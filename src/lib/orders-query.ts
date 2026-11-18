import { queryOptions } from '@tanstack/react-query';
import { getPublicMenu, listOrders, trackOrder } from './orders.functions';
export const publicMenuQuery = (slug: string) => queryOptions({ queryKey: ['public-menu', slug], queryFn: () => getPublicMenu({ data: { slug } }), staleTime: 15_000 });
export const ordersQuery = () => queryOptions({ queryKey: ['orders'], queryFn: () => listOrders(), refetchInterval: 10_000 });
export const trackingQuery = (token: string) => queryOptions({ queryKey: ['order-tracking', token], queryFn: () => trackOrder({ data: { token } }), refetchInterval: query => ['completed', 'cancelled'].includes(query.state.data?.status ?? '') ? false : 10_000, retry: false });