import { queryOptions } from '@tanstack/react-query';
import { getBilling, billingReady } from './billing.functions';
export const billingQuery = () => queryOptions({ queryKey: ['billing'], queryFn: () => getBilling(), refetchInterval: 15_000 });
export const billingReadyQuery = () => queryOptions({ queryKey: ['billing-ready'], queryFn: () => billingReady(), staleTime: 30_000 });
