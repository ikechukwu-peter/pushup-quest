// Tiny static server for local development (the app itself has no build step).
// `npm start` serves the repo at http://localhost:8765. Browsers allow the camera
// on localhost; any other address needs HTTPS.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.wasm': 'application/wasm',
  '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.task': 'application/octet-stream',
};

/**
 * Serve `root`, plus optional extra directories under URL prefixes (used by the
 * landmark extractor to expose video frames). Resolves to the listening server.
 */
export function serve({ root, port = 8765, mounts = {} }) {
  const server = createServer(async (req, res) => {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let base = root;
    for (const [prefix, dir] of Object.entries(mounts)) {
      if (path.startsWith(prefix)) { base = dir; path = path.slice(prefix.length - 1); break; }
    }
    if (path.endsWith('/')) path += 'index.html';
    const file = normalize(join(base, path));
    if (!file.startsWith(resolve(base))) { res.writeHead(403).end(); return; }
    try {
      if (!(await stat(file)).isFile()) throw 0;
      res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      res.end(await readFile(file));
    } catch {
      res.writeHead(404).end('Not found');
    }
  });
  return new Promise(ok => server.listen(port, () => ok(server)));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
  const port = Number(process.env.PORT) || 8765;
  serve({ root, port }).then(() => console.log(`Pushup Quest on http://localhost:${port}`));
}
