import articles from "./generated/blog-content.json";

export const categories = [
  "Charging operations",
  "Platform architecture",
  "Commercial models",
  "Energy & flexibility",
  "Interoperability",
];

export { articles };

function normalizeRelativePath(basePath, relativePath) {
  const parts = basePath.split("/").slice(0, -1);
  for (const part of relativePath.split(/[?#]/, 1)[0].split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") parts.pop();
    else parts.push(part);
  }
  return parts.join("/");
}

export function articleMarkdown(article, mode = "render") {
  return article.body.replace(/(!\[[^\]]*\]\()([^\s)]+)([^)]*\))/g, (match, start, url, end) => {
    if (/^(?:[a-z]+:|\/|#)/i.test(url)) return match;
    const target = normalizeRelativePath(article.sourcePath, url);
    if (!target.startsWith("assets/")) return match;
    const imageUrl = mode === "copy"
      ? `https://pli-poc.github.io/charge-weave/blog/${target}`
      : `${import.meta.env.BASE_URL}blog/${target}`;
    return `${start}${imageUrl}${end}`;
  });
}

export function markdownForLinkedIn(article) {
  return `# ${article.title}\n\n${article.summary}\n\n${articleMarkdown(article, "copy")}`;
}
