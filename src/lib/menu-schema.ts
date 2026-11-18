import { z } from 'zod';
export const idSchema = z.object({ id: z.string().uuid() });
export const categorySchema = z.object({ id: z.string().uuid().optional(), name: z.string().trim().min(2, 'Informe o nome da categoria.').max(100) });
export const dishSchema = z.object({
  id: z.string().uuid().optional(), name: z.string().trim().min(2, 'Informe o nome do prato.').max(100),
  description: z.string().trim().max(1000), price: z.number().finite().min(0, 'O preço não pode ser negativo.').max(99999999.99).refine(v => Math.abs(v * 100 - Math.round(v * 100)) < 0.00001, 'Use no máximo duas casas decimais.'),
  category_id: z.string().uuid().nullable(), active: z.boolean(), photo_path: z.string().max(250).nullable(),
});
export function validatePhoto(file: File) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Escolha uma foto JPG, PNG ou WebP.');
  if (file.size === 0 || file.size > 5 * 1024 * 1024) throw new Error('A foto deve ter até 5 MB.');
}