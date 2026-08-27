import { compressForWeb } from "@/lib/image-compress";
import { uploadAdminImage } from "@/lib/admin-media-upload";

const ALREADY_OPTIMIZED_BYTES = 400 * 1024;

export type ImageOptimizationResult =
  | { status: "optimized"; url: string; beforeBytes: number; afterBytes: number }
  | { status: "skipped"; url: string; beforeBytes: number; afterBytes: number }
  | { status: "failed"; url: string; error: string };

function fileNameFromUrl(url: string) {
  try {
    return new URL(url, window.location.origin).pathname.split("/").pop() || "image";
  } catch {
    return "image";
  }
}

export function canOptimizeImageUrl(url: string) {
  if (!url || url.startsWith("data:") || url.startsWith("blob:")) return false;
  // Bundled assets are already fingerprinted by Vite and cannot be replaced in the CMS.
  if (url.startsWith("/assets/") || url.startsWith("/src/")) return false;
  return (url.startsWith("/") && !url.startsWith("//")) || /^https:\/\//i.test(url);
}

export async function optimizeImageUrl(url: string): Promise<ImageOptimizationResult> {
  if (!canOptimizeImageUrl(url)) {
    return { status: "skipped", url, beforeBytes: 0, afterBytes: 0 };
  }

  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`Download failed (${response.status})`);

    const source = await response.blob();
    if (!source.type.startsWith("image/")) throw new Error("URL did not return an image");
    if (source.type === "image/webp" && source.size <= ALREADY_OPTIMIZED_BYTES) {
      return { status: "skipped", url, beforeBytes: source.size, afterBytes: source.size };
    }

    const file = new File([source], fileNameFromUrl(url), { type: source.type });
    const optimized = await compressForWeb(file);

    // Do not replace an image if transcoding does not reduce its payload.
    if (optimized.blob.size >= source.size) {
      return { status: "skipped", url, beforeBytes: source.size, afterBytes: source.size };
    }

    const uploaded = await uploadAdminImage(optimized.blob, `${crypto.randomUUID()}.${optimized.ext}`);

    return {
      status: "optimized",
      url: uploaded.url,
      beforeBytes: source.size,
      afterBytes: optimized.blob.size,
    };
  } catch (error) {
    return {
      status: "failed",
      url,
      error: error instanceof Error ? error.message : "Optimization failed",
    };
  }
}
