import { bundle } from "@remotion/bundler";
import { selectComposition, renderStill } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs";

const root = process.cwd();
const entry = path.join(root, "src/index.ts");
const outDir = path.join(root, "workspace/runs/ai-nguoi-moi-ep1/scenes");
fs.mkdirSync(outDir, { recursive: true });

// mid-scene frames (cumulative start + duration/2) for each of the 15 scenes
// hook + the 3 strike scenes at their post-hook (+45) mid-frames, to verify the strike fix
const frames = {
  "0": 32, "6": 1100, "12": 2453, "14": 2966,
};

console.log("bundling...");
const serveUrl = await bundle({ entryPoint: entry, onProgress: () => {} });
const composition = await selectComposition({ serveUrl, id: "ai-nguoi-moi-ep1" });
console.log("composition", composition.durationInFrames, "frames");
for (const [id, frame] of Object.entries(frames)) {
  const output = path.join(outDir, `${id}.png`);
  await renderStill({ composition, serveUrl, frame, output, overwrite: true });
  console.log("still", id, "@", frame, "->", output);
}
console.log("DONE");
