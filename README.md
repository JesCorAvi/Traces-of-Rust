# Traces of Rust

[🇪🇸 Español](#español) | [🇬🇧 English](#english)

---

## 🇪🇸 Español

**Traces of Rust** es un prototipo de juego de terror y supervivencia roguelike en 3D con perspectiva en tercera persona, inspirado mecánicamente en títulos tipo **survivor** y visualmente en la estética oscura, lo-fi y claustrofóbica. 

El juego combina un entorno industrial orgánico con relieve y colisiones 3D con la agilidad y nostalgia de los *sprites* 2D tipo *billboard* animados en 8 direcciones.

### ⚙️ Características Principales
* **Mundo 3D Industrial con Relieve:** Terreno dinámico con plataformas elevadas, rampas transitables, pasarelas metálicas, fosos de contención y cobertura física (cajas y barriles) que afectan tanto al jugador como a la IA enemiga.
* **Sistema de 8 Direcciones (8-Dir Sprites):** El personaje y los jefes cuentan con vistas angulares completas (frente, perfil, espaldas y diagonales) que cambian fluidamente al rotar la cámara alrededor del protagonista.
* **Apuntado y Disparo Independiente:** Puedes moverte en una dirección mientras disparas o atacas hacia donde apunta la cámara (¡incluso disparar de espaldas mientras huyes!).
* **Arsenal Extendido (8 Armas):** Desde la *Sierra de Amputación* inicial hasta la *Escopeta Calibre 12* (con perdigones físicos y cartuchos expulsados), *Soplete Incinerador*, *Minas de Metralla* o *Jaulas Orbitales*. Todas escalan hasta **Nivel +8** y ganan proyectiles extra con pasivas.
* **Sistema de Mutaciones e Implantes (+1 Proyectil):** Mezcla armas y pasivas al subir de ciclo. Límite estricto de 4 armas y 4 pasivas activas. Incluye **3 Usos de Actualización (Rerolls)** por partida.
* **5 Bosses Únicos cada 3 Minutos:** Enfrentamientos cronometrados contra *El Amputador de Planta*, *La Madre de Alambre*, *Autómata Crematorio*, *El Falso Cirujano* y *El Recaudador del Abismo*, con barras de vida, dos fases de combate y ataques telegrafiados en el suelo.
* **Fase Final (Minuto 15+):** Tras superar al 5.º jefe, se activa el protocolo de exterminio total con avalanchas exponenciales insuperables por diseño.
* **Meta-Progresión (La Mesa del Cirujano):** Recoge dientes (`🦷`) en combate para comprar mejoras permanentes sutiles al morir.

### 🕹️ Controles
* **WASD:** Moverse por el escenario (subir rampas y escalones).
* **ESPACIO:** Saltar a plataformas elevadas.
* **SHIFT:** Esquiva brusca con rastro e invulnerabilidad temporal.
* **RATÓN:** Apuntar linterna y disparar / atacar de forma independiente.

---

## 🇬🇧 English

**Traces of Rust** is a 3D horror survival roguelike prototype in third-person, mechanically inspired by survivor-style games and visually rooted in the dark, lo-fi, and claustrophobic aesthetics.

The game blends an organic industrial 3D environment featuring height variations and collisions with the nostalgic agility of 8-directional animated 2D billboard sprites.

### ⚙️ Main Features
* **Industrial 3D Terrain with Height Variations:** Dynamic terrain featuring elevated platforms, walkable ramps, catwalks, drainage basins, and physical covers (crates and barrels) that affect both player movement and enemy pathfinding.
* **8-Directional Sprites (8-Dir):** The protagonist and bosses feature full angular views (front, profile, back, and diagonals) that dynamically update as the camera rotates around the player.
* **Independent Aiming & Shooting:** Move in any direction while aiming and attacking wherever the camera points (allowing blind-firing backwards while kiting hordes).
* **Extended Arsenal (8 Weapons):** From the starting *Amputation Saw* to the *12-Gauge Shotgun* (featuring physical pellets and ejected red shells), *Incinerator Torch*, *Shrapnel Mines*, or *Butcher Cages*. All weapons scale up to **Level +8** and benefit from multi-projectile passive upgrades.
* **Mutations & Passives (+1 Projectile):** Mix weapons and passive implants upon leveling up. Strict inventory limits of 4 weapons and 4 passives. Includes **3 Rerolls** per run.
* **5 Unique Bosses Every 3 Minutes:** Timed encounters against *The Plant Butcher*, *The Wire Mother*, *Furnace Automaton*, *The False Surgeon*, and *The Warden of the Abyss*, featuring boss health bars, two combat phases, and telegraphed ground hazard zones.
* **Endgame Phase (Minute 15+):** Surviving past the 5th boss triggers a total containment failure featuring insurmountable exponential enemy swarms.
* **Meta-Progression (The Surgeon's Table):** Collect teeth (`🦷`) in combat to purchase subtle permanent upgrades upon death.

### 🕹️ Controls
* **WASD:** Move around the plant (walk up ramps and steps).
* **SPACE:** Jump onto elevated platforms.
* **SHIFT:** Quick dash with temporary invulnerability.
* **MOUSE:** Aim flashlight and shoot/attack independently.

---

### 🚀 Instalación y Ejecución / Installation & Running
Al tratarse de un prototipo web modular construido con ES6 Modules y Three.js, requiere un servidor local estricto para evitar bloqueos de CORS en los módulos:

1. Clona o descarga el repositorio.
2. Abre la carpeta del proyecto en **VS Code**.
3. Inicia un servidor local (por ejemplo, usando la extensión **Live Server** o ejecutando `python -m http.server 8000`).
4. Abre `http://localhost:8000` en tu navegador.
