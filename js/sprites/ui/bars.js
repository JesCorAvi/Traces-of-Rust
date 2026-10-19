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

  drawBarFill(UI.BAR_FILLS.hp,   '#ff9e9e', '#d62828', '#6e1414', 12);
  drawBarFill(UI.BAR_FILLS.exp,  '#fff6e0', '#e0b646', '#5c3818', 16);
  drawBarFill(UI.BAR_FILLS.stam, '#b8d8a0', '#5c8a4e', '#243022', 8);
  drawBarFill(UI.BAR_FILLS.boss, '#ffb3b3', '#b82525', '#4a2518', 10);
  drawBarFill(UI.BAR_FILLS.core, '#ffe699', '#d97724', '#4a2518', 8);
}
