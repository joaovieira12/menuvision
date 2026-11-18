import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import { CreditCard, RefreshCw, ArrowUpRight, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardShell } from '@/components/menuvision/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { billingQuery, billingReadyQuery } from '@/lib/billing-query';
import { plansQuery } from '@/lib/plans-query';
import { restaurantQuery } from '@/lib/restaurant-query';
import { startCheckout, cancelSubscription } from '@/lib/billing.functions';
import { formatPlanPrice } from '@/lib/plans-schema';
import { checkoutUrl } from '@/lib/billing-schema';
import { pageHead } from '@/lib/metadata';
export const Route = createFileRoute('/_authenticated/billing')({
  head: () => pageHead('Assinatura e pagamentos', 'Contrate seu plano MenuVision e acompanhe instalação, pagamentos semanais e cancelamento.'),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(billingQuery()), context.queryClient.ensureQueryData(billingReadyQuery()), context.queryClient.ensureQueryData(plansQuery()), context.queryClient.ensureQueryData(restaurantQuery())]),
  component: Billing,
});
const labels: Record<string,string> = { pending_configuration: 'Aguardando configuração', pending: 'Aguardando pagamento', active: 'Ativa', past_due: 'Pagamento pendente', cancelled: 'Cancelada', expired: 'Expirada', approved: 'Pago', rejected: 'Recusado', refunded: 'Reembolsado' };
function Billing() {
  const { data } = useSuspenseQuery(billingQuery()); const { data: ready } = useSuspenseQuery(billingReadyQuery());
  const { data: plans } = useSuspenseQuery(plansQuery()); const { data: restaurant } = useSuspenseQuery(restaurantQuery());
  const queryClient = useQueryClient(); const checkout = useServerFn(startCheckout); const cancel = useServerFn(cancelSubscription);
  const [busy, setBusy] = useState(false); const [selected, setSelected] = useState<string | null>(null); const [cancelId, setCancelId] = useState<string | null>(null);
  const current = data.subscriptions.find(s => !['cancelled','expired'].includes(s.status));
  const plan = plans.find(p => p.id === selected);
  async function contract(planId: string) { setBusy(true); try { await checkout({ data: { planId } }); await queryClient.invalidateQueries({ queryKey: ['billing'] }); setSelected(null); } catch (e) { toast.error(e instanceof Error ? e.message : 'Não foi possível iniciar a contratação.'); } finally { setBusy(false); } }
  async function cancelCurrent() { if (!cancelId) return; setBusy(true); try { await cancel({ data: { id: cancelId } }); await queryClient.invalidateQueries({ queryKey: ['billing'] }); setCancelId(null); toast.success('Renovação cancelada.'); } catch (e) { toast.error(e instanceof Error ? e.message : 'Não foi possível cancelar.'); } finally { setBusy(false); } }
  const installationPaid = current && data.payments.some(p => p.subscription_id === current.id && p.kind === 'installation' && p.status === 'approved');
  return <DashboardShell name={restaurant.restaurant.name}><span className="eyebrow">SEU PLANO MENUVISION</span><div className="flex flex-wrap items-center justify-between gap-4"><h1>Assinatura e pagamentos</h1><Button variant="outline" size="icon" aria-label="Atualizar pagamentos" title="Atualizar pagamentos" onClick={() => queryClient.invalidateQueries({ queryKey: ['billing'] })}><RefreshCw/></Button></div>
    {!ready && <p className="mt-6 border-l-2 border-primary pl-4 text-muted-foreground">Mercado Pago conectado. A contratação aguarda a configuração da confirmação segura de pagamentos.</p>}
    {current ? <section className="mt-8 border-y border-border py-6 space-y-5"><div className="flex flex-wrap justify-between gap-4"><div><h2>{plans.find(p => p.id === current.plan_id)?.name ?? 'Seu plano'}</h2><p className="text-muted-foreground">{formatPlanPrice(current.weekly_price_cents)} / semana · instalação {formatPlanPrice(current.installation_price_cents)}</p></div><span className="status-pill">{current.status === 'active' && current.current_period_end && new Date(current.current_period_end) <= new Date() ? 'Pagamento pendente' : labels[current.status]}</span></div>
    <div className="flex flex-wrap gap-3">{!installationPaid && current.installation_checkout_url && <Button asChild><a href={checkoutUrl(current.installation_checkout_url)}><CreditCard/> Pagar instalação <ArrowUpRight/></a></Button>}{current.subscription_checkout_url && current.provider_status !== 'authorized' && <Button asChild variant="outline"><a href={checkoutUrl(current.subscription_checkout_url)}>Autorizar assinatura semanal <ArrowUpRight/></a></Button>}{(!current.installation_checkout_url || !current.subscription_checkout_url) && <Button disabled={busy || !ready} onClick={() => contract(current.plan_id)}>Continuar contratação</Button>}<Button variant="ghost" disabled={busy} onClick={() => setCancelId(current.id)}>Cancelar renovação</Button></div>
    {current.current_period_end && <p className="text-sm text-muted-foreground">Período pago até {new Date(current.current_period_end).toLocaleDateString('pt-BR')}.</p>}<p className="text-sm text-muted-foreground">A instalação e a assinatura são pagamentos separados. A assinatura só fica ativa após a confirmação dos dois pagamentos.</p></section> : <div className="plans mt-8">{plans.map(p => <article className={`plan ${p.featured ? 'featured' : ''}`} key={p.id}><h2>{p.name}</h2><p className="plan-audience">{p.audience}</p><div className="weekly-price"><strong>{formatPlanPrice(p.weekly_price_cents)}</strong><span>/ semana</span></div><p className="mb-6 text-sm text-muted-foreground">Instalação única: {formatPlanPrice(p.installation_price_cents)}</p><Button className="w-full" disabled={!ready || busy} onClick={() => setSelected(p.id)}><CreditCard/> Contratar plano</Button></article>)}</div>}
    <section className="mt-10"><h2>Histórico de pagamentos</h2>{data.payments.length === 0 ? <p className="py-6 text-muted-foreground">Nenhum pagamento registrado.</p> : <div className="mt-4 divide-y divide-border">{data.payments.map(p => <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><strong>{p.kind === 'installation' ? 'Instalação única' : 'Assinatura semanal'}</strong><p className="text-sm text-muted-foreground">{new Date(p.created_at).toLocaleDateString('pt-BR')}</p></div><div className="flex items-center gap-4"><span>{formatPlanPrice(p.amount_cents)}</span><span className="status-pill">{labels[p.status]}</span></div></div>)}</div>}</section>
    <Dialog open={Boolean(plan)} onOpenChange={open => { if (!open && !busy) setSelected(null); }}><DialogContent><DialogHeader><DialogTitle>Contratar {plan?.name}</DialogTitle><DialogDescription>Pagamento protegido pelo Mercado Pago</DialogDescription></DialogHeader>{plan && <><p>Instalação única: <strong>{formatPlanPrice(plan.installation_price_cents)}</strong></p><p>Renovação automática a cada 7 dias: <strong>{formatPlanPrice(plan.weekly_price_cents)}</strong></p><p className="text-sm text-muted-foreground">Você autoriza a assinatura no Mercado Pago e pode cancelar futuras renovações nesta página. Recursos 3D e AR continuam em breve.</p><Button disabled={busy} onClick={() => contract(plan.id)}>{busy ? <LoaderCircle className="animate-spin"/> : <CreditCard/>} Continuar para pagamento</Button></>}</DialogContent></Dialog>
    <Dialog open={Boolean(cancelId)} onOpenChange={open => { if (!open && !busy) setCancelId(null); }}><DialogContent><DialogHeader><DialogTitle>Cancelar renovação?</DialogTitle><DialogDescription>As próximas cobranças automáticas serão interrompidas. Pagamentos anteriores não são reembolsados automaticamente.</DialogDescription></DialogHeader><Button variant="destructive" disabled={busy} onClick={cancelCurrent}>Confirmar cancelamento</Button><Button variant="outline" disabled={busy} onClick={() => setCancelId(null)}>Manter assinatura</Button></DialogContent></Dialog>
  </DashboardShell>;
}
