import { Link } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ArrowUpRight, Check, Clock3, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { plansQuery } from '@/lib/plans-query';
import { formatPlanPrice } from '@/lib/plans-schema';
import { useSessionUser } from './session';

export function PricingSection() {
  const { data: plans } = useSuspenseQuery(plansQuery());
  const user = useSessionUser();
  return <section id="planos" className="wrap section">
    <div className="section-heading"><span className="eyebrow">CRESÇA NO SEU RITMO</span><h2>Uma nova visão. Um plano para cada fase.</h2><p>Assinatura semanal + instalação única. Sem confundir os dois.</p></div>
    <div className="plans">{plans.map(plan => <article key={plan.id} className={`plan ${plan.featured ? 'featured' : ''} ${plan.slug === 'premium' ? 'premium' : ''}`}>
      {plan.featured && <span className="plan-label">MAIS VENDIDO</span>}
      <h3>{plan.name}</h3><p className="plan-audience">{plan.audience}</p>
      <div className="weekly-price"><strong>{formatPlanPrice(plan.weekly_price_cents)}</strong><span>/ semana</span></div>
      <div className="installation-price"><span>Instalação · pagamento único</span><strong>{formatPlanPrice(plan.installation_price_cents)}</strong><small>Valor inicial sugerido</small></div>
      <ul>
        <li><Check/><span>{plan.dish_limit === null ? 'Limite de pratos configurável' : `Até ${plan.dish_limit} pratos cadastrados`}</span></li>
        {plan.weekly_generation_limit > 0 && <li><Clock3/><span>Até {plan.weekly_generation_limit} gerações 3D por semana <small className="feature-pending">Em breve</small></span></li>}
        {plan.features.filter(feature => feature.enabled).map(feature => <li key={feature.key}>{feature.available === false ? <Clock3/> : <Check/>}<span>{feature.label}{feature.available === false && <small className="feature-pending">Em breve</small>}</span></li>)}
      </ul>
      <Button asChild variant={plan.featured ? 'default' : 'outline'} className="w-full"><Link to={user ? '/billing' : '/auth'}>Escolher plano <ArrowUpRight/></Link></Button>
    </article>)}</div>
    <p className="availability"><ShieldCheck size={15}/> Contratação na área do restaurante. Instalação e assinatura semanal são cobradas separadamente pelo Mercado Pago.</p>
    <p className="availability">Recursos marcados “Em breve” ainda não estão disponíveis.</p>
  </section>;
}