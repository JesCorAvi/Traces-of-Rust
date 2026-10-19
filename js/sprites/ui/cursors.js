// Cursores del juego (normal, puntero y mira).
// Exports: drawCursors.

export function drawCursors(ctx, UI) {
  ctx.save();
  ctx.translate(UI.CURSORS.default.x, UI.CURSORS.default.y);
  for (let i = 0; i < 11; i++) {
    ctx.fillStyle = '#050605';
    ctx.fillRect(1, 1 + i, 2 + Math.floor(i * 0.7), 2);
    ctx.fillStyle = i < 4 ? '#e6d7a5' : '#b89c46';
    ctx.fillRect(2, 2 + i, 1 + Math.floor(i * 0.5), 1);
  }
  ctx.fillStyle = '#a52020';
  ctx.fillRect(2, 2, 2, 2);
  ctx.restore();

  ctx.save();
  ctx.translate(UI.CURSORS.pointer.x, UI.CURSORS.pointer.y);
  ctx.fillStyle = '#050605';
  ctx.fillRect(3, 1, 5, 13);
  ctx.fillRect(2, 5, 11, 8);
  ctx.fillStyle = '#e6d7a5';
  ctx.fillRect(4, 2, 3, 10);
  ctx.fillStyle = '#b89c46';
  ctx.fillRect(3, 6, 9, 6);
  ctx.fillStyle = '#a52020';
  ctx.fillRect(4, 2, 3, 2);
  ctx.restore();

  ctx.save();
  ctx.translate(UI.CURSORS.crosshair.x, UI.CURSORS.crosshair.y);
  const ch = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  ch(2, 2, 4, 1, '#b89c46'); ch(2, 2, 1, 4, '#b89c46');
  ch(10, 2, 4, 1, '#b89c46'); ch(13, 2, 1, 4, '#b89c46');
  ch(2, 13, 4, 1, '#b89c46'); ch(2, 10, 1, 4, '#b89c46');
  ch(10, 13, 4, 1, '#b89c46'); ch(13, 10, 1, 4, '#b89c46');
  ch(7, 7, 2, 2, '#e6d7a5');
  ctx.restore();
}
