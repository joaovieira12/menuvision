import { createFileRoute } from '@tanstack/react-router';
import { restaurantQuery } from '@/lib/restaurant-query';
import { pageHead } from '@/lib/metadata';
import { Settings } from './settings';
export const Route = createFileRoute('/_authenticated/restaurant')({ head: () => pageHead('Meu restaurante', 'Gerencie as informações do seu restaurante no MenuVision.'), loader: ({ context }) => context.queryClient.ensureQueryData(restaurantQuery()), component: Settings });