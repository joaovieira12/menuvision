import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { categorySchema, dishSchema, idSchema } from './menu-schema';

export const getMenu = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const [dishes, categories] = await Promise.all([
    context.supabase.from('dishes').select('*').eq('owner_id', context.userId).order('created_at', { ascending: false }),
    context.supabase.from('categories').select('*').eq('owner_id', context.userId).order('name'),
  ]);
  if (dishes.error || categories.error) throw new Error('Não foi possível carregar seus pratos. Tente novamente.');
  const rows = await Promise.all(dishes.data.map(async dish => {
    if (!dish.photo_path) return { ...dish, photo_url: null };
    const photo = await context.supabase.storage.from('dish-photos').createSignedUrl(dish.photo_path, 3600);
    return { ...dish, photo_url: photo.data?.signedUrl ?? null };
  }));
  return { dishes: rows, categories: categories.data };
});

export const saveDish = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => dishSchema.parse(input)).handler(async ({ data, context }) => {
  const { data: restaurant, error } = await context.supabase.from('restaurants').select('id').eq('owner_id', context.userId).single();
  if (error || !restaurant) throw new Error('Restaurante não encontrado.');
  if (data.category_id) {
    const category = await context.supabase.from('categories').select('id').eq('id', data.category_id).eq('restaurant_id', restaurant.id).eq('owner_id', context.userId).single();
    if (category.error) throw new Error('Esta categoria não pertence ao seu restaurante.');
  }
  if (data.photo_path) {
    if (!new RegExp(`^${context.userId}/[a-f0-9-]+\\.(jpg|png|webp)$`).test(data.photo_path)) throw new Error('Foto inválida.');
    const filename = data.photo_path.split('/')[1];
    if (!filename) throw new Error('Foto inválida.');
    const objects = await context.supabase.storage.from('dish-photos').list(context.userId, { search: filename });
    const object = objects.data?.find(item => item.name === filename);
    if (objects.error || !object || !['image/jpeg', 'image/png', 'image/webp'].includes(String(object.metadata?.mimetype)) || Number(object.metadata?.size) > 5 * 1024 * 1024) throw new Error('Foto não encontrada ou inválida.');
  }
  const { id, ...values } = data;
  const result = id
    ? await context.supabase.from('dishes').update(values).eq('id', id).eq('owner_id', context.userId).select('id').single()
    : await context.supabase.from('dishes').insert({ ...values, owner_id: context.userId, restaurant_id: restaurant.id }).select('id').single();
  if (result.error) throw new Error('Não foi possível salvar o prato.');
  return result.data;
});
export const deleteDish = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => idSchema.parse(input)).handler(async ({ data, context }) => {
  const result = await context.supabase.from('dishes').delete().eq('id', data.id).eq('owner_id', context.userId).select('id,photo_path').single();
  if (result.error) throw new Error('Não foi possível excluir o prato.');
  if (result.data.photo_path) await context.supabase.storage.from('dish-photos').remove([result.data.photo_path]);
  return { success: true };
});
export const saveCategory = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => categorySchema.parse(input)).handler(async ({ data, context }) => {
  const restaurant = await context.supabase.from('restaurants').select('id').eq('owner_id', context.userId).single();
  if (restaurant.error) throw new Error('Restaurante não encontrado.');
  const result = data.id
    ? await context.supabase.from('categories').update({ name: data.name }).eq('id', data.id).eq('owner_id', context.userId).select('id').single()
    : await context.supabase.from('categories').insert({ name: data.name, owner_id: context.userId, restaurant_id: restaurant.data.id }).select('id').single();
  if (result.error) throw new Error(result.error.code === '23505' ? 'Já existe uma categoria com esse nome.' : 'Não foi possível salvar a categoria.');
  return result.data;
});
export const deleteCategory = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => idSchema.parse(input)).handler(async ({ data, context }) => {
  const result = await context.supabase.from('categories').delete().eq('id', data.id).eq('owner_id', context.userId).select('id').single();
  if (result.error) throw new Error(result.error.code === '23503' ? 'Mova os pratos para outra categoria antes de excluir.' : 'Não foi possível excluir a categoria.');
  return { success: true };
});