import { useRef, useState } from "react";
import { Plus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { compressForWeb } from "@/lib/image-compress";
import { uploadAdminImage } from "@/lib/admin-media-upload";

export function ImageUploadField({
  value,
  onChange,
  label = "Image",
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setBusy(true);
    try {
      const { blob, ext, contentType } = await compressForWeb(file);
      const uploaded = await uploadAdminImage(blob, `${crypto.randomUUID()}.${ext}`);
      onChange(uploaded.url);
      toast.success("Image uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold tracking-[0.18em] text-muted-foreground">{label.toUpperCase()}</p>
      <div className="flex items-center gap-3">
        {value ? (
          <div className="relative h-20 w-20 overflow-hidden border border-border bg-muted">
            <img src={value} alt="Selected" loading="lazy" decoding="async" className="h-full w-full object-cover" />
            <button
              type="button"
              aria-label="Remove image"
              onClick={() => onChange("")}
              className="absolute right-0 top-0 bg-background/80 p-1 text-foreground hover:text-destructive"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}
        <button
          type="button"
          aria-label="Add image"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="grid h-20 w-20 place-items-center border border-dashed border-border text-muted-foreground transition-colors hover:border-gold hover:text-gold disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-6 w-6" />}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
          }}
        />
      </div>
    </div>
  );
}
