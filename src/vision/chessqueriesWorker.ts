// Runs the model on the CPU, off the main thread. A CPU run blocks its thread for the whole
// inference (about 0.2 s with threads and 1.2 s without on a desktop), which would freeze the page.
import { type CompiledModel, loadAndCompile, loadLiteRt, supportsFeature, Tensor } from "@litertjs/core";
import { CHESSQUERIES_SIZE } from "../utils/constants";

export type WorkerCall = { type: "load", wasmUrl: string, modelUrl: string } | { type: "run", pixels: Uint8Array<ArrayBuffer> };
export type WorkerRequest = WorkerCall & { id: number };
// The model's outputs, or why the request failed
export type WorkerResponse = { id: number, arrays: Float32Array<ArrayBuffer>[] } | { id: number, error: string };

const INPUT_SHAPE: number[] = [1, CHESSQUERIES_SIZE, CHESSQUERIES_SIZE, 4];

let model: CompiledModel | null = null;
// Requests are handled one at a time, so runs never overlap on the model
let queue: Promise<unknown> = Promise.resolve();

const run = async (pixels: Uint8Array<ArrayBuffer>): Promise<Float32Array<ArrayBuffer>[]> => {
  if (model === null) {
    throw new Error("Piece detection is not ready");
  }
  const input = new Tensor(pixels, INPUT_SHAPE);
  let outputs: Tensor[];
  try {
    outputs = await model.run(input);
  } finally {
    input.delete();
  }
  return outputs.map((output) => {
    try {
      return output.toTypedArray() as Float32Array<ArrayBuffer>;
    } finally {
      output.delete();
    }
  });
}

// LiteRT.js's runtime is an Emscripten script made for a page, so it is patched to run in a module worker
const patchRuntime = (wasmUrl: string) => {
  const scope = self as unknown as {
    importScripts: (...urls: string[]) => void,
    Module: { locateFile: (path: string) => string },
    Worker: typeof Worker
  };
  // The last runtime script run, which its threads start from
  let runtimeUrl: string = "";
  // LiteRT.js runs the runtime with importScripts, which module workers do not allow, so it is fetched
  // and run globally instead. The fetch must be synchronous, as LiteRT.js does not wait for importScripts.
  scope.importScripts = (...urls: string[]) => {
    for (const url of urls) {
      const request = new XMLHttpRequest();
      request.open("GET", url, false);
      request.send();
      if (request.status !== 200) {
        throw new Error(`Unable to load ${url} (${request.status})`);
      }
      runtimeUrl = url;
      // Called through globalThis, so the script's top-level vars become globals, as with importScripts
      // biome-ignore lint/security/noGlobalEval: runs LiteRT.js's own runtime script
      globalThis.eval(`${request.responseText}\n//# sourceURL=${url}`);
    }
  };
  // In a worker, the runtime looks for its .wasm next to the running script, which is this file
  scope.Module = { locateFile: (path: string) => new URL(path, wasmUrl).href };
  // and starts its threads from this file too, so they are pointed at the runtime
  const NativeWorker = scope.Worker;
  scope.Worker = class extends NativeWorker {
    constructor(url: string | URL, options?: WorkerOptions) {
      super((options?.name === "em-pthread") ? runtimeUrl : url, options);
    }
  };
}

const load = async (wasmUrl: string, modelUrl: string): Promise<Float32Array<ArrayBuffer>[]> => {
  patchRuntime(wasmUrl);
  // Threads need SharedArrayBuffer (a cross-origin isolated page) and relaxed SIMD
  const threaded: boolean = crossOriginIsolated && await supportsFeature("relaxedSimd");
  await loadLiteRt(wasmUrl, { jspi: !threaded && "Suspending" in WebAssembly, threads: threaded });
  model = await loadAndCompile(modelUrl, {
    accelerator: "wasm",
    cpuOptions: { numThreads: threaded ? navigator.hardwareConcurrency : 1 }
  });
  // Warm up, so the first frame is not slow
  await run(new Uint8Array(CHESSQUERIES_SIZE * CHESSQUERIES_SIZE * 4));
  return [];
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  queue = queue
    .then(() => (request.type === "load") ? load(request.wasmUrl, request.modelUrl) : run(request.pixels))
    .then((arrays) => {
      const response: WorkerResponse = { id: request.id, arrays };
      self.postMessage(response, { transfer: arrays.map((array) => array.buffer) });
    })
    .catch((error: unknown) => {
      const response: WorkerResponse = { id: request.id, error: (error instanceof Error) ? error.message : String(error) };
      self.postMessage(response);
    });
}
