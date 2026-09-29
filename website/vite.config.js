import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
const blogRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../content/blog");
const websiteRoot = path.dirname(new URL(import.meta.url).pathname);
const siteBase = "/charge-weave-app/";
const categories = new Set([
  "Charging operations",
  "Platform architecture",
  "Commercial models",
  "Energy & flexibility",
  "Interoperability",
]);

function readFrontmatter(source) {
  const match = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/);
  if (!match) return null;
  const values = {};
  for (const line of match[1].split(/\r?\n/)) {
    const pair = line.match(/^([a-zA-Z][\w-]*):\s*(.*)$/);
    if (!pair) continue;
    let value = pair[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    values[pair[1]] = value;
  }
  return { values, body: source.slice(match[0].length).trim() };
}

function readPublishedArticles() {
  return fs.readdirSync(path.join(blogRoot, "articles"))
    .filter((filename) => filename.endsWith(".md") && /^[a-z0-9][a-z0-9-]*\.md$/.test(filename))
    .map((filename) => {
      const source = fs.readFileSync(path.join(blogRoot, "articles", filename), "utf8");
      const parsed = readFrontmatter(source);
      if (!parsed) return null;
      const { values, body } = parsed;
      if (values.published !== "true" || !values.title || !values.summary || !values.date || !categories.has(values.category)) return null;
      return {
        title: values.title,
        summary: values.summary,
        category: values.category,
        date: values.date,
        author: values.author || "",
        slug: filename.replace(/\.md$/i, ""),
        body,
        sourcePath: `articles/${filename}`,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.date.localeCompare(a.date));
}

const publishedArticles = readPublishedArticles();
const generatedContent = path.join(websiteRoot, "src", "generated", "blog-content.json");
fs.mkdirSync(path.dirname(generatedContent), { recursive: true });
fs.writeFileSync(generatedContent, `${JSON.stringify(publishedArticles, null, 2)}\n`);

function normalizeAsset(article, relativePath) {
  const parts = article.sourcePath.split("/").slice(0, -1);
  for (const part of relativePath.split(/[?#]/, 1)[0].split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") parts.pop();
    else parts.push(part);
  }
  const target = parts.join("/");
  return target.startsWith("assets/") ? target : null;
}

const publishedAssets = new Set();
for (const article of publishedArticles) {
  for (const match of article.body.matchAll(/!\[[^\]]*\]\(([^\s)]+)/g)) {
    const url = match[1];
    if (/^(?:[a-z]+:|\/|#)/i.test(url)) continue;
    const target = normalizeAsset(article, url);
    if (target && fs.existsSync(path.join(blogRoot, target))) publishedAssets.add(target);
  }
}

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[char]);
const pages = {
  blog: [
    "ChargeWeave insights",
    "Perspectives on charging operations, platform architecture, commercial models, energy and interoperability.",
  ],
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
  "developer/models": [
    "Model package provider",
    "Learn how the app loads versioned ontology and constraint packages through a replaceable provider contract.",
  ],
  "developer/replay": [
    "Deterministic replay",
    "Learn how a seeded scenario, virtual clock and versioned fault plan make ChargeWeave process tests reproducible.",
  ],
};

for (const article of publishedArticles) pages[`blog/${article.slug}`] = [article.title, article.summary];
export default defineConfig({
  plugins: [
    react(),
    {
      name: "static-page-entries",
      configureServer(server) {
        const assetPrefix = `${siteBase.replace(/\/$/, "")}/blog/assets/`;
        const types = { ".gif": "image/gif", ".jpeg": "image/jpeg", ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp" };
        server.middlewares.use((request, response, next) => {
          const pathname = new URL(request.url || "/", "http://vite.local").pathname;
          if (!pathname.startsWith(assetPrefix)) return next();
          let asset;
          try { asset = `assets/${decodeURIComponent(pathname.slice(assetPrefix.length))}`; }
          catch { response.statusCode = 400; response.end(); return; }
          if (!publishedAssets.has(asset)) { response.statusCode = 404; response.end(); return; }
          const filename = path.resolve(blogRoot, asset);
          response.setHeader("Content-Type", types[path.extname(filename).toLowerCase()] || "application/octet-stream");
          fs.createReadStream(filename).on("error", () => { response.statusCode = 404; response.end(); }).pipe(response);
        });
      },
      writeBundle() {
        for (const asset of publishedAssets) {
          const source = path.join(blogRoot, asset);
          const destination = path.join("dist", "blog", asset);
          fs.mkdirSync(path.dirname(destination), { recursive: true });
          fs.copyFileSync(source, destination);
        }
        const html = fs.readFileSync("dist/index.html", "utf8");
        for (const [slug, [title, description]] of Object.entries(pages)) {
          const dir = path.join("dist", slug);
          fs.mkdirSync(dir, { recursive: true });
          const content = html
            .replace(
              /<title>[^<]*<\/title>/,
              `<title>${escapeHtml(title)} — ChargeWeave</title>`,
            )
            .replace(
              /(name="description"\s+content=")[^"]*/g,
              (_match, prefix) => prefix + escapeHtml(description),
            )
            .replace(
              /(property="og:title"\s+content=")[^"]*/g,
              (_match, prefix) => prefix + escapeHtml(`${title} — ChargeWeave`),
            )
            .replace(
              /(property="og:description"\s+content=")[^"]*/g,
              (_match, prefix) => prefix + escapeHtml(description),
            )
            .replace(
              "https://pli-poc.github.io/charge-weave-app/",
              "https://pli-poc.github.io/charge-weave-app/" + slug + "/",
            );
          fs.writeFileSync(path.join(dir, "index.html"), content);
        }
      },
    },
  ],
  base: siteBase,
  build: {
    target: "es2022",
    sourcemap: false,
    minify: "esbuild",
    cssMinify: "esbuild",
    rollupOptions: {
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
        manualChunks(id) {
          if (id.includes("node_modules")) return "vendor";
        },
      },
    },
  },
  server: { allowedHosts: ["terminal.local"] },
});
