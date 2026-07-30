import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { BellRing } from "lucide-react";
import { createNotifyRequestFn } from "@/lib/notify.functions";

export function NotifyMeForm({ productId }: { productId: string }) {
  const submit = useServerFn(createNotifyRequestFn);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() && !phone.trim()) {
      setError("Enter an email or phone number so we can reach you.");
      return;
    }
    setStatus("saving");
    setError("");
    try {
      await submit({ data: { product_id: productId, name: name.trim(), email: email.trim(), phone: phone.trim() } });
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  if (status === "done") {
    return (
      <div className="mt-5 border border-gold/50 bg-gold/10 px-4 py-4 text-sm text-foreground">
        You're on the list — we'll let you know the moment this piece is back.
      </div>
    );
  }

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex w-full items-center justify-center gap-2 bg-onyx px-6 py-4 text-[11px] font-bold tracking-[0.28em] text-cream hover:bg-onyx/90"
      >
        <BellRing className="h-4 w-4 text-gold" /> NOTIFY ME WHEN AVAILABLE
      </button>

      {open && (
        <form onSubmit={onSubmit} className="mt-3 space-y-3 border border-border p-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name (optional)"
            className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number"
            className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={status === "saving"}
            className="w-full bg-gold px-6 py-3 text-[11px] font-bold tracking-[0.28em] text-onyx hover:bg-gold/90 disabled:opacity-60"
          >
            {status === "saving" ? "SENDING…" : "ALERT ME"}
          </button>
        </form>
      )}
    </div>
  );
}