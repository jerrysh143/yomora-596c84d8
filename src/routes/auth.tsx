import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
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
      { name: "description", content: "Sign in to your YOMORA account with Google or email." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/auth" });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: redirect ?? "/account", replace: true });
    });
  }, [navigate, redirect]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="container-x mx-auto grid max-w-md gap-6 py-20">
        <EmailLogin redirect={redirect} />
      </section>
      <SiteFooter />
    </div>
  );
}

function EmailLogin({ redirect }: { redirect?: string }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const google = async () => {
    try {
      const safeNext = redirect && redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : undefined;
      const res = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: safeNext ? `${window.location.origin}${safeNext}` : window.location.origin,
      });
      if (res.error) throw res.error;
      if (!("redirected" in res && res.redirected)) {
        navigate({ to: redirect ?? "/account", replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign in failed");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${
              redirect && redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : "/account"
            }`,
          },
        });
        if (error) throw error;
        toast.success("Account created. Check your email if confirmation is required.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: redirect ?? "/account", replace: true });
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
          YOMORA ACCOUNT
        </p>
        <h1 className="mt-3 font-display text-4xl text-foreground">
          {mode === "signin" ? "Sign in" : "Create account"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Continue with Google or use your email and password.
        </p>
      </div>

      <button
        type="button"
        onClick={google}
        className="border border-border px-6 py-3 text-[11px] font-semibold tracking-[0.24em] text-foreground hover:border-gold"
      >
        CONTINUE WITH GOOGLE
      </button>

      <div className="flex items-center gap-3 text-[10px] tracking-[0.24em] text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> OR <span className="h-px flex-1 bg-border" />
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
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
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
          {loading ? "PLEASE WAIT…" : mode === "signin" ? "SIGN IN" : "CREATE ACCOUNT"}
        </button>
        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="text-xs text-muted-foreground hover:text-gold"
        >
          {mode === "signin" ? "New to YOMORA? Create an account" : "Already have an account? Sign in"}
        </button>
      </form>
    </>
  );
}
