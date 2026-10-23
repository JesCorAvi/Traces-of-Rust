// Rellenos segmentados de las barras del HUD.
// Exports: drawBars.

export function drawBars(ctx, UI) {
  const drawBarFill = (cfg, colTop, colMid, colBot, segEvery = 8) => {
    if (!cfg) return;
    ctx.save();
    ctx.translate(cfg.x, cfg.y);
    for (let bx = 0; bx < cfg.w; bx++) {
      const isSegLine = (bx % segEvery === segEvery - 1);
      for (let by = 0; by < cfg.h; by++) {
        if (isSegLine) {
          ctx.fillStyle = '#050605';
        } else if (by === 0) {
          ctx.fillStyle = colTop;
        } else if (by === 1) {
          ctx.fillStyle = (bx + by) % 2 === 0 ? colTop : colMid;
        } else if (by > cfg.h - 3) {
          ctx.fillStyle = colBot;
        } else {
          ctx.fillStyle = ((bx * 7 + by * 13) & 3) === 0 ? colTop : colMid;
        }
        ctx.fillRect(bx, by, 1, 1);
      }
    }
    ctx.restore();
  };

  drawBarFill(UI.BAR_FILLS.hp,   '#ffc0a1', '#e9564c', '#7b2b2e', 12);
  drawBarFill(UI.BAR_FILLS.exp,  '#e9fff9', '#59d6c8', '#1e5e63', 16);
  drawBarFill(UI.BAR_FILLS.stam, '#d4f7c8', '#74d7a4', '#205a48', 8);
  drawBarFill(UI.BAR_FILLS.boss, '#ffd0b4', '#e9564c', '#6e2227', 10);
  drawBarFill(UI.BAR_FILLS.core, '#fff3b8', '#ffc857', '#8a4426', 8);
}
