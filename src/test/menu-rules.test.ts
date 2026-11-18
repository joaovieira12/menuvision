import { describe, expect, it, vi } from 'vitest';
import { dishSchema, validatePhoto } from '@/lib/menu-schema';
import { signupSchema } from '@/lib/restaurant-schema';
vi.mock('@tanstack/react-start', () => ({ createServerFn: () => ({ middleware: () => ({ handler: (h: unknown) => h, inputValidator: () => ({ handler: (h: unknown) => h }) }) }) }));
vi.mock('@/integrations/supabase/auth-middleware', () => ({ requireSupabaseAuth: {} }));
import { deleteDish, getMenu, saveDish } from '@/lib/menu.functions';
const dish = { name: 'Prato', description: '', price: 25.90, category_id: null, active: true, photo_path: null };
describe('Menu rules', () => {
  it('rejects negative prices', () => { expect(dishSchema.safeParse({ ...dish, price: -1 }).success).toBe(false); });
  it('persists inactive products', () => { expect(dishSchema.parse({ ...dish, active: false }).active).toBe(false); });
  it('rejects mismatched signup confirmation', () => { expect(signupSchema.safeParse({ restaurant_name: 'Restaurante', display_name: 'Samuel', phone: '11999999999', email: 'test@example.com', password: 'password123', confirm: 'different123' }).success).toBe(false); });
  it('requires a signup phone', () => { expect(signupSchema.safeParse({ restaurant_name: 'Restaurante', display_name: 'Samuel', email: 'test@example.com', password: 'password123', confirm: 'password123' }).success).toBe(false); });
  it('rejects non-photo uploads', () => { expect(() => validatePhoto(new File(['x'], 'file.html', { type: 'text/html' }))).toThrow(); });
  it('scopes dish and category reads to the authenticated owner', async () => {
    const filters: unknown[] = []; const supabase = { from: (table: string) => ({ select: () => ({ eq: (key: string, value: string) => { filters.push([table, key, value]); return { order: async () => ({ data: [], error: null }) }; } }) }) };
    await (getMenu as unknown as (i: unknown) => Promise<unknown>)({ context: { supabase, userId: 'owner' } });
    expect(filters).toEqual([['dishes', 'owner_id', 'owner'], ['categories', 'owner_id', 'owner']]);
  });
  it('scopes deletion to the authenticated owner', async () => {
    const filters: unknown[] = []; const chain = { eq: (key: string, value: string) => { filters.push([key, value]); return chain; }, select: () => ({ single: async () => ({ data: { photo_path: null }, error: null }) }) };
    const supabase = { from: () => ({ delete: () => chain }) };
    await (deleteDish as unknown as (i: unknown) => Promise<unknown>)({ data: { id: 'dish-id' }, context: { supabase, userId: 'owner' } });
    expect(filters).toEqual([['id', 'dish-id'], ['owner_id', 'owner']]);
  });
  it('rejects categories outside the authenticated restaurant before writing', async () => {
    const write = vi.fn(); const chain = { eq: () => chain, single: async () => ({ data: null, error: { message: 'hidden' } }) };
    const restaurant = { eq: () => ({ single: async () => ({ data: { id: 'restaurant' }, error: null }) }) };
    const supabase = { from: (table: string) => ({ select: () => table === 'restaurants' ? restaurant : chain, insert: write, update: write }) };
    await expect((saveDish as unknown as (i: unknown) => Promise<unknown>)({ data: { ...dish, category_id: 'foreign-category' }, context: { supabase, userId: 'owner' } })).rejects.toThrow('não pertence');
    expect(write).not.toHaveBeenCalled();
  });
});