"use client";

import { useEffect, useRef } from "react";
import { useSimStore } from "../store/useSimStore";

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  
  // Usar una función para obtener el estado más reciente dentro de los efectos
  const { getState } = useSimStore;

  useEffect(() => {
    if (!canvasRef.current || workerRef.current) return;

    console.log("Initializing GameCanvas worker...");

    // Crear worker
    const worker = new Worker(new URL("../workers/simulation.ts", import.meta.url), {
      type: "module",
    });
    workerRef.current = worker;

    const sendInitMessage = () => {
      if (!canvasRef.current || !workerRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const offscreen = canvasRef.current.transferControlToOffscreen();

      workerRef.current!.postMessage(
        {
          type: "init",
          canvas: offscreen,
          width: rect.width,
          height: rect.height,
          config: getState().config,
        },
        [offscreen]
      );
    };

    sendInitMessage();

    resizeObserverRef.current = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (!workerRef.current) continue;
        const { width, height } = entry.contentRect;
        workerRef.current.postMessage({ type: "resize", width, height });
      }
    });
    resizeObserverRef.current.observe(canvasRef.current);

    worker.onmessage = (ev) => {
      if (ev.data.type === "stats") {
        getState().addPopulation(ev.data);
      }
    };

    const handleReset = () => {
      if (workerRef.current) {
        workerRef.current.postMessage({ type: "reset" });
      }
    };
    window.addEventListener('resetSimulation', handleReset);

    return () => {
      console.log("Terminating GameCanvas worker.");
      worker.terminate();
      workerRef.current = null;
      resizeObserverRef.current?.disconnect();
      window.removeEventListener('resetSimulation', handleReset);
    };
  }, [getState]);

  // Enviar cambios de configuración
  useEffect(() => {
    const unsubscribe = useSimStore.subscribe((state) => {
      if (workerRef.current) {
        workerRef.current.postMessage({ type: "config", config: state.config });
      }
    });
    return unsubscribe;
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full"
      style={{ background: "black" }}
    />
  );
} 