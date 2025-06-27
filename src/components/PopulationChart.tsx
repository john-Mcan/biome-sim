"use client";

import { Line } from "react-chartjs-2";
import { Chart, LineElement, LinearScale, CategoryScale, PointElement } from "chart.js";
import { useSimStore } from "../store/useSimStore";
import { useMemo } from "react";

Chart.register(LineElement, LinearScale, CategoryScale, PointElement);

export default function PopulationChart() {
  const { population } = useSimStore();

  const data = useMemo(() => {
    const labels = population.map((p) => p.t.toFixed(0));
    return {
      labels,
      datasets: [
        {
          label: "Herbívoros",
          data: population.map((p) => p.herbivores),
          borderColor: "#4caf50",
          tension: 0.3,
        },
        {
          label: "Carnívoros",
          data: population.map((p) => p.carnivores),
          borderColor: "#f44336",
          tension: 0.3,
        },
      ],
    };
  }, [population]);

  return (
    <div className="bg-neutral-900 p-2">
      <Line data={data} options={{ responsive: true, maintainAspectRatio: false }} />
    </div>
  );
} 