import { z } from "zod";
export const generateModelSchema = z.object({
  dishId: z.string().uuid(),
  widthCm: z.number().finite().positive("Informe a largura real.").max(200),
});
export function physicalScale(widthCm: number, modelWidthMeters: number) {
  if (!(widthCm > 0) || !(modelWidthMeters > 0)) throw new Error("Medidas inválidas.");
  return widthCm / 100 / modelWidthMeters;
}
export const MAX_TEST_MODEL_BYTES = 15 * 1024 * 1024;
export function parseModelUpload(input: unknown) {
  if (!(input instanceof FormData)) throw new Error("Envie um arquivo .glb de até 15 MB.");
  const file = input.get("file");
  if (
    !(file instanceof File) ||
    !/\.glb$/i.test(file.name) ||
    !file.size ||
    file.size > MAX_TEST_MODEL_BYTES
  ) {
    throw new Error("Envie um arquivo .glb de até 15 MB.");
  }
  return {
    ...generateModelSchema.parse({
      dishId: input.get("dishId"),
      widthCm: Number(input.get("widthCm")),
    }),
    file,
  };
}

export function isGlb(bytes: Uint8Array) {
  if (bytes.byteLength < 24 || bytes.byteLength > MAX_TEST_MODEL_BYTES) return false;
  const header = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const jsonLength = header.getUint32(12, true);
  return (
    header.getUint32(0, true) === 0x46546c67 &&
    header.getUint32(4, true) === 2 &&
    header.getUint32(8, true) === bytes.byteLength &&
    header.getUint32(16, true) === 0x4e4f534a &&
    jsonLength > 0 &&
    jsonLength % 4 === 0 &&
    jsonLength <= bytes.byteLength - 20
  );
}
