import { create } from "zustand";

export interface UIConfig {
  foodRate: number;
  mutationRate: number;
}

interface PopDataPoint {
  t: number;
  herbivores: number;
  carnivores: number;
}

interface SimState {
  config: UIConfig;
  setConfig: (cfg: Partial<UIConfig>) => void;
  population: PopDataPoint[];
  addPopulation: (p: PopDataPoint) => void;
}

export const useSimStore = create<SimState>((set) => ({
  config: {
    foodRate: 20,
    mutationRate: 0.05,
  },
  setConfig: (cfg) => set((state) => ({ config: { ...state.config, ...cfg } })),
  population: [],
  addPopulation: (p) => set((state) => ({ population: [...state.population, p] })),
})); 