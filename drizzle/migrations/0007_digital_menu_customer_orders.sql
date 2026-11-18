ALTER TABLE public.restaurants ADD COLUMN menu_published boolean NOT NULL DEFAULT false;
CREATE TABLE public.menu_orders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 number bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
 restaurant_id uuid NOT NULL REFERENCES public.restaurants(id),
 owner_id uuid NOT NULL,
 tracking_token uuid NOT NULL UNIQUE,
 customer_name text NOT NULL,
 table_label text NOT NULL DEFAULT '',
 notes text NOT NULL DEFAULT '',
 items jsonb NOT NULL,
 total_cents integer NOT NULL,
 status text NOT NULL DEFAULT 'received' CHECK (status IN ('received','preparing','ready','completed','cancelled')),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.menu_orders TO authenticated;
GRANT ALL ON public.menu_orders TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.menu_orders_number_seq TO service_role;
ALTER TABLE public.menu_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY orders_owner_read ON public.menu_orders FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE INDEX menu_orders_restaurant_created ON public.menu_orders(restaurant_id, created_at DESC);
CREATE OR REPLACE FUNCTION public.read_published_menu(p_slug text) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT jsonb_build_object('restaurant', jsonb_build_object('name',r.name,'slug',r.slug,'description',r.description), 'dishes', COALESCE((SELECT jsonb_agg(jsonb_build_object('id',d.id,'name',d.name,'description',d.description,'price_cents',round(d.price*100)::integer,'category',c.name) ORDER BY c.name,d.name) FROM public.dishes d LEFT JOIN public.categories c ON c.id=d.category_id AND c.restaurant_id=d.restaurant_id WHERE d.restaurant_id=r.id AND d.active), '[]'::jsonb)) FROM public.restaurants r WHERE r.slug=p_slug AND r.menu_published;
$$;
REVOKE ALL ON FUNCTION public.read_published_menu(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.read_published_menu(text) TO anon, authenticated;
CREATE OR REPLACE FUNCTION public.place_menu_order(p_slug text, p_token uuid, p_name text, p_table text, p_notes text, p_items jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.restaurants; d public.dishes; existing public.menu_orders; item jsonb; snapshots jsonb := '[]'; total integer := 0; qty integer; result public.menu_orders;
BEGIN
 IF length(trim(p_name)) NOT BETWEEN 2 AND 80 OR length(p_table)>30 OR length(p_notes)>500 OR p_name IS NULL OR p_table IS NULL OR p_notes IS NULL OR p_token IS NULL OR jsonb_typeof(p_items) IS DISTINCT FROM 'array' OR jsonb_array_length(p_items) NOT BETWEEN 1 AND 30 THEN RAISE EXCEPTION 'Dados do pedido inválidos.'; END IF;
 SELECT * INTO r FROM public.restaurants WHERE slug=p_slug AND menu_published FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Cardápio indisponível.'; END IF;
 SELECT * INTO existing FROM public.menu_orders WHERE tracking_token=p_token;
 IF FOUND THEN
  IF existing.restaurant_id<>r.id THEN RAISE EXCEPTION 'Pedido inválido.'; END IF;
  RETURN jsonb_build_object('number',existing.number,'token',existing.tracking_token);
 END IF;
 IF (SELECT count(*) FROM public.menu_orders WHERE restaurant_id=r.id AND created_at>now()-interval '1 minute')>=60 THEN RAISE EXCEPTION 'Muitos pedidos no momento. Aguarde um minuto.'; END IF;
 IF (SELECT count(DISTINCT value->>'dish_id') FROM jsonb_array_elements(p_items)) <> jsonb_array_length(p_items) THEN RAISE EXCEPTION 'Itens repetidos.'; END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
  IF (item->>'quantity') IS NULL OR (item->>'quantity') !~ '^[0-9]{1,2}$' THEN RAISE EXCEPTION 'Quantidade inválida.'; END IF;
  qty := (item->>'quantity')::integer;
  IF qty NOT BETWEEN 1 AND 20 THEN RAISE EXCEPTION 'Quantidade inválida.'; END IF;
  SELECT * INTO d FROM public.dishes WHERE id=(item->>'dish_id')::uuid AND restaurant_id=r.id AND active FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Um prato não está mais disponível. Atualize o cardápio.'; END IF;
  total := total + round(d.price*100)::integer*qty;
  snapshots := snapshots || jsonb_build_array(jsonb_build_object('dish_id',d.id,'name',d.name,'quantity',qty,'unit_cents',round(d.price*100)::integer));
 END LOOP;
 INSERT INTO public.menu_orders(restaurant_id,owner_id,tracking_token,customer_name,table_label,notes,items,total_cents) VALUES(r.id,r.owner_id,p_token,trim(p_name),trim(p_table),trim(p_notes),snapshots,total) RETURNING * INTO result;
 RETURN jsonb_build_object('number',result.number,'token',result.tracking_token);
END; $$;
REVOKE ALL ON FUNCTION public.place_menu_order(text,uuid,text,text,text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_menu_order(text,uuid,text,text,text,jsonb) TO anon, authenticated;
CREATE OR REPLACE FUNCTION public.track_menu_order(p_token uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT jsonb_build_object('number',o.number,'status',o.status,'items',o.items,'total_cents',o.total_cents,'created_at',o.created_at,'restaurant_name',r.name,'slug',r.slug) FROM public.menu_orders o JOIN public.restaurants r ON r.id=o.restaurant_id WHERE tracking_token=p_token;
$$;
REVOKE ALL ON FUNCTION public.track_menu_order(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_menu_order(uuid) TO anon, authenticated;
CREATE OR REPLACE FUNCTION public.update_menu_order_status(p_id uuid,p_status text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE current_status text;
BEGIN
 SELECT status INTO current_status FROM public.menu_orders WHERE id=p_id AND owner_id=auth.uid() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Pedido não encontrado.'; END IF;
 IF NOT ((current_status='received' AND p_status IN ('preparing','cancelled')) OR (current_status='preparing' AND p_status IN ('ready','cancelled')) OR (current_status='ready' AND p_status IN ('completed','cancelled'))) THEN RAISE EXCEPTION 'Mudança de status inválida. Atualize os pedidos.'; END IF;
 UPDATE public.menu_orders SET status=p_status,updated_at=now() WHERE id=p_id;
END; $$;
REVOKE ALL ON FUNCTION public.update_menu_order_status(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_menu_order_status(uuid,text) TO authenticated;