import { useEffect, useState } from "react";
import { CRITICAL_IMAGES_READY_EVENT } from "@/components/site-image-preloader";

const MINIMUM_DISPLAY_MS = 1_100;
const MAXIMUM_DISPLAY_MS = 2_600;

export function LogoLoader() {
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const startedAt = performance.now();
    let finishTimer: number | undefined;

    const finish = () => {
      const remaining = Math.max(0, MINIMUM_DISPLAY_MS - (performance.now() - startedAt));
      if (finishTimer !== undefined) window.clearTimeout(finishTimer);
      finishTimer = window.setTimeout(() => setInitialLoading(false), remaining);
    };
    const maximumTimer = window.setTimeout(finish, MAXIMUM_DISPLAY_MS);

    window.addEventListener(CRITICAL_IMAGES_READY_EVENT, finish, { once: true });

    return () => {
      window.removeEventListener(CRITICAL_IMAGES_READY_EVENT, finish);
      window.clearTimeout(maximumTimer);
      if (finishTimer !== undefined) window.clearTimeout(finishTimer);
    };
  }, []);

  if (!initialLoading) return null;

  return (
    <div className="yomora-loader" role="status" aria-live="polite" aria-label="Loading YOMORA">
      <img
        className="yomora-loader__logo"
        src="/yomora-option-3-symbol.png"
        alt=""
        aria-hidden="true"
      />
      <span className="sr-only">Loading YOMORA</span>
    </div>
  );
}
