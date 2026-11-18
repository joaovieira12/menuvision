import { useSuspenseQuery } from '@tanstack/react-query';
import { Clock3 } from 'lucide-react';
import { restaurantQuery } from '@/lib/restaurant-query';
import { DashboardShell } from './dashboard-shell';
export function FuturePage({ title }: { title: string }) {
  const { data } = useSuspenseQuery(restaurantQuery());
  return <DashboardShell name={data.restaurant.name}><span className="eyebrow">MENU VISION</span><h1>{title}</h1><div className="empty-state"><Clock3 size={38}/><h2>Disponível em uma próxima etapa</h2><p className="dash-subtitle">Esta área ainda não está disponível.</p></div></DashboardShell>;
}