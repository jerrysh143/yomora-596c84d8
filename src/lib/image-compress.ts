/** Client-side image downscale + WebP (JPEG fallback) compression for uploads. */
const MAX_DIM = 1200;
const TARGET_BYTES = 350 * 1024;
const START_QUALITY = 0.76;
const MIN_QUALITY = 0.58;
const QUALITY_STEP = 0.06;

export type CompressedImage = { blob: Blob; ext: "webp" | "jpg"; contentType: string };

export async function compressForWeb(file: File): Promise<CompressedImage> {
  const bitmap = await createImageBitmap(file);

  try {
    const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unsupported");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, w, h);

    const encode = async (type: string) => {
      let quality = START_QUALITY;
      let blob = await new Promise<Blob | null>((res) =>
        canvas.toBlob(res, type, quality),
      );
      while (blob && blob.size > TARGET_BYTES && quality > MIN_QUALITY) {
        quality = Math.max(MIN_QUALITY, quality - QUALITY_STEP);
        blob = await new Promise<Blob | null>((res) =>
          canvas.toBlob(res, type, quality),
        );
      }
      return blob;
    };

    let blob = await encode("image/webp");
    // Some browsers silently fall back to PNG (huge files) when WebP is missing.
    if (!blob || blob.type !== "image/webp") {
      const jpeg = await encode("image/jpeg");
      if (jpeg && jpeg.type === "image/jpeg") {
        return { blob: jpeg, ext: "jpg", contentType: "image/jpeg" };
      }
      if (!blob) throw new Error("Compression failed");
      return { blob, ext: "jpg", contentType: blob.type || "image/jpeg" };
    }

    return { blob, ext: "webp", contentType: "image/webp" };
  } finally {
    bitmap.close?.();
  }
}
