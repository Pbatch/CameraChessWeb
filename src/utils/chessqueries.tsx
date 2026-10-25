import { type Accelerator, type CompiledModel, isWebGPUSupported, loadAndCompile, loadLiteRt, Tensor } from "@litertjs/core";
import { CHESSQUERIES_SIZE, LABEL_MAP } from "./constants";
import { zeros } from "./math";
import type { CornerName, ModelRefs, Roi, VideoRef } from "../types";

// Model classes, in output order
const CLASS_SYMBOLS: string[] = [".", "P", "N", "B", "R", "Q", "K", "p", "n", "b", "r", "q", "k"];
const INPUT_SHAPE: number[] = [1, CHESSQUERIES_SIZE, CHESSQUERIES_SIZE, 4];
const NUM_PROBS: number = 64 * CLASS_SYMBOLS.length;
// Region corners clockwise from the top left when rank 8 is at the top
const CORNERS: CornerName[] = ["a8", "h8", "h1", "a1"];
// Pinned to a commit so a new upload cannot change the model under a deployed app
const MODEL_URL: string = "https://huggingface.co/PBatch23888/chessq-chesscam/resolve/3f7e2cf472d6ef5d893c86937c67835b37808ed4/chessq-chesscam-fp16.tflite";

let canvas: OffscreenCanvas | null = null;
let accelerator: Accelerator | null = null;

// The accelerator the model was compiled for, once it has loaded
export const getAccelerator = (): Accelerator | null => accelerator;

const toArray = async (output: Tensor): Promise<Float32Array> => {
  const tensor: Tensor = (output.accelerator === "wasm") ? output : await output.moveTo("wasm");
  try {
    return tensor.toTypedArray() as Float32Array;
  } finally {
    tensor.delete();
  }
}

// Square probabilities, and where each square query looked (null for models without that output)
const run = async (model: CompiledModel, pixels: Float32Array): Promise<{
  probs: Float32Array, centroids: Float32Array | null
}> => {
  let input: Tensor = new Tensor(pixels, INPUT_SHAPE);
  if (accelerator === "webgpu") {
    input = await input.moveTo("webgpu");
  }
  const outputs: Tensor[] = await model.run(input);
  input.delete();
  const arrays: Float32Array[] = await Promise.all(outputs.map(toArray));
  // Output order is up to the converter, so they are told apart by size
  const probs = arrays.find((array) => array.length === NUM_PROBS);
  if (probs === undefined) {
    throw new Error("Model has no square probabilities");
  }
  return { probs, centroids: arrays.find((array) => array.length === 64 * 2) ?? null };
}

const warmUp = (model: CompiledModel) => run(model, new Float32Array(CHESSQUERIES_SIZE * CHESSQUERIES_SIZE * 4));

const loadWebGpu = async (): Promise<CompiledModel> => {
  // fp16 is the fastest and does not need the shader-f16 WebGPU feature
  const model: CompiledModel = await loadAndCompile(MODEL_URL, {
    accelerator: "webgpu",
    gpuOptions: { precision: "fp16" }
  });
  accelerator = "webgpu";
  try {
    // Warm up so shader compilation happens while loading
    await warmUp(model);
  } catch (error) {
    model.delete();
    accelerator = null;
    throw error;
  }
  return model;
}

const loadWasm = async (): Promise<CompiledModel> => {
  const model: CompiledModel = await loadAndCompile(MODEL_URL, {
    accelerator: "wasm",
    cpuOptions: { numThreads: crossOriginIsolated ? navigator.hardwareConcurrency : 1 }
  });
  accelerator = "wasm";
  await warmUp(model);
  return model;
}

export const loadChessqueries = async (): Promise<CompiledModel> => {
  // Served from node_modules in dev, copied to litert/ by vite.config.ts in builds
  const wasmPath: string = import.meta.env.DEV ? "/node_modules/@litertjs/core/wasm/" : "litert/";
  // Wasm threads need SharedArrayBuffer, which needs a cross-origin isolated page
  await loadLiteRt(wasmPath, { jspi: "Suspending" in WebAssembly, threads: crossOriginIsolated });

  if (isWebGPUSupported()) {
    try {
      return await loadWebGpu();
    } catch (error) {
      console.warn("WebGPU failed, falling back to the CPU", error);
    }
  } else {
    console.warn("WebGPU is not available, falling back to the CPU");
  }
  return await loadWasm();
}

const getPixels = (video: HTMLVideoElement, roi: Roi | null): Float32Array => {
  if (canvas === null) {
    canvas = new OffscreenCanvas(CHESSQUERIES_SIZE, CHESSQUERIES_SIZE);
  }
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (ctx === null) {
    throw new Error("Canvas is not ready");
  }
  // The model was trained on square-resized images, so the aspect ratio is not kept
  ctx.imageSmoothingQuality = "high";
  if (roi === null) {
    ctx.drawImage(video, 0, 0, CHESSQUERIES_SIZE, CHESSQUERIES_SIZE);
  } else {
    ctx.drawImage(video, roi.x, roi.y, roi.width, roi.height, 0, 0, CHESSQUERIES_SIZE, CHESSQUERIES_SIZE);
  }
  const imageData: ImageData = ctx.getImageData(0, 0, CHESSQUERIES_SIZE, CHESSQUERIES_SIZE);
  return Float32Array.from(imageData.data);
}

// Direction of rank 8 in video pixels, from the attention centroids in FEN order (a8..h1).
// The centroids are pulled towards the board centre, so only the rank and file directions are used.
const toDirection = (centroids: Float32Array, width: number, height: number): number[] => {
  const up: number[] = [0, 0];
  const right: number[] = [0, 0];
  for (let i = 0; i < 64; i++) {
    const rank: number = 7 - Math.floor(i / 8) - 3.5;
    const file: number = (i % 8) - 3.5;
    const x: number = centroids[2 * i] * width;
    const y: number = centroids[2 * i + 1] * height;
    up[0] += rank * x;
    up[1] += rank * y;
    right[0] += file * x;
    right[1] += file * y;
  }
  // Camera images are never mirrored, so the a->h direction turned 90 degrees anticlockwise is also rank 8
  const upNorm: number = Math.hypot(up[0], up[1]) || 1;
  const rightNorm: number = Math.hypot(right[0], right[1]) || 1;
  return [up[0] / upNorm + right[1] / rightNorm, up[1] / upNorm - right[0] / rightNorm];
}

// Rank 8 direction -> square names of the region corners, clockwise from the top left
export const getOrientation = (direction: number[]): CornerName[] => {
  // Quarter turns clockwise from rank 8 at the top
  const turns: number = Math.round(Math.atan2(direction[0], -direction[1]) / (Math.PI / 2));
  return CORNERS.map((_, i) => CORNERS[(((i - turns) % 4) + 4) % 4]);
}

// Probabilities in FEN order (a8..h1) -> 64x12 state in square order (a1..h8)
const toUpdate = (probs: Float32Array): number[][] => {
  const update: number[][] = zeros(64, 12);
  for (let i = 0; i < 64; i++) {
    const rank: number = 7 - Math.floor(i / 8);
    const file: number = i % 8;
    const square: number = 8 * rank + file;
    for (let j = 1; j < CLASS_SYMBOLS.length; j++) {
      update[square][LABEL_MAP[CLASS_SYMBOLS[j]]] = probs[i * CLASS_SYMBOLS.length + j];
    }
  }
  return update;
}

export const runChessqueries = async (
  modelRef: ModelRefs["chessqueriesModelRef"],
  videoRef: VideoRef,
  roi: Roi | null
): Promise<{ update: number[][], direction: number[] | null }> => {
  const model = modelRef.current;
  const video = videoRef.current;
  if (model === null || video === null) {
    throw new Error("Piece detection is not ready");
  }
  const { probs, centroids } = await run(model, getPixels(video, roi));
  const width: number = (roi === null) ? video.videoWidth : roi.width;
  const height: number = (roi === null) ? video.videoHeight : roi.height;
  return {
    update: toUpdate(probs),
    direction: (centroids === null) ? null : toDirection(centroids, width, height)
  };
}
