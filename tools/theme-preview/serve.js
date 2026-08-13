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
    if (urlPath === "/") urlPath = "/index.html";
    const rel = path.normalize(urlPath);
    // harness pages win; anything else (assets/*) comes from the real theme
    const candidates = [path.join(HARNESS, rel), path.join(ROOT, rel)].filter(
      (p) => p.startsWith(HARNESS) || p.startsWith(ROOT)
    );
    const send = (i) => {
      if (i >= candidates.length) {
        res.writeHead(404);
        return res.end("Not found");
      }
      fs.readFile(candidates[i], (err, data) => {
        if (err) return send(i + 1);
        res.writeHead(200, {
          "Content-Type": TYPES[path.extname(candidates[i])] || "application/octet-stream",
        });
        res.end(data);
      });
    };
    send(0);
  })
  .listen(PORT, () => console.log("theme preview on http://localhost:" + PORT));
