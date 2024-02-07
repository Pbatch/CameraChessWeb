import { MODEL_WIDTH, MODEL_HEIGHT } from "../constants";

export const clearCtx = (ctx: any) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

export const setupCtx = (canvasRef: any) => {
  const ctx = canvasRef.getContext("2d");
  ctx.globalAlpha = 0.8;
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  clearCtx(ctx);

  const fontSize = Math.max(Math.round(Math.max(width, height) / 40), 14);
  const font = `${fontSize}px Arial`;
  const fontHeight = parseInt(font, 10);
  const lineWidth = Math.max(Math.min(width, height) / 200, 2.5);
  
  ctx.textBaseline = "top";
  ctx.lineWidth = lineWidth;
  ctx.font = font;

  const sx = width / MODEL_WIDTH;
  const sy = height / MODEL_HEIGHT;

  return [ctx, fontHeight, lineWidth, sx, sy];
}

export const drawPoints = (ctx: any, points: number[][], colour: string, sx: number, sy: number) => {
  ctx.strokeStyle = colour;
  points.forEach((p, _) => {
    ctx.strokeRect(p[0] * sx, p[1] * sy, 1, 1);
  })
}

export const drawDict = (ctx: any, dict: { [id: string]: number[] }, colour: string, sx: number, sy: number, fontHeight: number, lineWidth: number) => {
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

export const drawPolygon = (ctx: any, polygon: number[][], colour: string, sx: number, sy: number) => {
  ctx.strokeStyle = colour;
  ctx.beginPath();
  const n = polygon.length;
  for (let i = 0; i < n; i++) {
    ctx.moveTo(polygon[i][0] * sx, polygon[i][1] * sy);
    ctx.lineTo(polygon[(i+1) % n][0] * sx, polygon[(i+1) % n][1] * sy);
  }
  ctx.stroke();
}

export const drawBox = (ctx: any, colour: string, cx: number, cy: number, text: string, fontHeight: number, lineWidth: number) => {
  ctx.fillStyle = colour;
  const textWidth = ctx.measureText(text).width;
  const y = cy - lineWidth - fontHeight / 2;
  const x = cx - textWidth / 2;
  ctx.fillRect(
    x,
    y,
    textWidth + lineWidth,
    fontHeight + lineWidth
  );

  // Draw labels
  ctx.fillStyle = "#ffffff";
  ctx.fillText(text, x, y);
}