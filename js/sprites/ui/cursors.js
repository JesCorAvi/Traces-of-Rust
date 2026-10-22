// Cursores procedurales de alta definición pixel-art inspirados en Buckshot Roulette.
// Estados: default (flecha táctica), pointer (hover interactivo), click (presionado),
// crosshair (retícula militar de apuntado), disabled (bloqueado/no permitido),
// grab (garra abierta) y grabbing (garra cerrada).
// Exports: drawCursors.

export function drawCursors(ctx, UI) {
  const p = (x, y, w = 1, h = 1, col = '#050605') => {
    ctx.fillStyle = col;
    ctx.fillRect(x, y, w, h);
  };

  // === 1. DEFAULT: Flecha táctica de acero oxidado con filo marfil y remache rojo ===
  if (UI.CURSORS.default) {
    ctx.save();
    ctx.translate(UI.CURSORS.default.x, UI.CURSORS.default.y);

    // Contorno exterior negro (#050605) para máximo contraste
    p(1, 0, 2, 1);
    p(0, 1, 1, 12);
    p(1, 13, 2, 1);
    p(3, 11, 2, 1);
    p(5, 10, 1, 2);
    p(6, 12, 1, 3);
    p(7, 15, 2, 1);
    p(9, 13, 1, 2);
    p(8, 11, 1, 2);
    p(7, 9, 3, 1);
    p(10, 8, 2, 1);
    p(12, 7, 1, 2);
    p(11, 6, 2, 1);
    p(9, 5, 2, 1);
    p(7, 4, 2, 1);
    p(5, 3, 2, 1);
    p(3, 2, 2, 1);

    // Filo cortante brillante (#e6d7a5)
    p(1, 1, 1, 11, '#e6d7a5');
    p(2, 2, 1, 2, '#e6d7a5');
    p(3, 3, 1, 2, '#e6d7a5');
    p(4, 4, 1, 2, '#e6d7a5');
    p(5, 5, 1, 2, '#e6d7a5');
    p(6, 6, 1, 2, '#e6d7a5');
    p(7, 7, 1, 2, '#e6d7a5');
    p(8, 8, 2, 1, '#e6d7a5');

    // Chapa de acero industrial (#877a5c)
    p(2, 4, 1, 7, '#877a5c');
    p(3, 5, 1, 5, '#877a5c');
    p(4, 6, 1, 4, '#877a5c');
    p(5, 7, 1, 3, '#877a5c');
    p(6, 8, 1, 2, '#877a5c');
    p(7, 11, 1, 3, '#877a5c');
    p(8, 12, 1, 2, '#877a5c');

    // Núcleo de latón oxidado (#b89c46)
    p(2, 7, 2, 3, '#b89c46');
    p(3, 8, 2, 2, '#b89c46');

    // Sombra de ranura de óxido (#4a2518)
    p(2, 11, 1, 1, '#4a2518');
    p(4, 10, 1, 1, '#4a2518');
    p(6, 10, 1, 2, '#4a2518');
    p(7, 14, 1, 1, '#4a2518');

    // Remache de sangre (#a52020) con centro pulido (#e6d7a5)
    p(3, 6, 2, 2, '#a52020');
    p(3, 6, 1, 1, '#e6d7a5');

    ctx.restore();
  }

  // === 2. POINTER: Guantelete mecánico industrial de selección (Hover) ===
  if (UI.CURSORS.pointer) {
    ctx.save();
    ctx.translate(UI.CURSORS.pointer.x, UI.CURSORS.pointer.y);

    // Contorno exterior negro (#050605)
    p(4, 0, 3, 1);
    p(3, 1, 1, 8);
    p(7, 1, 1, 7);
    p(1, 6, 2, 1);
    p(0, 7, 1, 3);
    p(1, 10, 2, 1);
    p(8, 5, 3, 1);
    p(11, 6, 1, 6);
    p(10, 12, 1, 2);
    p(4, 14, 6, 1);
    p(3, 11, 1, 3);

    // Yema brillante del dedo índice (#e6d7a5)
    p(4, 1, 3, 2, '#e6d7a5');
    // Falange de acero (#877a5c)
    p(4, 3, 3, 2, '#877a5c');
    // Ranura de articulación (#4a2518)
    p(4, 5, 3, 1, '#4a2518');
    // Falange proximal (#877a5c)
    p(4, 6, 3, 3, '#877a5c');

    // Pulgar mecánico (#877a5c / #b89c46)
    p(1, 7, 2, 3, '#877a5c');
    p(2, 8, 1, 2, '#b89c46');

    // Dorso de la mano y nudillos
    p(7, 6, 4, 3, '#877a5c');
    p(8, 6, 3, 1, '#e6d7a5');
    p(4, 9, 7, 4, '#877a5c');
    p(5, 10, 5, 2, '#b89c46');

    // Diodo / sensor de interfaz activo (#a52020 con núcleo #ff8866)
    p(7, 10, 2, 2, '#a52020');
    p(7, 10, 1, 1, '#ff8866');

    // Sombra de muñeca (#4a2518)
    p(5, 13, 4, 1, '#4a2518');

    ctx.restore();
  }

  // === 3. CLICK: Guantelete comprimido con micro-chispa de contacto (Active) ===
  if (UI.CURSORS.click) {
    ctx.save();
    ctx.translate(UI.CURSORS.click.x, UI.CURSORS.click.y);

    // Chispas de impacto/contacto sobre el punto de pulsado
    p(2, 0, 1, 1, '#e6d7a5');
    p(5, 0, 1, 1, '#ffaa33');
    p(7, 1, 1, 1, '#e6d7a5');

    // Contorno exterior negro (#050605)
    p(4, 1, 3, 1);
    p(3, 2, 1, 8);
    p(7, 2, 1, 7);
    p(1, 7, 2, 1);
    p(0, 8, 1, 3);
    p(1, 11, 2, 1);
    p(8, 6, 3, 1);
    p(11, 7, 1, 6);
    p(10, 13, 1, 2);
    p(4, 15, 6, 1);
    p(3, 12, 1, 3);

    // Dedo índice comprimido 1px hacia abajo (#e6d7a5 y #b89c46)
    p(4, 2, 3, 2, '#e6d7a5');
    p(4, 4, 3, 2, '#b89c46');
    p(4, 6, 3, 1, '#4a2518');
    p(4, 7, 3, 3, '#877a5c');

    // Pulgar comprimido
    p(1, 8, 2, 3, '#877a5c');
    p(2, 9, 1, 2, '#b89c46');

    // Dorso de la mano
    p(7, 7, 4, 3, '#877a5c');
    p(8, 7, 3, 1, '#e6d7a5');
    p(4, 10, 7, 4, '#877a5c');
    p(5, 11, 5, 2, '#b89c46');

    // Sensor de interfaz sobrecargado en clic (#ff2222 y centro blanco puro)
    p(7, 11, 2, 2, '#ff2222');
    p(7, 11, 1, 1, '#ffffff');

    p(5, 14, 4, 1, '#4a2518');

    ctx.restore();
  }

  // === 4. CROSSHAIR: Retícula militar industrial para colocación y apuntado ===
  if (UI.CURSORS.crosshair) {
    ctx.save();
    ctx.translate(UI.CURSORS.crosshair.x, UI.CURSORS.crosshair.y);

    // Sombra negra gruesa de los corchetes
    p(1, 1, 5, 2); p(1, 3, 2, 3);
    p(9, 1, 5, 2); p(12, 3, 2, 3);
    p(1, 12, 5, 2); p(1, 9, 2, 3);
    p(9, 12, 5, 2); p(12, 9, 2, 3);

    // Sombra de los ejes cardinales
    p(6, 0, 3, 5);
    p(6, 10, 3, 5);
    p(0, 6, 5, 3);
    p(10, 6, 5, 3);

    // Corchetes en acero brillante (#e6d7a5) y latón oxidado (#b89c46)
    p(2, 2, 3, 1, '#e6d7a5'); p(2, 3, 1, 2, '#e6d7a5');
    p(10, 2, 3, 1, '#e6d7a5'); p(12, 3, 1, 2, '#e6d7a5');
    p(2, 12, 3, 1, '#b89c46'); p(2, 10, 1, 2, '#b89c46');
    p(10, 12, 3, 1, '#b89c46'); p(12, 10, 1, 2, '#b89c46');

    // Ejes cardinales de alineación (#877a5c)
    p(7, 1, 1, 3, '#877a5c');
    p(7, 11, 1, 3, '#877a5c');
    p(1, 7, 3, 1, '#877a5c');
    p(11, 7, 3, 1, '#877a5c');

    // Colimador central con destello (#a52020 con núcleo #ffffff)
    p(6, 6, 3, 3, '#050605');
    p(7, 6, 1, 3, '#a52020');
    p(6, 7, 3, 1, '#a52020');
    p(7, 7, 1, 1, '#ffffff');

    ctx.restore();
  }

  // === 5. DISABLED: Advertencia industrial de bloqueo / no permitido ===
  if (UI.CURSORS.disabled) {
    ctx.save();
    ctx.translate(UI.CURSORS.disabled.x, UI.CURSORS.disabled.y);

    // Contorno exterior negro (#050605)
    p(5, 1, 5, 1); p(5, 13, 5, 1);
    p(2, 3, 3, 1); p(10, 3, 3, 1);
    p(2, 11, 3, 1); p(10, 11, 3, 1);
    p(1, 5, 1, 5); p(13, 5, 1, 5);

    // Aro de acero oxidado (#877a5c / #4a2518)
    p(5, 2, 5, 1, '#877a5c'); p(5, 12, 5, 1, '#4a2518');
    p(3, 3, 2, 2, '#877a5c'); p(10, 3, 2, 2, '#877a5c');
    p(3, 10, 2, 2, '#4a2518'); p(10, 10, 2, 2, '#4a2518');
    p(2, 5, 1, 5, '#877a5c'); p(12, 5, 1, 5, '#4a2518');

    // Interior sombrío (#121812)
    p(5, 4, 3, 2, '#121812');
    p(7, 9, 3, 2, '#121812');

    // Barra diagonal de peligro / bloqueo (#a52020 / #6e1414 con filo #e6d7a5)
    p(3, 4, 2, 1, '#e6d7a5');
    p(4, 5, 2, 1, '#a52020');
    p(5, 6, 2, 1, '#a52020');
    p(6, 7, 3, 1, '#e6d7a5');
    p(8, 8, 2, 1, '#a52020');
    p(9, 9, 2, 1, '#a52020');
    p(10, 10, 2, 1, '#6e1414');

    ctx.restore();
  }

  // === 6. GRAB: Garra mecánica abierta para agarrar / manipular ===
  if (UI.CURSORS.grab) {
    ctx.save();
    ctx.translate(UI.CURSORS.grab.x, UI.CURSORS.grab.y);

    // Sombra negra
    p(2, 2, 2, 6);
    p(6, 1, 3, 6);
    p(11, 2, 2, 6);
    p(3, 7, 9, 6);
    p(4, 13, 7, 2);

    // Pinzas abiertas (#877a5c con puntas de marfil #e6d7a5)
    p(3, 3, 1, 4, '#877a5c'); p(3, 2, 1, 1, '#e6d7a5');
    p(7, 2, 1, 4, '#877a5c'); p(7, 1, 1, 1, '#e6d7a5');
    p(11, 3, 1, 4, '#877a5c'); p(11, 2, 1, 1, '#e6d7a5');

    // Cuerpo mecánico (#877a5c / #b89c46)
    p(4, 8, 7, 4, '#877a5c');
    p(5, 9, 5, 2, '#b89c46');
    p(7, 9, 1, 2, '#a52020');
    p(5, 12, 5, 2, '#4a2518');

    ctx.restore();
  }

  // === 7. GRABBING: Garra mecánica cerrada sujetando con firmeza ===
  if (UI.CURSORS.grabbing) {
    ctx.save();
    ctx.translate(UI.CURSORS.grabbing.x, UI.CURSORS.grabbing.y);

    // Sombra negra
    p(4, 2, 7, 4);
    p(3, 6, 9, 7);
    p(4, 13, 7, 2);

    // Pinzas trabadas
    p(5, 3, 2, 2, '#e6d7a5');
    p(8, 3, 2, 2, '#e6d7a5');
    p(4, 5, 7, 2, '#877a5c');

    // Cuerpo comprimido y luz de bloqueo (#ff3b16)
    p(4, 7, 7, 5, '#877a5c');
    p(5, 8, 5, 3, '#b89c46');
    p(6, 9, 3, 1, '#ff3b16');
    p(5, 12, 5, 2, '#4a2518');

    ctx.restore();
  }
}
