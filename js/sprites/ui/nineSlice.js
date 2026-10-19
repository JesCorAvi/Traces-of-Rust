// Dibujo de cajas nine-slice para paneles, botones y slots.
// Exports: drawNineSliceBox.

export function drawNineSliceBox(ctx, cfg, opts) {
  const { x, y, w, h, slice = 7 } = cfg;
  ctx.save();
  ctx.translate(x, y);

  const px = (rx, ry, rw, rh, col) => {
    ctx.fillStyle = col;
    ctx.fillRect(rx, ry, rw, rh);
  };

  px(0, 0, w, h, '#050605');

  const inset = opts.borderThick || 2;
  px(inset, inset, w - inset * 2, h - inset * 2, opts.bg || '#0d110d');

  if (opts.innerGlow) {
    px(inset + 2, inset + 2, w - (inset + 2) * 2, h - (inset + 2) * 2, opts.innerGlow);
  }

  if (opts.speckle) {
    const cornerZone = Math.max(4, slice - 1);
    for (let py = inset + 1; py < h - inset - 1; py++) {
      for (let pxX = inset + 1; pxX < w - inset - 1; pxX++) {
        const inCornerX = pxX < cornerZone || pxX >= w - cornerZone;
        const inCornerY = py < cornerZone || py >= h - cornerZone;
        if (inCornerX && inCornerY && ((pxX * 19 + py * 37) & 7) === 0) {
          px(pxX, py, 1, 1, opts.speckle);
        }
      }
    }
  }

  const bTop = opts.pressed ? opts.borderDark : opts.borderLight;
  const bBot = opts.pressed ? opts.borderLight : opts.borderDark;

  px(1, 1, w - 2, 1, bTop);
  px(1, 1, 1, h - 2, bTop);
  px(1, h - 2, w - 2, 1, bBot);
  px(w - 2, 1, 1, h - 2, bBot);

  if (opts.doubleRim) {
    px(2, 2, w - 4, 1, opts.rimInner || '#4a2518');
    px(2, h - 3, w - 4, 1, '#050605');
    px(2, 2, 1, h - 4, opts.rimInner || '#4a2518');
    px(w - 3, 2, 1, h - 4, '#050605');
  }

  if (opts.leftStripe) {
    px(2, 2, 3, h - 4, opts.leftStripe);
  }

  if (!opts.cleanCorners) {
    px(3, 1, 1, 1, '#050605');
    px(w - 4, h - 2, 1, 1, '#050605');
  }

  if (opts.cornerRivets) {
    const rCol = opts.rivetColor || '#877a5c';
    const positions = [[3, 3], [w - 5, 3], [3, h - 5], [w - 5, h - 5]];
    positions.forEach(([rx, ry]) => {
      px(rx, ry, 2, 2, '#050605');
      px(rx, ry, 1, 1, rCol);
    });
  }

  if (opts.tornEdges) {
    for (let ty = 2; ty < h - 2; ty += 3) {
      px(0, ty, 2, 1, '#050605');
      px(w - 2, ty + 1, 2, 1, '#050605');
    }
  }

  ctx.restore();
}
