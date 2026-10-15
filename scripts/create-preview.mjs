import fs from "node:fs";
import path from "node:path";
const directory = path.resolve("dist");
let html = fs.readFileSync(path.join(directory, "index.html"), "utf8");
const files = fs.readdirSync(path.join(directory, "assets"));
const scripts = files.filter((file) => file.endsWith(".js"));
// A standalone HTML must never silently depend on another JS chunk.
if (scripts.length !== 1)
  throw new Error(
    "Standalone packaging requires exactly one JS bundle. Configure inlineDynamicImports or use an HTML bundler.",
  );
html = html.replace(
  /<script\b[^>]*src="([^"]+)"[^>]*><\/script>/g,
  (_, source) => {
    const js = fs.readFileSync(
      path.join(directory, source.replace(/^\//, "")),
      "utf8",
    );
    if (
      /\b(?:import|export)\s*[^;]*\bfrom\s*["']\./.test(js) ||
      /\bimport\s*\(["']\./.test(js)
    )
      throw new Error("External module dependency in standalone bundle.");
    return `<script type="module">${js.replace(/<\/script/gi, "<\\/script")}</script>`;
  },
);
html = html.replace(
  /<link\b[^>]*href="([^"]+\.css)"[^>]*>/g,
  (_, source) =>
    `<style>${fs.readFileSync(path.join(directory, source.replace(/^\//, "")), "utf8")}</style>`,
);
if (/<(?:script|link)\b[^>]*(?:src|href)="(?:\/assets|\.\/assets)/.test(html))
  throw new Error("Unresolved standalone asset.");
fs.writeFileSync("preview.html", html);
console.log(
  `Created standalone preview.html: ${Buffer.byteLength(html)} bytes`,
);
