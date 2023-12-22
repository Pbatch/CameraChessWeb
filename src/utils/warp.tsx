// @ts-expect-error (vectorious has no type declaration)
import { array, zeros } from 'vectorious';
import { BOARD_SIZE, SQUARE_SIZE } from "./constants";

export const perspectiveTransform = (src: number[][], transform: any) => {
    if (src[0].length == 2) {
      src = src.map(x => [x[0], x[1], 1]);
    }
    const warpedSrc: any = array(src).multiply(transform.T);

    for (let i = 0; i < warpedSrc.shape[0]; i++) {
      const x = warpedSrc.get(i, 0);
      const y = warpedSrc.get(i, 1);
      const w = warpedSrc.get(i, 2);
      warpedSrc.set(i, 0, x / w);
      warpedSrc.set(i, 1, y / w);
    }

    let warpedSrcArray: number[][] = warpedSrc.toArray();
    warpedSrcArray = warpedSrcArray.map(row => row.slice(0, 2));

    return warpedSrcArray
}

export const getPerspectiveTransform = (target: number[][], keypoints: number[][]) => {
    const A = zeros(8, 8);
    const B = zeros(8, 1);

    for (let i = 0; i < 4; i++) {
        const [x, y] = keypoints[i];
        const [u, v] = target[i];
        A.set(i * 2, 0, x);
        A.set(i * 2, 1, y);
        A.set(i * 2, 2, 1);
        A.set(i * 2, 6, -u * x);
        A.set(i * 2, 7, -u * y);
        A.set(i * 2 + 1, 3, x);
        A.set(i * 2 + 1, 4, y);
        A.set(i * 2 + 1, 5, 1);
        A.set(i * 2 + 1, 6, -v * x);
        A.set(i * 2 + 1, 7, -v * y);
        B.set(i * 2, 0, u);
        B.set(i * 2 + 1, 0, v);
    }

    const solution = A.solve(B).toArray();
    const transform = array([...solution, 1], {
      shape: [3, 3],
    });

    return transform
}

export const getInvTransform = (keypoints: number[][]) => {
  const target: number[][] = [
    [BOARD_SIZE, BOARD_SIZE],
    [0, BOARD_SIZE],
    [0, 0],
    [BOARD_SIZE, 0]
  ];

  const transform = getPerspectiveTransform(target, keypoints);
  const invTransform = transform.inv();
  return invTransform
}

export const transformCenters = (invTransform: any) => {
  const x = Array.from({ length: 8 }, (_, i) => 0.5 + i);
  const y = Array.from({ length: 8 }, (_, i) => 7.5 - i);
  const warpedCenters: number[][] = y.map(yy => 
    x.map(xx => 
      [xx * SQUARE_SIZE, yy * SQUARE_SIZE, 1]
    )
  ).flat();
  const centers: number[][] = perspectiveTransform(warpedCenters, invTransform);

  return centers
}

export const transformBoundary = (invTransform: any) => {
  const warpedBoundary: number[][] = [
    [-0.5 * SQUARE_SIZE, -0.5 * SQUARE_SIZE, 1],
    [-0.5 * SQUARE_SIZE, 8.5 * SQUARE_SIZE, 1],
    [8.5 * SQUARE_SIZE, 8.5 * SQUARE_SIZE, 1],
    [8.5 * SQUARE_SIZE, -0.5 * SQUARE_SIZE, 1]
  ]
  const boundary: number[][] = perspectiveTransform(warpedBoundary, invTransform);
  
  return boundary
}