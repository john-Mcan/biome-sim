"use client";

import { useState } from "react";
import GameCanvas from "../components/GameCanvas";
import ControlsPanel from "../components/ControlsPanel";
import PopulationChart from "../components/PopulationChart";

export default function Home() {
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [isChartOpen, setIsChartOpen] = useState(true);

  return (
    <div className="h-screen bg-black text-white overflow-hidden relative">
      {/* Botón flotante para abrir el panel de Controles */}
      <button
        onClick={() => setIsControlsOpen(true)}
        className={`fixed top-4 left-4 z-30 bg-neutral-800 hover:bg-neutral-700 text-white p-3 rounded-lg shadow-lg transition-all duration-300 flex items-center gap-2 ${
          isControlsOpen ? 'opacity-0 -translate-x-16' : 'opacity-100'
        }`}
        aria-label="Abrir panel de controles"
      >
        <span className="text-lg">☰</span>
      </button>

      {/* Botón flotante para abrir/cerrar el panel de Gráficos */}
      <button
        onClick={() => setIsChartOpen(!isChartOpen)}
        className="fixed top-4 right-4 z-30 bg-neutral-800 hover:bg-neutral-700 text-white p-3 rounded-lg shadow-lg transition-transform duration-300"
        aria-label="Alternar panel de gráficos"
      >
        <span className={`text-lg transition-transform duration-300 ${isChartOpen ? 'rotate-90' : '-rotate-90'}`}>
          {isChartOpen ? '→' : '←'}
        </span>
      </button>

      {/* Drawer de controles */}
      <ControlsPanel isOpen={isControlsOpen} setIsOpen={setIsControlsOpen} />
      
      {/* Contenedor principal que se desplaza */}
      <main
        className={`h-full absolute top-0 left-0 w-full transition-all duration-300 ease-in-out ${
          isControlsOpen ? 'transform translate-x-80' : 'transform translate-x-0'
        }`}
      >
        <div 
          className="h-full w-full grid transition-all duration-300 ease-in-out"
          style={{ gridTemplateColumns: `1fr ${isChartOpen ? '384px' : '0px'}` }}
        >
          {/* Canvas de simulación */}
          <div className="relative min-h-0">
            <GameCanvas />
          </div>
          
          {/* Gráfico de población */}
          <div className="h-full border-l border-gray-700 overflow-hidden">
            <PopulationChart />
          </div>
        </div>
      </main>
    </div>
  );
}
