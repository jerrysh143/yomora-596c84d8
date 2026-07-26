import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Crown, Calendar, BadgeCheck, Clock, Sparkles, RefreshCw, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { myMembershipQuery } from "@/lib/memberships.queries";
import { requestMembershipFn } from "@/lib/memberships.functions";
import { subscriptionPlansQuery } from "@/lib/subscription.queries";
import { formatINR } from "@/lib/products";

export const Route = createFileRoute("/_authenticated/membership-dashboard")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(myMembershipQuery());
    context.queryClient.ensureQueryData(subscriptionPlansQuery());
  },
  head: () => ({
    meta: [
      { title: "My Membership — YOMORA" },
      { name: "description", content: "View your Black Signature membership plan, status, and renewal details." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MembershipDashboard,
});

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function daysBetween(from: Date, to: Date) {
  return Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

function MembershipDashboard() {
  const { data: membership } = useSuspenseQuery(myMembershipQuery());
  const { data: plans } = useSuspenseQuery(subscriptionPlansQuery());
  const activePlan = plans.find((p) => p.is_active);
  const qc = useQueryClient();
  const requestFn = useServerFn(requestMembershipFn);
  const mutation = useMutation({
    mutationFn: () => requestFn({}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-membership"] }),
  });

  const now = new Date();
  const expires = membership?.expires_at ? new Date(membership.expires_at) : null;
  const daysLeft = expires ? daysBetween(now, expires) : null;
  const isActive = membership?.status === "active" && (!expires || expires > now);
  const isExpiring = isActive && daysLeft !== null && daysLeft <= 30;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="bg-onyx text-cream">
        <div className="container-x mx-auto max-w-[1200px] px-4 py-14 md:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.32em] text-gold">MY MEMBERSHIP</p>
              <h1 className="mt-3 font-display text-4xl leading-tight md:text-5xl">
                Black Signature Dashboard
              </h1>
            </div>
            <Link
              to="/account"
              className="text-[11px] font-semibold tracking-[0.24em] text-cream/70 hover:text-gold"
            >
              ← BACK TO ACCOUNT
            </Link>
          </div>

          {/* No membership */}
          {!membership && (
            <EmptyState
              plan={activePlan}
              onRequest={() => mutation.mutate()}
              loading={mutation.isPending}
            />
          )}

          {membership && (
            <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              {/* Plan card */}
              <div className="relative overflow-hidden border border-gold/30 bg-gradient-to-br from-[#1a1a1a] via-black to-[#0a0a0a] p-8 md:p-10">
                <div className="absolute inset-3 pointer-events-none border border-gold/15" />
                <div className="relative flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.32em] text-gold">
                      <Crown className="h-3.5 w-3.5" /> CURRENT PLAN
                    </div>
                    <h2 className="mt-3 font-display text-3xl text-cream md:text-4xl">
                      {membership.plan?.name ?? "Black Signature"}
                    </h2>
                    <p className="mt-2 text-sm text-cream/60">
                      {membership.plan?.tagline ?? "Exclusive. Rewarded. Always."}
                    </p>
                  </div>
                  <StatusPill status={membership.status} expired={!!expires && expires <= now} />
                </div>

                <div className="relative mt-8 grid gap-5 sm:grid-cols-3">
                  <Metric
                    icon={<BadgeCheck className="h-4 w-4" />}
                    label="Member ID"
                    value={membership.member_number ?? `BS-${membership.id.slice(0, 6).toUpperCase()}`}
                  />
                  <Metric
                    icon={<Calendar className="h-4 w-4" />}
                    label="Activated"
                    value={fmtDate(membership.activated_at)}
                  />
                  <Metric
                    icon={<Clock className="h-4 w-4" />}
                    label="Renews / Expires"
                    value={fmtDate(membership.expires_at)}
                  />
                </div>

                {isActive && daysLeft !== null && (
                  <div className="relative mt-6 border border-gold/20 bg-black/40 p-4">
                    <div className="flex items-center justify-between text-[11px] tracking-[0.22em] text-cream/70">
                      <span>MEMBERSHIP TIME REMAINING</span>
                      <span className="text-gold">{Math.max(0, daysLeft)} days</span>
                    </div>
                    <div className="mt-3 h-1 w-full overflow-hidden bg-white/10">
                      <div
                        className="h-full bg-gradient-to-r from-gold/80 to-gold"
                        style={{
                          width: `${Math.max(2, Math.min(100, (daysLeft / 365) * 100))}%`,
                        }}
                      />
                    </div>
                    {isExpiring && (
                      <p className="mt-3 text-[11px] text-gold/80">
                        Your membership expires soon — renew to keep all privileges.
                      </p>
                    )}
                  </div>
                )}

                {membership.status === "pending" && (
                  <p className="relative mt-6 border border-gold/20 bg-black/40 p-4 text-[11px] leading-relaxed text-cream/70">
                    Your request is being reviewed. Complete payment of{" "}
                    <span className="text-gold">{formatINR(membership.plan?.price ?? activePlan?.price ?? 0)}</span>{" "}
                    or shop for ₹25,000 in a single transaction to activate.
                  </p>
                )}
                {membership.status === "expired" && (
                  <p className="relative mt-6 border border-gold/20 bg-black/40 p-4 text-[11px] leading-relaxed text-cream/70">
                    Your membership has expired. Renew to restore your Black Signature privileges.
                  </p>
                )}
                {membership.status === "cancelled" && (
                  <p className="relative mt-6 border border-gold/20 bg-black/40 p-4 text-[11px] leading-relaxed text-cream/70">
                    Membership was cancelled. You can re-apply anytime.
                  </p>
                )}

                <div className="relative mt-8 flex flex-wrap gap-3">
                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-2 bg-gold px-6 py-3 text-[11px] font-semibold tracking-[0.28em] text-onyx hover:bg-gold-soft"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    {membership.status === "active" ? "MANAGE / RENEW" : "ACTIVATE NOW"}
                  </Link>
                  <Link
                    to="/membership"
                    className="inline-flex items-center gap-2 border border-gold/50 px-6 py-3 text-[11px] font-semibold tracking-[0.28em] text-cream hover:bg-gold/10"
                  >
                    VIEW BENEFITS <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* Side: signature card + auto-renew */}
              <div className="space-y-6">
                <div className="relative aspect-[1.6/1] w-full">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#1a1a1a] via-black to-[#0a0a0a] shadow-[0_30px_80px_-30px_rgba(212,175,55,0.5)]" />
                  <div className="absolute inset-3 rounded-lg border border-gold/40" />
                  <div className="relative flex h-full flex-col items-center justify-center px-6 text-center">
                    <div className="font-display text-3xl tracking-[0.22em] text-gold">YOMORA</div>
                    <div className="mt-1 text-[9px] tracking-[0.32em] text-cream/60">
                      BY NEHALBHAI DEVIKA JEWELLERS
                    </div>
                    <div className="mt-4 h-px w-20 bg-gold/50" />
                    <div className="mt-3 font-display text-lg tracking-[0.22em] text-cream">
                      BLACK SIGNATURE
                    </div>
                    <div className="mt-1 text-[10px] tracking-[0.32em] text-gold">MEMBERSHIP</div>
                    <div className="mt-3 text-[9px] tracking-[0.28em] text-cream/50">
                      MEMBER {membership.member_number ?? `BS-${membership.id.slice(0, 6).toUpperCase()}`}
                    </div>
                  </div>
                </div>

                <div className="border border-white/10 bg-black/30 p-5">
                  <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.28em] text-gold">
                    <Sparkles className="h-3.5 w-3.5" /> BENEFITS INCLUDED
                  </div>
                  <ul className="mt-4 space-y-2 text-[12px] leading-relaxed text-cream/75">
                    {(membership.plan?.benefits?.length
                      ? membership.plan.benefits
                      : [
                          "15% off on everything for 1 year",
                          "Early access to new collections",
                          "Priority dispatch & dedicated support",
                          "Birthday surprise & member-only offers",
                        ]
                    ).map((b) => (
                      <li key={b} className="flex gap-2">
                        <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-gold" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="border border-white/10 bg-black/30 p-4">
      <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.22em] text-gold">
        {icon} {label}
      </div>
      <div className="mt-2 font-display text-lg text-cream">{value}</div>
    </div>
  );
}

function StatusPill({ status, expired }: { status: string; expired: boolean }) {
  const effective = expired && status === "active" ? "expired" : status;
  const map: Record<string, string> = {
    active: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
    pending: "border-gold/50 bg-gold/10 text-gold",
    expired: "border-red-400/40 bg-red-400/10 text-red-300",
    cancelled: "border-white/20 bg-white/5 text-cream/60",
  };
  return (
    <span
      className={`inline-flex items-center gap-2 border px-3 py-1.5 text-[10px] font-semibold tracking-[0.28em] ${
        map[effective] ?? map.pending
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {effective.toUpperCase()}
    </span>
  );
}

function EmptyState({
  plan,
  onRequest,
  loading,
}: {
  plan: { name: string; price: number; duration_label: string; tagline: string } | undefined;
  onRequest: () => void;
  loading: boolean;
}) {
  return (
    <div className="mt-10 border border-gold/30 bg-black/40 p-8 md:p-12 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-gold/60 text-gold">
        <Crown className="h-6 w-6" />
      </div>
      <h2 className="mt-5 font-display text-3xl text-cream">You're not a member yet</h2>
      <p className="mx-auto mt-3 max-w-lg text-sm text-cream/70">
        Join Black Signature to unlock 15% off, early access, priority dispatch and more.
        {plan ? ` Membership from ${formatINR(plan.price)} / ${plan.duration_label.toLowerCase()}.` : ""}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          onClick={onRequest}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-gold px-6 py-3 text-[11px] font-semibold tracking-[0.28em] text-onyx hover:bg-gold-soft disabled:opacity-60"
        >
          {loading ? "REQUESTING..." : "REQUEST MEMBERSHIP"}
        </button>
        <Link
          to="/membership"
          className="inline-flex items-center gap-2 border border-gold/50 px-6 py-3 text-[11px] font-semibold tracking-[0.28em] text-cream hover:bg-gold/10"
        >
          LEARN MORE <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}