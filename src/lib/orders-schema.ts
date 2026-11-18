import { z } from 'zod';

export const orderStatus = z.enum(['received', 'preparing', 'ready', 'completed', 'cancelled']);
export type OrderStatus = z.infer<typeof orderStatus>;
export const statusLabels: Record<OrderStatus, string> = { received: 'Recebido', preparing: 'Em preparo', ready: 'Pronto', completed: 'Concluído', cancelled: 'Cancelado' };
export const nextStatuses: Record<OrderStatus, OrderStatus[]> = { received: ['preparing', 'cancelled'], preparing: ['ready', 'cancelled'], ready: ['completed', 'cancelled'], completed: [], cancelled: [] };
export const slugSchema = z.object({ slug: z.string().min(1).max(150).regex(/^[a-z0-9-]+$/) });
export const orderInput = slugSchema.extend({ token: z.string().uuid(), customer_name: z.string().trim().min(2, 'Informe seu nome.').max(80), table_label: z.string().trim().max(30), notes: z.string().trim().max(500), items: z.array(z.object({ dish_id: z.string().uuid(), quantity: z.number().int().min(1).max(20) })).min(1, 'Adicione um prato.').max(30) }).refine(data => new Set(data.items.map(i => i.dish_id)).size === data.items.length, 'Itens repetidos.');
export const orderItem = z.object({ dish_id: z.string().uuid(), name: z.string(), quantity: z.number(), unit_cents: z.number() });
export const trackedOrder = z.object({ number: z.number(), status: orderStatus, items: z.array(orderItem), total_cents: z.number(), created_at: z.string(), restaurant_name: z.string(), slug: z.string() });
export const publicMenuSchema = z.object({ restaurant: z.object({ name: z.string(), slug: z.string(), description: z.string() }), dishes: z.array(z.object({ id: z.string().uuid(), name: z.string(), description: z.string(), price_cents: z.number(), category: z.string().nullable() })) });
export const money = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });