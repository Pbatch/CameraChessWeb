import i18n from "../i18n";
import { version as LITERT_VERSION } from "@litertjs/core/package.json";
import { MODEL_SIZE, LABEL_MAP, NUM_LABELS } from "../utils/constants";
import { zeros } from "../utils/math";
import modelFile from "../model.json";
import type { PieceModel, PieceModelOutputs, CornerName, ModelRefs, Roi, VideoRef } from "../types";
import type { WorkerCall, WorkerRequest, WorkerResponse } from "./pieceModelWorker";

// Model classes, in output order
const CLASS_SYMBOLS: string[] = [".", "P", "N", "B", "R", "Q", "K", "p", "n", "b", "r", "q", "k"];
const NUM_PROBS: number = 64 * CLASS_SYMBOLS.length;
// Region corners clockwise from the top left when rank 8 is at the top
const CORNERS: CornerName[] = ["a8", "h8", "h1", "a1"];
// Served by the site itself, as scripts/fetchModel.mjs puts it in public/models. A function, as tests import this
// module where there is no document.
const modelUrl = (): string => new URL(`models/${modelFile.file}`, document.baseURI).href;

let canvas: OffscreenCanvas | null = null;

const blankPixels = (): Uint8Array<ArrayBuffer> => new Uint8Array(MODEL_SIZE * MODEL_SIZE * 4);

// Output order is up to the converter, so they are told apart by size
const toOutputs = (arrays: Float32Array[]): PieceModelOutputs => {
  const probs = arrays.find((array) => array.length === NUM_PROBS);
  if (probs === undefined) {
    throw new Error("Model has no square probabilities");
  }
  return { probs, centroids: arrays.find((array) => array.length === 64 * 2) ?? null };
}

// Served from node_modules in dev, copied to litert/<version>/ by vite.config.ts in builds
const wasmPath: string = import.meta.env.DEV ? "/node_modules/@litertjs/core/wasm/" : `litert/${LITERT_VERSION}/`;

// The CPU model runs in a worker, as each run blocks its thread for the whole inference
const loadWorker = async (): Promise<PieceModel> => {
  const worker = new Worker(new URL("./pieceModelWorker.ts", import.meta.url), { type: "module" });
  const pending = new Map<number, { resolve: (arrays: Float32Array[]) => void, reject: (error: Error) => void }>();
  let nextId: number = 0;
  // Set once the worker has stopped, so later runs fail rather than wait forever
  let stopped: Error | null = null;
  const stop = (error: Error) => {
    stopped = error;
    worker.terminate();
    pending.forEach(({ reject }) => {
      reject(error);
    });
    pending.clear();
  }

  worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
    const response = event.data;
    const request = pending.get(response.id);
    pending.delete(response.id);
    if ("error" in response) {
      request?.reject(new Error(response.error));
    } else {
      request?.resolve(response.arrays);
    }
  }
  // e.g. the worker failed to start, or ran out of memory
  worker.onerror = (event: ErrorEvent) => {
    console.error("Piece detection worker failed", event.message);
    stop(new Error(i18n.t("detection.stopped")));
  }

  const send = (call: WorkerCall, transfer: Transferable[] = []): Promise<Float32Array[]> => {
    if (stopped !== null) {
      return Promise.reject(stopped);
    }
    const id: number = nextId++;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      const request: WorkerRequest = { ...call, id };
      worker.postMessage(request, transfer);
    });
  }

  try {
    // The worker's URL is not the page's, so the runtime's path is made absolute
    await send({ type: "load", wasmUrl: new URL(wasmPath, document.baseURI).href, modelUrl: modelUrl() });
  } catch (error) {
    stop(error as Error);
    throw error;
  }
  return {
    run: async (video, roi) => {
      const pixels = (video === null) ? blankPixels() : getPixels(video, roi);
      return toOutputs(await send({ type: "run", pixels }, [pixels.buffer]));
    },
    delete: () => stop(new Error("The model was unloaded"))
  };
}

let loading: Promise<PieceModel> | null = null;

// Loads the model once, however often it is called. Every caller's ref gets it, as a
// remounted App (e.g. after a hot reload) asks again with a fresh, empty ref.
export const loadPieceModelOnce = (modelRef: ModelRefs["modelRef"]): Promise<void> => {
  if (modelRef.current !== null) {
    return Promise.resolve();
  }

  if (loading === null) {
    loading = loadWorker().catch((error: unknown) => {
      loading = null;
      throw error;
    });
  }
  return loading.then((model) => {
    modelRef.current = model;
  });
}

// RGBA bytes as the model takes them, viewing the canvas data without a copy
const getPixels = (video: HTMLVideoElement, roi: Roi | null): Uint8Array<ArrayBuffer> => {
  if (canvas === null) {
    canvas = new OffscreenCanvas(MODEL_SIZE, MODEL_SIZE);
  }
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (ctx === null) {
    throw new Error("Canvas is not ready");
  }
  // The model was trained on square-resized images, so the aspect ratio is not kept
  ctx.imageSmoothingQuality = "high";
  if (roi === null) {
    ctx.drawImage(video, 0, 0, MODEL_SIZE, MODEL_SIZE);
  } else {
    ctx.drawImage(video, roi.x, roi.y, roi.width, roi.height, 0, 0, MODEL_SIZE, MODEL_SIZE);
  }
  const imageData: ImageData = ctx.getImageData(0, 0, MODEL_SIZE, MODEL_SIZE);
  return new Uint8Array<ArrayBuffer>(imageData.data.buffer);
}

// Direction of rank 8 in video pixels, from the attention centroids in FEN order (a8..h1).
// The centroids are pulled towards the board centre, so only the rank and file directions are used.
export const toDirection = (centroids: Float32Array, width: number, height: number): number[] => {
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

// Probabilities in FEN order (a8..h1) -> 64x13 state in square order (a1..h8)
export const toUpdate = (probs: Float32Array): number[][] => {
  const update: number[][] = zeros(64, NUM_LABELS);
  for (let i = 0; i < 64; i++) {
    const rank: number = 7 - Math.floor(i / 8);
    const file: number = i % 8;
    const square: number = 8 * rank + file;
    for (let j = 0; j < CLASS_SYMBOLS.length; j++) {
      update[square][LABEL_MAP[CLASS_SYMBOLS[j]]] = probs[i * CLASS_SYMBOLS.length + j];
    }
  }
  return update;
}

export const runPieceModel = async (
  modelRef: ModelRefs["modelRef"],
  videoRef: VideoRef,
  roi: Roi | null
): Promise<{ update: number[][], direction: number[] | null }> => {
  const model = modelRef.current;
  const video = videoRef.current;
  if (model === null || video === null) {
    throw new Error("Piece detection is not ready");
  }
  const { probs, centroids } = await model.run(video, roi);
  const width: number = (roi === null) ? video.videoWidth : roi.width;
  const height: number = (roi === null) ? video.videoHeight : roi.height;
  return {
    update: toUpdate(probs),
    direction: (centroids === null) ? null : toDirection(centroids, width, height)
  };
}
