// simulation.ts - Web Worker para ecosistema de puntos móviles
// NOTA: Este worker corre en un hilo separado y actualiza estado de entidades.
// Usa OffscreenCanvas si el mensaje inicial provee un canvas.

import { Application, Graphics, DOMAdapter, WebWorkerAdapter } from "pixi.js";

// Configurar Pixi para entorno de WebWorker antes de crear cualquier instancia
DOMAdapter.set(WebWorkerAdapter);

export interface InitMessage {
  type: "init";
  canvas: OffscreenCanvas;
  width: number;
  height: number;
  config: SimConfig;
}

export interface ConfigUpdateMessage {
  type: "config";
  config: Partial<SimConfig>;
}

export interface TickRequestMessage {
  type: "tick";
}

export interface ResizeMessage {
  type: "resize";
  width: number;
  height: number;
}

export interface ResetMessage {
  type: "reset";
}

export interface StatsMessage {
  type: "stats";
  t: number;
  herbivores: number;
  carnivores: number;
  food: number;
  species: Record<number, number>; // key color int, value count
}

export interface SimConfig {
  foodRate: number; // items por segundo
  mutationRate: number; // 0-1
  maxFood: number;
  initialHerbivores: number;
  initialCarnivores: number;
  simulationSpeed: number;
  respawnEnabled: boolean;
  minPopulation: number;
  showGrid: boolean;
  carnivoreChaseEnabled: boolean;
  zoomLevel: number;
}

// Tipos de entidades
const enum EntityType {
  Food = 0,
  Herbivore = 1,
  Carnivore = 2,
}

interface CreatureDNA {
  speed: number;
  foodNeeded: number;
  offspring: number;
  lifespan: number;
  color: number; // 0xRRGGBB pixi-style
  size: number;
}

interface Creature {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  lastEat: number;
  energy: number; // comida acumulada
  dna: CreatureDNA;
  type: EntityType.Herbivore | EntityType.Carnivore;
  targetX?: number;
  targetY?: number;
}

interface Food {
  x: number;
  y: number;
}

// Estado global dentro del worker
let app: Application | null = null;
let graphics: Graphics | null = null;
let worldWidth = 0;
let worldHeight = 0;
let canvasWidth = 0;
let canvasHeight = 0;

const food: Food[] = [];
const creatures: Creature[] = [];
let nextId = 1;

let config: SimConfig = {
  foodRate: 25,
  mutationRate: 0.08,
  maxFood: 800,
  initialHerbivores: 60,
  initialCarnivores: 8,
  simulationSpeed: 1.0,
  respawnEnabled: true,
  minPopulation: 15,
  showGrid: false,
  carnivoreChaseEnabled: true,
  zoomLevel: 1.0,
};

// Utilitarios
const rand = (min: number, max: number) => Math.random() * (max - min) + min;
const randInt = (min: number, max: number) => Math.floor(rand(min, max));

// Colores pre-definidos para herbívoros (evitar verde)
const HERBIVORE_COLORS = [
  0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xfeca57, 0xff9ff3, 0x54a0ff,
  0x5f27cd, 0xff9f43, 0x3742fa, 0x2f3542, 0xf1c40f, 0xe74c3c, 0x9b59b6,
  0x1abc9c, 0x34495e, 0xf39c12, 0x8e44ad, 0x2ecc71, 0x3498db, 0xe67e22,
];

// Colores para carnívoros (tonos rojos y oscuros)
const CARNIVORE_COLORS = [
  0xdc2626, 0x991b1b, 0x7f1d1d, 0xb91c1c, 0xef4444, 0xf87171, 0xa21caf,
  0x86198f, 0xbe185d, 0x9f1239, 0x881337, 0x450a0a, 0x7c2d12, 0x92400e,
];

self.onmessage = (ev: MessageEvent<InitMessage | ConfigUpdateMessage | TickRequestMessage | ResizeMessage | ResetMessage>) => {
  const { data } = ev;
  switch (data.type) {
    case "init": {
      (async () => {
        canvasWidth = data.width;
        canvasHeight = data.height;
        config = { ...config, ...data.config };
        worldWidth = canvasWidth / config.zoomLevel;
        worldHeight = canvasHeight / config.zoomLevel;

        app = new Application();
        await app.init({
          canvas: data.canvas as unknown as OffscreenCanvas,
          width: canvasWidth,
          height: canvasHeight,
          background: "#000000",
          antialias: false,
          autoDensity: false,
          resolution: 1,
        });

        graphics = new Graphics();
        app.stage.addChild(graphics);

        // Spawn inicial
        spawnCreatures(config.initialHerbivores, EntityType.Herbivore);
        spawnCreatures(config.initialCarnivores, EntityType.Carnivore);

        app.ticker.add(() => {
          const dt = (app!.ticker.deltaMS / 1000) * config.simulationSpeed;
          update(dt);
          renderPixi();
        });
      })();
      break;
    }
    case "config": {
      config = { ...config, ...data.config };
      worldWidth = canvasWidth / config.zoomLevel;
      worldHeight = canvasHeight / config.zoomLevel;
      break;
    }
    case "tick": {
      // Could implement manual stepping if desired
      break;
    }
    case "resize": {
      canvasWidth = data.width;
      canvasHeight = data.height;
      worldWidth = canvasWidth / config.zoomLevel;
      worldHeight = canvasHeight / config.zoomLevel;
      if (app) {
        (app.renderer as any).resize(canvasWidth, canvasHeight);
      }
      break;
    }
    case "reset": {
      // Resetear simulación manteniendo configuración actual
      food.length = 0;
      creatures.length = 0;
      nextId = 1;
      
      // Re-spawn con configuración actual
      spawnCreatures(config.initialHerbivores, EntityType.Herbivore);
      spawnCreatures(config.initialCarnivores, EntityType.Carnivore);
      break;
    }
  }
};

let lastStats = 0;
const STATS_INTERVAL = 1000;

function spawnCreatures(count: number, type: EntityType.Herbivore | EntityType.Carnivore) {
  for (let i = 0; i < count; i++) {
    let color: number;
    if (type === EntityType.Herbivore) {
      color = HERBIVORE_COLORS[Math.floor(Math.random() * HERBIVORE_COLORS.length)];
    } else {
      color = CARNIVORE_COLORS[Math.floor(Math.random() * CARNIVORE_COLORS.length)];
    }

    const dna: CreatureDNA = {
      speed: rand(30, 80),
      foodNeeded: randInt(3, 7),
      offspring: randInt(1, 3),
      lifespan: rand(40, 80),
      color,
      size: rand(2, 4),
    };
    creatures.push({
      id: nextId++,
      x: rand(0, worldWidth),
      y: rand(0, worldHeight),
      vx: 0,
      vy: 0,
      age: 0,
      lastEat: 0,
      energy: 0,
      dna,
      type,
    });
  }
}

function maybeSpawnFood(dt: number) {
  const targetPerSecond = config.foodRate;
  const expected = targetPerSecond * dt;
  let toSpawn = Math.floor(expected);
  if (Math.random() < expected - toSpawn) toSpawn++;
  for (let i = 0; i < toSpawn && food.length < config.maxFood; i++) {
    food.push({ x: rand(0, worldWidth), y: rand(0, worldHeight) });
  }
}

function findNearestFood(creature: Creature): Food | null {
  let nearest: Food | null = null;
  let minDist = Infinity;
  for (const f of food) {
    const dx = f.x - creature.x;
    const dy = f.y - creature.y;
    const dist = dx * dx + dy * dy;
    if (dist < minDist) {
      minDist = dist;
      nearest = f;
    }
  }
  return nearest;
}

function findNearestPrey(predator: Creature): Creature | null {
  let nearest: Creature | null = null;
  let minDist = Infinity;
  for (const c of creatures) {
    if (c.type !== EntityType.Herbivore || c === predator) continue;
    const dx = c.x - predator.x;
    const dy = c.y - predator.y;
    const dist = dx * dx + dy * dy;
    if (dist < minDist && dist < 10000) { // Rango de detección
      minDist = dist;
      nearest = c;
    }
  }
  return nearest;
}

function moveTowardsTarget(creature: Creature, targetX: number, targetY: number, dt: number) {
  const dx = targetX - creature.x;
  const dy = targetY - creature.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  if (dist > 1) {
    const speed = creature.dna.speed * dt;
    creature.vx = (dx / dist) * speed;
    creature.vy = (dy / dist) * speed;
  }
}

function update(dt: number) {
  maybeSpawnFood(dt);
  
  // Mover criaturas
  for (let i = creatures.length - 1; i >= 0; i--) {
    const c = creatures[i];
    c.age += dt;

    // Comportamiento inteligente
    if (c.type === EntityType.Herbivore) {
      const nearestFood = findNearestFood(c);
      if (nearestFood) {
        moveTowardsTarget(c, nearestFood.x, nearestFood.y, dt);
      } else {
        // Movimiento aleatorio si no hay comida
        if (Math.random() < 0.05) {
          const angle = Math.random() * Math.PI * 2;
          c.vx = Math.cos(angle) * c.dna.speed * 0.5;
          c.vy = Math.sin(angle) * c.dna.speed * 0.5;
        }
      }
    } else if (c.type === EntityType.Carnivore) {
      if (config.carnivoreChaseEnabled) {
        const nearestPrey = findNearestPrey(c);
        if (nearestPrey) {
          moveTowardsTarget(c, nearestPrey.x, nearestPrey.y, dt);
        } else {
          // Patrullaje aleatorio
          if (Math.random() < 0.03) {
            const angle = Math.random() * Math.PI * 2;
            c.vx = Math.cos(angle) * c.dna.speed * 0.3;
            c.vy = Math.sin(angle) * c.dna.speed * 0.3;
          }
        }
      } else {
        // Movimiento siempre aleatorio si la IA está desactivada
        if (Math.random() < 0.03) {
          const angle = Math.random() * Math.PI * 2;
          c.vx = Math.cos(angle) * c.dna.speed * 0.3;
          c.vy = Math.sin(angle) * c.dna.speed * 0.3;
        }
      }
    }

    // Aplicar movimiento
    c.x += c.vx * dt;
    c.y += c.vy * dt;
    
    // Rebote en bordes
    if (c.x < 0 || c.x > worldWidth) {
      c.vx *= -0.8;
      c.x = Math.max(0, Math.min(worldWidth, c.x));
    }
    if (c.y < 0 || c.y > worldHeight) {
      c.vy *= -0.8;
      c.y = Math.max(0, Math.min(worldHeight, c.y));
    }

    // Comer
    if (c.type === EntityType.Herbivore) {
      // Buscar comida cercana
      for (let j = food.length - 1; j >= 0; j--) {
        const f = food[j];
        const dx = f.x - c.x;
        const dy = f.y - c.y;
        if (dx * dx + dy * dy < 20) {
          food.splice(j, 1);
          c.energy += 1;
          c.lastEat = 0;
          break;
        }
      }
    } else if (c.type === EntityType.Carnivore) {
      // Buscar herbívoros cercanos
      for (let k = creatures.length - 1; k >= 0; k--) {
        const prey = creatures[k];
        if (prey.type !== EntityType.Herbivore || prey === c) continue;
        const dx = prey.x - c.x;
        const dy = prey.y - c.y;
        if (dx * dx + dy * dy < 30) {
          creatures.splice(k, 1);
          if (k < i) i--; // Ajustar índice
          c.energy += prey.dna.foodNeeded;
          c.lastEat = 0;
          break;
        }
      }
    }

    // Ayuno
    c.lastEat += dt;

    // Reproducir
    if (c.energy >= c.dna.foodNeeded) {
      reproduce(c);
      c.energy = 0;
    }

    // Morir por edad o hambre
    const maxFastTime = c.type === EntityType.Herbivore ? 25 : 40;
    if (c.age > c.dna.lifespan || c.lastEat > maxFastTime) {
      creatures.splice(i, 1);
    }
  }

  // Auto-respawn si está habilitado y la población es muy baja
  if (config.respawnEnabled) {
    const herbCount = creatures.filter(c => c.type === EntityType.Herbivore).length;
    const carnCount = creatures.filter(c => c.type === EntityType.Carnivore).length;
    
    if (herbCount < config.minPopulation) {
      spawnCreatures(Math.min(10, config.minPopulation - herbCount), EntityType.Herbivore);
    }
    if (carnCount < 2) {
      spawnCreatures(Math.min(3, 5 - carnCount), EntityType.Carnivore);
    }
  }

  // Enviar estadísticas
  const now = performance.now();
  if (now - lastStats >= STATS_INTERVAL) {
    let herbivores = 0;
    const speciesCounts: Record<number, number> = {};
    for (const c of creatures) {
      if (c.type === EntityType.Herbivore) {
        herbivores++;
        speciesCounts[c.dna.color] = (speciesCounts[c.dna.color] || 0) + 1;
      }
    }
    const carnivores = creatures.filter((c) => c.type === EntityType.Carnivore).length;
    const stats: StatsMessage = {
      type: "stats",
      t: now / 1000,
      herbivores,
      carnivores,
      food: food.length,
      species: speciesCounts,
    };
    self.postMessage(stats);
    lastStats = now;
  }
}

function mutate(value: number, rate: number, factor: number = 0.15) {
  if (Math.random() < rate) {
    return value * (1 + rand(-factor, factor));
  }
  return value;
}

function reproduce(parent: Creature) {
  const babies = parent.dna.offspring;
  for (let i = 0; i < babies; i++) {
    let newColor = parent.dna.color;
    if (Math.random() < config.mutationRate) {
      if (parent.type === EntityType.Herbivore) {
        newColor = HERBIVORE_COLORS[Math.floor(Math.random() * HERBIVORE_COLORS.length)];
      } else {
        newColor = CARNIVORE_COLORS[Math.floor(Math.random() * CARNIVORE_COLORS.length)];
      }
    }

    const dna: CreatureDNA = {
      speed: Math.max(10, mutate(parent.dna.speed, config.mutationRate)),
      foodNeeded: Math.max(1, Math.round(mutate(parent.dna.foodNeeded, config.mutationRate))),
      offspring: Math.max(1, Math.min(5, Math.round(mutate(parent.dna.offspring, config.mutationRate)))),
      lifespan: Math.max(20, mutate(parent.dna.lifespan, config.mutationRate)),
      color: newColor,
      size: Math.max(1, mutate(parent.dna.size, config.mutationRate)),
    };
    
    const spreadRadius = 20;
    creatures.push({
      id: nextId++,
      x: Math.max(0, Math.min(worldWidth, parent.x + rand(-spreadRadius, spreadRadius))),
      y: Math.max(0, Math.min(worldHeight, parent.y + rand(-spreadRadius, spreadRadius))),
      vx: 0,
      vy: 0,
      age: 0,
      lastEat: 0,
      energy: 0,
      dna,
      type: parent.type,
    });
  }
}

function renderPixi() {
  if (!graphics || !app) return;

  app.stage.scale.set(config.zoomLevel);

  graphics.clear();
  
  // Grid opcional
  if (config.showGrid) {
    graphics.beginFill(0x222222);
    const gridSize = 50;
    for (let x = 0; x < worldWidth; x += gridSize) {
      graphics.drawRect(x, 0, 1 / config.zoomLevel, worldHeight);
    }
    for (let y = 0; y < worldHeight; y += gridSize) {
      graphics.drawRect(0, y, worldWidth, 1 / config.zoomLevel);
    }
    graphics.endFill();
  }
  
  // comida verde brillante (diferente de herbívoros)
  graphics.beginFill(0x00ff00);
  for (const f of food) {
    graphics.drawCircle(f.x, f.y, 2);
  }
  graphics.endFill();

  // criaturas por especie (color) con tamaño variable
  for (const c of creatures) {
    graphics.beginFill(c.dna.color);
    const size = Math.max(2, c.dna.size);
    graphics.drawCircle(c.x, c.y, size);
    graphics.endFill();
  }
} 