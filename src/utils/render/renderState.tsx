import { LABELS, PALETTE } from "../constants";
import { setupCtx, drawBox, drawPoints, drawPolygon } from "./common";

export const renderState = (canvasRef: any, centers: number[][], boundary: number[][], state: number[][]) => {
  const [ctx, fontHeight, lineWidth, sx, sy] = setupCtx(canvasRef);

  drawPoints(ctx, centers, "blue", sx, sy);
  drawPolygon(ctx, boundary, "blue", sx, sy);

  for (let i = 0; i < 64; i++) {
    let bestScore = 0.1;
    let bestPiece = -1;
    for (let j = 0; j < 12; j++) {
      if (state[i][j] > bestScore) {
        bestScore = state[i][j];
        bestPiece = j;
      }
    }

    if (bestPiece === -1) {
      continue;
    }
    
    const color = PALETTE[bestPiece % PALETTE.length];
    const text: string = `${LABELS[bestPiece]}:${Math.round(100 * bestScore)}`;

    drawBox(ctx, color, centers[i][0] * sx, centers[i][1] * sy, text, fontHeight, lineWidth);
  }
};
