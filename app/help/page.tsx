import { Shell } from "@/components/Shell";
import { Help } from "@/components/help/Help";
import { pageMetadata } from "@/lib/pageMeta";

export const metadata = pageMetadata({
  title: "Help",
  description:
    "How four.io scoring works, display names, the Hall of Fame, rate limits, and fair-play rules.",
  pathname: "/help",
});

export default function HelpPage() {
  return (
    <Shell>
      <Help />
    </Shell>
  );
}
