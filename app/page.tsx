import type { Metadata } from "next";
import { Shell } from "@/components/Shell";
import { Home } from "@/components/home/Home";
import { LandingParallaxProvider } from "@/components/home/LandingParallaxProvider";
import { SiteJsonLd } from "@/components/seo/SiteJsonLd";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { url: "/" },
};

export default function HomePage() {
  return (
    <LandingParallaxProvider>
      <Shell>
        <SiteJsonLd />
        <Home />
      </Shell>
    </LandingParallaxProvider>
  );
}
