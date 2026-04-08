import { Shell } from "@/components/Shell";
import { Play } from "@/components/play/Play";
import { pageMetadata } from "@/lib/pageMeta";

export const metadata = pageMetadata({
  title: "Play",
  description:
    "Face the CPU on Easy, Medium, or Hard. Keyboard columns 1–7, optional hints and undo, then submit verified wins to the Hall of Fame.",
  pathname: "/play",
});

export default function PlayPage() {
  return (
    <Shell>
      <Play />
    </Shell>
  );
}
