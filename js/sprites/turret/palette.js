// Paleta, helper de píxel y montura común de torretas.
// Exports: P, px, drawTurretMount.

export const P = {
  black: '#07181c',
  ink: '#0b2226',
  dark: '#123235',
  greenDark: '#163f40',
  green: '#1f5a55',
  greenMid: '#32776d',
  rustDark: '#6b3823',
  rust: '#a85832',
  blood: '#d84a44',
  steelDark: '#8a6845',
  steel: '#b8976c',
  steelLight: '#f1e0b2',
  brass: '#ffc857',
  bone: '#fff0c7',
  iceDark: '#275b62',
  ice: '#3f7d83',
  iceMid: '#7cbfc2',
  iceLight: '#c7ece6',
  moss: '#5fa45a'
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
