// Minimal static file server for the Chirp'n 3rd landing page (web/).
// Honors the PORT env var (falls back to 5173) so it works with managed preview runners.
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "web");
const PORT = process.env.PORT || 5173;
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".m4a": "audio/mp4",
  ".ogg": "audio/ogg",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

http
  .createServer((req, res) => {
    let urlPath = decodeURIComponent(req.url.split("?")[0]);
    const host = (req.headers.host || "").toLowerCase();
    // new.chirpn3rd.com fronts the Chirpn3rd Online rebrand mockup
    if (urlPath === "/" && host.startsWith("new.")) urlPath = "/mockups/chirpn-online.html";
    if (urlPath === "/") urlPath = "/index.html";
    if (urlPath === "/mockups/chirpn-online") urlPath = "/mockups/chirpn-online.html";
    const filePath = path.join(ROOT, path.normalize(urlPath));
    if (!filePath.startsWith(ROOT)) {
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
  .listen(PORT, () => console.log(`Chirp'n 3rd serving web/ on http://localhost:${PORT}`));
