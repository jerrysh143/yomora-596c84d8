import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { uploadAdminImage } from "@/lib/admin-media-upload";
import { updateSiteContentFn } from "@/lib/site-content.functions";
import { siteContentQuery } from "@/lib/site-content.queries";

const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_BYTES = 8 * 1024 * 1024;

function extensionFor(file: File) {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

export function PaymentQrManager() {
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const save = useServerFn(updateSiteContentFn);
  const { data: content, isLoading } = useQuery(siteContentQuery());
  const [uploading, setUploading] = useState(false);

  const publish = useMutation({
    mutationFn: (imageUrl: string) =>
      save({ data: { key: "payment_qr", data: { image_url: imageUrl } } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["site_content"] });
      toast.success("Payment QR published to checkout");
    },
    onError: (error: Error) => toast.error(error.message || "Unable to publish payment QR"),
  });

  async function handleFile(file: File) {
    if (!ACCEPTED_TYPES.has(file.type)) {
      toast.error("Choose a JPG, PNG or WebP image");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      toast.error("QR image must be smaller than 8 MB");
      return;
    }

    setUploading(true);
    try {
      const upload = await uploadAdminImage(
        file,
        `payment-qr-${crypto.randomUUID()}.${extensionFor(file)}`,
      );
      await publish.mutateAsync(upload.url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to upload payment QR");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const busy = uploading || publish.isPending;
  const imageUrl = content?.payment_qr.image_url ?? "/devika-jewellers-phonepe-qr.jpeg";

  return (
    <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(280px,420px)_1fr]">
      <div className="border border-gold/40 bg-white p-5 shadow-sm">
        {isLoading ? (
          <div className="grid aspect-square place-items-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <img
            src={imageUrl}
            alt="Current checkout payment QR"
            className="mx-auto w-full max-w-[360px] object-contain"
          />
        )}
      </div>

      <div className="border border-border bg-secondary/20 p-6 sm:p-8">
        <p className="text-[11px] font-semibold tracking-[0.24em] text-gold">CHECKOUT PAYMENT</p>
        <h2 className="mt-2 font-display text-3xl">Payment QR scanner</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Upload the verified merchant QR customers should scan after placing an online-payment
          order. The current checkout image stays active unless the new upload and secure admin
          update both succeed.
        </p>

        <div className="mt-6 flex items-start gap-3 border border-gold/35 bg-gold/10 p-4 text-sm">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
          <p>
            Stored in Hostinger media storage and published only by an authenticated YOMORA admin.
          </p>
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="mt-6 inline-flex items-center gap-2 bg-gold px-5 py-3 text-[11px] font-semibold tracking-[0.2em] text-onyx hover:bg-gold-soft disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {busy ? "UPLOADING & PUBLISHING…" : "UPLOAD & PUBLISH NEW QR"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
        <p className="mt-3 text-xs text-muted-foreground">
          JPG, PNG or WebP · maximum 8 MB. Test-scan the new QR after publishing.
        </p>
      </div>
    </section>
  );
}

