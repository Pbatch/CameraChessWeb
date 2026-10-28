import { type Accelerator, type CompiledModel, getGlobalLiteRt, isWebGPUSupported, loadAndCompile, loadLiteRt, Tensor } from "@litertjs/core";
import { version as LITERT_VERSION } from "@litertjs/core/package.json";
import { CHESSQUERIES_SIZE, LABEL_MAP, NUM_LABELS } from "../utils/constants";
import { zeros } from "../utils/math";
import type { CornerName, ModelRefs, Roi, VideoRef } from "../types";

// Model classes, in output order
const CLASS_SYMBOLS: string[] = [".", "P", "N", "B", "R", "Q", "K", "p", "n", "b", "r", "q", "k"];
const INPUT_SHAPE: number[] = [1, CHESSQUERIES_SIZE, CHESSQUERIES_SIZE, 4];
const NUM_PROBS: number = 64 * CLASS_SYMBOLS.length;
// Region corners clockwise from the top left when rank 8 is at the top
const CORNERS: CornerName[] = ["a8", "h8", "h1", "a1"];
// Pinned to a commit so a new upload cannot change the model under a deployed app
const MODEL_URL: string = "https://huggingface.co/PBatch23888/chessq-chesscam/resolve/1407e49c17299f53c1197155e08c9a1106298e05/chessq-chesscam-dinov3-448-fp16.tflite";

// Resizes the frame straight into the input buffer, one packed RGBA u32 per pixel.
// Each output pixel averages a grid of bilinear taps over its footprint, like the canvas's high quality downscale.
const RESIZE_SHADER: string = `
struct Params { origin: vec2f, size: vec2f, taps: vec2f }
@group(0) @binding(0) var frame: texture_external;
@group(0) @binding(1) var smp: sampler;
@group(0) @binding(2) var<storage, read_write> pixels: array<u32>;
@group(0) @binding(3) var<uniform> params: Params;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3u) {
  if (id.x >= ${CHESSQUERIES_SIZE}u || id.y >= ${CHESSQUERIES_SIZE}u) {
    return;
  }
  let taps = vec2u(params.taps);
  var sum = vec3f(0.0);
  for (var j = 0u; j < taps.y; j++) {
    for (var i = 0u; i < taps.x; i++) {
      let p = (vec2f(id.xy) + (vec2f(f32(i), f32(j)) + 0.5) / params.taps) / ${CHESSQUERIES_SIZE}.0;
      sum += textureSampleBaseClampToEdge(frame, smp, params.origin + p * params.size).rgb;
    }
  }
  pixels[id.y * ${CHESSQUERIES_SIZE}u + id.x] = pack4x8unorm(vec4f(sum / f32(taps.x * taps.y), 1.0));
}`;

interface GpuResize {
  device: GPUDevice,
  pipeline: GPUComputePipeline,
  sampler: GPUSampler,
  params: GPUBuffer
}

let canvas: OffscreenCanvas | null = null;
let accelerator: Accelerator | null = null;
// On WebGPU, the input is moved to the GPU once and every frame is resized into its buffer in place,
// so frames never come back to the CPU
let gpuInput: Tensor | null = null;
let gpuResize: GpuResize | null = null;
// Runs share gpuInput, so each waits for the one before it to finish reading it
let lastRun: Promise<unknown> = Promise.resolve();

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

const blankPixels = (): Uint8Array<ArrayBuffer> => new Uint8Array(CHESSQUERIES_SIZE * CHESSQUERIES_SIZE * 4);

const getGpuResize = (device: GPUDevice): GpuResize => {
  if (gpuResize?.device !== device) {
    gpuResize = {
      device,
      pipeline: device.createComputePipeline({
        layout: "auto",
        compute: { module: device.createShaderModule({ code: RESIZE_SHADER }), entryPoint: "main" }
      }),
      sampler: device.createSampler({ magFilter: "linear", minFilter: "linear" }),
      // GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST, whose constants TypeScript does not declare
      params: device.createBuffer({ size: 6 * 4, usage: 0x40 | 0x08 })
    };
  }
  return gpuResize;
}

// Queued ahead of the model's GPU work, so the model reads the new frame
const resizeOnGpu = (input: Tensor, video: HTMLVideoElement, roi: Roi | null) => {
  const device = input.environment.webGpuDevice;
  if (device === null) {
    throw new Error("WebGPU device is gone");
  }
  const { pipeline, sampler, params } = getGpuResize(device);
  const width: number = video.videoWidth;
  const height: number = video.videoHeight;
  const region: Roi = roi ?? { x: 0, y: 0, width, height };
  // The model was trained on square-resized images, so the aspect ratio is not kept
  device.queue.writeBuffer(params, 0, new Float32Array([
    region.x / width, region.y / height, region.width / width, region.height / height,
    Math.max(1, Math.ceil(region.width / CHESSQUERIES_SIZE)), Math.max(1, Math.ceil(region.height / CHESSQUERIES_SIZE))
  ]));
  // An external texture is only valid in the task that imports it, so it is used straight away
  const bindGroup: GPUBindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: device.importExternalTexture({ source: video }) },
      { binding: 1, resource: sampler },
      { binding: 2, resource: { buffer: input.toGpuBuffer() } },
      { binding: 3, resource: { buffer: params } }
    ]
  });
  const encoder: GPUCommandEncoder = device.createCommandEncoder();
  const pass: GPUComputePassEncoder = encoder.beginComputePass();
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bindGroup);
  const groups: number = Math.ceil(CHESSQUERIES_SIZE / 8);
  pass.dispatchWorkgroups(groups, groups);
  pass.end();
  device.queue.submit([encoder.finish()]);
}

// A null video gives blank pixels, for the warm-up
const toInput = async (video: HTMLVideoElement | null, roi: Roi | null): Promise<Tensor> => {
  if (accelerator !== "webgpu") {
    return new Tensor((video === null) ? blankPixels() : getPixels(video, roi), INPUT_SHAPE);
  }
  if (gpuInput === null) {
    gpuInput = await new Tensor(blankPixels(), INPUT_SHAPE).moveTo("webgpu");
  }
  if (video !== null) {
    const device = gpuInput.environment.webGpuDevice;
    // Firefox can't import a video as a texture (or copy one into a texture),
    // so it resizes on the canvas and uploads the small result instead
    if (device !== null && typeof device.importExternalTexture !== "function") {
      device.queue.writeBuffer(gpuInput.toGpuBuffer(), 0, getPixels(video, roi));
    } else {
      resizeOnGpu(gpuInput, video, roi);
    }
  }
  return gpuInput;
}

const deleteGpuInput = () => {
  gpuInput?.delete();
  gpuInput = null;
  gpuResize?.params.destroy();
  gpuResize = null;
}

// Square probabilities, and where each square query looked (null for models without that output)
const run = (model: CompiledModel, video: HTMLVideoElement | null, roi: Roi | null): Promise<{
  probs: Float32Array, centroids: Float32Array | null
}> => {
  const result = lastRun.then(() => runNow(model, video, roi));
  lastRun = result.catch(() => undefined);
  return result;
}

const runNow = async (model: CompiledModel, video: HTMLVideoElement | null, roi: Roi | null): Promise<{
  probs: Float32Array, centroids: Float32Array | null
}> => {
  const input: Tensor = await toInput(video, roi);
  const outputs: Tensor[] = await model.run(input);
  if (input !== gpuInput) {
    input.delete();
  }
  const arrays: Float32Array[] = await Promise.all(outputs.map(toArray));
  // Output order is up to the converter, so they are told apart by size
  const probs = arrays.find((array) => array.length === NUM_PROBS);
  if (probs === undefined) {
    throw new Error("Model has no square probabilities");
  }
  return { probs, centroids: arrays.find((array) => array.length === 64 * 2) ?? null };
}

const warmUp = (model: CompiledModel) => run(model, null, null);

// Firefox's shader-f16 overflows to NaN on some frames, though the same frames are fine without it.
// Without the feature, LiteRT's fp16 precision still works, so only the feature is left out.
const setDeviceWithoutF16 = async () => {
  const adapter: GPUAdapter | null = await navigator.gpu.requestAdapter({ powerPreference: "high-performance" });
  if (adapter === null) {
    throw new Error("No GPU adapter found");
  }
  // The limits LiteRT asks for on its own device
  const device: GPUDevice = await adapter.requestDevice({
    requiredFeatures: adapter.features.has("subgroups") ? ["subgroups" as GPUFeatureName] : [],
    requiredLimits: {
      maxBufferSize: adapter.limits.maxBufferSize,
      maxStorageBufferBindingSize: adapter.limits.maxStorageBufferBindingSize,
      maxStorageBuffersPerShaderStage: adapter.limits.maxStorageBuffersPerShaderStage,
      maxTextureDimension2D: adapter.limits.maxTextureDimension2D
    }
  });
  getGlobalLiteRt().setWebGpuDevice(device);
}

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
    // GPU errors (e.g. running out of memory) otherwise only show as wrong outputs
    const device = gpuInput?.environment.webGpuDevice;
    if (device) {
      device.addEventListener("uncapturederror", (event) => {
        console.error("WebGPU error", (event as GPUUncapturedErrorEvent).error.message);
      });
      void device.lost.then((info) => console.error("WebGPU device lost", info.reason, info.message));
    }
  } catch (error) {
    deleteGpuInput();
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
  // Served from node_modules in dev, copied to litert/<version>/ by vite.config.ts in builds
  const wasmPath: string = import.meta.env.DEV ? "/node_modules/@litertjs/core/wasm/" : `litert/${LITERT_VERSION}/`;
  // Wasm threads need SharedArrayBuffer, which needs a cross-origin isolated page
  await loadLiteRt(wasmPath, { jspi: "Suspending" in WebAssembly, threads: crossOriginIsolated });

  if (isWebGPUSupported()) {
    try {
      if (navigator.userAgent.includes("Firefox/")) {
        await setDeviceWithoutF16();
      }
      return await loadWebGpu();
    } catch (error) {
      console.warn("WebGPU failed, falling back to the CPU", error);
    }
  } else {
    console.warn("WebGPU is not available, falling back to the CPU");
  }
  return await loadWasm();
}

let loading: Promise<CompiledModel> | null = null;

// Loads the model once, however often it is called. Every caller's ref gets it, as a
// remounted App (e.g. after a hot reload) asks again with a fresh, empty ref.
export const loadChessqueriesOnce = (modelRef: ModelRefs["chessqueriesModelRef"]): Promise<void> => {
  if (modelRef.current !== null) {
    return Promise.resolve();
  }

  if (loading === null) {
    loading = loadChessqueries().catch((error: unknown) => {
      loading = null;
      throw error;
    });
  }
  return loading.then((model) => {
    modelRef.current = model;
  });
}

// RGBA bytes as the model takes them, viewing the canvas data without a copy. Used on the CPU, and on WebGPU without external textures.
const getPixels = (video: HTMLVideoElement, roi: Roi | null): Uint8Array<ArrayBuffer> => {
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
  return new Uint8Array<ArrayBuffer>(imageData.data.buffer);
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

// Probabilities in FEN order (a8..h1) -> 64x13 state in square order (a1..h8)
const toUpdate = (probs: Float32Array): number[][] => {
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
  const { probs, centroids } = await run(model, video, roi);
  const width: number = (roi === null) ? video.videoWidth : roi.width;
  const height: number = (roi === null) ? video.videoHeight : roi.height;
  return {
    update: toUpdate(probs),
    direction: (centroids === null) ? null : toDirection(centroids, width, height)
  };
}
