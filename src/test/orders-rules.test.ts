import { describe, expect, it, vi } from 'vitest';
import { orderInput, nextStatuses } from '@/lib/orders-schema';
vi.mock('@tanstack/react-start', () => ({ createServerFn: () => ({ middleware: () => ({ handler: (h: unknown) => h, inputValidator: () => ({ handler: (h: unknown) => h }) }), inputValidator: () => ({ handler: (h: unknown) => h }) }) }));
vi.mock('@/integrations/supabase/auth-middleware', () => ({ requireSupabaseAuth: {} }));
import { listOrders, changeOrderStatus, publishMenu } from '@/lib/orders.functions';
const input = { slug: 'restaurante', token: '00000000-0000-4000-8000-000000000001', customer_name: 'Cliente', table_label: '5', notes: '', items: [{ dish_id: '00000000-0000-4000-8000-000000000002', quantity: 2 }] };
describe('Pedidos', () => {
  it('accepts guest orders without an account', () => { expect(orderInput.parse(input).items[0]?.quantity).toBe(2); });
  it('rejects an empty order', () => { expect(orderInput.safeParse({ ...input, items: [] }).success).toBe(false); });
  it('rejects duplicate dishes', () => { expect(orderInput.safeParse({ ...input, items: [...input.items, ...input.items] }).success).toBe(false); });
  it('removes client-supplied prices and ownership', () => { const result = orderInput.parse({ ...input, owner_id: 'another', items: [{ ...input.items[0], price: 1 }] }); expect(result.items[0]).not.toHaveProperty('price'); expect(result).not.toHaveProperty('owner_id'); });
  it('restricts completed and cancelled orders to terminal states', () => { expect(nextStatuses.completed).toEqual([]); expect(nextStatuses.cancelled).toEqual([]); expect(nextStatuses.received).not.toContain('completed'); });
  it('reads only authenticated owner orders', async () => { const eq = vi.fn(() => ({ order: async () => ({ data: [], error: null }) })); await (listOrders as unknown as (i: unknown) => Promise<unknown>)({ context: { userId: 'owner', supabase: { from: () => ({ select: () => ({ eq }) }) } } }); expect(eq).toHaveBeenCalledWith('owner_id', 'owner'); });
  it('updates status through the owner-authorized transaction', async () => { const rpc = vi.fn(async () => ({ error: null })); await (changeOrderStatus as unknown as (i: unknown) => Promise<unknown>)({ data: { id: 'order', status: 'preparing' }, context: { supabase: { rpc } } }); expect(rpc).toHaveBeenCalledWith('update_menu_order_status', { p_id: 'order', p_status: 'preparing' }); });
  it('publishes only the authenticated restaurant', async () => { const eq = vi.fn(() => ({ select: () => ({ single: async () => ({ error: null }) }) })); await (publishMenu as unknown as (i: unknown) => Promise<unknown>)({ data: { published: true }, context: { userId: 'owner', supabase: { from: () => ({ update: () => ({ eq }) }) } } }); expect(eq).toHaveBeenCalledWith('owner_id', 'owner'); });
});