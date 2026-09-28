const articleFiles = import.meta.glob("../../content/blog/articles/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
});

const imageFiles = import.meta.glob("../../content/blog/assets/**/*.{png,jpg,jpeg,webp,gif,svg}", {
  eager: true,
  query: "?url",
  import: "default",
});

function scalar(value = "") {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseArticle(file, source) {
  const match = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/);
  if (!match) return null;
  const metadata = {};
  for (const line of match[1].split(/\r?\n/)) {
    const pair = line.match(/^([a-zA-Z][\w-]*):\s*(.*)$/);
    if (pair) metadata[pair[1]] = scalar(pair[2]);
  }
  const filename = file.split("/").at(-1);
  const slug = filename.replace(/\.md$/i, "");
  return {
    ...metadata,
    published: metadata.published === "true",
    slug,
    body: source.slice(match[0].length).trim(),
    sourcePath: `articles/${filename}`,
  };
}

export const categories = [
  "Charging operations",
  "Platform architecture",
  "Commercial models",
  "Energy & flexibility",
  "Interoperability",
];

export const articles = Object.entries(articleFiles)
  .map(([file, source]) => parseArticle(file, source))
  .filter((article) => article?.published && article.title && article.summary && article.category && article.date)
  .sort((a, b) => b.date.localeCompare(a.date));

function normalizeRelativePath(basePath, relativePath) {
  const parts = [...basePath.split("/").slice(0, -1)];
  for (const part of relativePath.split(/[?#]/, 1)[0].split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") parts.pop();
    else parts.push(part);
  }
  return parts.join("/");
}

function imageKey(path) {
  const marker = "/content/blog/assets/";
  const index = path.indexOf(marker);
  return index >= 0 ? `assets/${path.slice(index + marker.length)}` : path;
}

const imageUrls = Object.fromEntries(
  Object.entries(imageFiles).map(([file, url]) => [imageKey(file), url]),
);

export function articleMarkdown(article, mode = "render") {
  return article.body.replace(/(!\[[^\]]*\]\()([^\s)]+)([^)]*\))/g, (match, start, url, end) => {
    if (/^(?:[a-z]+:|\/|#)/i.test(url)) return match;
    const target = normalizeRelativePath(article.sourcePath, url);
    if (!target.startsWith("assets/")) return match;
    if (mode === "copy") {
      return `${start}https://pli-poc.github.io/charge-weave/blog/${target}${end}`;
    }
    return `${start}${imageUrls[target] ?? `${import.meta.env.BASE_URL}blog/${target}`}${end}`;
  });
}

export function markdownForLinkedIn(article) {
  return `# ${article.title}\n\n${article.summary}\n\n${articleMarkdown(article, "copy")}`;
}
