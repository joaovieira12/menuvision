import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { checkoutSchema, billingIdSchema, checkoutUrl, recurringAmount } from './billing-schema';

export const billingReady = createServerFn({ method: 'GET' }).handler(async () => Boolean(process.env['LOVABLE_API_KEY'] && process.env['UDC_MERCADO_PAGO_API_KEY'] && process.env['MERCADO_PAGO_WEBHOOK_SECRET']));
export const getBilling = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data: subscriptions, error } = await context.supabase.from('restaurant_subscriptions').select('*').eq('owner_id', context.userId).order('created_at', { ascending: false });
  if (error) throw new Error('Não foi possível carregar sua assinatura.');
  const { data: payments, error: paymentError } = await context.supabase.from('billing_payments').select('*').order('created_at', { ascending: false });
  if (paymentError) throw new Error('Não foi possível carregar os pagamentos.');
  return { subscriptions: subscriptions ?? [], payments: payments ?? [] };
});
export const startCheckout = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(input => checkoutSchema.parse(input)).handler(async ({ data, context }) => {
  const apiKey = process.env['LOVABLE_API_KEY']; const connection = process.env['UDC_MERCADO_PAGO_API_KEY'];
  if (!apiKey || !connection || !process.env['MERCADO_PAGO_WEBHOOK_SECRET']) throw new Error('A configuração de pagamentos ainda não foi concluída.');
  const { data: restaurant } = await context.supabase.from('restaurants').select('id').eq('owner_id', context.userId).single();
  const { data: plan } = await context.supabase.from('plans').select('*').eq('id', data.planId).eq('active', true).single();
  const { data: userData } = await context.supabase.auth.getUser();
  if (!restaurant || !plan || !userData.user?.email) throw new Error('Restaurante ou plano indisponível.');
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { mercadoRequest } = await import('./mercado-pago.server');
  const { data: existing } = await context.supabase.from('restaurant_subscriptions').select('*').eq('restaurant_id', restaurant.id).not('status', 'in', '(cancelled,expired)').maybeSingle();
  if (existing && existing.plan_id !== plan.id) throw new Error('Cancele a contratação atual antes de escolher outro plano.');
  if (existing?.status === 'active') throw new Error('Seu plano já está ativo.');
  let subscription = existing;
  if (!subscription) {
    const result = await supabaseAdmin.from('restaurant_subscriptions').insert({ restaurant_id: restaurant.id, owner_id: context.userId, plan_id: plan.id, status: 'pending', weekly_price_cents: plan.weekly_price_cents, installation_price_cents: plan.installation_price_cents }).select('*').single();
    if (result.error || !result.data) throw new Error('Já existe uma contratação em andamento. Atualize a página.');
    subscription = result.data;
  }
  const base = 'https://screenshot-to-interface-506.lovable.app';
  if (!subscription.installation_checkout_url) {
    const preference = await mercadoRequest('/checkout/preferences', apiKey, connection, 'POST', {
      items: [{ id: `${subscription.id}:installation`, title: `MenuVision — instalação ${plan.name}`, quantity: 1, currency_id: 'BRL', unit_price: subscription.installation_price_cents / 100 }],
      external_reference: `${subscription.id}:installation`, payer: { email: userData.user.email },
      back_urls: { success: `${base}/billing`, pending: `${base}/billing`, failure: `${base}/billing` },
      notification_url: `${base}/api/public/mercado-pago`, auto_return: 'approved',
    }, `${subscription.id}-installation`);
    const url = checkoutUrl(preference.init_point);
    const { error } = await supabaseAdmin.from('restaurant_subscriptions').update({ installation_checkout_url: url }).eq('id', subscription.id);
    if (error) throw new Error('Não foi possível salvar a cobrança.');
  }
  // Never retry creation of a recurring contract: an ambiguous provider response must be reconciled first.
  if (!subscription.provider_subscription_id) {
    const search = await mercadoRequest(`/preapproval/search?external_reference=${subscription.id}`, apiKey, connection);
    let remote = search.results?.find((s: { external_reference: string }) => s.external_reference === subscription.id);
    if (!remote) remote = await mercadoRequest('/preapproval', apiKey, connection, 'POST', { reason: `MenuVision — ${plan.name} semanal`, external_reference: subscription.id, payer_email: userData.user.email, auto_recurring: recurringAmount(subscription.weekly_price_cents), back_url: `${base}/billing`, notification_url: `${base}/api/public/mercado-pago`, status: 'pending' }, `${subscription.id}-weekly`);
    const { error } = await supabaseAdmin.from('restaurant_subscriptions').update({ provider_subscription_id: String(remote.id), subscription_checkout_url: checkoutUrl(remote.init_point) }).eq('id', subscription.id);
    if (error) throw new Error('Não foi possível salvar a assinatura.');
  }
  return { id: subscription.id };
});
export const cancelSubscription = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(input => billingIdSchema.parse(input)).handler(async ({ data, context }) => {
  const { data: subscription } = await context.supabase.from('restaurant_subscriptions').select('*').eq('id', data.id).eq('owner_id', context.userId).single();
  if (!subscription) throw new Error('Assinatura não encontrada.');
  if (subscription.status === 'cancelled') return { ok: true };
  if (subscription.provider_subscription_id) {
    const apiKey = process.env['LOVABLE_API_KEY']; const connection = process.env['UDC_MERCADO_PAGO_API_KEY'];
    if (!apiKey || !connection) throw new Error('Mercado Pago indisponível.');
    const { mercadoRequest } = await import('./mercado-pago.server');
    await mercadoRequest(`/preapproval/${encodeURIComponent(subscription.provider_subscription_id)}`, apiKey, connection, 'PUT', { status: 'cancelled' });
  }
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { error } = await supabaseAdmin.from('restaurant_subscriptions').update({ status: 'cancelled', renews_automatically: false, cancelled_at: new Date().toISOString() }).eq('id', subscription.id);
  if (error) throw new Error('Não foi possível registrar o cancelamento.');
  return { ok: true };
});
