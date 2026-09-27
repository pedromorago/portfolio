// A static server for _site, used by the scripts that screenshot or print the
// built pages. Folders map to their index.html; unknown paths get 404.html.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const TYPES = {
  ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".avif": "image/avif",
  ".woff2": "font/woff2", ".woff": "font/woff", ".xml": "application/xml", ".pdf": "application/pdf",
};

function serve(root) {
  const server = http.createServer((req, res) => {
    let file = path.join(root, decodeURIComponent(req.url.split("?")[0]));
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
    const found = fs.existsSync(file);
    if (!found) file = path.join(root, "404.html");
    res.writeHead(found ? 200 : 404, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

module.exports = { serve };
