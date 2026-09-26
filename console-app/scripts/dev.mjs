import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(project, "src");
const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
]);
const port = Number(process.env.PORT ?? 4174);

const server = http.createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }
  let requested;
  try {
    requested = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  } catch {
    response.writeHead(400).end("Bad request");
    return;
  }
  const relative = requested === "/" ? "index.html" : requested.replace(/^\/+/, "");
  const file = path.resolve(source, relative);
  if (!file.startsWith(`${source}${path.sep}`) && file !== path.join(source, "index.html")) {
    response.writeHead(403).end("Forbidden");
    return;
  }
  try {
    const body = await fs.readFile(file);
    response.writeHead(200, {
      "Content-Type": mimeTypes.get(path.extname(file)) ?? "application/octet-stream",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not found");
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`ChargeWeave console: http://localhost:${port}/`);
});
