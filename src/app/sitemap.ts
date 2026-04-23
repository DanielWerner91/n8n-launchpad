import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

const BASE_URL = "https://launchpad-six-tau.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    { url: `${BASE_URL}/changelog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/roadmap`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("launchdeck_projects")
      .select("slug,updated_at")
      .eq("is_public", true)
      .limit(1000);

    if (data) {
      for (const p of data) {
        base.push({
          url: `${BASE_URL}/p/${p.slug}`,
          lastModified: new Date(p.updated_at),
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    }
  } catch {
    // Sitemap generation should never break the build
  }

  return base;
}
