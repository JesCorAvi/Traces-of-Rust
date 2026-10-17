export const CONFIG = {
  SAVE_KEY: 'echoes_rust_buckshot_save_v1',
  PIXEL_SCALE: 0.42, // Renderizado interno low-res estilo PS1 / Buckshot Roulette
  FRAME_SIZE: 64,    // 64x64 px por frame (256x256 por spritesheet 4x4)
  SKILLS: {
    slash:   { name: 'Sierra de Amputación', icon: '🪚', max: 5, desc: 'Tajo frontal oxidado que desgarra y empuja.' },
    shotgun: { name: 'Escopeta Calibre 12',  icon: '🔫', max: 5, desc: 'Postas a quemarropa con fogonazo y retroceso.' },
    orbital: { name: 'Ganchos de Carnicero', icon: '🪝', max: 5, desc: 'Cadenas oxidadas orbitan y cortan la carne.' },
    spike:   { name: 'Trampa de Alcantarilla',icon: '⚙️', max: 5, desc: 'Hierros retorcidos brotan bajo los monstruos.' },
    bolt:    { name: 'Desfibrilador Roto',   icon: '⚡', max: 5, desc: 'Descarga de alto voltaje que salta entre cuerpos.' },
    vital:   { name: 'Bolsa de Plasma',      icon: '🩸', max: 5, desc: '+35 Pulso Máximo y transfusión inmediata.' }
  },
  SHOP: [
    { id: 'dmg', name: 'Pólvora Prensada (+20% Daño)',      cost: 5 },
    { id: 'hp',  name: 'Costuras de Alambre (+25 Pulso)',   cost: 4 },
    { id: 'spd', name: 'Adrenalina Sintética (+Velocidad)', cost: 5 },
    { id: 'mag', name: 'Tenazas de Extracción (+Alcance)',  cost: 4 }
  ]
};