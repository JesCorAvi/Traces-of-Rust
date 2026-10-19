// Catálogo de torretas y reglas de mejora estilo BTD6.
// Exports: TURRET_UPGRADE_RULES, TURRETS.

  // 9. REGLAS DE MEJORA ESTILO BTD6
export const TURRET_UPGRADE_RULES = {
    maxTier: 4,
    freeTier: 2,          // Todas las rutas pueden subir hasta nivel 2
    specializedTier: 3,   // Solo una ruta puede pasar de nivel 2
    sellRefund: 0.5
  };

  // 10. CATÁLOGO DE TORRETAS
  // Cada torreta tiene 3 rutas de 4 niveles. Los niveles 2 y 4 cambian el comportamiento
  // mediante `special` y añaden piezas visuales mediante `visual`.
export const TURRETS = {
    gunner: {
      id: 'gunner',
      name: 'CLAVADORA',
      role: 'DAÑO DIRECTO',
      icon: 'turret_gunner',
      spriteKey: 'turret_gunner',
      description: 'Rifle industrial de alta cadencia. Barato y fiable contra objetivos únicos.',
      cost: 10,
      color: 0xb89c46,
      spriteSize: 1.5,
      base: {
        damage: 6, range: 11, fireRate: 2.8, hp: 220,
        collisionRadius: 0.55, height: 1.7, attackStopDistance: 1.6,
        projectileSpeed: 42, tracer: true
      },
      paths: [
        {
          id: 'rate', name: 'CADENCIA', color: 0xd9b38c,
          upgrades: [
            { cost: 6, name: 'Cerrojo rápido', desc: '+25% de cadencia.', effects: { fireRateMult: 1.25 } },
            { cost: 12, name: 'Cañón gemelo', desc: 'Dispara a 2 objetivos a la vez.', effects: { projectileCount: 2 }, special: 'twin', visual: 'twin_barrels' },
            { cost: 22, name: 'Motor sobrealimentado', desc: '+30% de cadencia.', effects: { fireRateMult: 1.3 } },
            { cost: 40, name: 'Tormenta de balas', desc: 'Cada ataque dispara una ráfaga de 6 balas.', effects: { burstCount: 6 }, special: 'storm', visual: 'ammo_drum' }
          ]
        },
        {
          id: 'pierce', name: 'PERFORACIÓN', color: 0x877a5c,
          upgrades: [
            { cost: 6, name: 'Núcleo de acero', desc: '+2 de daño.', effects: { damageFlat: 2 } },
            { cost: 12, name: 'Munición perforante', desc: 'La bala atraviesa 2 enemigos.', effects: { pierce: 2 }, special: 'pierce', visual: 'long_barrel' },
            { cost: 22, name: 'Cañón reforzado', desc: '+3 de daño y +10% de alcance.', effects: { damageFlat: 3, rangeMult: 1.1 } },
            { cost: 40, name: 'Riel electromagnético', desc: 'El disparo atraviesa a todos los enemigos en línea y hace +50% de daño.', effects: { damageMult: 1.5, pierce: 99, rangeMult: 1.15 }, special: 'railgun', visual: 'rail_coils' }
          ]
        },
        {
          id: 'incendiary', name: 'INCENDIARIA', color: 0xa54a2a,
          upgrades: [
            { cost: 6, name: 'Pólvora incendiaria', desc: '+15% de daño.', effects: { damageMult: 1.15 } },
            { cost: 12, name: 'Balas incendiarias', desc: 'Aplica quemadura (4 dps durante 3s).', effects: { burnDps: 4, burnDuration: 3 }, special: 'incendiary', visual: 'fuel_tank' },
            { cost: 22, name: 'Combustible denso', desc: '+50% de daño de quemadura.', effects: { burnDpsMult: 1.5 } },
            { cost: 40, name: 'Munición explosiva', desc: 'El impacto explota en área y la quemadura es mucho más fuerte.', effects: { explosionRadius: 1.6, explosionDamageMult: 0.5, burnDpsMult: 1.5 }, special: 'explosive', visual: 'explosive_tank' }
          ]
        }
      ]
    },

    mortar: {
      id: 'mortar',
      name: 'BOMBARDA',
      role: 'ÁREA',
      icon: 'turret_mortar',
      spriteKey: 'turret_mortar',
      description: 'Mortero pesado de cadencia lenta. Castiga grupos enteros de hostiles.',
      cost: 18,
      color: 0x9c6b3f,
      spriteSize: 1.65,
      base: {
        damage: 18, range: 16, fireRate: 0.55, hp: 260,
        aoeRadius: 2.4, collisionRadius: 0.65, height: 1.85, attackStopDistance: 1.8,
        projectileSpeed: 12, arcProjectile: true
      },
      paths: [
        {
          id: 'caliber', name: 'CALIBRE', color: 0xd9b38c,
          upgrades: [
            { cost: 8, name: 'Carga reforzada', desc: '+20% de daño y +10% de radio.', effects: { damageMult: 1.2, aoeRadiusMult: 1.1 } },
            { cost: 16, name: 'Racimo', desc: 'La bomba se divide en 3 subexplosiones.', effects: { cluster: 3, clusterDamageMult: 0.6, clusterRadiusMult: 0.7 }, special: 'cluster', visual: 'cluster_tubes' },
            { cost: 28, name: 'Carga de asedio', desc: '+25% de daño y radio.', effects: { damageMult: 1.25, aoeRadiusMult: 1.25 } },
            { cost: 50, name: 'Asedio', desc: 'Bomba masiva: +80% de daño y radio, -25% de cadencia.', effects: { damageMult: 1.8, aoeRadiusMult: 1.8, fireRateMult: 0.75 }, special: 'siege', visual: 'siege_barrel' }
          ]
        },
        {
          id: 'barrage', name: 'CADENCIA', color: 0x877a5c,
          upgrades: [
            { cost: 8, name: 'Recarga asistida', desc: '+25% de cadencia.', effects: { fireRateMult: 1.25 } },
            { cost: 16, name: 'Andanada', desc: 'Dispara 3 proyectiles por ataque.', effects: { shellCount: 3 }, special: 'barrage', visual: 'autoloader' },
            { cost: 28, name: 'Cargador rápido', desc: '+30% de cadencia.', effects: { fireRateMult: 1.3 } },
            { cost: 50, name: 'Bombardeo', desc: '5 proyectiles por ataque y +15% de alcance.', effects: { shellCount: 5, rangeMult: 1.15 }, special: 'barrage_master', visual: 'barrage_racks' }
          ]
        },
        {
          id: 'napalm', name: 'NAPALM', color: 0xa54a2a,
          upgrades: [
            { cost: 8, name: 'Mezcla incendiaria', desc: '+15% de daño.', effects: { damageMult: 1.15 } },
            { cost: 16, name: 'Napalm', desc: 'Deja un charco de fuego durante 4s.', effects: { napalmDps: 6, napalmDuration: 4, napalmRadius: 2.2 }, special: 'napalm', visual: 'fuel_tanks' },
            { cost: 28, name: 'Combustible espeso', desc: '+50% de daño y duración del charco.', effects: { napalmDpsMult: 1.5, napalmDurationMult: 1.5 } },
            { cost: 50, name: 'Infierno', desc: 'Charco mayor e ignición adicional al impactar.', effects: { napalmRadiusMult: 1.5, napalmDpsMult: 1.5, ignitionDamage: 20 }, special: 'inferno', visual: 'inferno_tanks' }
          ]
        }
      ]
    },

    cryo: {
      id: 'cryo',
      name: 'ESCARCHA',
      role: 'CONTROL',
      icon: 'turret_cryo',
      spriteKey: 'turret_cryo',
      description: 'Emisor criogénico que ralentiza a la horda. Poco daño, control brutal.',
      cost: 12,
      color: 0x6f8f9c,
      spriteSize: 1.55,
      base: {
        damage: 0, range: 10, fireRate: 0.8, hp: 240,
        aoeRadius: 3.2, slowFactor: 0.6, slowDuration: 1.6,
        collisionRadius: 0.6, height: 1.8, attackStopDistance: 1.7
      },
      paths: [
        {
          id: 'refrigerant', name: 'REFRIGERANTE', color: 0x9fc3c9,
          upgrades: [
            { cost: 7, name: 'Refrigerante II', desc: 'Ralentiza un 45%.', effects: { slowFactor: 0.55 } },
            { cost: 14, name: 'Congelación', desc: 'Cada 5 pulsos congela a los enemigos 0.8s.', effects: { freezeDuration: 0.8, freezeEvery: 5 }, special: 'freeze', visual: 'frost_coils' },
            { cost: 24, name: 'Refrigerante III', desc: 'Ralentiza un 55%.', effects: { slowFactor: 0.45 } },
            { cost: 44, name: 'Cero absoluto', desc: 'Congela 1.5s y los congelados reciben +50% de daño.', effects: { freezeDuration: 1.5, frozenDamageMult: 1.5 }, special: 'absolute_zero', visual: 'crystal_core' }
          ]
        },
        {
          id: 'radius', name: 'RADIO', color: 0x6f8f9c,
          upgrades: [
            { cost: 7, name: 'Boquilla ancha', desc: '+15% de radio.', effects: { aoeRadiusMult: 1.15 } },
            { cost: 14, name: 'Ventisca', desc: 'El pulso cubre +40% de radio.', effects: { aoeRadiusMult: 1.4 }, special: 'blizzard', visual: 'radiator_fins' },
            { cost: 24, name: 'Difusor industrial', desc: '+20% de radio.', effects: { aoeRadiusMult: 1.2 } },
            { cost: 44, name: 'Blanco total', desc: 'Aura continua sin huecos y +20% de alcance.', effects: { continuous: true, rangeMult: 1.2 }, special: 'whiteout', visual: 'blizzard_core' }
          ]
        },
        {
          id: 'lethal', name: 'ESCARCHA LETAL', color: 0x4a6b73,
          upgrades: [
            { cost: 7, name: 'Escarcha cortante', desc: 'El pulso inflige 3 de daño.', effects: { damageFlat: 3 } },
            { cost: 14, name: 'Congelación profunda', desc: 'Los enemigos ralentizados sufren 2 dps.', effects: { frostbiteDps: 2 }, special: 'frostbite', visual: 'ice_spikes' },
            { cost: 24, name: 'Hielo negro', desc: '+3 de daño y +50% de daño por congelación.', effects: { damageFlat: 3, frostbiteDpsMult: 1.5 } },
            { cost: 44, name: 'Fractura', desc: 'Los enemigos ralentizados o congelados reciben +40% de daño.', effects: { brittleMult: 1.4 }, special: 'shatter', visual: 'shatter_crystal' }
          ]
        }
      ]
    },

    barracks: {
      id: 'barracks',
      name: 'CUARTEL',
      role: 'TROPAS ALIADAS',
      icon: 'turret_barracks',
      spriteKey: 'turret_barracks',
      description: 'Foso de reconstrucción que despliega guardias para bloquear y hostigar.',
      cost: 20,
      color: 0x68863a,
      spriteSize: 1.7,
      base: {
        damage: 0, range: 10, fireRate: 1, hp: 300,
        spawnInterval: 8, allyCap: 2,
        allyHp: 60, allyDamage: 6, allySpeed: 4.2, allyAttackInterval: 0.9,
        allyRange: 10, collisionRadius: 0.7, height: 2.0, attackStopDistance: 2.0
      },
      paths: [
        {
          id: 'recruitment', name: 'RECLUTAMIENTO', color: 0x9caf6b,
          upgrades: [
            { cost: 9, name: 'Litera extra', desc: '+1 guardia máximo.', effects: { allyCap: 1 } },
            { cost: 18, name: 'Escuadrón', desc: 'Despliega 2 guardias por tanda.', effects: { alliesPerSpawnSet: 2 }, special: 'squad', visual: 'extra_bunks' },
            { cost: 30, name: 'Barracones ampliados', desc: '+1 guardia máximo.', effects: { allyCap: 1 } },
            { cost: 54, name: 'Batallón', desc: 'Máximo 6 guardias y 3 por tanda.', effects: { allyCap: 2, alliesPerSpawn: 1 }, special: 'battalion', visual: 'battalion_bunks' }
          ]
        },
        {
          id: 'weaponry', name: 'ARMAMENTO', color: 0xb89c46,
          upgrades: [
            { cost: 9, name: 'Acero afilado', desc: '+25% de daño y vida de los aliados.', effects: { allyDamageMult: 1.25, allyHpMult: 1.25 } },
            { cost: 18, name: 'Élite', desc: 'Armadura del 25% y +20% de velocidad.', effects: { allyArmor: 0.25, allySpeedMult: 1.2 }, special: 'elite', visual: 'armor_plates' },
            { cost: 30, name: 'Forja de guerra', desc: '+25% de daño y vida de los aliados.', effects: { allyDamageMult: 1.25, allyHpMult: 1.25 } },
            { cost: 54, name: 'Juggernaut', desc: 'Ataque en área y +50% de vida.', effects: { allyAoe: true, allyHpMult: 1.5 }, special: 'juggernaut', visual: 'heavy_armor' }
          ]
        },
        {
          id: 'fabrication', name: 'FABRICACIÓN', color: 0x6f8f9c,
          upgrades: [
            { cost: 9, name: 'Cadena de montaje', desc: '-20% de intervalo de aparición.', effects: { spawnIntervalMult: 0.8 } },
            { cost: 18, name: 'Drones', desc: 'Los aliados atacan a distancia.', effects: { allyRanged: true }, special: 'drone', visual: 'antenna' },
            { cost: 30, name: 'Línea automatizada', desc: '-25% de intervalo de aparición.', effects: { spawnIntervalMult: 0.75 } },
            { cost: 54, name: 'Enjambre', desc: '2 drones por tanda y +25% de alcance.', effects: { alliesPerSpawn: 1, allyRangeMult: 1.25 }, special: 'swarm', visual: 'drone_rack' }
          ]
        }
      ]
    },

    support: {
      id: 'support',
      name: 'TALLER',
      role: 'SOPORTE',
      icon: 'turret_support',
      spriteKey: 'turret_support',
      description: 'Estación de mantenimiento. Repara estructuras y potencia a las torretas cercanas.',
      cost: 12,
      color: 0x6b7f5a,
      spriteSize: 1.5,
      base: {
        damage: 0, range: 12, fireRate: 1, hp: 200,
        pulseInterval: 3, healAmount: 8, healRadius: 12,
        buffFireRate: 0, buffDamage: 0, auraArmor: 0,
        shieldAmount: 0, shieldInterval: 10,
        collisionRadius: 0.55, height: 1.65, attackStopDistance: 1.7
      },
      paths: [
        {
          id: 'repair', name: 'REPARACIÓN', color: 0x9caf6b,
          upgrades: [
            { cost: 7, name: 'Herramientas finas', desc: '+30% de curación.', effects: { healAmountMult: 1.3 } },
            { cost: 14, name: 'Aura de reparación', desc: 'Reparación continua en lugar de pulsos.', effects: { continuousHeal: true }, special: 'repair_aura', visual: 'tool_arms' },
            { cost: 24, name: 'Soldadura reforzada', desc: '+40% de curación.', effects: { healAmountMult: 1.4 } },
            { cost: 44, name: 'Reconstrucción', desc: 'Duplica la curación y +30% de radio.', effects: { healAmountMult: 2, healRadiusMult: 1.3 }, special: 'rebuild', visual: 'repair_beacon' }
          ]
        },
        {
          id: 'overclock', name: 'SOBRECARGA', color: 0xb89c46,
          upgrades: [
            { cost: 7, name: 'Aceite conductor', desc: '+10% de cadencia a torretas cercanas.', effects: { buffFireRate: 0.1 } },
            { cost: 14, name: 'Overclock', desc: '+25% de daño y +15% de cadencia a torretas cercanas.', effects: { buffFireRate: 0.15, buffDamage: 0.25 }, special: 'overclock', visual: 'tesla_coils' },
            { cost: 24, name: 'Reactor auxiliar', desc: '+10% de daño y cadencia adicionales.', effects: { buffFireRate: 0.1, buffDamage: 0.1 } },
            { cost: 44, name: 'Pico de potencia', desc: 'Cada 20s, +80% de cadencia durante 5s.', effects: { overclockBurst: 0.8, overclockBurstDuration: 5, overclockBurstInterval: 20 }, special: 'power_surge', visual: 'surge_core' }
          ]
        },
        {
          id: 'shield', name: 'ESCUDO', color: 0x6f8f9c,
          upgrades: [
            { cost: 7, name: 'Placas de refuerzo', desc: '+10% de armadura para estructuras cercanas.', effects: { auraArmor: 0.1 } },
            { cost: 14, name: 'Escudo', desc: 'Otorga 20 HP de escudo periódico.', effects: { shieldAmount: 20, shieldInterval: 10 }, special: 'shield', visual: 'dome' },
            { cost: 24, name: 'Blindaje compuesto', desc: '+10% de armadura y +50% de escudo.', effects: { auraArmor: 0.1, shieldAmountMult: 1.5 } },
            { cost: 44, name: 'Barrera', desc: '30% de reducción de daño para estructuras en el área.', effects: { auraArmor: 0.2, barrier: true }, special: 'barrier', visual: 'barrier_ring' }
          ]
        }
      ]
    }
  };
