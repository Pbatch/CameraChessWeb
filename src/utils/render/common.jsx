export const drawPoints = (ctx, points, colour, sx, sy) => {
  ctx.strokeStyle = colour;
  points.forEach((p, _) => {
    ctx.strokeRect(p[0] * sx, p[1] * sy, 1, 1);
  })
}

export const drawDict = (ctx, dict, colour, sx, sy, fontHeight, lineWidth) => {
  ctx.strokeStyle = colour;
  for (const [text, p] of Object.entries(dict)) {
    const x = p[0] * sx;
    const y = p[1] * sy;
    const textWidth = ctx.measureText(text).width;

    ctx.strokeRect(x, y, 1, 1);

    ctx.fillStyle = colour;
    const w = textWidth + lineWidth;
    const h = fontHeight + lineWidth;

    ctx.fillStyle = "#ffffff";
    ctx.fillText(text, x - (w / 2), y - (h / 2));
  }
}

export const drawPolygon = (ctx, polygon, colour, sx, sy) => {
  ctx.strokeStyle = colour;
  ctx.beginPath();
  const n = polygon.length;
  for (let i = 0; i < n; i++) {
    ctx.moveTo(polygon[i][0] * sx, polygon[i][1] * sy);
    ctx.lineTo(polygon[(i+1) % n][0] * sx, polygon[(i+1) % n][1] * sy);
  }
  ctx.stroke();
}

export const drawBox = (ctx, colour, x, y, text, fontHeight, lineWidth, sx, sy) => {
  ctx.fillStyle = colour;
  const textWidth = ctx.measureText(text).width;
  const yText = (sy * y) - fontHeight - lineWidth;
  ctx.fillRect(
    (sx * x) - 1,
    yText < 0 ? 0 : yText, // handle overflow label box
    textWidth + lineWidth,
    fontHeight + lineWidth
  );

  // Draw labels
  ctx.fillStyle = "#ffffff";
  ctx.fillText(text, (sx * x) - 1, yText < 0 ? 0 : yText);
}