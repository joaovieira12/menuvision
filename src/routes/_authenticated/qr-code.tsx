import { createFileRoute } from '@tanstack/react-router';
import { restaurantQuery } from '@/lib/restaurant-query';
import { pageHead } from '@/lib/metadata';
import { FuturePage } from '@/components/menuvision/future-page';
export const Route = createFileRoute('/_authenticated/qr-code')({ head: () => pageHead('QR Code', 'Área de QR Code do restaurante no MenuVision.'), loader: ({ context }) => context.queryClient.ensureQueryData(restaurantQuery()), component: () => <FuturePage title="QR Code"/> });