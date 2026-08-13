// Serves tools/theme-preview/index.html against the real theme assets, so the CSS
// can be eyeballed without a Shopify store. Not part of the theme upload.
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..", "shopify-theme");
const HARNESS = __dirname;
const PORT = process.env.PORT || 4200;
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".wav": "audio/wav",
};

http
  .createServer((req, res) => {
    let urlPath = decodeURIComponent(req.url.split("?")[0]);
    const base = urlPath === "/" ? HARNESS : ROOT;
    if (urlPath === "/") urlPath = "/index.html";
    const filePath = path.join(base, path.normalize(urlPath));
    if (!filePath.startsWith(ROOT) && !filePath.startsWith(HARNESS)) {
      res.writeHead(403);
      return res.end("Forbidden");
    }
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        return res.end("Not found");
      }
      res.writeHead(200, { "Content-Type": TYPES[path.extname(filePath)] || "application/octet-stream" });
      res.end(data);
    });
  })
  .listen(PORT, () => console.log("theme preview on http://localhost:" + PORT));
