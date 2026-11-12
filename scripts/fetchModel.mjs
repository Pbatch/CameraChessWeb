// Downloads the piece model named in src/model.json from Hugging Face into public/models, with its LICENSE and
// NOTICE, so the site serves its own copy. Runs before `npm start` and `npm run build`; does nothing if the model
// is already there with the right hash.
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const model = JSON.parse(fs.readFileSync(path.join(root, "src/model.json"), "utf8"));
const dir = path.join(root, "public/models");
const base = `https://huggingface.co/${model.repo}/resolve/${model.commit}`;

const sha256 = (file) => createHash("sha256").update(fs.readFileSync(file)).digest("hex");

const download = async (name) => {
  const response = await fetch(`${base}/${name}`);
  if (!response.ok) {
    throw new Error(`Downloading ${name} failed: ${response.status} ${response.statusText}`);
  }
  return Buffer.from(await response.arrayBuffer());
};

fs.mkdirSync(dir, { recursive: true });
const target = path.join(dir, model.file);
if (fs.existsSync(target) && sha256(target) === model.sha256) {
  process.exit(0);
}

console.log(`Downloading ${model.file} from Hugging Face`);
const bytes = await download(model.file);
const hash = createHash("sha256").update(bytes).digest("hex");
if (hash !== model.sha256) {
  throw new Error(`${model.file} has SHA-256 ${hash}, but src/model.json expects ${model.sha256}`);
}
// The model's weights are under their own licence, which has to travel with them
for (const name of ["LICENSE", "NOTICE"]) {
  fs.writeFileSync(path.join(dir, name), await download(name));
}
// Only the current model goes into the build; old ones stay on the server for clients not yet updated
for (const name of fs.readdirSync(dir)) {
  if (name.endsWith(".tflite")) {
    fs.rmSync(path.join(dir, name));
  }
}
fs.writeFileSync(target, bytes);
