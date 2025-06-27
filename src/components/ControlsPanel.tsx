"use client";

import { useSimStore } from "../store/useSimStore";
import { useState } from "react";

interface ControlsPanelProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function ControlsPanel({ isOpen, setIsOpen }: ControlsPanelProps) {
  const { config, setConfig, clearHistory } = useSimStore();
  const [activeSection, setActiveSection] = useState<string>("poblacion");

  const sections = [
    { id: "poblacion", label: "Población", icon: "🌱" },
    { id: "evolucion", label: "Evolución", icon: "🧬" },
    { id: "visual", label: "Visual", icon: "👁️" },
    { id: "controles", label: "Controles", icon: "⚙️" },
  ];

  const handleReset = () => {
    clearHistory();
    window.dispatchEvent(new CustomEvent('resetSimulation'));
  };

  return (
    <>
      {/* Drawer */}
      <div
        className={`absolute top-0 left-0 h-full w-80 bg-neutral-800 text-white shadow-2xl z-20 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header del drawer */}
        <div className="p-4 border-b border-neutral-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-blue-400">Panel de Control</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Navegación de secciones */}
        <div className="p-2 border-b border-neutral-700">
          <div className="grid grid-cols-2 gap-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded transition-colors ${
                  activeSection === section.id
                    ? "bg-blue-600 text-white"
                    : "text-neutral-300 hover:text-white hover:bg-neutral-700"
                }`}
              >
                <span>{section.icon}</span>
                {section.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contenido scrolleable */}
        <div className="overflow-y-auto p-4" style={{ height: 'calc(100% - 120px)' }}>
          {activeSection === "poblacion" && (
            <div className="space-y-6">
              <h3 className="text-sm font-semibold text-green-400 border-b border-green-400/30 pb-2">
                CONFIGURACIÓN DE POBLACIÓN
              </h3>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Tasa de Comida: <span className="text-green-400">{config.foodRate}/s</span>
                </label>
                <input
                  type="range"
                  min={5}
                  max={500}
                  step={5}
                  value={config.foodRate}
                  onChange={(e) => setConfig({ foodRate: Number(e.target.value) })}
                  className="w-full accent-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Comida Máxima: <span className="text-green-400">{config.maxFood}</span>
                </label>
                <input
                  type="range"
                  min={200}
                  max={5000}
                  step={100}
                  value={config.maxFood}
                  onChange={(e) => setConfig({ maxFood: Number(e.target.value) })}
                  className="w-full accent-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Herbívoros Iniciales: <span className="text-green-400">{config.initialHerbivores}</span>
                </label>
                <input
                  type="range"
                  min={10}
                  max={200}
                  step={5}
                  value={config.initialHerbivores}
                  onChange={(e) => setConfig({ initialHerbivores: Number(e.target.value) })}
                  className="w-full accent-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Carnívoros Iniciales: <span className="text-green-400">{config.initialCarnivores}</span>
                </label>
                <input
                  type="range"
                  min={2}
                  max={50}
                  value={config.initialCarnivores}
                  onChange={(e) => setConfig({ initialCarnivores: Number(e.target.value) })}
                  className="w-full accent-green-500"
                />
              </div>
            </div>
          )}

          {activeSection === "evolucion" && (
            <div className="space-y-6">
              <h3 className="text-sm font-semibold text-blue-400 border-b border-blue-400/30 pb-2">
                PARÁMETROS EVOLUTIVOS
              </h3>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Mutación: <span className="text-blue-400">{(config.mutationRate * 100).toFixed(1)}%</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={0.3}
                  step={0.01}
                  value={config.mutationRate}
                  onChange={(e) => setConfig({ mutationRate: Number(e.target.value) })}
                  className="w-full accent-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Velocidad: <span className="text-blue-400">{config.simulationSpeed.toFixed(1)}x</span>
                </label>
                <input
                  type="range"
                  min={0.1}
                  max={10.0}
                  step={0.1}
                  value={config.simulationSpeed}
                  onChange={(e) => setConfig({ simulationSpeed: Number(e.target.value) })}
                  className="w-full accent-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Población Mínima: <span className="text-blue-400">{config.minPopulation}</span>
                </label>
                <input
                  type="range"
                  min={5}
                  max={100}
                  value={config.minPopulation}
                  onChange={(e) => setConfig({ minPopulation: Number(e.target.value) })}
                  className="w-full accent-blue-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-neutral-700 rounded-lg">
                <div>
                  <label htmlFor="carnivoreChase" className="text-sm font-medium block">
                    Persecución de Carnívoros
                  </label>
                  <p className="text-xs text-gray-400">Activa la IA de caza</p>
                </div>
                <input
                  type="checkbox"
                  id="carnivoreChase"
                  checked={config.carnivoreChaseEnabled}
                  onChange={(e) => setConfig({ carnivoreChaseEnabled: e.target.checked })}
                  className="w-5 h-5 rounded accent-blue-500"
                />
              </div>

            </div>
          )}

          {activeSection === "visual" && (
            <div className="space-y-6">
              <h3 className="text-sm font-semibold text-purple-400 border-b border-purple-400/30 pb-2">
                OPCIONES VISUALES
              </h3>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Historial: <span className="text-purple-400">{config.maxHistoryPoints}s</span>
                </label>
                <input
                  type="range"
                  min={30}
                  max={300}
                  step={10}
                  value={config.maxHistoryPoints}
                  onChange={(e) => setConfig({ maxHistoryPoints: Number(e.target.value) })}
                  className="w-full accent-purple-500"
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-neutral-700 rounded-lg">
                  <div>
                    <label htmlFor="showGrid" className="text-sm font-medium block">
                      Mostrar Cuadrícula
                    </label>
                    <p className="text-xs text-gray-400">Grid de referencia</p>
                  </div>
                  <input
                    type="checkbox"
                    id="showGrid"
                    checked={config.showGrid}
                    onChange={(e) => setConfig({ showGrid: e.target.checked })}
                    className="w-5 h-5 rounded accent-purple-500"
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 bg-neutral-700 rounded-lg">
                  <div>
                    <label htmlFor="respawnEnabled" className="text-sm font-medium block">
                      Auto-Respawn
                    </label>
                    <p className="text-xs text-gray-400">Prevenir extinción</p>
                  </div>
                  <input
                    type="checkbox"
                    id="respawnEnabled"
                    checked={config.respawnEnabled}
                    onChange={(e) => setConfig({ respawnEnabled: e.target.checked })}
                    className="w-5 h-5 rounded accent-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Nivel de Zoom: <span className="text-purple-400">{config.zoomLevel.toFixed(2)}x</span>
                </label>
                <input
                  type="range"
                  min={0.25}
                  max={2.0}
                  step={0.05}
                  value={config.zoomLevel}
                  onChange={(e) => setConfig({ zoomLevel: Number(e.target.value) })}
                  className="w-full accent-purple-500"
                />
              </div>

            </div>
          )}

          {activeSection === "controles" && (
            <div className="space-y-6">
              <h3 className="text-sm font-semibold text-red-400 border-b border-red-400/30 pb-2">
                ACCIONES DEL SIMULADOR
              </h3>
              
              <div className="space-y-3">
                <button
                  onClick={clearHistory}
                  className="w-full bg-orange-600 hover:bg-orange-700 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <span>📊</span>
                  Limpiar Gráfico
                </button>
                
                <button
                  onClick={handleReset}
                  className="w-full bg-red-600 hover:bg-red-700 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <span>🔄</span>
                  Reiniciar Simulación
                </button>
              </div>
              
              <div className="bg-neutral-700 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">GUÍA RÁPIDA</h4>
                <div className="space-y-2 text-sm text-gray-400">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0"></div>
                    <span>Comida verde</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-blue-500 rounded-full flex-shrink-0"></div>
                    <span>Herbívoros (colores varios)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-red-500 rounded-full flex-shrink-0"></div>
                    <span>Carnívoros (tonos rojos)</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
} 