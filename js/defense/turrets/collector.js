// Economía del Recolector de Chatarra. Solo Host/offline acredita scrap.
// Exports: updateCollector, awardCollectorWave.

function canGenerate(mode) {
  return !!mode && (!mode.isNetworked || mode.isNetworkHost);
}

export function updateCollector(turret, dt) {
  const mode = turret.system?.mode;
  if (!canGenerate(mode)) return;

  const interval = Math.max(2, turret.stats.scrapInterval || 8);
  if (turret.collectorTimer == null) turret.collectorTimer = interval;
  turret.collectorTimer -= dt;
  if (turret.collectorTimer > 0) return;

  turret.collectorTimer = interval;
  const amount = Math.max(0, Math.round(turret.stats.scrapAmount || 0));
  if (amount > 0) {
    mode.addScrap(amount);
    turret.firingFlash = 0.16;
  }
}

export function awardCollectorWave(turret) {
  const mode = turret.system?.mode;
  if (!canGenerate(mode)) return 0;
  const amount = Math.max(0, Math.round(turret.stats.scrapPerWave || 0));
  if (amount > 0) {
    mode.addScrap(amount);
    turret.firingFlash = 0.24;
  }
  return amount;
}
