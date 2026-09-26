import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
const pages = {
  ontology: [
    "Ontology explorer",
    "Explore ChargeWeave classes, relationships, RDF triples, validation rules and temporal definitions.",
  ],
  capabilities: [
    "Platform capabilities",
    "Explore the planned charging, energy and commercial capabilities and their model definitions.",
  ],
  architecture: [
    "Architecture",
    "Explore the proposed ChargeWeave architecture, semantic validation and temporal data design.",
  ],
  roadmap: [
    "Development roadmap",
    "Follow the path from the current semantic foundation to the planned operational platform.",
  ],
};
export default defineConfig({
  plugins: [
    react(),
    {
      name: "static-page-entries",
      closeBundle() {
        const html = fs.readFileSync("dist/index.html", "utf8");
        for (const [slug, [title, description]] of Object.entries(pages)) {
          const dir = path.join("dist", slug);
          fs.mkdirSync(dir, { recursive: true });
          const content = html
            .replace(
              /<title>[^<]*<\/title>/,
              `<title>${title} — ChargeWeave</title>`,
            )
            .replace(
              /(name="description"\s+content=")[^"]*/g,
              `$1${description}`,
            )
            .replace(
              /(property="og:title"\s+content=")[^"]*/g,
              `$1${title} — ChargeWeave`,
            )
            .replace(
              /(property="og:description"\s+content=")[^"]*/g,
              `$1${description}`,
            )
            .replace(
              "https://pli-poc.github.io/charge-weave/",
              "https://pli-poc.github.io/charge-weave/" + slug + "/",
            );
          fs.writeFileSync(path.join(dir, "index.html"), content);
        }
      },
    },
  ],
  base: "/charge-weave/",
  server: { allowedHosts: ["terminal.local"] },
});
