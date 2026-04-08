import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/seo";

export function pageMetadata(input: {
  title: string;
  description: string;
  pathname: "/" | "/play" | "/leaderboard" | "/help" | "/replay";
}): Metadata {
  const { title, description, pathname } = input;
  const ogTitle = `${title} | ${SITE_NAME}`;
  return {
    title,
    description,
    alternates: { canonical: pathname },
    openGraph: {
      title: ogTitle,
      description,
      url: pathname,
    },
    twitter: {
      title: ogTitle,
      description,
    },
  };
}
