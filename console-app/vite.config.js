import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: path.join(projectRoot, "src"),
  base: "./",
  build: {
    outDir: path.join(projectRoot, "dist"),
    emptyOutDir: true,
  },
});
