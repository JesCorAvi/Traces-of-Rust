// Fuente bitmap 3x5 para badges del atlas de UI.
// Exports: drawBitmapString.

const MINI_FONT_3X5 = {
  '+': [0b000, 0b010, 0b111, 0b010, 0b000],
  '-': [0b000, 0b000, 0b111, 0b000, 0b000],
  '0': [0b111, 0b101, 0b101, 0b101, 0b111],
  '1': [0b010, 0b110, 0b010, 0b010, 0b111],
  '2': [0b111, 0b001, 0b111, 0b100, 0b111],
  '3': [0b111, 0b001, 0b011, 0b001, 0b111],
  '4': [0b101, 0b101, 0b111, 0b001, 0b001],
  '5': [0b111, 0b100, 0b111, 0b001, 0b111],
  '6': [0b111, 0b100, 0b111, 0b101, 0b111],
  '7': [0b111, 0b001, 0b010, 0b010, 0b010],
  '8': [0b111, 0b101, 0b111, 0b101, 0b111],
  '9': [0b111, 0b101, 0b111, 0b001, 0b111],
  'M': [0b101, 0b111, 0b101, 0b101, 0b101],
  'A': [0b010, 0b101, 0b111, 0b101, 0b101],
  'X': [0b101, 0b101, 0b010, 0b101, 0b101]
};

export function drawBitmapString(ctx, text, x, y, color, shadowColor = '#050605') {
  let curX = x;
  for (let i = 0; i < text.length; i++) {
    const rows = MINI_FONT_3X5[text[i]];
    if (rows) {
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 3; c++) {
          if ((rows[r] >> (2 - c)) & 1) {
            if (shadowColor) {
              ctx.fillStyle = shadowColor;
              ctx.fillRect(curX + c + 1, y + r + 1, 1, 1);
            }
            ctx.fillStyle = color;
            ctx.fillRect(curX + c, y + r, 1, 1);
          }
        }
      }
    }
    curX += 4;
  }
}
