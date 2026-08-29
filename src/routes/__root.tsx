import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "sonner";
import { CheckCircle2, Info, LoaderCircle, TriangleAlert, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "YOMORA — Premium 925 Sterling Silver Jewellery" },
      {
        name: "description",
        content:
          "YOMORA by Nehalbhai Devika Jewellers — timeless 925 sterling silver rings, earrings, neckwear, and bracelets crafted for every you.",
      },
      { name: "author", content: "YOMORA" },
      { property: "og:title", content: "YOMORA — Premium 925 Sterling Silver Jewellery" },
      {
        property: "og:description",
        content: "YOMORA by Nehalbhai Devika Jewellers — timeless 925 sterling silver rings, earrings, neckwear, and bracelets crafted for every you.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "YOMORA — Premium 925 Sterling Silver Jewellery" },
      { name: "twitter:description", content: "YOMORA by Nehalbhai Devika Jewellers — timeless 925 sterling silver rings, earrings, neckwear, and bracelets crafted for every you." },
      { property: "og:image", content: "https://yomora.in/og-image.jpg" },
      { name: "twitter:image", content: "https://yomora.in/og-image.jpg" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/yomora-option-3-symbol.png?v=3", type: "image/png" },
      { rel: "shortcut icon", href: "/yomora-option-3-symbol.png?v=3", type: "image/png" },
      { rel: "apple-touch-icon", href: "/yomora-option-3-symbol.png?v=3" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <main id="main-content">
        <Outlet />
      </main>
      <Toaster
        className="yomora-toaster"
        position="top-right"
        visibleToasts={4}
        gap={10}
        offset={18}
        mobileOffset={12}
        closeButton
        icons={{
          success: <CheckCircle2 className="h-5 w-5" />,
          error: <XCircle className="h-5 w-5" />,
          warning: <TriangleAlert className="h-5 w-5" />,
          info: <Info className="h-5 w-5" />,
          loading: <LoaderCircle className="h-5 w-5 animate-spin" />,
        }}
        toastOptions={{
          classNames: {
            toast: "yomora-toast",
            title: "yomora-toast-title",
            description: "yomora-toast-description",
            icon: "yomora-toast-icon",
            actionButton: "yomora-toast-action",
            cancelButton: "yomora-toast-cancel",
            closeButton: "yomora-toast-close",
          },
        }}
      />
    </QueryClientProvider>
  );
}
