REVOKE EXECUTE ON FUNCTION public.handle_menuvision_signup() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_menuvision_signup() TO service_role;