import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { MessageCircle, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { requestPhoneOtpFn, verifyPhoneOtpFn } from "@/lib/phone-auth.functions";
import { toast } from "sonner";

const searchSchema = z.object({
  redirect: z.string().optional(),
  admin: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign In — YOMORA" },
      { name: "description", content: "Sign in to YOMORA with your mobile number." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { redirect, admin } = useSearch({ from: "/auth" });
  const isAdminAccess = admin === "1" || (redirect ?? "").includes("/admin");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: redirect ?? "/account", replace: true });
    });
  }, [navigate, redirect]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="container-x mx-auto grid max-w-md gap-6 py-20">
        {isAdminAccess ? <AdminLogin redirect={redirect} /> : <PhoneLogin redirect={redirect} />}
      </section>
      <SiteFooter />
    </div>
  );
}

function PhoneLogin({ redirect }: { redirect?: string }) {
  const navigate = useNavigate();
  const requestOtp = useServerFn(requestPhoneOtpFn);
  const verifyOtp = useServerFn(verifyPhoneOtpFn);
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = () => {
    setCooldown(30);
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1 && timer.current) clearInterval(timer.current);
        return c <= 1 ? 0 : c - 1;
      });
    }, 1000);
  };
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const res = await requestOtp({ data: { phone } });
      setPhone(res.phone);
      setStep("code");
      startCooldown();
      if (res.devCode) {
        toast.info(`WhatsApp is not connected yet — your code is ${res.devCode}`, { duration: 15000 });
      } else {
        toast.success("Code sent to your WhatsApp");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send the code");
    } finally {
      setLoading(false);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { email, password } = await verifyOtp({ data: { phone, code } });
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Signed in");
      navigate({ to: redirect ?? "/account", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not verify the code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div>
        <p className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.28em] text-gold">
          <MessageCircle className="h-3.5 w-3.5" /> WHATSAPP LOGIN
        </p>
        <h1 className="mt-3 font-display text-4xl text-foreground">
          {step === "phone" ? "Sign in with mobile" : "Enter your code"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {step === "phone"
            ? "We'll send a 6-digit code to your WhatsApp. No password needed."
            : `Code sent to ${phone} on WhatsApp.`}
        </p>
      </div>

      {step === "phone" ? (
        <form onSubmit={send} className="grid gap-4">
          <label className="grid gap-1.5 text-sm">
            <span className="text-xs tracking-[0.16em] text-muted-foreground">MOBILE NUMBER</span>
            <div className="flex items-center border border-border bg-background focus-within:border-gold">
              <span className="px-3 text-sm text-muted-foreground">+91</span>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                required
                placeholder="98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-transparent px-1 py-2.5 text-sm outline-none"
              />
            </div>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="bg-onyx px-6 py-3 text-[11px] font-semibold tracking-[0.24em] text-cream hover:bg-onyx/90 disabled:opacity-50"
          >
            {loading ? "SENDING…" : "SEND CODE ON WHATSAPP"}
          </button>
        </form>
      ) : (
        <form onSubmit={verify} className="grid gap-4">
          <label className="grid gap-1.5 text-sm">
            <span className="text-xs tracking-[0.16em] text-muted-foreground">6-DIGIT CODE</span>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="border border-border bg-background px-3 py-2.5 text-center text-lg tracking-[0.5em] outline-none focus:border-gold"
            />
          </label>
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="bg-onyx px-6 py-3 text-[11px] font-semibold tracking-[0.24em] text-cream hover:bg-onyx/90 disabled:opacity-50"
          >
            {loading ? "VERIFYING…" : "VERIFY & SIGN IN"}
          </button>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <button type="button" onClick={() => setStep("phone")} className="hover:text-gold">
              Change number
            </button>
            <button
              type="button"
              disabled={cooldown > 0 || loading}
              onClick={() => send()}
              className="hover:text-gold disabled:opacity-50"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
            </button>
          </div>
        </form>
      )}
    </>
  );
}

function AdminLogin({ redirect }: { redirect?: string }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate({ to: redirect ?? "/admin", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div>
        <p className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.28em] text-gold">
          <ShieldCheck className="h-3.5 w-3.5" /> STAFF ACCESS
        </p>
        <h1 className="mt-3 font-display text-4xl text-foreground">Admin sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Restricted area. Use your administrator credentials.
        </p>
      </div>
      <form onSubmit={submit} className="grid gap-4">
        <label className="grid gap-1.5 text-sm">
          <span className="text-xs tracking-[0.16em] text-muted-foreground">EMAIL</span>
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="text-xs tracking-[0.16em] text-muted-foreground">PASSWORD</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="bg-onyx px-6 py-3 text-[11px] font-semibold tracking-[0.24em] text-cream hover:bg-onyx/90 disabled:opacity-50"
        >
          {loading ? "PLEASE WAIT…" : "SIGN IN"}
        </button>
      </form>
    </>
  );
}
