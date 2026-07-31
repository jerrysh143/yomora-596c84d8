import { createFileRoute } from "@tanstack/react-router";

/**
 * Streams images from the public site-images bucket without buffering them in
 * memory, and forwards validators so browsers/CDNs can answer with 304s.
 */
export const Route = createFileRoute("/api/public/img/$")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const path = (params as Record<string, string>)._splat;
        if (!path || path.includes("..")) return new Response("Not found", { status: 404 });

        const base = process.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
        if (!base) return new Response("Not configured", { status: 404 });

        const inm = request.headers.get("if-none-match");
        const upstream = await fetch(
          `${base}/storage/v1/object/public/site-images/${path.split("/").map(encodeURIComponent).join("/")}`,
          {
            headers: {
              ...(inm ? { "If-None-Match": inm } : {}),
              ...(request.headers.get("range") ? { Range: request.headers.get("range")! } : {}),
            },
          },
        );

        const cache = "public, max-age=31536000, s-maxage=31536000, immutable";
        if (upstream.status === 304) {
          return new Response(null, {
            status: 304,
            headers: { "Cache-Control": cache, ETag: upstream.headers.get("etag") ?? "" },
          });
        }
        if (!upstream.ok || !upstream.body) return new Response("Not found", { status: 404 });

        const headers = new Headers({
          "Content-Type": upstream.headers.get("content-type") || "image/webp",
          "Cache-Control": cache,
        });
        const etag = upstream.headers.get("etag");
        if (etag) headers.set("ETag", etag);
        const len = upstream.headers.get("content-length");
        if (len) headers.set("Content-Length", len);

        return new Response(upstream.body, { status: upstream.status, headers });
      },
    },
  },
});
