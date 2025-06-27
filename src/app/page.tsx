import GameCanvas from "../components/GameCanvas";
import ControlsPanel from "../components/ControlsPanel";
import PopulationChart from "../components/PopulationChart";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <header className="shrink-0">
        <ControlsPanel />
      </header>
      <main className="flex-1 relative">
        <GameCanvas />
      </main>
      <footer className="h-64 overflow-hidden">
        <PopulationChart />
      </footer>
    </div>
  );
}
