"use client";

import { useSyncExternalStore } from "react";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";

/* Cloudflare Web Analytics. The token is public - it ships in the page
   either way - and the beacon is cookieless. */
const CLOUDFLARE_ANALYTICS_TOKEN = "1586f33cd9db4e7e80d99ff30ac22e4c";

const LOCAL_HOST = /^(localhost|127\.\d+\.\d+\.\d+|\[::1\]|0\.0\.0\.0)$|\.localhost$/;

const subscribe = (): (() => void) => () => {};

/**
 * Both beacons only make sense on a real host. On localhost the Vercel
 * script 404s and the Cloudflare RUM call fails CORS, which put three
 * errors in every local console (and in Lighthouse's Best Practices).
 * Server snapshot is "local" so nothing renders during SSR; the scripts
 * mount right after hydration, the same moment they loaded before.
 */
export default function SiteAnalyticsImpl() {
  const isLocal = useSyncExternalStore(
    subscribe,
    () => LOCAL_HOST.test(window.location.hostname),
    () => true,
  );

  if (isLocal) return null;

  return (
    <>
      <Analytics />
      <Script
        id="cloudflare-web-analytics"
        src="https://static.cloudflareinsights.com/beacon.min.js"
        data-cf-beacon={JSON.stringify({ token: CLOUDFLARE_ANALYTICS_TOKEN })}
        strategy="afterInteractive"
      />
    </>
  );
}
