"use client";

import { useSyncExternalStore } from "react";
import dynamic from "next/dynamic";

/* The beacons (Vercel + Cloudflare) are their own chunk, requested only
   once the page has finished loading - analytics never competes with
   the LCP image or the framework JS for bandwidth. */
const Beacons = dynamic(() => import("./site-analytics-impl"), { ssr: false });

const subscribe = (cb: () => void) => {
  window.addEventListener("load", cb);
  return () => window.removeEventListener("load", cb);
};

export default function SiteAnalytics() {
  const loaded = useSyncExternalStore(
    subscribe,
    () => document.readyState === "complete",
    () => false,
  );
  return loaded ? <Beacons /> : null;
}
