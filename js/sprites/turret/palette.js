// Paleta, helper de píxel y montura común de torretas.
// Exports: P, px, drawTurretMount.

export const P = {
  black: '#050605',
  ink: '#0a0d0a',
  dark: '#121812',
  greenDark: '#182018',
  green: '#243022',
  greenMid: '#364832',
  rustDark: '#4a2518',
  rust: '#743718',
  blood: '#a52020',
  steelDark: '#63533b',
  steel: '#877a5c',
  steelLight: '#c8c2ac',
  brass: '#b89c46',
  bone: '#e6d7a5',
  iceDark: '#2c4148',
  ice: '#4a6b73',
  iceMid: '#6f8f9c',
  iceLight: '#9fc3c9',
  moss: '#68863a'
};

export function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

export function drawTurretMount(ctx, gCtx, accent) {
  // Collarín metálico que conecta con el pedestal 3D
  px(ctx, 15, 48, 34, 12, P.black);
  px(ctx, 17, 48, 30, 9, P.rustDark);
  px(ctx, 19, 48, 26, 3, P.steel);
  px(ctx, 19, 53, 26, 2, P.dark);
  px(ctx, 21, 55, 4, 3, P.steelDark);
  px(ctx, 39, 55, 4, 3, P.steelDark);
  if (accent) {
    px(ctx, 29, 50, 6, 2, accent);
    gCtx.fillStyle = accent;
    gCtx.fillRect(29, 50, 6, 2);
  }
}
