import { describe, expect, it } from 'vitest';
import { restaurantSchema, signupSchema } from '@/lib/restaurant-schema';
describe('Restaurant account validation',()=>{
 it('requires an email credential rather than a username',()=>{expect(signupSchema.safeParse({restaurant_name:'Restaurante',display_name:'Samuel',email:'samuel',password:'safePassword8'}).success).toBe(false);});
 it('retains the restaurant name and personal profile separately',()=>{const result=restaurantSchema.parse({name:'Restaurante do Samuel',description:'Cozinha brasileira',phone:'11912345678',display_name:'Samuel'});expect(result.name).toBe('Restaurante do Samuel');expect(result.display_name).toBe('Samuel');});
});
