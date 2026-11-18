CREATE TABLE public.plans (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug text NOT NULL UNIQUE, name text NOT NULL, audience text NOT NULL,
 weekly_price_cents integer NOT NULL CHECK (weekly_price_cents >= 0), installation_price_cents integer NOT NULL CHECK (installation_price_cents >= 0), currency text NOT NULL DEFAULT 'BRL' CHECK (currency = 'BRL'), billing_interval_days integer NOT NULL DEFAULT 7 CHECK (billing_interval_days = 7),
 dish_limit integer CHECK (dish_limit > 0), weekly_generation_limit integer NOT NULL DEFAULT 0 CHECK (weekly_generation_limit >= 0), features jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(features) = 'array'), featured boolean NOT NULL DEFAULT false, active boolean NOT NULL DEFAULT true, sort_order integer NOT NULL DEFAULT 0, updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.plans TO anon, authenticated;
GRANT ALL ON public.plans TO service_role;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY plans_public_read ON public.plans FOR SELECT TO anon, authenticated USING (active);
CREATE TABLE public.plan_promotions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), plan_id uuid NOT NULL REFERENCES public.plans(id), code text NOT NULL UNIQUE, discount_percent numeric NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100), applies_to text NOT NULL CHECK (applies_to IN ('installation','weekly','both')), starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL, active boolean NOT NULL DEFAULT false, CHECK (ends_at > starts_at)
);
GRANT ALL ON public.plan_promotions TO service_role;
ALTER TABLE public.plan_promotions ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.billing_webhook_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), provider text NOT NULL DEFAULT 'mercado_pago' CHECK (provider = 'mercado_pago'), provider_event_id text NOT NULL UNIQUE, provider_resource_id text NOT NULL, signature_verified boolean NOT NULL DEFAULT false, resource_verified boolean NOT NULL DEFAULT false, received_at timestamptz NOT NULL DEFAULT now(), processed_at timestamptz
);
GRANT ALL ON public.billing_webhook_events TO service_role;
ALTER TABLE public.billing_webhook_events ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.restaurant_subscriptions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), restaurant_id uuid NOT NULL REFERENCES public.restaurants(id), owner_id uuid NOT NULL, plan_id uuid NOT NULL REFERENCES public.plans(id), provider text NOT NULL DEFAULT 'mercado_pago' CHECK (provider = 'mercado_pago'), provider_subscription_id text UNIQUE,
 status text NOT NULL DEFAULT 'pending_configuration' CHECK (status IN ('pending_configuration','pending','active','past_due','cancelled','expired')), weekly_price_cents integer NOT NULL CHECK (weekly_price_cents >= 0), installation_price_cents integer NOT NULL CHECK (installation_price_cents >= 0), dish_limit_override integer CHECK (dish_limit_override > 0), billing_interval_days integer NOT NULL DEFAULT 7 CHECK (billing_interval_days = 7), renews_automatically boolean NOT NULL DEFAULT false, current_period_end timestamptz, cancelled_at timestamptz, verified_event_id uuid REFERENCES public.billing_webhook_events(id), created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.restaurant_subscriptions TO authenticated;
GRANT ALL ON public.restaurant_subscriptions TO service_role;
ALTER TABLE public.restaurant_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY subscriptions_owner_read ON public.restaurant_subscriptions FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE INDEX subscriptions_owner_idx ON public.restaurant_subscriptions(owner_id);
CREATE TABLE public.billing_payments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), subscription_id uuid NOT NULL REFERENCES public.restaurant_subscriptions(id), provider_payment_id text UNIQUE, kind text NOT NULL CHECK (kind IN ('installation','weekly')), amount_cents integer NOT NULL CHECK (amount_cents >= 0), currency text NOT NULL DEFAULT 'BRL' CHECK (currency = 'BRL'), status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','refunded','cancelled')), verified_event_id uuid REFERENCES public.billing_webhook_events(id), paid_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.billing_payments TO authenticated;
GRANT ALL ON public.billing_payments TO service_role;
ALTER TABLE public.billing_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY payments_owner_read ON public.billing_payments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.restaurant_subscriptions s WHERE s.id = subscription_id AND s.owner_id = auth.uid()));
CREATE INDEX payments_subscription_idx ON public.billing_payments(subscription_id);
CREATE FUNCTION public.validate_billing_confirmation() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF (TG_TABLE_NAME = 'restaurant_subscriptions' AND NEW.status = 'active') OR (TG_TABLE_NAME = 'billing_payments' AND NEW.status = 'approved') THEN
  IF NEW.verified_event_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.billing_webhook_events e WHERE e.id = NEW.verified_event_id AND e.signature_verified AND e.resource_verified AND e.processed_at IS NOT NULL) THEN
   RAISE EXCEPTION 'Billing activation requires a verified and processed webhook';
  END IF;
 END IF;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.validate_billing_confirmation() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER subscription_confirmation BEFORE INSERT OR UPDATE ON public.restaurant_subscriptions FOR EACH ROW EXECUTE FUNCTION public.validate_billing_confirmation();
CREATE TRIGGER payment_confirmation BEFORE INSERT OR UPDATE ON public.billing_payments FOR EACH ROW EXECUTE FUNCTION public.validate_billing_confirmation();
CREATE FUNCTION public.validate_subscription_owner() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = NEW.restaurant_id AND r.owner_id = NEW.owner_id) THEN RAISE EXCEPTION 'Subscription owner must own the restaurant'; END IF;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.validate_subscription_owner() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER subscription_owner BEFORE INSERT OR UPDATE ON public.restaurant_subscriptions FOR EACH ROW EXECUTE FUNCTION public.validate_subscription_owner();