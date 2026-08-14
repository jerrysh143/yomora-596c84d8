import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";

const MINIMUM_DISPLAY_MS = 1550;

export function LogoLoader() {
  const routePending = useRouterState({ select: (state) => state.status === "pending" });
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const startedAt = performance.now();
    let timer: number | undefined;

    const finish = () => {
      const remaining = Math.max(0, MINIMUM_DISPLAY_MS - (performance.now() - startedAt));
      timer = window.setTimeout(() => setInitialLoading(false), remaining);
    };

    if (document.readyState === "complete") finish();
    else window.addEventListener("load", finish, { once: true });

    return () => {
      window.removeEventListener("load", finish);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, []);

  if (!initialLoading && !routePending) return null;

  return (
    <div className="yomora-loader" role="status" aria-live="polite" aria-label="Loading YOMORA">
      <svg className="yomora-loader__logo" viewBox="0 0 512 512" aria-hidden="true">
        <g className="yomora-loader__lines" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path pathLength="1" d="M106 323v-90q0-70 70-105 60-30 80-72 20 42 80 72 70 35 70 105v90" />
          <path pathLength="1" d="M106 323h65m170 0h65" />
          <path pathLength="1" d="M256 313c-40-45-90-45-116-3 40 0 80 16 116 53 36-37 76-53 116-53-26-42-76-42-116 3Z" />
          <path pathLength="1" d="M256 363c-40-25-70-33-108-33 24 40 66 56 108 33 42 23 84 7 108-33-38 0-68 8-108 33Z" />
        </g>
        <g className="yomora-loader__details" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path pathLength="1" d="m256 82 10 20 20 10-20 10-10 20-10-20-20-10 20-10Z" />
          <path pathLength="1" d="m106 253 8 16 16 8-16 8-8 16-8-16-16-8 16-8Z" />
          <path pathLength="1" d="m406 253 8 16 16 8-16 8-8 16-8-16-16-8 16-8Z" />
          <path pathLength="1" d="m261.55 219.45-25.2-40.65c-1.2-1.8-1.65-3.15-1.65-4.2 0-1.95 1.8-2.85 5.85-2.85h8.85v-7.05h-48.15v7.05h3.3c6.75.15 8.55 1.05 12.15 6.9l32.4 51.3v24.6c0 7.65 0 7.95-.9 9.3-1.2 1.5-4.05 2.1-12.6 2.1h-3.9V273h51.45v-7.05h-3.9c-8.55-.15-11.25-.6-12.45-2.1-.9-1.35-.9-1.5-.9-9.3v-26.4l22.35-40.35c6.45-12 11.1-15.6 20.7-16.05h1.2v-7.05h-42.6v7.05h3.45c8.1 0 11.55 1.95 11.55 6.75 0 2.25-.9 5.25-2.4 7.8Z" />
        </g>
      </svg>
      <span className="sr-only">Loading YOMORA</span>
    </div>
  );
}
