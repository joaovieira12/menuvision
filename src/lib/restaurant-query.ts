import { queryOptions } from '@tanstack/react-query';
import { getRestaurant } from './restaurant.functions';
export const restaurantQuery = () => queryOptions({queryKey:['restaurant'],queryFn:()=>getRestaurant()});
