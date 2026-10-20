// Generador procedural de retratos faciales pixel-art (32x32) para los 8 operadores.
// Exports: getCharacterPortraitURL, drawCharacterPortrait.

import { CHARACTER_THEMES } from './body.js';

const portraitCache = new Map();

export function getCharacterPortraitURL(charId = 'otto') {
  if (portraitCache.has(charId)) {
    return portraitCache.get(charId);
  }

  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');

  drawCharacterPortrait(ctx, charId);

  const url = canvas.toDataURL('image/png');
  portraitCache.set(charId, url);
  return url;
}

export function drawCharacterPortrait(ctx, charId = 'otto') {
  const theme = CHARACTER_THEMES[charId] || CHARACTER_THEMES.otto;

  const px = (x, y, w, h, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };

  // Fondo oscuro del retrato
  ctx.fillStyle = '#060906';
  ctx.fillRect(0, 0, 32, 32);

  // Marco biselado sutil
  px(0, 0, 32, 1, '#182418');
  px(0, 0, 1, 32, '#182418');
  px(31, 0, 1, 32, '#0c120c');
  px(0, 31, 32, 1, '#0c120c');

  // Hombros y abrigo
  px(4, 25, 24, 7, theme.coatDark);
  px(6, 24, 20, 3, theme.coatBase);
  px(8, 23, 16, 2, theme.coatHi);
  px(13, 22, 6, 4, theme.belt);
  px(14, 23, 4, 2, theme.buckle);

  // Cuello
  px(12, 19, 8, 4, theme.maskBase);
  px(14, 19, 4, 3, theme.coatTrim);

  // Base de la cabeza / Máscara
  px(9, 9, 14, 11, theme.maskBase);
  px(10, 8, 12, 2, theme.coatTrim);
  px(10, 10, 12, 9, theme.maskHi);

  // Ojos base con el brillo del operador
  px(11, 13, 3, 2, theme.maskBase);
  px(18, 13, 3, 2, theme.maskBase);
  px(12, 13, 2, 2, theme.eyeGlow);
  px(18, 13, 2, 2, theme.eyeGlow);

  // Nariz / Filtro inferior
  px(14, 16, 4, 3, theme.maskBase);
  px(15, 17, 2, 2, theme.coatTrim);

  // -------------------------------------------------------------------------
  // RASGOS Y ACCESORIOS DISTINTIVOS EXCLUSIVOS POR OPERADOR
  // -------------------------------------------------------------------------
  if (charId === 'otto') {
    // Dr. V. Richter: Espejo frontal de médico en la frente
    px(13, 6, 6, 5, '#877a5c');
    px(14, 7, 4, 3, '#c8c2ac');
    px(15, 7, 2, 2, '#ffffff'); // Glint blanco
    px(10, 8, 12, 1, '#4a3b2c'); // Cinta de cuero alrededor de la cabeza
    // Mancha de sangre quirúrgica en el cuello
    px(19, 23, 3, 3, '#8a1414');
  } else if (charId === 'mack') {
    // Sargento K. Briggs: Casco blindado de infantería con puro
    px(8, 5, 16, 5, '#3b4a2c');
    px(7, 8, 18, 3, '#54683e');
    px(7, 10, 18, 1, '#232d1a'); // Sombra del visor sobre los ojos
    // Puro encendido en la boca con brasa naranja
    px(19, 18, 4, 2, '#4a2518');
    px(23, 18, 2, 2, '#ff5500');
    px(24, 17, 1, 1, '#e6d7a5'); // Hilillo de humo
  } else if (charId === 'pepe') {
    // Sanitizador T. Keller: Capucha ignífuga amarilla y gafas de soldador cian
    px(8, 6, 16, 5, '#c87a18');
    px(7, 9, 3, 11, '#c87a18');
    px(22, 9, 3, 11, '#c87a18');
    // Gafas de soldador con montura de latón
    px(10, 11, 5, 5, '#7a4008');
    px(17, 11, 5, 5, '#7a4008');
    px(11, 12, 3, 3, '#3fe0f5'); // Lente cian izquierda
    px(18, 12, 3, 3, '#3fe0f5'); // Lente cian derecha
    px(15, 13, 2, 1, '#7a4008'); // Puente de las gafas
    // Respirador de gas
    px(13, 16, 6, 4, '#24180c');
  } else if (charId === 'morbo') {
    // Custodia M. Vane: Hábito de monja blanco/negro con corona de espinas
    px(6, 6, 20, 4, '#181022');
    px(6, 9, 4, 14, '#e6ddc8'); // Caída del velo blanco izquierda
    px(22, 9, 4, 14, '#e6ddc8'); // Caída del velo blanco derecha
    px(10, 7, 12, 2, '#e6ddc8'); // Frente del velo
    // Rostro pálido en la sombra
    px(10, 9, 12, 9, '#100818');
    px(12, 12, 2, 2, '#55de3e'); // Ojo verde radiactivo
    px(18, 12, 2, 2, '#55de3e');
    // Espinas radiactivas
    px(11, 5, 2, 2, '#55de3e');
    px(19, 5, 2, 2, '#55de3e');
  } else if (charId === 'bob') {
    // Zapador J. Novak: Casco amarillo de cantera con faro frontal
    px(7, 4, 18, 6, '#f0c954');
    px(6, 9, 20, 2, '#ffe078'); // Reborde del casco
    // Faro minero frontal
    px(13, 5, 6, 4, '#080c08');
    px(14, 6, 4, 2, '#ffffff'); // Luz blanca brillante
    // Barba y rostro tiznado
    px(11, 15, 10, 4, '#5c3a1e');
  } else if (charId === 'krauss') {
    // Capitán H. Krauss: Gorra naval con insignia dorada y visor biónico rojo
    px(7, 4, 18, 5, '#151a1e');
    px(14, 5, 4, 3, '#f0c954'); // Ancla dorada
    px(6, 8, 20, 2, '#080c08'); // Visera negra charol
    // Ojo derecho normal
    px(11, 13, 3, 2, '#080c08');
    px(12, 13, 2, 2, '#c8c2ac');
    // Ojo izquierdo biónico con lente roja y mira telescópica
    px(17, 11, 5, 5, '#7a6832');
    px(18, 12, 3, 3, '#ff2222');
    px(19, 13, 1, 1, '#ffffff'); // Brillo óptico
    // Bigote naval espeso
    px(12, 16, 8, 2, '#877a5c');
  } else if (charId === 'axel') {
    // Capataz A. Hogg: Máscara de cuero de verdugo con costuras y ojos rojos
    px(8, 6, 16, 13, '#352018');
    px(10, 7, 12, 2, '#4a3024');
    // Placa de hierro sobre la nariz/boca
    px(13, 12, 6, 8, '#1a1412');
    px(14, 15, 4, 4, '#080808'); // Ranuras de respiración
    // Ojos de cerdo al rojo vivo
    px(11, 11, 3, 2, '#ff3b3b');
    px(18, 11, 3, 2, '#ff3b3b');
    // Remaches de hierro
    px(9, 8, 1, 1, '#877a5c');
    px(22, 8, 1, 1, '#877a5c');
    px(15, 23, 2, 2, '#c8c2ac'); // Gancho al cuello
  } else if (charId === 'tesla') {
    // Ingeniero E. Vance: Pelo chamuscado erizado y chispas eléctricas
    // Pelo de punta
    px(7, 3, 3, 5, '#121216');
    px(12, 2, 4, 6, '#121216');
    px(18, 2, 3, 6, '#121216');
    px(23, 3, 3, 5, '#121216');
    // Bobinas aislantes de porcelana a los lados de la cabeza
    px(6, 11, 3, 4, '#e6f0ff');
    px(23, 11, 3, 4, '#e6f0ff');
    // Chispas eléctricas cian
    px(5, 9, 2, 2, '#3fe0f5');
    px(25, 9, 2, 2, '#3fe0f5');
    px(15, 1, 2, 2, '#3fe0f5');
    // Ojos eléctricos
    px(12, 13, 2, 2, '#3fe0f5');
    px(18, 13, 2, 2, '#3fe0f5');
  }
}
