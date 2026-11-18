import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { restaurantSchema } from './restaurant-schema';
export const getRestaurant = createServerFn({method:'GET'}).middleware([requireSupabaseAuth]).handler(async ({context})=>{
 const [restaurant,profile] = await Promise.all([context.supabase.from('restaurants').select('*').eq('owner_id',context.userId).single(),context.supabase.from('profiles').select('display_name').eq('id',context.userId).single()]);
 if(restaurant.error || profile.error) throw new Error('Não foi possível carregar o restaurante. Tente novamente.');
 return {restaurant:restaurant.data,profile:profile.data};
});
export const updateRestaurant = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((input:unknown)=>restaurantSchema.parse(input)).handler(async ({data,context})=>{
 const {display_name,...restaurant} = data;
 const result=await context.supabase.from('restaurants').update(restaurant).eq('owner_id',context.userId).select('id').single();
 if(result.error) throw new Error('Não foi possível salvar o restaurante.');
 const profile=await context.supabase.from('profiles').update({display_name}).eq('id',context.userId);
 if(profile.error) throw new Error('Restaurante salvo, mas não foi possível atualizar seu nome.');
 return {success:true};
});
