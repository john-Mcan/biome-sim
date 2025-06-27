# Biome Sim v2

> Simulación interactiva de un ecosistema digital con evolución basada en ADN, desarrollada con **Next.js 15** y **React 19**.

## Tabla de contenidos

1. [Descripción](#descripción)
2. [Demo rápida](#demo-rápida)
3. [Tecnologías](#tecnologías)
4. [Arquitectura](#arquitectura)
5. [Instalación y puesta en marcha](#instalación-y-puesta-en-marcha)
6. [Comandos disponibles](#comandos-disponibles)
7. [Estructura del proyecto](#estructura-del-proyecto)
8. [Personalización y Controles](#personalización-y-controles)
9. [Contribución](#contribución)
10. [Roadmap](#roadmap)
11. [Licencia](#licencia)

---

## Descripción

Biome Sim es una simulación de un ecosistema digital donde tres tipos de entidades interactúan:

*   **Comida (verde)**: Aparece de forma aleatoria a una tasa configurable.
*   **Herbívoros (colores variados)**: Buscan comida para sobrevivir y reproducirse.
*   **Carnívoros (tonos rojos/oscuros)**: Cazan herbívoros para alimentarse.

Cada criatura posee un **ADN** único que define sus atributos:
*   `velocidad`: Qué tan rápido se mueve.
*   `esperanza de vida`: Duración máxima de su ciclo vital.
*   `necesidad de comida`: Cantidad de energía requerida para reproducirse.
*   `descendencia`: Número de hijos por camada.
*   `tamaño`: Radio visual de la criatura.

Al reproducirse, el ADN se hereda con una **tasa de mutación** configurable, permitiendo la evolución de las especies a lo largo del tiempo. La interfaz permite ajustar múltiples parámetros en tiempo real y observar su impacto en el gráfico de población.

<div align="center">
  <img src="public/globe.svg" alt="Captura de la simulación" width="600"/>
</div>

---

## Demo rápida

```bash
# Clona el repositorio y entra al directorio raíz
$ git clone <url-del-repo>
$ cd biome-sim

# Instala dependencias y levanta el modo desarrollo
$ npm install
$ npm run dev
```

Abre <http://localhost:3000> en tu navegador. ¡Listo!

---

## Tecnologías

| Categoría | Herramienta | Descripción breve |
| :--- | :--- | :--- |
| Framework web | **Next.js 15** | App Router, soporte a Turbopack |
| Librería frontend | **React 19** | Server/Client Components |
| Render de gráficos | **PixiJS 8** | Se ejecuta en un _Web Worker_ con **OffscreenCanvas** para no bloquear el hilo principal |
| Estado global | **Zustand 5** | Store minimalista para comunicar UI y worker |
| Gráficas | **Chart.js 4** + **react-chartjs-2** | Gráfico histórico de poblaciones (total y por especie) |
| Estilos | **Tailwind CSS 4** | Modelo _utility-first_ |
| Linting | **ESLint 9** + `next/core-web-vitals` |
| Lenguaje | **TypeScript 5** | Tipado estático |

---

## Arquitectura

```mermaid
graph TD;
    subgraph "Hilo Principal (UI)"
        direction LR
        A[Panel de Controles] -->|actualiza config| S[Store de Zustand]
        S -->|suscribe y lee| C[Gráfico de Población]
        G[Canvas React] -->|transfiere OffscreenCanvas| W
    end

    subgraph "Hilo del Worker"
        direction LR
        W[Web Worker<br/>(simulation.ts)] -->|inicia y renderiza| P[Pixi.js]
        W -->|envía stats periódicas| S
    end

    S -->|envía config actualizada| W

    style W fill:#f9f,stroke:#333,stroke-width:2px
```

*   **`GameCanvas.tsx`**: Al montarse, crea un _Web Worker_ a partir de `src/workers/simulation.ts` y le transfiere el control de un `OffscreenCanvas` para evitar bloquear el hilo principal.
*   **`ControlsPanel.tsx`**: Contiene sliders y toggles que modifican el estado de la simulación. Cada cambio se refleja en el store de **Zustand**.
*   **Zustand Store (`useSimStore.ts`)**: Actúa como el nexo central. Notifica al _worker_ sobre los cambios en la configuración (ej. velocidad de simulación) y recibe de vuelta estadísticas de población cada segundo.
*   **`PopulationChart.tsx`**: Se suscribe al store y renderiza los datos de población que el _worker_ envía, mostrando la evolución del ecosistema en tiempo real.
*   **Web Worker (`simulation.ts`)**: Contiene toda la lógica de la simulación: IA de las criaturas, física, reproducción, y el ciclo de renderizado con **PixiJS**.

---

## Instalación y puesta en marcha

Requisitos:

*   Node.js >= 20
*   npm >= 10 (o `pnpm`, `bun`, etc.)

```bash
# Instalar dependencias
npm install

# Correr en desarrollo
npm run dev

# Compilar para producción
npm run build

# Probar build local
npm start
```

> Nota: `next dev` se ejecuta con **Turbopack** por defecto.

---

## Comandos disponibles

| Script | Descripción |
| :--- | :--- |
| `npm run dev` | Levanta el servidor en modo dev |
| `npm run build` | Compila el proyecto (output `.next`) |
| `npm start` | Arranca el build generado |
| `npm run lint` | Corre ESLint |

---

## Estructura del proyecto

```text
biome-sim/
│
├─ src/
│  ├─ app/               # App Router de Next.js
│  │  ├─ layout.tsx      # Marco HTML/CSS global
│  │  └─ page.tsx        # Página principal
│  │
│  ├─ components/
│  │  ├─ ControlsPanel.tsx   # Panel de configuración interactivo
│  │  ├─ GameCanvas.tsx      # Lienzo y conexión al worker
│  │  └─ PopulationChart.tsx # Gráfico de población
│  │
│  ├─ store/
│  │  └─ useSimStore.ts      # Zustand store (estado global)
│  │
│  └─ workers/
│     └─ simulation.ts       # Núcleo de la simulación (lógica y render)
│
├─ public/              # Recursos estáticos (SVG, íconos, etc.)
├─ next.config.ts       # Configuración de Next
└─ package.json         # Dependencias y scripts
```

---

## Personalización y Controles

La simulación es altamente configurable a través del panel de controles. Los valores iniciales se encuentran en `src/store/useSimStore.ts` y la lógica de ADN en `src/workers/simulation.ts`.

| Control | Descripción |
| :--- | :--- |
| **Velocidad Sim.** | Multiplicador de la velocidad de la simulación (0x a 5x). |
| **Nivel de Zoom** | Aumenta o disminuye el acercamiento de la cámara. |
| **Tasa de Comida** | Cantidad de comida que aparece por segundo. |
| **Máx. Comida** | Límite máximo de unidades de comida en el mapa. |
| **Tasa de Mutación** | Probabilidad (0% a 100%) de que el ADN de un descendiente mute. |
| **Población Inicial** | Cantidad de herbívoros y carnívoros al inicio/reset. |
| **Respawn** | Si está activo, reintroduce una población mínima si se extinguen. |
| **Persecución (Carn.)**| Activa o desactiva la IA de caza de los carnívoros. |
| **Mostrar Grilla** | Renderiza una grilla de fondo para mejor visualización. |

---

## Contribución

¡Las PRs y _issues_ son bienvenidas! Sigue estos pasos:

1.  Haz _fork_ y crea una rama descriptiva: `git checkout -b feat/mejora-x`.
2.  Asegúrate de que `npm run lint` pase sin errores.
3.  Abre la PR describiendo tu cambio y añade capturas si aplica.

---

## Roadmap

- [ ] Añadir sonido ambiente y efectos.
- [ ] Persistir configuraciones del usuario en `localStorage`.
- [ ] Exportar estadísticas de población a formato CSV.
- [ ] Implementar comportamientos de manada en herbívoros.
- [ ] Optimizar la detección de entidades cercanas (ej. Quadtree).

---

## Licencia

Distribuido bajo licencia **MIT**.

---

> © 2024 Biome Sim – Hecho con 💚 en Latinoamérica.

