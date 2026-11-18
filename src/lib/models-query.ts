import { queryOptions } from '@tanstack/react-query';
import { getModels } from './models.functions';
export const modelsQuery=()=>queryOptions({queryKey:['dish-models'],queryFn:()=>getModels(),staleTime:10000});
