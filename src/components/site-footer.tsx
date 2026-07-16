import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="bg-onyx text-cream/80">
      <div className="container-x mx-auto max-w-[1400px] grid gap-10 py-14 md:grid-cols-4">
        <div>
          <div className="font-display text-2xl tracking-[0.18em] text-gold">YOMORA</div>
          <p className="mt-3 text-xs leading-relaxed text-cream/60">
            Premium 925 sterling silver jewellery by Nehalbhai Devika Jewellers. A legacy of trust since 1994.
          </p>
        </div>
        <FooterCol title="Shop" links={[
          { label: "Rings", to: "/products" },
          { label: "Earrings", to: "/products" },
          { label: "Neckwear", to: "/products" },
          { label: "Bracelets", to: "/products" },
        ]} />
        <FooterCol title="Help" links={[
          { label: "Shipping", to: "/products" },
          { label: "Returns", to: "/products" },
          { label: "Care Guide", to: "/products" },
          { label: "Contact", to: "/products" },
        ]} />
        <div>
          <div className="text-xs font-semibold tracking-[0.24em] text-gold">STAY IN TOUCH</div>
          <p className="mt-3 text-xs text-cream/60">New arrivals, quiet drops, and craft notes.</p>
          <form className="mt-4 flex overflow-hidden rounded-sm border border-white/15">
            <input placeholder="Email address" className="flex-1 bg-transparent px-3 py-2 text-xs outline-none placeholder:text-cream/40" />
            <button className="bg-gold px-4 text-[11px] font-semibold tracking-[0.18em] text-onyx hover:bg-gold-soft">JOIN</button>
          </form>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-[11px] tracking-[0.14em] text-cream/50">
        © {new Date().getFullYear()} YOMORA · Nehalbhai Devika Jewellers
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; to: string }[] }) {
  return (
    <div>
      <div className="text-xs font-semibold tracking-[0.24em] text-gold">{title.toUpperCase()}</div>
      <ul className="mt-3 space-y-2 text-xs text-cream/70">
        {links.map((l) => (
          <li key={l.label}>
            <Link to={l.to} className="hover:text-gold">{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}