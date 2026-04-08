import { getSiteUrl } from "@/lib/siteUrl";
import { SITE_NAME, SITE_TAGLINE, siteDescription } from "@/lib/seo";

export function SiteJsonLd() {
  const url = getSiteUrl();
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${url}/#website`,
        name: SITE_NAME,
        url,
        description: SITE_TAGLINE,
        inLanguage: "en",
      },
      {
        "@type": "VideoGame",
        "@id": `${url}/#game`,
        name: SITE_NAME,
        description: siteDescription,
        gamePlatform: "Web browser",
        applicationCategory: "Game",
        operatingSystem: "Any",
        url,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
