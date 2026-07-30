import { useRef, useState } from "react";
import { Plus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const MAX_DIM = 1600;
const QUALITY = 0.82;
const MAX_IMAGES = 8;

async function compressForWeb(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unsupported");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/webp", QUALITY));
  if (!blob) throw new Error("Compression failed");
  return blob;
}

/** Multi-image uploader. The first image is used as the main product image. */
export function GalleryUploadField({
  value,
  onChange,
  label = "Product images",
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFiles(files: File[]) {
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (!images.length) {
      toast.error("Please choose image files");
      return;
    }
    const room = MAX_IMAGES - value.length;
    if (room <= 0) {
      toast.error(`You can upload up to ${MAX_IMAGES} images`);
      return;
    }
    const batch = images.slice(0, room);
    setBusy(true);
    const uploaded: string[] = [];
    try {
      for (const file of batch) {
        const blob = await compressForWeb(file);
        const path = `${crypto.randomUUID()}.webp`;
        const { error } = await supabase.storage
          .from("site-images")
          .upload(path, blob, { contentType: "image/webp", cacheControl: "31536000" });
        if (error) throw error;
        uploaded.push(`/api/public/img/${path}`);
      }
      onChange([...value, ...uploaded]);
      toast.success(`${uploaded.length} image${uploaded.length > 1 ? "s" : ""} uploaded`);
    } catch (e) {
      if (uploaded.length) onChange([...value, ...uploaded]);
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold tracking-[0.18em] text-muted-foreground">
        {label.toUpperCase()}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        {value.map((url, i) => (
          <div key={url + i} className="relative h-20 w-20 overflow-hidden border border-border bg-muted">
            <img src={url} alt={`Product ${i + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              aria-label={`Remove image ${i + 1}`}
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              className="absolute right-0 top-0 bg-background/80 p-1 text-foreground hover:text-destructive"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            {i === 0 ? (
              <span className="absolute bottom-0 left-0 bg-background/85 px-1 text-[9px] tracking-[0.12em] text-muted-foreground">
                MAIN
              </span>
            ) : (
              <button
                type="button"
                aria-label={`Move image ${i + 1} left`}
                onClick={() => move(i, i - 1)}
                className="absolute bottom-0 left-0 bg-background/85 px-1 text-[9px] tracking-[0.12em] text-muted-foreground hover:text-gold"
              >
                ←
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          aria-label="Add images"
          disabled={busy || value.length >= MAX_IMAGES}
          onClick={() => inputRef.current?.click()}
          className="grid h-20 w-20 place-items-center border border-dashed border-border text-muted-foreground transition-colors hover:border-gold hover:text-gold disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-6 w-6" />}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            if (files.length) void handleFiles(files);
          }}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Select multiple files at once. First image is the main one shown in listings (up to {MAX_IMAGES}).
      </p>
    </div>
  );
}