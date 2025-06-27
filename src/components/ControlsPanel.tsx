"use client";

import { useSimStore } from "../store/useSimStore";

export default function ControlsPanel() {
  const { config, setConfig } = useSimStore();

  return (
    <div className="flex gap-4 text-white p-2 bg-neutral-800">
      <div>
        <label className="block text-xs">Tasa de comida: {config.foodRate}/s</label>
        <input
          type="range"
          min={1}
          max={100}
          value={config.foodRate}
          onChange={(e) => setConfig({ foodRate: Number(e.target.value) })}
        />
      </div>
      <div>
        <label className="block text-xs">Mutación: {(config.mutationRate * 100).toFixed(0)}%</label>
        <input
          type="range"
          min={0}
          max={0.5}
          step={0.01}
          value={config.mutationRate}
          onChange={(e) => setConfig({ mutationRate: Number(e.target.value) })}
        />
      </div>
    </div>
  );
} 