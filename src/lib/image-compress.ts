/** Client-side image downscale + WebP (JPEG fallback) compression for uploads. */
const MAX_DIM = 1400;
const QUALITY = 0.78;

export type CompressedImage = { blob: Blob; ext: "webp" | "jpg"; contentType: string };

export async function compressForWeb(file: File): Promise<CompressedImage> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unsupported");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  const toBlob = (type: string) =>
    new Promise<Blob | null>((res) => canvas.toBlob(res, type, QUALITY));

  let blob = await toBlob("image/webp");
  // Some browsers silently fall back to PNG (huge files) when WebP is missing.
  if (!blob || blob.type !== "image/webp") {
    const jpeg = await toBlob("image/jpeg");
    if (jpeg && jpeg.type === "image/jpeg") {
      return { blob: jpeg, ext: "jpg", contentType: "image/jpeg" };
    }
    if (!blob) throw new Error("Compression failed");
    return { blob, ext: "jpg", contentType: blob.type || "image/jpeg" };
  }
  return { blob, ext: "webp", contentType: "image/webp" };
}