import { createFileRoute, Link } from '@tanstack/react-router';
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import { Copy, ExternalLink, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { restaurantQuery } from '@/lib/restaurant-query';
import { pageHead } from '@/lib/metadata';
import { publishMenu } from '@/lib/orders.functions';
import { DashboardShell } from '@/components/menuvision/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
export const Route = createFileRoute('/_authenticated/digital-menu')({ head: () => pageHead('Cardápio digital', 'Publique seu cardápio e receba pedidos no MenuVision.'), loader: ({ context }) => context.queryClient.ensureQueryData(restaurantQuery()), component: DigitalMenu });
function DigitalMenu() {
  const { data } = useSuspenseQuery(restaurantQuery()); const client = useQueryClient(); const publish = useServerFn(publishMenu); const [busy, setBusy] = useState(false);
  async function toggle(published: boolean) { setBusy(true); try { await publish({ data: { published } }); await client.invalidateQueries({ queryKey: ['restaurant'] }); await client.invalidateQueries({ queryKey: ['public-menu'] }); toast.success(published ? 'Cardápio publicado.' : 'Cardápio despublicado.'); } catch (e) { toast.error(e instanceof Error ? e.message : 'Não foi possível salvar.'); } finally { setBusy(false); } }
  async function copy() { try { await navigator.clipboard.writeText(`${window.location.origin}/menu/${data.restaurant.slug}`); toast.success('Link copiado.'); } catch { toast.error('Não foi possível copiar o link.'); } }
  return <DashboardShell name={data.restaurant.name}><span className="eyebrow">ABERTO PARA ESCOLHAS</span><h1>Cardápio digital</h1><section className="max-w-2xl mt-10"><div className="flex justify-between gap-6 items-center border-y border-border py-6"><div><h2 className="text-lg">Publicação do cardápio</h2><p className="dash-subtitle mt-2">{data.restaurant.menu_published ? 'Publicado · recebendo pedidos' : 'Não publicado'}</p></div><Switch checked={data.restaurant.menu_published} disabled={busy} onCheckedChange={p => void toggle(p)} aria-label="Publicar cardápio"/></div><div className="py-8"><p className="text-sm text-muted-foreground mb-3">Link do cardápio</p><p className="break-all font-mono text-sm mb-6">/menu/{data.restaurant.slug}</p><div className="flex flex-wrap gap-3"><Button variant="outline" onClick={() => void copy()}><Copy/>Copiar link</Button>{data.restaurant.menu_published && <Button asChild><Link to="/menu/$slug" params={{ slug: data.restaurant.slug }}><ExternalLink/>Abrir cardápio</Link></Button>}<Button asChild variant="ghost"><Link to="/dishes"><BookOpen/>Gerenciar pratos</Link></Button></div></div></section></DashboardShell>;
}