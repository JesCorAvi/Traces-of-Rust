import { t } from '../../core/i18n.js';
const _t = (k, fb) => (typeof t === 'function' ? t(k) : fb);

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
      get name() { return _t('turret.gunner.name', 'CLAVADORA'); },
      get role() { return _t('turret.gunner.role', 'DAÑO DIRECTO'); },
      icon: 'turret_gunner',
      spriteKey: 'turret_gunner',
      get description() { return _t('turret.gunner.desc', 'Rifle tropical de alta cadencia. Barato y fiable contra objetivos únicos.'); },
      cost: 10,
      color: 0xffc857,
      spriteSize: 1.5,
      base: {
        damage: 15, range: 11, fireRate: 2.8, hp: 220,
        collisionRadius: 0.55, height: 1.7, attackStopDistance: 1.6,
        projectileSpeed: 42, tracer: true
      },
      paths: [
        {
          id: 'rate', get name() { return _t('turret.gunner.path.rate.name', 'CADENCIA'); }, color: 0xd9b38c,
          upgrades: [
            { cost: 6, get name() { return _t('turret.gunner.upgrade.rate.1.name', 'Cerrojo rápido'); }, get desc() { return _t('turret.gunner.upgrade.rate.1.desc', '+25% de cadencia.'); }, effects: { fireRateMult: 1.25 } },
            { cost: 12, get name() { return _t('turret.gunner.upgrade.rate.2.name', 'Cañón gemelo'); }, get desc() { return _t('turret.gunner.upgrade.rate.2.desc', 'Dispara a 2 objetivos a la vez.'); }, effects: { projectileCount: 2 }, special: 'twin', visual: 'twin_barrels' },
            { cost: 22, get name() { return _t('turret.gunner.upgrade.rate.3.name', 'Motor sobrealimentado'); }, get desc() { return _t('turret.gunner.upgrade.rate.3.desc', '+30% de cadencia.'); }, effects: { fireRateMult: 1.3 } },
            { cost: 40, get name() { return _t('turret.gunner.upgrade.rate.4.name', 'Tormenta de balas'); }, get desc() { return _t('turret.gunner.upgrade.rate.4.desc', 'Cada ataque dispara una ráfaga de 6 balas.'); }, effects: { burstCount: 6 }, special: 'storm', visual: 'ammo_drum' }
          ]
        },
        {
          id: 'pierce', get name() { return _t('turret.gunner.path.pierce.name', 'PERFORACIÓN'); }, color: 0x877a5c,
          upgrades: [
            { cost: 6, get name() { return _t('turret.gunner.upgrade.pierce.1.name', 'Despensa de acero'); }, get desc() { return _t('turret.gunner.upgrade.pierce.1.desc', '+2 de daño.'); }, effects: { damageFlat: 2 } },
            { cost: 12, get name() { return _t('turret.gunner.upgrade.pierce.2.name', 'Munición perforante'); }, get desc() { return _t('turret.gunner.upgrade.pierce.2.desc', 'La bala atraviesa 2 cangrejos.'); }, effects: { pierce: 2 }, special: 'pierce', visual: 'long_barrel' },
            { cost: 22, get name() { return _t('turret.gunner.upgrade.pierce.3.name', 'Cañón reforzado'); }, get desc() { return _t('turret.gunner.upgrade.pierce.3.desc', '+3 de daño y +10% de alcance.'); }, effects: { damageFlat: 3, rangeMult: 1.1 } },
            { cost: 40, get name() { return _t('turret.gunner.upgrade.pierce.4.name', 'Riel electromagnético'); }, get desc() { return _t('turret.gunner.upgrade.pierce.4.desc', 'El disparo atraviesa a todos los cangrejos en línea y hace +50% de daño.'); }, effects: { damageMult: 1.5, pierce: 99, rangeMult: 1.15 }, special: 'railgun', visual: 'rail_coils' }
          ]
        },
        {
          id: 'incendiary', get name() { return _t('turret.gunner.path.incendiary.name', 'INCENDIARIA'); }, color: 0xa54a2a,
          upgrades: [
            { cost: 6, get name() { return _t('turret.gunner.upgrade.incendiary.1.name', 'Pólvora incendiaria'); }, get desc() { return _t('turret.gunner.upgrade.incendiary.1.desc', '+15% de daño.'); }, effects: { damageMult: 1.15 } },
            { cost: 12, get name() { return _t('turret.gunner.upgrade.incendiary.2.name', 'Balas incendiarias'); }, get desc() { return _t('turret.gunner.upgrade.incendiary.2.desc', 'Aplica quemadura (4 dps durante 3s).'); }, effects: { burnDps: 4, burnDuration: 3 }, special: 'incendiary', visual: 'fuel_tank' },
            { cost: 22, get name() { return _t('turret.gunner.upgrade.incendiary.3.name', 'Combustible denso'); }, get desc() { return _t('turret.gunner.upgrade.incendiary.3.desc', '+50% de daño de quemadura.'); }, effects: { burnDpsMult: 1.5 } },
            { cost: 40, get name() { return _t('turret.gunner.upgrade.incendiary.4.name', 'Munición explosiva'); }, get desc() { return _t('turret.gunner.upgrade.incendiary.4.desc', 'El impacto explota en área y la quemadura es mucho más fuerte.'); }, effects: { explosionRadius: 1.6, explosionDamageMult: 0.5, burnDpsMult: 1.5 }, special: 'explosive', visual: 'explosive_tank' }
          ]
        }
      ]
    },

    mortar: {
      id: 'mortar',
      get name() { return _t('turret.mortar.name', 'BOMBARDA'); },
      get role() { return _t('turret.mortar.role', 'ÁREA'); },
      icon: 'turret_mortar',
      spriteKey: 'turret_mortar',
      get description() { return _t('turret.mortar.desc', 'Mortero pesado de cadencia lenta. Castiga grupos enteros de cangrejos.'); },
      cost: 18,
      color: 0xffb05c,
      spriteSize: 1.65,
      base: {
        damage: 44, range: 16, fireRate: 0.55, hp: 260,
        aoeRadius: 2.8, collisionRadius: 0.65, height: 1.85, attackStopDistance: 1.8,
        projectileSpeed: 12, arcProjectile: true
      },
      paths: [
        {
          id: 'caliber', get name() { return _t('turret.mortar.path.caliber.name', 'CALIBRE'); }, color: 0xd9b38c,
          upgrades: [
            { cost: 8, get name() { return _t('turret.mortar.upgrade.caliber.1.name', 'Carga reforzada'); }, get desc() { return _t('turret.mortar.upgrade.caliber.1.desc', '+20% de daño y +10% de radio.'); }, effects: { damageMult: 1.2, aoeRadiusMult: 1.1 } },
            { cost: 16, get name() { return _t('turret.mortar.upgrade.caliber.2.name', 'Racimo'); }, get desc() { return _t('turret.mortar.upgrade.caliber.2.desc', 'La bomba se divide en 3 subexplosiones.'); }, effects: { cluster: 3, clusterDamageMult: 0.6, clusterRadiusMult: 0.7 }, special: 'cluster', visual: 'cluster_tubes' },
            { cost: 28, get name() { return _t('turret.mortar.upgrade.caliber.3.name', 'Carga de asedio'); }, get desc() { return _t('turret.mortar.upgrade.caliber.3.desc', '+25% de daño y radio.'); }, effects: { damageMult: 1.25, aoeRadiusMult: 1.25 } },
            { cost: 50, get name() { return _t('turret.mortar.upgrade.caliber.4.name', 'Asedio'); }, get desc() { return _t('turret.mortar.upgrade.caliber.4.desc', 'Bomba masiva: +80% de daño y radio, -25% de cadencia.'); }, effects: { damageMult: 1.8, aoeRadiusMult: 1.8, fireRateMult: 0.75 }, special: 'siege', visual: 'siege_barrel' }
          ]
        },
        {
          id: 'barrage', get name() { return _t('turret.mortar.path.barrage.name', 'CADENCIA'); }, color: 0x877a5c,
          upgrades: [
            { cost: 8, get name() { return _t('turret.mortar.upgrade.barrage.1.name', 'Recarga asistida'); }, get desc() { return _t('turret.mortar.upgrade.barrage.1.desc', '+25% de cadencia.'); }, effects: { fireRateMult: 1.25 } },
            { cost: 16, get name() { return _t('turret.mortar.upgrade.barrage.2.name', 'Andanada'); }, get desc() { return _t('turret.mortar.upgrade.barrage.2.desc', 'Dispara 3 proyectiles por ataque.'); }, effects: { shellCount: 3 }, special: 'barrage', visual: 'autoloader' },
            { cost: 28, get name() { return _t('turret.mortar.upgrade.barrage.3.name', 'Cargador rápido'); }, get desc() { return _t('turret.mortar.upgrade.barrage.3.desc', '+30% de cadencia.'); }, effects: { fireRateMult: 1.3 } },
            { cost: 50, get name() { return _t('turret.mortar.upgrade.barrage.4.name', 'Bombardeo'); }, get desc() { return _t('turret.mortar.upgrade.barrage.4.desc', '5 proyectiles por ataque y +15% de alcance.'); }, effects: { shellCount: 5, rangeMult: 1.15 }, special: 'barrage_master', visual: 'barrage_racks' }
          ]
        },
        {
          id: 'napalm', get name() { return _t('turret.mortar.path.napalm.name', 'NAPALM'); }, color: 0xa54a2a,
          upgrades: [
            { cost: 8, get name() { return _t('turret.mortar.upgrade.napalm.1.name', 'Mezcla incendiaria'); }, get desc() { return _t('turret.mortar.upgrade.napalm.1.desc', '+15% de daño.'); }, effects: { damageMult: 1.15 } },
            { cost: 16, get name() { return _t('turret.mortar.upgrade.napalm.2.name', 'Napalm'); }, get desc() { return _t('turret.mortar.upgrade.napalm.2.desc', 'Deja un charco de fuego durante 4s.'); }, effects: { napalmDps: 6, napalmDuration: 4, napalmRadius: 2.2 }, special: 'napalm', visual: 'fuel_tanks' },
            { cost: 28, get name() { return _t('turret.mortar.upgrade.napalm.3.name', 'Combustible espeso'); }, get desc() { return _t('turret.mortar.upgrade.napalm.3.desc', '+50% de daño y duración del charco.'); }, effects: { napalmDpsMult: 1.5, napalmDurationMult: 1.5 } },
            { cost: 50, get name() { return _t('turret.mortar.upgrade.napalm.4.name', 'Infierno'); }, get desc() { return _t('turret.mortar.upgrade.napalm.4.desc', 'Charco mayor e ignición adicional al impactar.'); }, effects: { napalmRadiusMult: 1.5, napalmDpsMult: 1.5, ignitionDamage: 20 }, special: 'inferno', visual: 'inferno_tanks' }
          ]
        }
      ]
    },

    cryo: {
      id: 'cryo',
      get name() { return _t('turret.cryo.name', 'ESCARCHA'); },
      get role() { return _t('turret.cryo.role', 'CONTROL'); },
      icon: 'turret_cryo',
      spriteKey: 'turret_cryo',
      get description() { return _t('turret.cryo.desc', 'Emisor criogénico que ralentiza a la horda. Poco daño, control brutal.'); },
      cost: 12,
      color: 0x9ff7ff,
      spriteSize: 1.55,
      base: {
        damage: 0, range: 10, fireRate: 0.8, hp: 240,
        aoeRadius: 3.2, slowFactor: 0.5, slowDuration: 2.2,
        collisionRadius: 0.6, height: 1.8, attackStopDistance: 1.7
      },
      paths: [
        {
          id: 'refrigerant', get name() { return _t('turret.cryo.path.refrigerant.name', 'REFRIGERANTE'); }, color: 0x9fc3c9,
          upgrades: [
            { cost: 7, get name() { return _t('turret.cryo.upgrade.refrigerant.1.name', 'Refrigerante II'); }, get desc() { return _t('turret.cryo.upgrade.refrigerant.1.desc', 'Ralentiza un 45%.'); }, effects: { slowFactor: 0.55 } },
            { cost: 14, get name() { return _t('turret.cryo.upgrade.refrigerant.2.name', 'Congelación'); }, get desc() { return _t('turret.cryo.upgrade.refrigerant.2.desc', 'Cada 5 pulsos congela a los cangrejos 0.8s.'); }, effects: { freezeDuration: 0.8, freezeEvery: 5 }, special: 'freeze', visual: 'frost_coils' },
            { cost: 24, get name() { return _t('turret.cryo.upgrade.refrigerant.3.name', 'Refrigerante III'); }, get desc() { return _t('turret.cryo.upgrade.refrigerant.3.desc', 'Ralentiza un 55%.'); }, effects: { slowFactor: 0.45 } },
            { cost: 44, get name() { return _t('turret.cryo.upgrade.refrigerant.4.name', 'Cero absoluto'); }, get desc() { return _t('turret.cryo.upgrade.refrigerant.4.desc', 'Congela 1.5s y los congelados reciben +50% de daño.'); }, effects: { freezeDuration: 1.5, frozenDamageMult: 1.5 }, special: 'absolute_zero', visual: 'crystal_core' }
          ]
        },
        {
          id: 'radius', get name() { return _t('turret.cryo.path.radius.name', 'RADIO'); }, color: 0x6f8f9c,
          upgrades: [
            { cost: 7, get name() { return _t('turret.cryo.upgrade.radius.1.name', 'Boquilla ancha'); }, get desc() { return _t('turret.cryo.upgrade.radius.1.desc', '+15% de radio.'); }, effects: { aoeRadiusMult: 1.15 } },
            { cost: 14, get name() { return _t('turret.cryo.upgrade.radius.2.name', 'Ventisca'); }, get desc() { return _t('turret.cryo.upgrade.radius.2.desc', 'El pulso cubre +40% de radio.'); }, effects: { aoeRadiusMult: 1.4 }, special: 'blizzard', visual: 'radiator_fins' },
            { cost: 24, get name() { return _t('turret.cryo.upgrade.radius.3.name', 'Difusor tropical'); }, get desc() { return _t('turret.cryo.upgrade.radius.3.desc', '+20% de radio.'); }, effects: { aoeRadiusMult: 1.2 } },
            { cost: 44, get name() { return _t('turret.cryo.upgrade.radius.4.name', 'Blanco total'); }, get desc() { return _t('turret.cryo.upgrade.radius.4.desc', 'Aura continua sin huecos y +20% de alcance.'); }, effects: { continuous: true, rangeMult: 1.2 }, special: 'whiteout', visual: 'blizzard_core' }
          ]
        },
        {
          id: 'lethal', get name() { return _t('turret.cryo.path.lethal.name', 'ESCARCHA LETAL'); }, color: 0x4a6b73,
          upgrades: [
            { cost: 7, get name() { return _t('turret.cryo.upgrade.lethal.1.name', 'Escarcha cortante'); }, get desc() { return _t('turret.cryo.upgrade.lethal.1.desc', 'El pulso inflige 3 de daño.'); }, effects: { damageFlat: 3 } },
            { cost: 14, get name() { return _t('turret.cryo.upgrade.lethal.2.name', 'Congelación profunda'); }, get desc() { return _t('turret.cryo.upgrade.lethal.2.desc', 'Los cangrejos ralentizados sufren 2 dps.'); }, effects: { frostbiteDps: 2 }, special: 'frostbite', visual: 'ice_spikes' },
            { cost: 24, get name() { return _t('turret.cryo.upgrade.lethal.3.name', 'Hielo negro'); }, get desc() { return _t('turret.cryo.upgrade.lethal.3.desc', '+3 de daño y +50% de daño por congelación.'); }, effects: { damageFlat: 3, frostbiteDpsMult: 1.5 } },
            { cost: 44, get name() { return _t('turret.cryo.upgrade.lethal.4.name', 'Fractura'); }, get desc() { return _t('turret.cryo.upgrade.lethal.4.desc', 'Los cangrejos ralentizados o congelados reciben +40% de daño.'); }, effects: { brittleMult: 1.4 }, special: 'shatter', visual: 'shatter_crystal' }
          ]
        }
      ]
    },

    barracks: {
      id: 'barracks',
      get name() { return _t('turret.barracks.name', 'CUARTEL'); },
      get role() { return _t('turret.barracks.role', 'TROPAS ALIADAS'); },
      icon: 'turret_barracks',
      spriteKey: 'turret_barracks',
      get description() { return _t('turret.barracks.desc', 'Foso de reconstrucción que despliega guardias para bloquear y hostigar.'); },
      cost: 20,
      color: 0x9cff9a,
      spriteSize: 1.7,
      base: {
        damage: 0, range: 10, fireRate: 1, hp: 300,
        spawnInterval: 6, allyCap: 2,
        allyHp: 120, allyDamage: 14, allySpeed: 4.2, allyAttackInterval: 0.9,
        allyRange: 10, collisionRadius: 0.7, height: 2.0, attackStopDistance: 2.0
      },
      paths: [
        {
          id: 'recruitment', get name() { return _t('turret.barracks.path.recruitment.name', 'RECLUTAMIENTO'); }, color: 0x9caf6b,
          upgrades: [
            { cost: 9, get name() { return _t('turret.barracks.upgrade.recruitment.1.name', 'Litera extra'); }, get desc() { return _t('turret.barracks.upgrade.recruitment.1.desc', '+1 guardia máximo.'); }, effects: { allyCap: 1 } },
            { cost: 18, get name() { return _t('turret.barracks.upgrade.recruitment.2.name', 'Escuadrón'); }, get desc() { return _t('turret.barracks.upgrade.recruitment.2.desc', 'Despliega 2 guardias por tanda.'); }, effects: { alliesPerSpawnSet: 2 }, special: 'squad', visual: 'extra_bunks' },
            { cost: 30, get name() { return _t('turret.barracks.upgrade.recruitment.3.name', 'Barracones ampliados'); }, get desc() { return _t('turret.barracks.upgrade.recruitment.3.desc', '+1 guardia máximo.'); }, effects: { allyCap: 1 } },
            { cost: 54, get name() { return _t('turret.barracks.upgrade.recruitment.4.name', 'Batallón'); }, get desc() { return _t('turret.barracks.upgrade.recruitment.4.desc', 'Máximo 6 guardias y 3 por tanda.'); }, effects: { allyCap: 2, alliesPerSpawn: 1 }, special: 'battalion', visual: 'battalion_bunks' }
          ]
        },
        {
          id: 'weaponry', get name() { return _t('turret.barracks.path.weaponry.name', 'ARMAMENTO'); }, color: 0xb89c46,
          upgrades: [
            { cost: 9, get name() { return _t('turret.barracks.upgrade.weaponry.1.name', 'Acero afilado'); }, get desc() { return _t('turret.barracks.upgrade.weaponry.1.desc', '+25% de daño y vida de los aliados.'); }, effects: { allyDamageMult: 1.25, allyHpMult: 1.25 } },
            { cost: 18, get name() { return _t('turret.barracks.upgrade.weaponry.2.name', 'Élite'); }, get desc() { return _t('turret.barracks.upgrade.weaponry.2.desc', 'Armadura del 25% y +20% de velocidad.'); }, effects: { allyArmor: 0.25, allySpeedMult: 1.2 }, special: 'elite', visual: 'armor_plates' },
            { cost: 30, get name() { return _t('turret.barracks.upgrade.weaponry.3.name', 'Forja de guerra'); }, get desc() { return _t('turret.barracks.upgrade.weaponry.3.desc', '+25% de daño y vida de los aliados.'); }, effects: { allyDamageMult: 1.25, allyHpMult: 1.25 } },
            { cost: 54, get name() { return _t('turret.barracks.upgrade.weaponry.4.name', 'Juggernaut'); }, get desc() { return _t('turret.barracks.upgrade.weaponry.4.desc', 'Ataque en área y +50% de vida.'); }, effects: { allyAoe: true, allyHpMult: 1.5 }, special: 'juggernaut', visual: 'heavy_armor' }
          ]
        },
        {
          id: 'fabrication', get name() { return _t('turret.barracks.path.fabrication.name', 'FABRICACIÓN'); }, color: 0x6f8f9c,
          upgrades: [
            { cost: 9, get name() { return _t('turret.barracks.upgrade.fabrication.1.name', 'Cadena de montaje'); }, get desc() { return _t('turret.barracks.upgrade.fabrication.1.desc', '-20% de intervalo de aparición.'); }, effects: { spawnIntervalMult: 0.8 } },
            { cost: 18, get name() { return _t('turret.barracks.upgrade.fabrication.2.name', 'Drones'); }, get desc() { return _t('turret.barracks.upgrade.fabrication.2.desc', 'Los aliados atacan a distancia.'); }, effects: { allyRanged: true }, special: 'drone', visual: 'antenna' },
            { cost: 30, get name() { return _t('turret.barracks.upgrade.fabrication.3.name', 'Línea automatizada'); }, get desc() { return _t('turret.barracks.upgrade.fabrication.3.desc', '-25% de intervalo de aparición.'); }, effects: { spawnIntervalMult: 0.75 } },
            { cost: 54, get name() { return _t('turret.barracks.upgrade.fabrication.4.name', 'Enjambre'); }, get desc() { return _t('turret.barracks.upgrade.fabrication.4.desc', '2 drones por tanda y +25% de alcance.'); }, effects: { alliesPerSpawn: 1, allyRangeMult: 1.25 }, special: 'swarm', visual: 'drone_rack' }
          ]
        }
      ]
    },

    support: {
      id: 'support',
      get name() { return _t('turret.support.name', 'TALLER'); },
      get role() { return _t('turret.support.role', 'AMPLIFICADOR'); },
      icon: 'turret_support',
      spriteKey: 'turret_support',
      get description() { return _t('turret.support.desc', 'Torre de enlace táctico. Potencia a las torretas cercanas aumentando su cadencia, daño y alcance.'); },
      cost: 14,
      color: 0x59d6c8,
      spriteSize: 1.5,
      base: {
        damage: 0, range: 14, fireRate: 1, hp: 300,
        buffFireRate: 0.15, buffDamage: 0.15, buffRange: 0.15,
        collisionRadius: 0.55, height: 1.65, attackStopDistance: 1.7
      },
      paths: [
        {
          id: 'overclock', get name() { return _t('turret.support.path.overclock.name', 'SOBRECARGA'); }, color: 0xb89c46,
          upgrades: [
            { cost: 8, get name() { return _t('turret.support.upgrade.overclock.1.name', 'Bobinas aceleradoras'); }, get desc() { return _t('turret.support.upgrade.overclock.1.desc', '+15% de cadencia a torretas cercanas.'); }, effects: { buffFireRate: 0.15 } },
            { cost: 16, get name() { return _t('turret.support.upgrade.overclock.2.name', 'Sincronizador armónico'); }, get desc() { return _t('turret.support.upgrade.overclock.2.desc', '+20% de cadencia adicional.'); }, effects: { buffFireRate: 0.20 }, special: 'harmonic_sync', visual: 'tesla_coils' },
            { cost: 28, get name() { return _t('turret.support.upgrade.overclock.3.name', 'Frecuencia de choque'); }, get desc() { return _t('turret.support.upgrade.overclock.3.desc', '+25% de cadencia adicional.'); }, effects: { buffFireRate: 0.25 } },
            { cost: 48, get name() { return _t('turret.support.upgrade.overclock.4.name', 'Tormenta cinética'); }, get desc() { return _t('turret.support.upgrade.overclock.4.desc', '+40% de cadencia y ráfagas de hipervelocidad periódicas.'); }, effects: { buffFireRate: 0.40, overclockBurst: 0.5 }, special: 'power_surge', visual: 'surge_core' }
          ]
        },
        {
          id: 'power', get name() { return _t('turret.support.path.power.name', 'POTENCIA'); }, color: 0xd95326,
          upgrades: [
            { cost: 8, get name() { return _t('turret.support.upgrade.power.1.name', 'Cargas de tungsteno'); }, get desc() { return _t('turret.support.upgrade.power.1.desc', '+15% de daño a torretas cercanas.'); }, effects: { buffDamage: 0.15 } },
            { cost: 16, get name() { return _t('turret.support.upgrade.power.2.name', 'Amplificador cinético'); }, get desc() { return _t('turret.support.upgrade.power.2.desc', '+25% de daño a torretas cercanas.'); }, effects: { buffDamage: 0.25 }, special: 'kinetic_amp', visual: 'tool_arms' },
            { cost: 28, get name() { return _t('turret.support.upgrade.power.3.name', 'Sobrealimentación'); }, get desc() { return _t('turret.support.upgrade.power.3.desc', '+30% de daño adicional.'); }, effects: { buffDamage: 0.30 } },
            { cost: 48, get name() { return _t('turret.support.upgrade.power.4.name', 'Fisión tropical'); }, get desc() { return _t('turret.support.upgrade.power.4.desc', '+45% de daño adicional a torretas en rango.'); }, effects: { buffDamage: 0.45 }, special: 'fission', visual: 'repair_beacon' }
          ]
        },
        {
          id: 'radar', get name() { return _t('turret.support.path.radar.name', 'RADAR Y ALCANCE'); }, color: 0x6f8f9c,
          upgrades: [
            { cost: 6, get name() { return _t('turret.support.upgrade.radar.1.name', 'Antena de rastreo'); }, get desc() { return _t('turret.support.upgrade.radar.1.desc', '+20% de alcance a torretas cercanas.'); }, effects: { buffRange: 0.20 } },
            { cost: 14, get name() { return _t('turret.support.upgrade.radar.2.name', 'Sensor multiespectral'); }, get desc() { return _t('turret.support.upgrade.radar.2.desc', '+25% de alcance y +15% de madera por bajas cercanas.'); }, effects: { buffRange: 0.25, buffScrap: 0.15 }, special: 'sensor_sweep', visual: 'dome' },
            { cost: 24, get name() { return _t('turret.support.upgrade.radar.3.name', 'Faro de puntería'); }, get desc() { return _t('turret.support.upgrade.radar.3.desc', '+30% de alcance adicional.'); }, effects: { buffRange: 0.30 } },
            { cost: 45, get name() { return _t('turret.support.upgrade.radar.4.name', 'Red de mando orbital'); }, get desc() { return _t('turret.support.upgrade.radar.4.desc', '+50% de alcance masivo y +25% de madera global.'); }, effects: { buffRange: 0.50, buffScrap: 0.25 }, special: 'orbital_link', visual: 'barrier_ring' }
          ]
        }
      ]
    },

    tesla: {
      id: 'tesla',
      get name() { return _t('turret.tesla.name', 'BOBINA DE TESLA'); },
      get role() { return _t('turret.tesla.role', 'CADENA ELÉCTRICA'); },
      icon: 'turret_tesla',
      spriteKey: 'turret_tesla',
      get description() { return _t('turret.tesla.desc', 'Descarga arcos entre varios cangrejos. Excelente contra grupos compactos.'); },
      cost: 28,
      color: 0x65e6e9,
      spriteSize: 1.6,
      base: {
        damage: 12, range: 8, fireRate: 1.6, hp: 240,
        chainCount: 2, chainRange: 4,
        collisionRadius: 0.55, height: 1.7, attackStopDistance: 1.7
      },
      paths: [
        {
          id: 'chain', get name() { return _t('turret.tesla.path.chain.name', 'CADENA'); }, color: 0x6fa8c8,
          upgrades: [
            { cost: 10, get name() { return _t('turret.tesla.upgrade.chain.1.name', 'Bobina doble'); }, get desc() { return _t('turret.tesla.upgrade.chain.1.desc', '+1 salto de cadena.'); }, effects: { chainCount: 3 } },
            { cost: 20, get name() { return _t('turret.tesla.upgrade.chain.2.name', 'Conductores largos'); }, get desc() { return _t('turret.tesla.upgrade.chain.2.desc', '+25% de radio de cadena y +1 salto.'); }, effects: { chainRangeMult: 1.25, chainCount: 4 }, visual: 'tesla_arcs' },
            { cost: 34, get name() { return _t('turret.tesla.upgrade.chain.3.name', 'Red de arcos'); }, get desc() { return _t('turret.tesla.upgrade.chain.3.desc', '+1 salto adicional.'); }, effects: { chainCount: 5 } },
            { cost: 58, get name() { return _t('turret.tesla.upgrade.chain.4.name', 'Tormenta de enlaces'); }, get desc() { return _t('turret.tesla.upgrade.chain.4.desc', '+35% de radio y +2 saltos.'); }, effects: { chainRangeMult: 1.35, chainCount: 7 }, visual: 'tesla_crown' }
          ]
        },
        {
          id: 'voltage', get name() { return _t('turret.tesla.path.voltage.name', 'VOLTAJE'); }, color: 0xd8b45a,
          upgrades: [
            { cost: 10, get name() { return _t('turret.tesla.upgrade.voltage.1.name', 'Despensa de cobre'); }, get desc() { return _t('turret.tesla.upgrade.voltage.1.desc', '+4 de daño.'); }, effects: { damageFlat: 4 } },
            { cost: 20, get name() { return _t('turret.tesla.upgrade.voltage.2.name', 'Sobretensión'); }, get desc() { return _t('turret.tesla.upgrade.voltage.2.desc', '+30% de daño.'); }, effects: { damageMult: 1.3 } },
            { cost: 34, get name() { return _t('turret.tesla.upgrade.voltage.3.name', 'Arco paralizante'); }, get desc() { return _t('turret.tesla.upgrade.voltage.3.desc', 'Los impactos aturden brevemente.'); }, effects: { freezeDuration: 0.25 }, visual: 'tesla_capacitor' },
            { cost: 58, get name() { return _t('turret.tesla.upgrade.voltage.4.name', 'Descarga tropical'); }, get desc() { return _t('turret.tesla.upgrade.voltage.4.desc', '+50% de daño y aturdimiento mayor.'); }, effects: { damageMult: 1.5, freezeDuration: 0.35 } }
          ]
        },
        {
          id: 'overcharge', get name() { return _t('turret.tesla.path.overcharge.name', 'SOBRECARGA'); }, color: 0xa8f044,
          upgrades: [
            { cost: 10, get name() { return _t('turret.tesla.upgrade.overcharge.1.name', 'Condensador rápido'); }, get desc() { return _t('turret.tesla.upgrade.overcharge.1.desc', '+25% de cadencia.'); }, effects: { fireRateMult: 1.25 } },
            { cost: 20, get name() { return _t('turret.tesla.upgrade.overcharge.2.name', 'Chispa múltiple'); }, get desc() { return _t('turret.tesla.upgrade.overcharge.2.desc', '+1 salto y +10% de alcance.'); }, effects: { chainCount: 3, rangeMult: 1.1 } },
            { cost: 34, get name() { return _t('turret.tesla.upgrade.overcharge.3.name', 'Descarga continua'); }, get desc() { return _t('turret.tesla.upgrade.overcharge.3.desc', '+30% de cadencia.'); }, effects: { fireRateMult: 1.3 } },
            { cost: 58, get name() { return _t('turret.tesla.upgrade.overcharge.4.name', 'Reactor de arco'); }, get desc() { return _t('turret.tesla.upgrade.overcharge.4.desc', '+40% de radio de cadena y +1 salto.'); }, effects: { chainRangeMult: 1.4, chainCount: 4 }, visual: 'tesla_overload' }
          ]
        }
      ]
    },

    incinerator: {
      id: 'incinerator',
      get name() { return _t('turret.incinerator.name', 'SOPLETE DE FOSO'); },
      get role() { return _t('turret.incinerator.role', 'ÁREA INCENDIARIA'); },
      icon: 'turret_incinerator',
      spriteKey: 'turret_incinerator',
      get description() { return _t('turret.incinerator.desc', 'Cono de fuego a corta distancia. La quemadura compensa su alcance limitado.'); },
      cost: 24,
      color: 0xff8a4c,
      spriteSize: 1.55,
      base: {
        damage: 6, range: 5.5, fireRate: 8, hp: 260,
        burnDps: 8, burnDuration: 2.5,
        collisionRadius: 0.55, height: 1.7, attackStopDistance: 1.7
      },
      paths: [
        {
          id: 'fuel', get name() { return _t('turret.incinerator.path.fuel.name', 'COMBUSTIBLE'); }, color: 0xa54a2a,
          upgrades: [
            { cost: 9, get name() { return _t('turret.incinerator.upgrade.fuel.1.name', 'Mezcla densa'); }, get desc() { return _t('turret.incinerator.upgrade.fuel.1.desc', '+4 DPS de quemadura.'); }, effects: { burnDps: 4 } },
            { cost: 18, get name() { return _t('turret.incinerator.upgrade.fuel.2.name', 'Válvula abierta'); }, get desc() { return _t('turret.incinerator.upgrade.fuel.2.desc', '+50% de DPS de quemadura.'); }, effects: { burnDpsMult: 1.5 }, visual: 'fuel_tank' },
            { cost: 30, get name() { return _t('turret.incinerator.upgrade.fuel.3.name', 'Combustible gelatinoso'); }, get desc() { return _t('turret.incinerator.upgrade.fuel.3.desc', '+1s de quemadura.'); }, effects: { burnDuration: 1 } },
            { cost: 54, get name() { return _t('turret.incinerator.upgrade.fuel.4.name', 'Fuego de foso'); }, get desc() { return _t('turret.incinerator.upgrade.fuel.4.desc', '+60% de DPS y +2s de quemadura.'); }, effects: { burnDpsMult: 1.6, burnDuration: 2 } }
          ]
        },
        {
          id: 'pressure', get name() { return _t('turret.incinerator.path.pressure.name', 'PRESIÓN'); }, color: 0xd8b45a,
          upgrades: [
            { cost: 9, get name() { return _t('turret.incinerator.upgrade.pressure.1.name', 'Boquilla amplia'); }, get desc() { return _t('turret.incinerator.upgrade.pressure.1.desc', '+15% de alcance.'); }, effects: { rangeMult: 1.15 } },
            { cost: 18, get name() { return _t('turret.incinerator.upgrade.pressure.2.name', 'Bomba auxiliar'); }, get desc() { return _t('turret.incinerator.upgrade.pressure.2.desc', '+25% de cadencia.'); }, effects: { fireRateMult: 1.25 }, visual: 'pressure_valve' },
            { cost: 30, get name() { return _t('turret.incinerator.upgrade.pressure.3.name', 'Turbina de presión'); }, get desc() { return _t('turret.incinerator.upgrade.pressure.3.desc', '+20% de alcance.'); }, effects: { rangeMult: 1.2 } },
            { cost: 54, get name() { return _t('turret.incinerator.upgrade.pressure.4.name', 'Sobrepresión'); }, get desc() { return _t('turret.incinerator.upgrade.pressure.4.desc', '+30% de cadencia.'); }, effects: { fireRateMult: 1.3 } }
          ]
        },
        {
          id: 'napalm', get name() { return _t('turret.incinerator.path.napalm.name', 'NAPALM'); }, color: 0x55e038,
          upgrades: [
            { cost: 9, get name() { return _t('turret.incinerator.upgrade.napalm.1.name', 'Aditivo incendiario'); }, get desc() { return _t('turret.incinerator.upgrade.napalm.1.desc', 'Deja una pequeña zona de napalm.'); }, effects: { napalmDps: 5, napalmDuration: 3, napalmRadius: 2.0 } },
            { cost: 18, get name() { return _t('turret.incinerator.upgrade.napalm.2.name', 'Depósito de gel'); }, get desc() { return _t('turret.incinerator.upgrade.napalm.2.desc', '+40% de DPS de napalm.'); }, effects: { napalmDpsMult: 1.4 }, visual: 'napalm_tank' },
            { cost: 30, get name() { return _t('turret.incinerator.upgrade.napalm.3.name', 'Espuma adherente'); }, get desc() { return _t('turret.incinerator.upgrade.napalm.3.desc', '+50% de duración del napalm.'); }, effects: { napalmDurationMult: 1.5 } },
            { cost: 54, get name() { return _t('turret.incinerator.upgrade.napalm.4.name', 'Incendio de foso'); }, get desc() { return _t('turret.incinerator.upgrade.napalm.4.desc', '+30% de radio e ignición al impactar.'); }, effects: { napalmRadiusMult: 1.3, ignitionDamage: 12 } }
          ]
        }
      ]
    },

    railgun: {
      id: 'railgun',
      get name() { return _t('turret.railgun.name', 'CAÑÓN DE RIEL'); },
      get role() { return _t('turret.railgun.role', 'FRANCOTIRADOR'); },
      icon: 'turret_railgun',
      spriteKey: 'turret_railgun',
      get description() { return _t('turret.railgun.desc', 'Disparo lento y devastador contra un único objetivo prioritario. Sin área.'); },
      cost: 46,
      color: 0xffe08a,
      spriteSize: 1.7,
      base: {
        damage: 110, range: 24, fireRate: 0.45, hp: 220,
        targetMode: 'strongest',
        collisionRadius: 0.55, height: 1.8, attackStopDistance: 1.8
      },
      paths: [
        {
          id: 'caliber', get name() { return _t('turret.railgun.path.caliber.name', 'CALIBRE'); }, color: 0xc8c2ac,
          upgrades: [
            { cost: 12, get name() { return _t('turret.railgun.upgrade.caliber.1.name', 'Proyectil pesado'); }, get desc() { return _t('turret.railgun.upgrade.caliber.1.desc', '+20% de daño.'); }, effects: { damageMult: 1.2 } },
            { cost: 24, get name() { return _t('turret.railgun.upgrade.caliber.2.name', 'Despensa de tungsteno'); }, get desc() { return _t('turret.railgun.upgrade.caliber.2.desc', '+25 de daño.'); }, effects: { damageFlat: 25 }, visual: 'long_rail' },
            { cost: 40, get name() { return _t('turret.railgun.upgrade.caliber.3.name', 'Perforador cinético'); }, get desc() { return _t('turret.railgun.upgrade.caliber.3.desc', '+35% de daño.'); }, effects: { damageMult: 1.35 } },
            { cost: 64, get name() { return _t('turret.railgun.upgrade.caliber.4.name', 'Ejecutor de placas'); }, get desc() { return _t('turret.railgun.upgrade.caliber.4.desc', '+50% de daño contra el objetivo.'); }, effects: { damageMult: 1.5 } }
          ]
        },
        {
          id: 'coils', get name() { return _t('turret.railgun.path.coils.name', 'BOBINAS'); }, color: 0x6fa8c8,
          upgrades: [
            { cost: 12, get name() { return _t('turret.railgun.upgrade.coils.1.name', 'Carga rápida'); }, get desc() { return _t('turret.railgun.upgrade.coils.1.desc', '+25% de cadencia.'); }, effects: { fireRateMult: 1.25 } },
            { cost: 24, get name() { return _t('turret.railgun.upgrade.coils.2.name', 'Batería de bobinas'); }, get desc() { return _t('turret.railgun.upgrade.coils.2.desc', '+15% de alcance y +15% de cadencia.'); }, effects: { rangeMult: 1.15, fireRateMult: 1.15 }, visual: 'coil_bank' },
            { cost: 40, get name() { return _t('turret.railgun.upgrade.coils.3.name', 'Capacitor de riel'); }, get desc() { return _t('turret.railgun.upgrade.coils.3.desc', '+30% de cadencia.'); }, effects: { fireRateMult: 1.3 } },
            { cost: 64, get name() { return _t('turret.railgun.upgrade.coils.4.name', 'Lanzamiento hipersónico'); }, get desc() { return _t('turret.railgun.upgrade.coils.4.desc', '+20% de alcance adicional.'); }, effects: { rangeMult: 1.2 } }
          ]
        },
        {
          id: 'scope', get name() { return _t('turret.railgun.path.scope.name', 'MIRA'); }, color: 0xe6d7a5,
          upgrades: [
            { cost: 12, get name() { return _t('turret.railgun.upgrade.scope.1.name', 'Óptica de precisión'); }, get desc() { return _t('turret.railgun.upgrade.scope.1.desc', '+20% de alcance.'); }, effects: { rangeMult: 1.2 } },
            { cost: 24, get name() { return _t('turret.railgun.upgrade.scope.2.name', 'Marca de prioridad'); }, get desc() { return _t('turret.railgun.upgrade.scope.2.desc', '+15% de daño y +10% de alcance.'); }, effects: { damageMult: 1.15, rangeMult: 1.1 }, visual: 'scope' },
            { cost: 40, get name() { return _t('turret.railgun.upgrade.scope.3.name', 'Predictor balístico'); }, get desc() { return _t('turret.railgun.upgrade.scope.3.desc', '+20% de daño.'); }, effects: { damageMult: 1.2 } },
            { cost: 64, get name() { return _t('turret.railgun.upgrade.scope.4.name', 'Tiro de ejecución'); }, get desc() { return _t('turret.railgun.upgrade.scope.4.desc', '+40% de daño al objetivo prioritario.'); }, effects: { damageMult: 1.4 } }
          ]
        }
      ]
    },

    collector: {
      id: 'collector',
      get name() { return _t('turret.collector.name', 'RECOLECTOR DE MADERA'); },
      get role() { return _t('turret.collector.role', 'ECONOMÍA'); },
      icon: 'turret_collector',
      spriteKey: 'turret_collector',
      get description() { return _t('turret.collector.desc', 'No ataca. Genera madera al completar oleadas y mediante su ciclo de reciclaje.'); },
      cost: 32,
      color: 0xc9f26f,
      spriteSize: 1.5,
      base: {
        damage: 0, range: 3, fireRate: 1, hp: 300,
        scrapPerWave: 6, scrapInterval: 10, scrapAmount: 2,
        collisionRadius: 0.55, height: 1.7, attackStopDistance: 1.7
      },
      paths: [
        {
          id: 'yield', get name() { return _t('turret.collector.path.yield.name', 'RENDIMIENTO'); }, color: 0xd8b45a,
          upgrades: [
            { cost: 10, get name() { return _t('turret.collector.upgrade.yield.1.name', 'Contenedor extra'); }, get desc() { return _t('turret.collector.upgrade.yield.1.desc', '+3 de madera por oleada.'); }, effects: { scrapPerWave: 3 } },
            { cost: 20, get name() { return _t('turret.collector.upgrade.yield.2.name', 'Clasificador'); }, get desc() { return _t('turret.collector.upgrade.yield.2.desc', '+4 de madera por oleada.'); }, effects: { scrapPerWave: 4 }, visual: 'scrap_bin' },
            { cost: 34, get name() { return _t('turret.collector.upgrade.yield.3.name', 'Línea de fundición'); }, get desc() { return _t('turret.collector.upgrade.yield.3.desc', '+5 de madera por oleada.'); }, effects: { scrapPerWave: 5 } },
            { cost: 58, get name() { return _t('turret.collector.upgrade.yield.4.name', 'Fundición tropical'); }, get desc() { return _t('turret.collector.upgrade.yield.4.desc', '+8 de madera por oleada.'); }, effects: { scrapPerWave: 8 } }
          ]
        },
        {
          id: 'logistics', get name() { return _t('turret.collector.path.logistics.name', 'LOGÍSTICA'); }, color: 0x6f8f9c,
          upgrades: [
            { cost: 10, get name() { return _t('turret.collector.upgrade.logistics.1.name', 'Cinta rápida'); }, get desc() { return _t('turret.collector.upgrade.logistics.1.desc', '+1 de madera por ciclo.'); }, effects: { scrapAmount: 1 } },
            { cost: 20, get name() { return _t('turret.collector.upgrade.logistics.2.name', 'Turno doble'); }, get desc() { return _t('turret.collector.upgrade.logistics.2.desc', 'Ciclos más frecuentes.'); }, effects: { scrapInterval: 8 }, visual: 'crane' },
            { cost: 34, get name() { return _t('turret.collector.upgrade.logistics.3.name', 'Cadena automatizada'); }, get desc() { return _t('turret.collector.upgrade.logistics.3.desc', '+2 de madera por ciclo.'); }, effects: { scrapAmount: 2 } },
            { cost: 58, get name() { return _t('turret.collector.upgrade.logistics.4.name', 'Reciclaje continuo'); }, get desc() { return _t('turret.collector.upgrade.logistics.4.desc', 'Ciclos aún más frecuentes.'); }, effects: { scrapInterval: 6 } }
          ]
        },
        {
          id: 'reserve', get name() { return _t('turret.collector.path.reserve.name', 'RESERVA'); }, color: 0xa54a2a,
          upgrades: [
            { cost: 10, get name() { return _t('turret.collector.upgrade.reserve.1.name', 'Reserva de emergencia'); }, get desc() { return _t('turret.collector.upgrade.reserve.1.desc', '+2 de madera por oleada.'); }, effects: { scrapPerWave: 2 } },
            { cost: 20, get name() { return _t('turret.collector.upgrade.reserve.2.name', 'Baliza de suministros'); }, get desc() { return _t('turret.collector.upgrade.reserve.2.desc', '+1 de madera por ciclo y +9s de intervalo.'); }, effects: { scrapAmount: 1, scrapInterval: 9 }, visual: 'beacon' },
            { cost: 34, get name() { return _t('turret.collector.upgrade.reserve.3.name', 'Almacén blindado'); }, get desc() { return _t('turret.collector.upgrade.reserve.3.desc', '+4 de madera por oleada.'); }, effects: { scrapPerWave: 4 } },
            { cost: 58, get name() { return _t('turret.collector.upgrade.reserve.4.name', 'Red de salvamento'); }, get desc() { return _t('turret.collector.upgrade.reserve.4.desc', '+2 de madera por ciclo y +7s de intervalo.'); }, effects: { scrapAmount: 2, scrapInterval: 7 } }
          ]
        }
      ]
    },

    press: {
      id: 'press',
      get name() { return _t('turret.press.name', 'PRENSA DE VÍA'); },
      get role() { return _t('turret.press.role', 'CONTROL A CORTA DISTANCIA'); },
      icon: 'turret_press',
      spriteKey: 'turret_press',
      get description() { return _t('turret.press.desc', 'Golpea el suelo a muy corta distancia con una prensa hidráulica. Empuja y aturde.'); },
      cost: 20,
      color: 0xffd166,
      spriteSize: 1.45,
      base: {
        damage: 55, range: 2.2, fireRate: 0.45, hp: 280,
        aoeRadius: 2.2, freezeDuration: 0.6,
        collisionRadius: 0.6, height: 1.55, attackStopDistance: 1.8
      },
      paths: [
        {
          id: 'pressure', get name() { return _t('turret.press.path.pressure.name', 'PRESIÓN'); }, color: 0xd8b45a,
          upgrades: [
            { cost: 8, get name() { return _t('turret.press.upgrade.pressure.1.name', 'Émbolo pesado'); }, get desc() { return _t('turret.press.upgrade.pressure.1.desc', '+25% de daño.'); }, effects: { damageMult: 1.25 } },
            { cost: 16, get name() { return _t('turret.press.upgrade.pressure.2.name', 'Placa de impacto'); }, get desc() { return _t('turret.press.upgrade.pressure.2.desc', '+15% de radio.'); }, effects: { aoeRadiusMult: 1.15 }, visual: 'heavy_ram' },
            { cost: 28, get name() { return _t('turret.press.upgrade.pressure.3.name', 'Pistón sobrealimentado'); }, get desc() { return _t('turret.press.upgrade.pressure.3.desc', '+30% de daño.'); }, effects: { damageMult: 1.3 } },
            { cost: 50, get name() { return _t('turret.press.upgrade.pressure.4.name', 'Prensa de demolición'); }, get desc() { return _t('turret.press.upgrade.pressure.4.desc', '+20% de radio y +25% de daño.'); }, effects: { aoeRadiusMult: 1.2, damageMult: 1.25 } }
          ]
        },
        {
          id: 'cadence', get name() { return _t('turret.press.path.cadence.name', 'CADENCIA'); }, color: 0x877a5c,
          upgrades: [
            { cost: 8, get name() { return _t('turret.press.upgrade.cadence.1.name', 'Válvula rápida'); }, get desc() { return _t('turret.press.upgrade.cadence.1.desc', '+25% de cadencia.'); }, effects: { fireRateMult: 1.25 } },
            { cost: 16, get name() { return _t('turret.press.upgrade.cadence.2.name', 'Volante de inercia'); }, get desc() { return _t('turret.press.upgrade.cadence.2.desc', '+30% de cadencia.'); }, effects: { fireRateMult: 1.3 }, visual: 'side_pistons' },
            { cost: 28, get name() { return _t('turret.press.upgrade.cadence.3.name', 'Biela ligera'); }, get desc() { return _t('turret.press.upgrade.cadence.3.desc', '+15% de alcance.'); }, effects: { rangeMult: 1.15 } },
            { cost: 50, get name() { return _t('turret.press.upgrade.cadence.4.name', 'Prensa automática'); }, get desc() { return _t('turret.press.upgrade.cadence.4.desc', '+40% de cadencia.'); }, effects: { fireRateMult: 1.4 } }
          ]
        },
        {
          id: 'weight', get name() { return _t('turret.press.path.weight.name', 'PESO'); }, color: 0xa52020,
          upgrades: [
            { cost: 8, get name() { return _t('turret.press.upgrade.weight.1.name', 'Lastre de hierro'); }, get desc() { return _t('turret.press.upgrade.weight.1.desc', 'Aturdimiento de 0.9s.'); }, effects: { freezeDuration: 0.9 } },
            { cost: 16, get name() { return _t('turret.press.upgrade.weight.2.name', 'Contrapeso'); }, get desc() { return _t('turret.press.upgrade.weight.2.desc', '+12 de daño.'); }, effects: { damageFlat: 12 }, visual: 'hazard_plate' },
            { cost: 28, get name() { return _t('turret.press.upgrade.weight.3.name', 'Yunque de senda'); }, get desc() { return _t('turret.press.upgrade.weight.3.desc', 'Aturdimiento de 1.2s.'); }, effects: { freezeDuration: 1.2 } },
            { cost: 50, get name() { return _t('turret.press.upgrade.weight.4.name', 'Impacto sísmico'); }, get desc() { return _t('turret.press.upgrade.weight.4.desc', '+40% de daño y aturdimiento de 1.5s.'); }, effects: { damageMult: 1.4, freezeDuration: 1.5 } }
          ]
        }
      ]
    },

    ejector: {
      id: 'ejector',
      get name() { return _t('turret.ejector.name', 'EYECCIÓN HIDRÁULICA'); },
      get role() { return _t('turret.ejector.role', 'DESPLAZAMIENTO'); },
      icon: 'turret_ejector',
      spriteKey: 'turret_ejector',
      get description() { return _t('turret.ejector.desc', 'Válvula de presión que empuja a los cangrejos hacia atrás por la ruta. Daño bajo.'); },
      cost: 18,
      color: 0x8bffdd,
      spriteSize: 1.4,
      base: {
        damage: 10, range: 2.5, fireRate: 1.3, hp: 260,
        aoeRadius: 2.0, pushDistance: 3.5, freezeDuration: 0.15,
        collisionRadius: 0.55, height: 1.5, attackStopDistance: 1.8
      },
      paths: [
        {
          id: 'pressure', get name() { return _t('turret.ejector.path.pressure.name', 'PRESIÓN'); }, color: 0x6f8f9c,
          upgrades: [
            { cost: 7, get name() { return _t('turret.ejector.upgrade.pressure.1.name', 'Acumulador'); }, get desc() { return _t('turret.ejector.upgrade.pressure.1.desc', '+1m de empuje.'); }, effects: { pushDistance: 1 } },
            { cost: 14, get name() { return _t('turret.ejector.upgrade.pressure.2.name', 'Válvula de golpe'); }, get desc() { return _t('turret.ejector.upgrade.pressure.2.desc', '+1.5m de empuje.'); }, effects: { pushDistance: 1.5 }, visual: 'pressure_tank' },
            { cost: 24, get name() { return _t('turret.ejector.upgrade.pressure.3.name', 'Pistón neumático'); }, get desc() { return _t('turret.ejector.upgrade.pressure.3.desc', '+2m de empuje.'); }, effects: { pushDistance: 2 } },
            { cost: 44, get name() { return _t('turret.ejector.upgrade.pressure.4.name', 'Eyección masiva'); }, get desc() { return _t('turret.ejector.upgrade.pressure.4.desc', '+2.5m de empuje.'); }, effects: { pushDistance: 2.5 }, visual: 'wide_nozzle' }
          ]
        },
        {
          id: 'valve', get name() { return _t('turret.ejector.path.valve.name', 'VÁLVULA'); }, color: 0xd8b45a,
          upgrades: [
            { cost: 7, get name() { return _t('turret.ejector.upgrade.valve.1.name', 'Servoválvula'); }, get desc() { return _t('turret.ejector.upgrade.valve.1.desc', '+25% de cadencia.'); }, effects: { fireRateMult: 1.25 } },
            { cost: 14, get name() { return _t('turret.ejector.upgrade.valve.2.name', 'Boquilla amplia'); }, get desc() { return _t('turret.ejector.upgrade.valve.2.desc', '+15% de alcance.'); }, effects: { rangeMult: 1.15 } },
            { cost: 24, get name() { return _t('turret.ejector.upgrade.valve.3.name', 'Reacción rápida'); }, get desc() { return _t('turret.ejector.upgrade.valve.3.desc', '+30% de cadencia.'); }, effects: { fireRateMult: 1.3 }, visual: 'reflux_pipes' },
            { cost: 44, get name() { return _t('turret.ejector.upgrade.valve.4.name', 'Turbina de eyección'); }, get desc() { return _t('turret.ejector.upgrade.valve.4.desc', '+20% de alcance.'); }, effects: { rangeMult: 1.2 } }
          ]
        },
        {
          id: 'reflux', get name() { return _t('turret.ejector.path.reflux.name', 'REFLUJO'); }, color: 0xa54a2a,
          upgrades: [
            { cost: 7, get name() { return _t('turret.ejector.upgrade.reflux.1.name', 'Golpe de ariete'); }, get desc() { return _t('turret.ejector.upgrade.reflux.1.desc', '+30% de daño.'); }, effects: { damageMult: 1.3 } },
            { cost: 14, get name() { return _t('turret.ejector.upgrade.reflux.2.name', 'Impacto aturdidor'); }, get desc() { return _t('turret.ejector.upgrade.reflux.2.desc', '+0.2s de aturdimiento.'); }, effects: { freezeDuration: 0.2 } },
            { cost: 24, get name() { return _t('turret.ejector.upgrade.reflux.3.name', 'Retorno violento'); }, get desc() { return _t('turret.ejector.upgrade.reflux.3.desc', '+40% de daño.'); }, effects: { damageMult: 1.4 } },
            { cost: 44, get name() { return _t('turret.ejector.upgrade.reflux.4.name', 'Sobrecarga de retorno'); }, get desc() { return _t('turret.ejector.upgrade.reflux.4.desc', '+0.3s de aturdimiento y +1m de empuje.'); }, effects: { freezeDuration: 0.3, pushDistance: 1 } }
          ]
        }
      ]
    }
  };
