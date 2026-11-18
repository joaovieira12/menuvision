import { queryOptions } from '@tanstack/react-query';
import { getPlans } from './plans.functions';
export const plansQuery = () => queryOptions({ queryKey: ['public-plans'], queryFn: () => getPlans(), staleTime: 60_000 });