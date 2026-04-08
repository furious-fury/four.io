import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/siteUrl";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const paths: { path: string; changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"]; priority: number }[] =
    [
      { path: "", changeFrequency: "weekly", priority: 1 },
      { path: "/play", changeFrequency: "weekly", priority: 0.9 },
      { path: "/leaderboard", changeFrequency: "daily", priority: 0.85 },
      { path: "/help", changeFrequency: "monthly", priority: 0.6 },
      { path: "/replay", changeFrequency: "weekly", priority: 0.5 },
    ];

  return paths.map(({ path, changeFrequency, priority }) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));
}
