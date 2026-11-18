import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { verifyMercadoSignature } from '@/lib/billing-schema';
export const Route = createFileRoute('/api/public/mercado-pago')({ server: { handlers: {
  POST: async ({ request }) => {
    const secret = process.env['MERCADO_PAGO_WEBHOOK_SECRET'];
    const id = new URL(request.url).searchParams.get('data.id') ?? '';
    // An unconfigured verifier cannot authenticate a notification. Reject it
    // without acknowledging delivery or touching billing/provider resources.
    if (!secret || !await verifyMercadoSignature(request.headers.get('x-signature'), request.headers.get('x-request-id'), id, secret)) return new Response('Invalid signature', { status: 401 });
    try {
      const body = z.object({ type: z.enum(['payment','subscription_preapproval','subscription_authorized_payment']), data: z.object({ id: z.union([z.string().max(128), z.number()]) }) }).parse(await request.json());
      if (String(body.data.id).toLowerCase() !== id.toLowerCase()) return new Response('Invalid resource', { status: 400 });
      const apiKey = process.env['LOVABLE_API_KEY']; const connection = process.env['UDC_MERCADO_PAGO_API_KEY'];
      if (!apiKey || !connection) return new Response('Unavailable', { status: 503 });
      const { mercadoRequest } = await import('@/lib/mercado-pago.server');
      const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
      let payment; let remote; let subscriptionId; let kind: 'installation' | 'weekly' | undefined;
      if (body.type === 'subscription_preapproval') {
        remote = await mercadoRequest(`/preapproval/${encodeURIComponent(id)}`, apiKey, connection);
        subscriptionId = remote.external_reference;
      } else {
        if (body.type === 'subscription_authorized_payment') {
          const invoice = await mercadoRequest(`/authorized_payments/${encodeURIComponent(id)}`, apiKey, connection);
          if (!invoice.payment?.id) return new Response('ok');
          payment = await mercadoRequest(`/v1/payments/${invoice.payment.id}`, apiKey, connection);
          remote = await mercadoRequest(`/preapproval/${encodeURIComponent(invoice.preapproval_id)}`, apiKey, connection);
          subscriptionId = remote.external_reference; kind = 'weekly';
        } else {
          payment = await mercadoRequest(`/v1/payments/${encodeURIComponent(id)}`, apiKey, connection);
          const ref = String(payment.external_reference ?? '');
          if (ref.endsWith(':installation')) { subscriptionId = ref.slice(0, -13); kind = 'installation'; }
          else {
            const preapprovalId = payment.metadata?.preapproval_id;
            if (!preapprovalId) return new Response('ok');
            remote = await mercadoRequest(`/preapproval/${encodeURIComponent(preapprovalId)}`, apiKey, connection);
            subscriptionId = remote.external_reference; kind = 'weekly';
          }
        }
      }
      if (!z.string().uuid().safeParse(subscriptionId).success) return new Response('ok');
      const { data: s } = await supabaseAdmin.from('restaurant_subscriptions').select('*').eq('id', subscriptionId).single();
      if (!s) return new Response('ok');
      if (!remote && s.provider_subscription_id) remote = await mercadoRequest(`/preapproval/${encodeURIComponent(s.provider_subscription_id)}`, apiKey, connection);
      if (remote && String(remote.id) !== s.provider_subscription_id) return new Response('Mismatch', { status: 400 });
      if (remote && (remote.auto_recurring?.currency_id !== 'BRL' || remote.auto_recurring?.frequency !== 7 || remote.auto_recurring?.frequency_type !== 'days' || Math.round(Number(remote.auto_recurring?.transaction_amount)*100) !== s.weekly_price_cents)) return new Response('Mismatch', { status: 400 });
      if (payment && (payment.currency_id !== 'BRL' || Math.round(Number(payment.transaction_amount)*100) !== (kind === 'installation' ? s.installation_price_cents : s.weekly_price_cents))) return new Response('Mismatch', { status: 400 });
      const status = payment ? (['approved','rejected','refunded','cancelled'].includes(payment.status) ? payment.status : 'pending') : null;
      const { error } = await supabaseAdmin.rpc('apply_mercado_pago_confirmation', { p_subscription_id: s.id, p_event_key: `${body.type}:${id}:${remote?.last_modified ?? ''}:${payment?.date_last_updated ?? ''}:${payment?.status ?? ''}`, p_resource_id: id, p_provider_status: remote?.status ?? s.provider_status, ...(payment && kind ? { p_payment_id: String(payment.id), p_kind: kind, p_amount_cents: Math.round(Number(payment.transaction_amount)*100), p_payment_status: status, ...(payment.date_approved ? { p_paid_at: payment.date_approved } : {}) } : {}) });
      if (error) return new Response('Processing failed', { status: 500 });
      return new Response('ok');
    } catch (error) { if (error instanceof z.ZodError) return new Response('Invalid notification', { status: 400 }); return new Response('Processing failed', { status: 502 }); }
  },
} } });
