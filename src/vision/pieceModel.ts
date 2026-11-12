import { version as LITERT_VERSION } from "@litertjs/core/package.json";
import { loadModel, type Model } from "@chesscam/recorder";
import modelFile from "../model.json";
import type { ModelRefs } from "../types";

// Served by the site itself, as scripts/fetchModel.mjs puts it in public/models. A function, as tests import this
// module where there is no document.
const modelUrl = (): string => new URL(`models/${modelFile.file}`, document.baseURI).href;
// Served from node_modules in dev, copied to litert/<version>/ by vite.config.ts in builds. Both are the page's own
// origin, so the model can use threads.
const wasmPath: string = import.meta.env.DEV ? "/node_modules/@litertjs/core/wasm/" : `litert/${LITERT_VERSION}/`;

let loading: Promise<Model> | null = null;

// Loads the model once, however often it is called. Every caller's ref gets it, as a
// remounted App (e.g. after a hot reload) asks again with a fresh, empty ref.
export const loadPieceModelOnce = (modelRef: ModelRefs["modelRef"]): Promise<void> => {
  if (modelRef.current !== null) {
    return Promise.resolve();
  }

  if (loading === null) {
    loading = loadModel({ modelUrl: modelUrl(), wasmUrl: new URL(wasmPath, document.baseURI).href })
      .catch((error: unknown) => {
        loading = null;
        throw error;
      });
  }
  return loading.then((model) => {
    modelRef.current = model;
  });
}
