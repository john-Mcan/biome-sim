// simulation.ts - Web Worker para ecosistema de puntos móviles
// NOTA: Este worker corre en un hilo separado y actualiza estado de entidades.
// Usa OffscreenCanvas si el mensaje inicial provee un canvas.

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

export interface StatsMessage {
  type: "stats";
  t: number;
  herbivores: number;
  carnivores: number;
}

export interface SimConfig {
  foodRate: number; // items por segundo
  mutationRate: number; // 0-1
  maxFood: number;
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
}

interface Food {
  x: number;
  y: number;
}

// Estado global dentro del worker
let ctx: OffscreenCanvasRenderingContext2D | null = null;
let width = 0;
let height = 0;

const food: Food[] = [];
const creatures: Creature[] = [];
let nextId = 1;

let config: SimConfig = {
  foodRate: 20,
  mutationRate: 0.05,
  maxFood: 500,
};

// Utilitarios
const rand = (min: number, max: number) => Math.random() * (max - min) + min;
const randInt = (min: number, max: number) => Math.floor(rand(min, max));

self.onmessage = (ev: MessageEvent<InitMessage | ConfigUpdateMessage | TickRequestMessage>) => {
  const { data } = ev;
  switch (data.type) {
    case "init": {
      width = data.width;
      height = data.height;
      config = data.config;
      ctx = data.canvas.getContext("2d");
      if (ctx) {
        ctx.imageSmoothingEnabled = false;
      }
      // Semilla inicial
      spawnCreatures(50, EntityType.Herbivore);
      spawnCreatures(5, EntityType.Carnivore);
      // Arrancar loop
      lastTick = performance.now();
      requestAnimationFrame(loop);
      break;
    }
    case "config": {
      config = { ...config, ...data.config };
      break;
    }
    case "tick": {
      // Could implement manual stepping if desired
      break;
    }
  }
};

let lastTick = 0;
const TICK_MS = 16; // ~60 FPS
let lastStats = 0;
const STATS_INTERVAL = 1000;

function loop() {
  const now = performance.now();
  const delta = now - lastTick;
  if (delta >= TICK_MS) {
    update(delta / 1000);
    lastTick = now;
  }
  draw();
  requestAnimationFrame(loop);
}

function spawnCreatures(count: number, type: EntityType.Herbivore | EntityType.Carnivore) {
  for (let i = 0; i < count; i++) {
    const dna: CreatureDNA = {
      speed: rand(20, 60),
      foodNeeded: randInt(3, 8),
      offspring: randInt(1, 4),
      lifespan: rand(30, 60),
      color: Math.random() * 0xffffff,
    };
    creatures.push({
      id: nextId++,
      x: rand(0, width),
      y: rand(0, height),
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
    food.push({ x: rand(0, width), y: rand(0, height) });
  }
}

function update(dt: number) {
  maybeSpawnFood(dt);
  // Mover criaturas
  for (let i = creatures.length - 1; i >= 0; i--) {
    const c = creatures[i];
    c.age += dt;
    // movimiento simple: escoge target aleatorio ocasionalmente
    if (Math.random() < 0.02) {
      const angle = Math.random() * Math.PI * 2;
      c.vx = Math.cos(angle) * c.dna.speed;
      c.vy = Math.sin(angle) * c.dna.speed;
    }
    c.x += c.vx * dt;
    c.y += c.vy * dt;
    // bounds
    if (c.x < 0 || c.x > width) c.vx *= -1;
    if (c.y < 0 || c.y > height) c.vy *= -1;
    c.x = Math.max(0, Math.min(width, c.x));
    c.y = Math.max(0, Math.min(height, c.y));

    // Comer
    if (c.type === EntityType.Herbivore) {
      // Buscar comida cercana
      for (let j = food.length - 1; j >= 0; j--) {
        const f = food[j];
        const dx = f.x - c.x;
        const dy = f.y - c.y;
        if (dx * dx + dy * dy < 10) {
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
        if (prey.type !== EntityType.Herbivore) continue;
        const dx = prey.x - c.x;
        const dy = prey.y - c.y;
        if (dx * dx + dy * dy < 25) {
          creatures.splice(k, 1);
          c.energy += prey.dna.foodNeeded; // gana energía proporcional
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
    if (c.age > c.dna.lifespan || c.lastEat > 20) {
      creatures.splice(i, 1);
    }
  }

  const now = performance.now();
  if (now - lastStats >= STATS_INTERVAL) {
    const herbivores = creatures.filter((c) => c.type === EntityType.Herbivore).length;
    const carnivores = creatures.filter((c) => c.type === EntityType.Carnivore).length;
    const stats: StatsMessage = {
      type: "stats",
      t: now / 1000,
      herbivores,
      carnivores,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (self as any).postMessage(stats);
    lastStats = now;
  }
}

function mutate(value: number, rate: number, factor: number = 0.1) {
  if (Math.random() < rate) {
    return value * (1 + rand(-factor, factor));
  }
  return value;
}

function reproduce(parent: Creature) {
  const babies = parent.dna.offspring;
  for (let i = 0; i < babies; i++) {
    const dna: CreatureDNA = {
      speed: mutate(parent.dna.speed, config.mutationRate),
      foodNeeded: Math.max(1, Math.round(mutate(parent.dna.foodNeeded, config.mutationRate))),
      offspring: Math.round(mutate(parent.dna.offspring, config.mutationRate)),
      lifespan: mutate(parent.dna.lifespan, config.mutationRate),
      color: parent.dna.color, // color se mantiene de especie
    };
    creatures.push({
      id: nextId++,
      x: parent.x,
      y: parent.y,
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

function draw() {
  if (!ctx) return;
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, width, height);
  // Dibujar comida
  ctx.fillStyle = "green";
  for (const f of food) {
    ctx.fillRect(f.x, f.y, 2, 2);
  }
  // Dibujar criaturas
  for (const c of creatures) {
    ctx.fillStyle = `#${c.dna.color.toString(16).padStart(6, "0")}`;
    ctx.fillRect(c.x, c.y, 3, 3);
  }
} 