import { z } from 'zod';

export const planFeatureSchema = z.object({ key: z.string(), label: z.string(), enabled: z.boolean(), available: z.boolean().nullable() });
export const planSchema = z.object({
  id: z.string().uuid(), slug: z.string(), name: z.string(), audience: z.string(),
  weekly_price_cents: z.number().int().nonnegative(), installation_price_cents: z.number().int().nonnegative(),
  currency: z.literal('BRL'), billing_interval_days: z.literal(7), dish_limit: z.number().int().positive().nullable(),
  weekly_generation_limit: z.number().int().nonnegative(), featured: z.boolean(), features: z.array(planFeatureSchema),
});
export type Plan = z.infer<typeof planSchema>;
export const formatPlanPrice = (cents: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);