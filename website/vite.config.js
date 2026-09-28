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
    "Platform architecture & design principles",
    "Read the ChargeWeave high-level design: platform layers, semantic contracts, runtime boundaries, evidence and temporal principles.",
  ],
  roadmap: [
    "Development roadmap",
    "Follow the path from the current semantic foundation to the planned operational platform.",
  ],
  developer: [
    "Developer guide",
    "Explore the browser-hosted simulator, protocol adapters, storage ports, switchboard and deterministic replay.",
  ],
  "developer/platform": [
    "Workflow runtime architecture",
    "Developer detail on generic XFlow definitions, ontology bindings, validation, XState execution and replaceable runtime ports.",
  ],
  "developer/human-tasks": [
    "Human task forms",
    "Interactive prototype of task-scoped forms guided by a workflow contract, ontology terms and explicit validation shapes.",
  ],
  "developer/simulator": [
    "Simulation workbench",
    "Run seeded roaming-charge fixtures and inspect protocol traces, process events and simulated browser stores.",
  ],
  "developer/flows": [
    "Workflow Studio",
    "Edit, inspect and run the visual XState-backed J07/J08 charge-correction workflow.",
  ],
  "developer/protocols": [
    "Protocol simulation",
    "Learn how versioned OCPP, OCPI and optional ISO 15118 adapters connect to ChargeWeave process events.",
  ],
  "developer/switchboard": [
    "Runtime switchboard",
    "Explore independent virtual, observe, hybrid and live modes for ChargeWeave protocols and simulated stores.",
  ],
  "developer/storage": [
    "Simulated storage",
    "Review the semantic, operational, temporal, telemetry and evidence store contracts used by the browser simulator.",
  ],
  "developer/replay": [
    "Deterministic replay",
    "Learn how a seeded scenario, virtual clock and versioned fault plan make ChargeWeave process tests reproducible.",
  ],
};
export default defineConfig({
  plugins: [
    react(),
    {
      name: "static-page-entries",
      writeBundle() {
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
