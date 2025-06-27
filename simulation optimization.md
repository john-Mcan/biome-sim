# Propuesta de Optimización de la Simulación

> Autor: Equipo Biome Sim – Junio 2025  
> Versión: 1.0

---

## 1. Problema Observado

Después de ejecutar la simulación durante periodos prolongados se identifican **dos patrones de colapso de rendimiento**:

1. **IA de carnívoros activada** → los carnívoros evolucionan a versiones casi inmortales y dominan la pantalla. Los herbívoros se mantienen en una población mínima que alimenta el ciclo, pero el conteo total de entidades se dispara, saturando la CPU/GPU.
2. **IA de carnívoros desactivada** → los herbívoros se vuelven supersónicos y superpoblados; los carnívoros apenas controlan su número. El resultado también es una cantidad masiva de entidades.

En ambos casos se genera **degradación progresiva de FPS** y la simulación pierde valor educativo por la falta de balance ecológico.

---

## 2. Objetivos de la Optimización

1. **Mantener un equilibrio poblacional** sin imponer límites duros visibles (―evitar pops arbitrarios).  
2. **Conservar la presión evolutiva** para que la dinámica siga siendo interesante.  
3. **Reducir la complejidad computacional** por frame de _O(n²)_ a _O(n log n)_ o mejor.  
4. **Mantener la experiencia UI fluida** (> 55 FPS en equipos promedio) durante > 30 min de ejecución.

---

## 3. Propuestas de Cambio

### 3.1 Costos Energéticos Dinámicos

| Idea | Descripción | Impacto |
| --- | --- | --- |
| **Costo por movimiento** | Cada criatura descuenta energía proporcional a `velocidad * dt`. Las versiones más rápidas pagarán la factura. | + Balance, + Realismo |
| **Costo por reproducción incremental** | Cada camada subsecuente aumenta `foodNeeded` un % (ej. `+20 %`). Limita explosiones demográficas. | + Balance |
| **Envejecimiento acelerado** | Incrementar `age` según `velocidad` (organismos más rápidos = vida más corta). | + Balance |

### 3.2 Capacidad de Carga (“Carrying Capacity”)

* Calcular **densidad local** (entidades/área).  
* Si la densidad supera un umbral, aplicar: _menor tasa de comida_, _mayor costo energético_ y/o _menor probabilidad de reproducción_.

> _Inspiración_: Modelos Lotka-Volterra con términos logísticos.

### 3.3 IA de Depredador–Presa Mejorada

1. **Fuga de herbívoros**: Al detectar carnívoro a < `visionRange`, cambian dirección contraria.  
2. **Frenos a la caza**: Tiempo de recuperación (“fatiga”) tras cada captura para evitar ráfagas.

### 3.4 Algoritmos de Colisiones Eficientes

| Técnica | Detalle |
| --- | --- |
| **Cuadrante / Grid Hashing** | Dividir el mundo en celdas 50×50 px y solo comparar dentro de celdas vecinas. Reduce `findNearest*` de _O(n²)_ a ~_O(n)_. |
| **Quadtree (opcional)** | Implementar `quadtree` para mejorar todavía más con grandes `n`. |

### 3.5 Límites Blandos de Población

* Definir `maxHerbivores` y `maxCarnivores`.  
* Al intentar _spawn_ o _reproduce_ y el conteo ≥ máximo, abortar la creación **o** sacrificar al ejemplar más viejo/debil.

### 3.6 Frecuencia de Renderizado Adaptativa

* Mantener lógica a 60 tics/seg, pero **renderizar** a 30 FPS cuando `creatures.length > threshold`. Se logra con un simple contador de frames.

---

## 4. Plan de Implementación

1. **Fase 1 – Balance Básico (1 día)**  
   a. Agregar costo energético por movimiento.  
   b. Introducir edad ↔ velocidad.  
   c. Implementar límites blandos.
2. **Fase 2 – Capacidad de Carga (2 días)**  
   a. Medir densidad en cada frame.  
   b. Ajustar `foodRate` dinámicamente.  
   c. Añadir variación visual en color de comida para mostrar escasez.
3. **Fase 3 – Optimización de Colisiones (3 días)**  
   a. Refactorizar `findNearest*` a grid hashing.  
   b. Benchmark antes/después.  
   c. Evaluar quadtree.
4. **Fase 4 – IA Avanzada (opcional, 4 días)**  
   a. Fuga de herbívoros.  
   b. Fatiga de carnívoros.  
   c. Parámetros expuestos al panel de control.

---

## 5. Métricas de Éxito

| Métrica | Objetivo |
| --- | --- |
| FPS medio a 10 min | > 55 FPS |
| Entidades totales | < 4 000 |
| Tasa de extinción | < 5 % de corridas terminan sin criaturas |
| Uso de CPU (worker) | < 50 % en CPU móvil moderna |

---

## 6. Riesgos y Mitigación

1. **Mayor complejidad de código** → documentar bien + pruebas unitarias.  
2. **Parámetros difíciles de balancear** → exponer _sliders_ en modo dev para _tuning_.  
3. **Regresión de FPS en mundos pequeños** → desactivar grid hashing si `n < 200`.

---

## 7. Próximos Pasos Inmediatos

1. Crear rama `opt/performance-balance`.  
2. Implementar costo energético por movimiento y vida ligada a velocidad.  
3. Liberar _build_ experimental y medir métricas.

---

**¡Fin de la propuesta!** 