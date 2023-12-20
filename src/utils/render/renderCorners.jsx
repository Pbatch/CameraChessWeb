import { drawPoints, setupCtx } from "./common"; 

export const renderCorners = (canvasRef, xCorners) => {
  const [ctx, _, __, sx, sy] = setupCtx(canvasRef);

  drawPoints(ctx, xCorners, "blue", sx, sy);
}
