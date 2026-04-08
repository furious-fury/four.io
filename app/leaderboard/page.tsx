import { Shell } from "@/components/Shell";
import { Leaderboard } from "@/components/leaderboard/Leaderboard";
import { pageMetadata } from "@/lib/pageMeta";

export const metadata = pageMetadata({
  title: "Hall of Fame",
  description:
    "Global leaderboard of verified Connect 4 wins. Filter by Easy, Medium, or Hard and see top scores.",
  pathname: "/leaderboard",
});

export default function LeaderboardPage() {
  return (
    <Shell>
      <Leaderboard />
    </Shell>
  );
}
