import * as Constants from "../constants.jsx";
import { drawPoints } from "./common.jsx"; 

export const renderCorners = (canvasRef, keypoints, xCorners) => {
  const ctx = canvasRef.getContext("2d");
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  const sx = width / Constants.MODEL_SIZE;
  const sy = height / Constants.MODEL_SIZE;

  ctx.clearRect(0, 0, width, height);

  // font configs
  const fontSize = Math.max(Math.round(Math.max(width, height) / 40), 14);
  const font = `${fontSize}px Arial`;
  const fontHeight = parseInt(font, 10);
  const lineWidth = Math.max(Math.min(width, height) / 200, 2.5);
  
  ctx.textBaseline = "top";
  ctx.lineWidth = lineWidth;
  ctx.font = font;

  ctx.clearRect(0, 0, width, height);

  drawPoints(ctx, xCorners, "blue", sx, sy);

}
