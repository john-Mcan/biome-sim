"use client";

import { Line } from "react-chartjs-2";
import {
  Chart,
  LineElement,
  LinearScale,
  CategoryScale,
  PointElement,
  Legend,
  Title,
  Tooltip,
} from "chart.js";
import { useSimStore } from "../store/useSimStore";
import { useMemo } from "react";

Chart.register(LineElement, LinearScale, CategoryScale, PointElement, Legend, Title, Tooltip);

export default function PopulationChart() {
  const { population, chartView, setChartView } = useSimStore();

  const data = useMemo(() => {
    if (population.length === 0) {
      return { labels: [], datasets: [] };
    }

    // Crear etiquetas de tiempo relativo (últimos N segundos)
    const startTime = population[0]?.t || 0;
    const labels = population.map((p) => `${Math.floor(p.t - startTime)}s`);

    if (chartView === "totals") {
      // Vista A: Solo totales
      const datasets = [
        {
          label: "Herbívoros Total",
          data: population.map((p) => p.herbivores),
          borderColor: "#22c55e",
          backgroundColor: "#22c55e20",
          fill: true,
          tension: 0.4,
          pointRadius: 1,
          pointHoverRadius: 4,
        },
        {
          label: "Carnívoros Total",
          data: population.map((p) => p.carnivores),
          borderColor: "#ef4444",
          backgroundColor: "#ef444420",
          fill: true,
          tension: 0.4,
          pointRadius: 1,
          pointHoverRadius: 4,
        },
        {
          label: "Comida Disponible",
          data: population.map((p) => p.food || 0),
          borderColor: "#facc15", // Amarillo
          backgroundColor: "#facc1520",
          fill: false,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 3,
          borderDash: [5, 5],
          yAxisID: 'y1', // Usar un eje secundario
        },
      ];

      return { labels, datasets };
    } else {
      // Vista B: Especies individuales
      const datasets: any[] = [];
      
      // Encontrar todas las especies únicas a lo largo del tiempo
      const allSpeciesKeys = new Set<number>();
      population.forEach((p) => {
        Object.keys(p.species).forEach((k) => allSpeciesKeys.add(Number(k)));
      });

      // Crear datasets para herbívoros (especies individuales)
      Array.from(allSpeciesKeys).forEach((colorKey) => {
        const colorHex = colorKey.toString(16).padStart(6, "0");
        const speciesData = population.map((p) => p.species[colorKey] || 0);
        
        // Solo mostrar si tiene datos significativos
        const maxValue = Math.max(...speciesData);
        if (maxValue > 0) {
          datasets.push({
            label: `Herbívoro #${colorHex.slice(0, 3)}`,
            data: speciesData,
            borderColor: `#${colorHex}`,
            backgroundColor: `#${colorHex}30`,
            fill: false,
            tension: 0.3,
            pointRadius: 0,
            pointHoverRadius: 2,
          });
        }
      });

      // Para carnívoros, necesitamos rastrear por color también
      // Por ahora, mostraremos carnívoros como un grupo hasta que implementemos tracking por especie
      const carnivoreColors = [
        "#dc2626", "#991b1b", "#7f1d1d", "#b91c1c", "#ef4444", "#f87171", 
        "#a21caf", "#86198f", "#be185d", "#9f1239", "#881337", "#450a0a"
      ];

      // Simular especies de carnívoros (esto sería ideal rastrearlo en el worker)
      carnivoreColors.slice(0, 3).forEach((color, index) => {
        const carnivoreData = population.map((p) => {
          // Distribuir carnívoros entre las "especies" de forma simplificada
          const totalCarnivores = p.carnivores;
          return Math.floor(totalCarnivores / 3) + (index === 0 ? totalCarnivores % 3 : 0);
        });
        
        const maxValue = Math.max(...carnivoreData);
        if (maxValue > 0) {
          datasets.push({
            label: `Carnívoro Tipo ${index + 1}`,
            data: carnivoreData,
            borderColor: color,
            backgroundColor: `${color}30`,
            fill: false,
            tension: 0.3,
            pointRadius: 0,
            pointHoverRadius: 2,
          });
        }
      });

      return { labels, datasets };
    }
  }, [population, chartView]);

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: chartView === "totals" 
          ? "Población y Recursos Totales" 
          : "Población por Especies",
        color: "#fff",
        font: {
          size: 14,
          weight: "bold" as const,
        },
      },
      legend: {
        display: true,
        position: "top" as const,
        labels: {
          color: "#fff",
          font: {
            size: 10,
          },
          usePointStyle: true,
          pointStyle: "line",
        },
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "#444",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: "Tiempo Transcurrido",
          color: "#ccc",
          font: {
            size: 11,
          },
        },
        ticks: {
          color: "#ccc",
          font: {
            size: 10,
          },
          maxTicksLimit: 10,
        },
        grid: {
          color: "#333",
          lineWidth: 0.5,
        },
      },
      y: {
        display: true,
        type: 'linear' as const,
        position: 'left' as const,
        title: {
          display: true,
          text: "Población",
          color: "#ccc",
        },
        ticks: {
          color: "#ccc",
          beginAtZero: true,
        },
        grid: {
          color: "#333",
        },
      },
      y1: {
        display: true,
        type: 'linear' as const,
        position: 'right' as const,
        title: {
          display: true,
          text: "Comida",
          color: "#facc15",
        },
        ticks: {
          color: "#facc15",
          beginAtZero: true,
        },
        grid: {
          drawOnChartArea: false, // No dibujar grid para este eje
        },
      },
    },
    interaction: {
      mode: "nearest" as const,
      axis: "x" as const,
      intersect: false,
    },
    animation: {
      duration: 0, // Deshabilitar animaciones para mejor performance
    },
  };

  if (population.length === 0) {
    return (
      <div className="bg-neutral-900 p-4 h-full flex flex-col items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="text-sm">Esperando datos de simulación...</div>
          <div className="text-xs mt-1">La gráfica aparecerá en unos segundos</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 p-4 h-full flex flex-col">
      {/* Toggle de vistas */}
      <div className="flex items-center justify-center mb-3">
        <div className="flex bg-neutral-700 rounded-lg p-1">
          <button
            onClick={() => setChartView("totals")}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              chartView === "totals"
                ? "bg-blue-600 text-white"
                : "text-gray-300 hover:text-white"
            }`}
          >
            Vista Totales
          </button>
          <button
            onClick={() => setChartView("species")}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              chartView === "species"
                ? "bg-blue-600 text-white"
                : "text-gray-300 hover:text-white"
            }`}
          >
            Vista Especies
          </button>
        </div>
      </div>
      
      {/* Gráfico */}
      <div className="flex-1">
        <Line data={data} options={options} />
      </div>
    </div>
  );
} 