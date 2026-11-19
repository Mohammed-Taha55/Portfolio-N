import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { LAB_ENTRIES } from "@/components/lab-entries";
import { WORK } from "@/content/work";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const page = (path: string, priority: number): MetadataRoute.Sitemap[number] => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    priority,
  });
  return [
    page("", 1),
    ...WORK.map((c) => page(`/work/${c.slug}`, 0.9)),
    page("/about", 0.7),
    page("/lab", 0.6),
    page("/gallery", 0.6),
    ...LAB_ENTRIES.map((e) => page(`/lab/${e.slug}`, 0.4)),
  ];
}
