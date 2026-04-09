import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/pageMeta";

export const metadata = pageMetadata({
  title: "Daily puzzle",
  description:
    "Same Connect 4 seed every UTC day. Fewest plies wins; faster time breaks ties. Verified on the server.",
  pathname: "/daily",
});

export default function DailyLayout({ children }: { children: ReactNode }) {
  return children;
}
