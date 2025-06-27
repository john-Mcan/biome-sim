import { create } from "zustand";

export interface UIConfig {
  foodRate: number;
  mutationRate: number;
  maxFood: number;
  initialHerbivores: number;
  initialCarnivores: number;
  showGrid: boolean;
  simulationSpeed: number;
  maxHistoryPoints: number;
  respawnEnabled: boolean;
  minPopulation: number;
  carnivoreChaseEnabled: boolean;
  zoomLevel: number;
}

interface PopDataPoint {
  t: number;
  herbivores: number;
  carnivores: number;
  food: number;
  species: Record<number, number>;
}

type ChartView = "totals" | "species";

interface SimState {
  config: UIConfig;
  setConfig: (cfg: Partial<UIConfig>) => void;
  population: PopDataPoint[];
  addPopulation: (p: PopDataPoint) => void;
  clearHistory: () => void;
  chartView: ChartView;
  setChartView: (view: ChartView) => void;
}

export const useSimStore = create<SimState>((set) => ({
  config: {
    foodRate: 25,
    mutationRate: 0.08,
    maxFood: 800,
    initialHerbivores: 60,
    initialCarnivores: 8,
    showGrid: false,
    simulationSpeed: 1.0,
    maxHistoryPoints: 120, // 2 minutos a 1 punto por segundo
    respawnEnabled: true,
    minPopulation: 15,
    carnivoreChaseEnabled: true,
    zoomLevel: 1.0,
  },
  setConfig: (cfg) => set((state) => ({ config: { ...state.config, ...cfg } })),
  population: [],
  addPopulation: (p) =>
    set((state) => {
      const newPopulation = [...state.population, { ...p, species: p.species ?? {} }];
      // Mantener solo los últimos maxHistoryPoints
      if (newPopulation.length > state.config.maxHistoryPoints) {
        return { population: newPopulation.slice(-state.config.maxHistoryPoints) };
      }
      return { population: newPopulation };
    }),
  clearHistory: () => set({ population: [] }),
  chartView: "totals",
  setChartView: (view) => set({ chartView: view }),
})); 