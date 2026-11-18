import { describe, expect, it, vi } from 'vitest';

vi.mock('@tanstack/react-start', () => ({
  createServerFn: () => ({
    middleware: () => ({
      handler: (handler: unknown) => handler,
      inputValidator: () => ({ handler: (handler: unknown) => handler }),
    }),
  }),
}));
vi.mock('@/integrations/supabase/auth-middleware', () => ({ requireSupabaseAuth: {} }));
import { getRestaurant } from '@/lib/restaurant.functions';

describe('Restaurant isolation', () => {
  it('scopes workspace and profile reads to the authenticated owner', async () => {
    const filters: Array<[string, string, string]> = [];
    const client = {
      from: (table: string) => ({
        select: () => ({
          eq: (column: string, value: string) => {
            filters.push([table, column, value]);
            return { single: async () => ({ data: {}, error: null }) };
          },
        }),
      }),
    };
    const handler = getRestaurant as unknown as (input: { context: { supabase: typeof client; userId: string } }) => Promise<unknown>;
    await handler({ context: { supabase: client, userId: 'authenticated-owner' } });
    expect(filters).toEqual([
      ['restaurants', 'owner_id', 'authenticated-owner'],
      ['profiles', 'id', 'authenticated-owner'],
    ]);
  });
});