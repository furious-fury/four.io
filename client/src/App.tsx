import { Route, Routes } from "react-router-dom";
import { Shell } from "./components/Shell";
import { Help } from "./pages/Help";
import { Home } from "./pages/Home";
import { Leaderboard } from "./pages/Leaderboard";
import { Play } from "./pages/Play";
import { Replay } from "./pages/Replay";

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/play" element={<Play />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/replay" element={<Replay />} />
        <Route path="/help" element={<Help />} />
      </Routes>
    </Shell>
  );
}
