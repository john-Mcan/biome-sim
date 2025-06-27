"use client";

import { useEffect, useRef } from "react";
import { useSimStore } from "../store/useSimStore";

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const { config } = useSimStore();

  useEffect(() => {
    if (!canvasRef.current) return;

    // Crear worker
    const worker = new Worker(new URL("../workers/simulation.ts", import.meta.url), {
      type: "module",
    });
    workerRef.current = worker;

    const rect = canvasRef.current.getBoundingClientRect();
    const offscreen = canvasRef.current.transferControlToOffscreen();

    worker.postMessage(
      {
        type: "init",
        canvas: offscreen,
        width: rect.width,
        height: rect.height,
        config: {
          foodRate: config.foodRate,
          mutationRate: config.mutationRate,
          maxFood: 500,
        },
      },
      [offscreen]
    );

    // TODO: Recibir datos agregados y actualizar gráfico
    worker.onmessage = (ev) => {
      const msg = ev.data as { type: string };
      if (msg.type === "stats") {
        const { t, herbivores, carnivores } = ev.data as {
          t: number;
          herbivores: number;
          carnivores: number;
        };
        useSimStore.getState().addPopulation({ t, herbivores, carnivores });
      }
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  // Enviar cambios de configuración
  useEffect(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: "config", config });
    }
  }, [config]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      style={{ width: "100%", height: "100%", background: "black" }}
    />
  );
} 