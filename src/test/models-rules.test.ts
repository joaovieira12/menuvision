import { describe, it, expect } from "vitest";
import {
  generateModelSchema,
  physicalScale,
  isGlb,
  MAX_TEST_MODEL_BYTES,
  parseModelUpload,
} from "@/lib/models-schema";
describe("Real-sized food models", () => {
  it("turns a 20 cm measured dish width into 0.2 meters", () =>
    expect(physicalScale(20, 1)).toBe(0.2));
  it("normalizes a 2 meter model to a 30 cm dish", () => expect(physicalScale(30, 2)).toBe(0.15));
  it("rejects missing or zero dimensions", () => {
    expect(() => physicalScale(0, 1)).toThrow();
    expect(() =>
      generateModelSchema.parse({ dishId: "11111111-1111-4111-8111-111111111111", widthCm: 0 }),
    ).toThrow();
  });
});

describe("GLB upload", () => {
  const glb = new Uint8Array([
    0x67,
    0x6c,
    0x54,
    0x46,
    2,
    0,
    0,
    0,
    48,
    0,
    0,
    0,
    28,
    0,
    0,
    0,
    0x4a,
    0x53,
    0x4f,
    0x4e,
    ...new TextEncoder().encode('{"asset":{"version":"2.0"}} '),
  ]);

  it("accepts a GLB 2.0 and rejects truncated, invalid or oversized files", () => {
    expect(isGlb(glb)).toBe(true);
    expect(isGlb(glb.subarray(0, -1))).toBe(false);
    expect(isGlb(new Uint8Array(48))).toBe(false);
    expect(isGlb(new Uint8Array(MAX_TEST_MODEL_BYTES + 1))).toBe(false);
  });

  it("validates an upload with a file and measured width", () => {
    const form = new FormData();
    form.set("dishId", "11111111-1111-4111-8111-111111111111");
    form.set("widthCm", "15.5");
    form.set("file", new File([glb], "prato.GLB"));
    expect(parseModelUpload(form).widthCm).toBe(15.5);
    form.set("file", new File([glb], "prato.txt"));
    expect(() => parseModelUpload(form)).toThrow();
  });
});
