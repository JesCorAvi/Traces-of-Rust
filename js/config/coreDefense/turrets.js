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
        damage: 15, range: 11, fireRate: 2.8, hp: 220,
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
        damage: 44, range: 16, fireRate: 0.55, hp: 260,
        aoeRadius: 2.8, collisionRadius: 0.65, height: 1.85, attackStopDistance: 1.8,
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
        aoeRadius: 3.2, slowFactor: 0.5, slowDuration: 2.2,
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
        spawnInterval: 6, allyCap: 2,
        allyHp: 120, allyDamage: 14, allySpeed: 4.2, allyAttackInterval: 0.9,
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
      role: 'AMPLIFICADOR',
      icon: 'turret_support',
      spriteKey: 'turret_support',
      description: 'Torre de enlace táctico. Potencia a las torretas cercanas aumentando su cadencia, daño y alcance.',
      cost: 14,
      color: 0xb89c46,
      spriteSize: 1.5,
      base: {
        damage: 0, range: 14, fireRate: 1, hp: 300,
        buffFireRate: 0.15, buffDamage: 0.15, buffRange: 0.15,
        collisionRadius: 0.55, height: 1.65, attackStopDistance: 1.7
      },
      paths: [
        {
          id: 'overclock', name: 'SOBRECARGA', color: 0xb89c46,
          upgrades: [
            { cost: 8, name: 'Bobinas aceleradoras', desc: '+15% de cadencia a torretas cercanas.', effects: { buffFireRate: 0.15 } },
            { cost: 16, name: 'Sincronizador armónico', desc: '+20% de cadencia adicional.', effects: { buffFireRate: 0.20 }, special: 'harmonic_sync', visual: 'tesla_coils' },
            { cost: 28, name: 'Frecuencia de choque', desc: '+25% de cadencia adicional.', effects: { buffFireRate: 0.25 } },
            { cost: 48, name: 'Tormenta cinética', desc: '+40% de cadencia y ráfagas de hipervelocidad periódicas.', effects: { buffFireRate: 0.40, overclockBurst: 0.5 }, special: 'power_surge', visual: 'surge_core' }
          ]
        },
        {
          id: 'power', name: 'POTENCIA', color: 0xd95326,
          upgrades: [
            { cost: 8, name: 'Cargas de tungsteno', desc: '+15% de daño a torretas cercanas.', effects: { buffDamage: 0.15 } },
            { cost: 16, name: 'Amplificador cinético', desc: '+25% de daño a torretas cercanas.', effects: { buffDamage: 0.25 }, special: 'kinetic_amp', visual: 'tool_arms' },
            { cost: 28, name: 'Sobrealimentación', desc: '+30% de daño adicional.', effects: { buffDamage: 0.30 } },
            { cost: 48, name: 'Fisión industrial', desc: '+45% de daño adicional a torretas en rango.', effects: { buffDamage: 0.45 }, special: 'fission', visual: 'repair_beacon' }
          ]
        },
        {
          id: 'radar', name: 'RADAR Y ALCANCE', color: 0x6f8f9c,
          upgrades: [
            { cost: 6, name: 'Antena de rastreo', desc: '+20% de alcance a torretas cercanas.', effects: { buffRange: 0.20 } },
            { cost: 14, name: 'Sensor multiespectral', desc: '+25% de alcance y +15% de chatarra por bajas cercanas.', effects: { buffRange: 0.25, buffScrap: 0.15 }, special: 'sensor_sweep', visual: 'dome' },
            { cost: 24, name: 'Faro de puntería', desc: '+30% de alcance adicional.', effects: { buffRange: 0.30 } },
            { cost: 45, name: 'Red de mando orbital', desc: '+50% de alcance masivo y +25% de chatarra global.', effects: { buffRange: 0.50, buffScrap: 0.25 }, special: 'orbital_link', visual: 'barrier_ring' }
          ]
        }
      ]
    },

    tesla: {
      id: 'tesla',
      name: 'BOBINA DE TESLA',
      role: 'CADENA ELÉCTRICA',
      icon: 'turret_tesla',
      spriteKey: 'turret_tesla',
      description: 'Descarga arcos entre varios hostiles. Excelente contra grupos compactos.',
      cost: 28,
      color: 0x6fa8c8,
      spriteSize: 1.6,
      base: {
        damage: 12, range: 8, fireRate: 1.6, hp: 240,
        chainCount: 2, chainRange: 4,
        collisionRadius: 0.55, height: 1.7, attackStopDistance: 1.7
      },
      paths: [
        {
          id: 'chain', name: 'CADENA', color: 0x6fa8c8,
          upgrades: [
            { cost: 10, name: 'Bobina doble', desc: '+1 salto de cadena.', effects: { chainCount: 3 } },
            { cost: 20, name: 'Conductores largos', desc: '+25% de radio de cadena y +1 salto.', effects: { chainRangeMult: 1.25, chainCount: 4 }, visual: 'tesla_arcs' },
            { cost: 34, name: 'Red de arcos', desc: '+1 salto adicional.', effects: { chainCount: 5 } },
            { cost: 58, name: 'Tormenta de enlaces', desc: '+35% de radio y +2 saltos.', effects: { chainRangeMult: 1.35, chainCount: 7 }, visual: 'tesla_crown' }
          ]
        },
        {
          id: 'voltage', name: 'VOLTAJE', color: 0xd8b45a,
          upgrades: [
            { cost: 10, name: 'Núcleo de cobre', desc: '+4 de daño.', effects: { damageFlat: 4 } },
            { cost: 20, name: 'Sobretensión', desc: '+30% de daño.', effects: { damageMult: 1.3 } },
            { cost: 34, name: 'Arco paralizante', desc: 'Los impactos aturden brevemente.', effects: { freezeDuration: 0.25 }, visual: 'tesla_capacitor' },
            { cost: 58, name: 'Descarga industrial', desc: '+50% de daño y aturdimiento mayor.', effects: { damageMult: 1.5, freezeDuration: 0.35 } }
          ]
        },
        {
          id: 'overcharge', name: 'SOBRECARGA', color: 0xa8f044,
          upgrades: [
            { cost: 10, name: 'Condensador rápido', desc: '+25% de cadencia.', effects: { fireRateMult: 1.25 } },
            { cost: 20, name: 'Chispa múltiple', desc: '+1 salto y +10% de alcance.', effects: { chainCount: 3, rangeMult: 1.1 } },
            { cost: 34, name: 'Descarga continua', desc: '+30% de cadencia.', effects: { fireRateMult: 1.3 } },
            { cost: 58, name: 'Reactor de arco', desc: '+40% de radio de cadena y +1 salto.', effects: { chainRangeMult: 1.4, chainCount: 4 }, visual: 'tesla_overload' }
          ]
        }
      ]
    },

    incinerator: {
      id: 'incinerator',
      name: 'SOPLETE DE FOSO',
      role: 'ÁREA INCENDIARIA',
      icon: 'turret_incinerator',
      spriteKey: 'turret_incinerator',
      description: 'Cono de fuego a corta distancia. La quemadura compensa su alcance limitado.',
      cost: 24,
      color: 0xa54a2a,
      spriteSize: 1.55,
      base: {
        damage: 6, range: 5.5, fireRate: 8, hp: 260,
        burnDps: 8, burnDuration: 2.5,
        collisionRadius: 0.55, height: 1.7, attackStopDistance: 1.7
      },
      paths: [
        {
          id: 'fuel', name: 'COMBUSTIBLE', color: 0xa54a2a,
          upgrades: [
            { cost: 9, name: 'Mezcla densa', desc: '+4 DPS de quemadura.', effects: { burnDps: 4 } },
            { cost: 18, name: 'Válvula abierta', desc: '+50% de DPS de quemadura.', effects: { burnDpsMult: 1.5 }, visual: 'fuel_tank' },
            { cost: 30, name: 'Combustible gelatinoso', desc: '+1s de quemadura.', effects: { burnDuration: 1 } },
            { cost: 54, name: 'Fuego de foso', desc: '+60% de DPS y +2s de quemadura.', effects: { burnDpsMult: 1.6, burnDuration: 2 } }
          ]
        },
        {
          id: 'pressure', name: 'PRESIÓN', color: 0xd8b45a,
          upgrades: [
            { cost: 9, name: 'Boquilla amplia', desc: '+15% de alcance.', effects: { rangeMult: 1.15 } },
            { cost: 18, name: 'Bomba auxiliar', desc: '+25% de cadencia.', effects: { fireRateMult: 1.25 }, visual: 'pressure_valve' },
            { cost: 30, name: 'Turbina de presión', desc: '+20% de alcance.', effects: { rangeMult: 1.2 } },
            { cost: 54, name: 'Sobrepresión', desc: '+30% de cadencia.', effects: { fireRateMult: 1.3 } }
          ]
        },
        {
          id: 'napalm', name: 'NAPALM', color: 0x55e038,
          upgrades: [
            { cost: 9, name: 'Aditivo incendiario', desc: 'Deja una pequeña zona de napalm.', effects: { napalmDps: 5, napalmDuration: 3, napalmRadius: 2.0 } },
            { cost: 18, name: 'Depósito de gel', desc: '+40% de DPS de napalm.', effects: { napalmDpsMult: 1.4 }, visual: 'napalm_tank' },
            { cost: 30, name: 'Espuma adherente', desc: '+50% de duración del napalm.', effects: { napalmDurationMult: 1.5 } },
            { cost: 54, name: 'Incendio de foso', desc: '+30% de radio e ignición al impactar.', effects: { napalmRadiusMult: 1.3, ignitionDamage: 12 } }
          ]
        }
      ]
    },

    railgun: {
      id: 'railgun',
      name: 'CAÑÓN DE RIEL',
      role: 'FRANCOTIRADOR',
      icon: 'turret_railgun',
      spriteKey: 'turret_railgun',
      description: 'Disparo lento y devastador contra un único objetivo prioritario. Sin área.',
      cost: 46,
      color: 0x9fc3c9,
      spriteSize: 1.7,
      base: {
        damage: 110, range: 24, fireRate: 0.45, hp: 220,
        targetMode: 'strongest',
        collisionRadius: 0.55, height: 1.8, attackStopDistance: 1.8
      },
      paths: [
        {
          id: 'caliber', name: 'CALIBRE', color: 0xc8c2ac,
          upgrades: [
            { cost: 12, name: 'Proyectil pesado', desc: '+20% de daño.', effects: { damageMult: 1.2 } },
            { cost: 24, name: 'Núcleo de tungsteno', desc: '+25 de daño.', effects: { damageFlat: 25 }, visual: 'long_rail' },
            { cost: 40, name: 'Perforador cinético', desc: '+35% de daño.', effects: { damageMult: 1.35 } },
            { cost: 64, name: 'Ejecutor de placas', desc: '+50% de daño contra el objetivo.', effects: { damageMult: 1.5 } }
          ]
        },
        {
          id: 'coils', name: 'BOBINAS', color: 0x6fa8c8,
          upgrades: [
            { cost: 12, name: 'Carga rápida', desc: '+25% de cadencia.', effects: { fireRateMult: 1.25 } },
            { cost: 24, name: 'Batería de bobinas', desc: '+15% de alcance y +15% de cadencia.', effects: { rangeMult: 1.15, fireRateMult: 1.15 }, visual: 'coil_bank' },
            { cost: 40, name: 'Capacitor de riel', desc: '+30% de cadencia.', effects: { fireRateMult: 1.3 } },
            { cost: 64, name: 'Lanzamiento hipersónico', desc: '+20% de alcance adicional.', effects: { rangeMult: 1.2 } }
          ]
        },
        {
          id: 'scope', name: 'MIRA', color: 0xe6d7a5,
          upgrades: [
            { cost: 12, name: 'Óptica de precisión', desc: '+20% de alcance.', effects: { rangeMult: 1.2 } },
            { cost: 24, name: 'Marca de prioridad', desc: '+15% de daño y +10% de alcance.', effects: { damageMult: 1.15, rangeMult: 1.1 }, visual: 'scope' },
            { cost: 40, name: 'Predictor balístico', desc: '+20% de daño.', effects: { damageMult: 1.2 } },
            { cost: 64, name: 'Tiro de ejecución', desc: '+40% de daño al objetivo prioritario.', effects: { damageMult: 1.4 } }
          ]
        }
      ]
    },

    collector: {
      id: 'collector',
      name: 'RECOLECTOR DE CHATARRA',
      role: 'ECONOMÍA',
      icon: 'turret_collector',
      spriteKey: 'turret_collector',
      description: 'No ataca. Genera chatarra al completar oleadas y mediante su ciclo de reciclaje.',
      cost: 32,
      color: 0xb89c46,
      spriteSize: 1.5,
      base: {
        damage: 0, range: 3, fireRate: 1, hp: 300,
        scrapPerWave: 6, scrapInterval: 10, scrapAmount: 2,
        collisionRadius: 0.55, height: 1.7, attackStopDistance: 1.7
      },
      paths: [
        {
          id: 'yield', name: 'RENDIMIENTO', color: 0xd8b45a,
          upgrades: [
            { cost: 10, name: 'Contenedor extra', desc: '+3 de chatarra por oleada.', effects: { scrapPerWave: 3 } },
            { cost: 20, name: 'Clasificador', desc: '+4 de chatarra por oleada.', effects: { scrapPerWave: 4 }, visual: 'scrap_bin' },
            { cost: 34, name: 'Línea de fundición', desc: '+5 de chatarra por oleada.', effects: { scrapPerWave: 5 } },
            { cost: 58, name: 'Fundición industrial', desc: '+8 de chatarra por oleada.', effects: { scrapPerWave: 8 } }
          ]
        },
        {
          id: 'logistics', name: 'LOGÍSTICA', color: 0x6f8f9c,
          upgrades: [
            { cost: 10, name: 'Cinta rápida', desc: '+1 de chatarra por ciclo.', effects: { scrapAmount: 1 } },
            { cost: 20, name: 'Turno doble', desc: 'Ciclos más frecuentes.', effects: { scrapInterval: 8 }, visual: 'crane' },
            { cost: 34, name: 'Cadena automatizada', desc: '+2 de chatarra por ciclo.', effects: { scrapAmount: 2 } },
            { cost: 58, name: 'Reciclaje continuo', desc: 'Ciclos aún más frecuentes.', effects: { scrapInterval: 6 } }
          ]
        },
        {
          id: 'reserve', name: 'RESERVA', color: 0xa54a2a,
          upgrades: [
            { cost: 10, name: 'Reserva de emergencia', desc: '+2 de chatarra por oleada.', effects: { scrapPerWave: 2 } },
            { cost: 20, name: 'Baliza de suministros', desc: '+1 de chatarra por ciclo y +9s de intervalo.', effects: { scrapAmount: 1, scrapInterval: 9 }, visual: 'beacon' },
            { cost: 34, name: 'Almacén blindado', desc: '+4 de chatarra por oleada.', effects: { scrapPerWave: 4 } },
            { cost: 58, name: 'Red de salvamento', desc: '+2 de chatarra por ciclo y +7s de intervalo.', effects: { scrapAmount: 2, scrapInterval: 7 } }
          ]
        }
      ]
    },

    press: {
      id: 'press',
      name: 'PRENSA DE VÍA',
      role: 'CONTROL A CORTA DISTANCIA',
      icon: 'turret_press',
      spriteKey: 'turret_press',
      description: 'Golpea el suelo a muy corta distancia con una prensa hidráulica. Empuja y aturde.',
      cost: 20,
      color: 0xd8b45a,
      spriteSize: 1.45,
      base: {
        damage: 55, range: 2.2, fireRate: 0.45, hp: 280,
        aoeRadius: 2.2, freezeDuration: 0.6,
        collisionRadius: 0.6, height: 1.55, attackStopDistance: 1.8
      },
      paths: [
        {
          id: 'pressure', name: 'PRESIÓN', color: 0xd8b45a,
          upgrades: [
            { cost: 8, name: 'Émbolo pesado', desc: '+25% de daño.', effects: { damageMult: 1.25 } },
            { cost: 16, name: 'Placa de impacto', desc: '+15% de radio.', effects: { aoeRadiusMult: 1.15 }, visual: 'heavy_ram' },
            { cost: 28, name: 'Pistón sobrealimentado', desc: '+30% de daño.', effects: { damageMult: 1.3 } },
            { cost: 50, name: 'Prensa de demolición', desc: '+20% de radio y +25% de daño.', effects: { aoeRadiusMult: 1.2, damageMult: 1.25 } }
          ]
        },
        {
          id: 'cadence', name: 'CADENCIA', color: 0x877a5c,
          upgrades: [
            { cost: 8, name: 'Válvula rápida', desc: '+25% de cadencia.', effects: { fireRateMult: 1.25 } },
            { cost: 16, name: 'Volante de inercia', desc: '+30% de cadencia.', effects: { fireRateMult: 1.3 }, visual: 'side_pistons' },
            { cost: 28, name: 'Biela ligera', desc: '+15% de alcance.', effects: { rangeMult: 1.15 } },
            { cost: 50, name: 'Prensa automática', desc: '+40% de cadencia.', effects: { fireRateMult: 1.4 } }
          ]
        },
        {
          id: 'weight', name: 'PESO', color: 0xa52020,
          upgrades: [
            { cost: 8, name: 'Lastre de hierro', desc: 'Aturdimiento de 0.9s.', effects: { freezeDuration: 0.9 } },
            { cost: 16, name: 'Contrapeso', desc: '+12 de daño.', effects: { damageFlat: 12 }, visual: 'hazard_plate' },
            { cost: 28, name: 'Yunque de vía', desc: 'Aturdimiento de 1.2s.', effects: { freezeDuration: 1.2 } },
            { cost: 50, name: 'Impacto sísmico', desc: '+40% de daño y aturdimiento de 1.5s.', effects: { damageMult: 1.4, freezeDuration: 1.5 } }
          ]
        }
      ]
    },

    ejector: {
      id: 'ejector',
      name: 'EYECCIÓN HIDRÁULICA',
      role: 'DESPLAZAMIENTO',
      icon: 'turret_ejector',
      spriteKey: 'turret_ejector',
      description: 'Válvula de presión que empuja a los hostiles hacia atrás por la ruta. Daño bajo.',
      cost: 18,
      color: 0x6f8f9c,
      spriteSize: 1.4,
      base: {
        damage: 10, range: 2.5, fireRate: 1.3, hp: 260,
        aoeRadius: 2.0, pushDistance: 3.5, freezeDuration: 0.15,
        collisionRadius: 0.55, height: 1.5, attackStopDistance: 1.8
      },
      paths: [
        {
          id: 'pressure', name: 'PRESIÓN', color: 0x6f8f9c,
          upgrades: [
            { cost: 7, name: 'Acumulador', desc: '+1m de empuje.', effects: { pushDistance: 1 } },
            { cost: 14, name: 'Válvula de golpe', desc: '+1.5m de empuje.', effects: { pushDistance: 1.5 }, visual: 'pressure_tank' },
            { cost: 24, name: 'Pistón neumático', desc: '+2m de empuje.', effects: { pushDistance: 2 } },
            { cost: 44, name: 'Eyección masiva', desc: '+2.5m de empuje.', effects: { pushDistance: 2.5 }, visual: 'wide_nozzle' }
          ]
        },
        {
          id: 'valve', name: 'VÁLVULA', color: 0xd8b45a,
          upgrades: [
            { cost: 7, name: 'Servoválvula', desc: '+25% de cadencia.', effects: { fireRateMult: 1.25 } },
            { cost: 14, name: 'Boquilla amplia', desc: '+15% de alcance.', effects: { rangeMult: 1.15 } },
            { cost: 24, name: 'Reacción rápida', desc: '+30% de cadencia.', effects: { fireRateMult: 1.3 }, visual: 'reflux_pipes' },
            { cost: 44, name: 'Turbina de eyección', desc: '+20% de alcance.', effects: { rangeMult: 1.2 } }
          ]
        },
        {
          id: 'reflux', name: 'REFLUJO', color: 0xa54a2a,
          upgrades: [
            { cost: 7, name: 'Golpe de ariete', desc: '+30% de daño.', effects: { damageMult: 1.3 } },
            { cost: 14, name: 'Impacto aturdidor', desc: '+0.2s de aturdimiento.', effects: { freezeDuration: 0.2 } },
            { cost: 24, name: 'Retorno violento', desc: '+40% de daño.', effects: { damageMult: 1.4 } },
            { cost: 44, name: 'Sobrecarga de retorno', desc: '+0.3s de aturdimiento y +1m de empuje.', effects: { freezeDuration: 0.3, pushDistance: 1 } }
          ]
        }
      ]
    }
  };
