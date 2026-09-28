import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const websiteDir = path.resolve(scriptDir, "..");
const blogDir = path.resolve(websiteDir, "../content/blog");
const articleDir = path.join(blogDir, "articles");
const assetsDir = path.join(blogDir, "assets");
const categories = new Set([
  "Charging operations",
  "Platform architecture",
  "Commercial models",
  "Energy & flexibility",
  "Interoperability",
]);
const imageExtensions = new Set([".gif", ".jpeg", ".jpg", ".png", ".svg", ".webp"]);
const publishedAssets = new Set();
const publishedArticles = [];

function fail(message) {
  console.error(`Blog content check failed: ${message}`);
  process.exitCode = 1;
}

function parseFrontmatter(source, filename) {
  const match = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/);
  if (!match) throw new Error(`${filename}: missing YAML front matter`);
  const fields = {};
  for (const line of match[1].split(/\r?\n/)) {
    const pair = line.match(/^([a-zA-Z][\w-]*):\s*(.*)$/);
    if (!pair) continue;
    const raw = pair[2].trim();
    fields[pair[1]] = raw.replace(/^(?:"([\s\S]*)"|'([\s\S]*)')$/, (_, doubleQuoted, singleQuoted) => doubleQuoted ?? singleQuoted);
  }
  return { fields, body: source.slice(match[0].length) };
}

function localImageTarget(articlePath, url) {
  const localUrl = url.split(/[?#]/, 1)[0];
  if (!localUrl || /^(?:[a-z][a-z\d+.-]*:|\/|#)/i.test(localUrl)) return null;
  const target = path.resolve(path.dirname(articlePath), localUrl);
  const relativeToAssets = path.relative(assetsDir, target);
  if (relativeToAssets.startsWith("..") || path.isAbsolute(relativeToAssets)) {
    throw new Error(`${path.relative(blogDir, articlePath)}: image must be stored under content/blog/assets: ${url}`);
  }
  if (!imageExtensions.has(path.extname(target).toLowerCase())) {
    throw new Error(`${path.relative(blogDir, articlePath)}: unsupported image file type: ${url}`);
  }
  if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
    throw new Error(`${path.relative(blogDir, articlePath)}: linked image does not exist: ${url}`);
  }
  return relativeToAssets;
}

for (const filename of fs.readdirSync(articleDir).filter((name) => name.endsWith(".md"))) {
  if (!/^[a-z0-9][a-z0-9-]*\.md$/.test(filename)) {
    fail(`${filename}: use a lowercase, URL-safe article filename`);
    continue;
  }
  const articlePath = path.join(articleDir, filename);
  try {
    const { fields, body } = parseFrontmatter(fs.readFileSync(articlePath, "utf8"), filename);
    for (const required of ["title", "summary", "category", "date", "published"]) {
      if (!fields[required]) throw new Error(`${filename}: missing ${required} front matter`);
    }
    if (!categories.has(fields.category)) throw new Error(`${filename}: unknown category “${fields.category}”`);
    const date = new Date(`${fields.date}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fields.date) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== fields.date) {
      throw new Error(`${filename}: date must use YYYY-MM-DD`);
    }
    if (!new Set(["true", "false"]).has(fields.published)) throw new Error(`${filename}: published must be true or false`);
    if (fields.published !== "true") continue;

    const slug = filename.slice(0, -3);
    const targets = [];
    for (const match of body.matchAll(/!\[[^\]]*\]\(([^\s)]+)/g)) {
      const target = localImageTarget(articlePath, match[1]);
      if (target) targets.push(target);
    }
    for (const target of targets) publishedAssets.add(target);
    publishedArticles.push({ slug, targets });
  } catch (error) {
    fail(error.message);
  }
}

if (process.exitCode) process.exit(process.exitCode);

if (process.argv.includes("--built")) {
  const distDir = path.join(websiteDir, "dist");
  for (const article of publishedArticles) {
    const page = path.join(distDir, "blog", article.slug, "index.html");
    if (!fs.existsSync(page)) fail(`${article.slug}: published article page is missing from the site build`);
  }
  for (const asset of publishedAssets) {
    const builtAsset = path.join(distDir, "blog", "assets", asset);
    if (!fs.existsSync(builtAsset)) fail(`${asset}: referenced image is missing from the site build`);
  }
}

if (!process.exitCode) {
  console.log(`Blog content OK: ${publishedArticles.length} published article(s), ${publishedAssets.size} linked asset(s)${process.argv.includes("--built") ? "; built routes and assets verified" : ""}.`);
}
