const { app, BrowserWindow, shell } = require('electron');
const { createServer } = require('http');
const { createReadStream } = require('fs');
const { stat } = require('fs/promises');
const path = require('path');

let staticServer = null;
let staticServerUrl = null;

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
};

function resolveDistPath(urlPath) {
  const distDir = path.resolve(__dirname, 'dist');
  const decodedPath = decodeURIComponent((urlPath || '/').split('?')[0]);
  const requestedPath = decodedPath === '/' ? '/index.html' : decodedPath;
  const normalizedPath = path.normalize(requestedPath).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.resolve(distDir, `.${path.sep}${normalizedPath}`);

  if (!filePath.startsWith(distDir)) return null;
  return filePath;
}

function startStaticServer() {
  if (staticServerUrl) return Promise.resolve(staticServerUrl);

  const server = createServer(async (req, res) => {
    const filePath = resolveDistPath(req.url);
    if (!filePath) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Forbidden');
      return;
    }

    try {
      const fileStat = await stat(filePath);
      if (!fileStat.isFile()) throw new Error('Not a file');
      res.writeHead(200, {
        'Content-Type': mimeTypes[path.extname(filePath)] || 'application/octet-stream',
        'Cache-Control': 'no-cache',
      });
      createReadStream(filePath).pipe(res);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
    }
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      staticServer = server;
      staticServerUrl = `http://127.0.0.1:${address.port}`;
      resolve(staticServerUrl);
    });
  });
}

async function createWindow() {
  const appUrl = await startStaticServer();
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Land of Power',
    backgroundColor: '#0d2137',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.loadURL(`${appUrl}/index.html`);
  win.setMenuBarVisibility(false);

  // Open external links in the user's browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (staticServer) staticServer.close();
  app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
