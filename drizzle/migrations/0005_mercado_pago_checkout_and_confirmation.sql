ALTER TABLE public.restaurant_subscriptions ADD COLUMN installation_checkout_url text, ADD COLUMN subscription_checkout_url text, ADD COLUMN provider_status text NOT NULL DEFAULT 'pending';
CREATE UNIQUE INDEX subscriptions_one_open_per_restaurant ON public.restaurant_subscriptions(restaurant_id) WHERE status NOT IN ('cancelled','expired');
CREATE FUNCTION public.apply_mercado_pago_confirmation(p_subscription_id uuid, p_event_key text, p_resource_id text, p_provider_status text, p_payment_id text DEFAULT NULL, p_kind text DEFAULT NULL, p_amount_cents integer DEFAULT NULL, p_payment_status text DEFAULT NULL, p_paid_at timestamptz DEFAULT NULL) RETURNS void LANGUAGE plpgsql SET search_path = public AS $$
DECLARE s public.restaurant_subscriptions; event_uuid uuid; latest_paid timestamptz; install_paid boolean;
BEGIN
 SELECT * INTO s FROM public.restaurant_subscriptions WHERE id=p_subscription_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Unknown subscription'; END IF;
 INSERT INTO public.billing_webhook_events(provider_event_id,provider_resource_id,signature_verified,resource_verified,processed_at) VALUES(p_event_key,p_resource_id,true,true,now()) ON CONFLICT(provider_event_id) DO NOTHING RETURNING id INTO event_uuid;
 IF event_uuid IS NULL THEN RETURN; END IF;
 IF p_payment_id IS NOT NULL THEN
  IF p_kind IS NULL OR p_payment_status IS NULL OR p_amount_cents IS NULL OR p_kind NOT IN ('installation','weekly') OR p_payment_status NOT IN ('pending','approved','rejected','refunded','cancelled') OR p_amount_cents <> (CASE WHEN p_kind='installation' THEN s.installation_price_cents ELSE s.weekly_price_cents END) THEN RAISE EXCEPTION 'Invalid payment'; END IF;
  IF EXISTS(SELECT 1 FROM public.billing_payments WHERE provider_payment_id=p_payment_id AND subscription_id<>s.id) THEN RAISE EXCEPTION 'Payment belongs to another subscription'; END IF;
  INSERT INTO public.billing_payments(subscription_id,provider_payment_id,kind,amount_cents,status,verified_event_id,paid_at) VALUES(s.id,p_payment_id,p_kind,p_amount_cents,p_payment_status,event_uuid,p_paid_at) ON CONFLICT(provider_payment_id) DO UPDATE SET status=excluded.status,verified_event_id=excluded.verified_event_id,paid_at=excluded.paid_at;
 END IF;
 SELECT EXISTS(SELECT 1 FROM public.billing_payments WHERE subscription_id=s.id AND kind='installation' AND status='approved') INTO install_paid;
 SELECT max(paid_at) FROM public.billing_payments WHERE subscription_id=s.id AND kind='weekly' AND status='approved' INTO latest_paid;
 UPDATE public.restaurant_subscriptions SET provider_status=p_provider_status, verified_event_id=event_uuid, current_period_end=latest_paid+interval '7 days', renews_automatically=p_provider_status='authorized', cancelled_at=CASE WHEN p_provider_status IN ('cancelled','canceled') THEN coalesce(cancelled_at,now()) ELSE cancelled_at END, status=CASE WHEN s.status='cancelled' OR p_provider_status IN ('cancelled','canceled') THEN 'cancelled' WHEN install_paid AND latest_paid+interval '7 days'>now() AND p_provider_status='authorized' THEN 'active' WHEN latest_paid IS NOT NULL OR p_provider_status='paused' THEN 'past_due' ELSE 'pending' END WHERE id=s.id;
END; $$;
REVOKE ALL ON FUNCTION public.apply_mercado_pago_confirmation(uuid,text,text,text,text,text,integer,text,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.apply_mercado_pago_confirmation(uuid,text,text,text,text,text,integer,text,timestamptz) TO service_role;