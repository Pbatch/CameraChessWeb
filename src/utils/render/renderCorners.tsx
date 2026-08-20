import { drawPoints, setupCtx } from "./common"; 

export const renderCorners = (canvas: HTMLCanvasElement, xCorners: number[][]) => {
  const [ctx, , , sx, sy] = setupCtx(canvas);

  drawPoints(ctx, xCorners, "blue", sx, sy);
}
