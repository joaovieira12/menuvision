REVOKE ALL ON public.plan_promotions, public.billing_webhook_events FROM anon, authenticated;
REVOKE ALL ON public.restaurant_subscriptions, public.billing_payments FROM anon, authenticated;
GRANT SELECT ON public.restaurant_subscriptions, public.billing_payments TO authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.plans FROM anon, authenticated;
GRANT SELECT ON public.plans TO anon, authenticated;