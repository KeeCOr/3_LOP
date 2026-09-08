const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

// Steamworks SDK — graceful fallback if running outside Steam
// TODO: Replace APP_ID (480 = Spacewar test app) with actual Steam App ID before release
const pkg = require('../package.json');

const STEAM_APP_ID = 480;
let steam = null;
try {
  steam = require('steamworks.js');
  steam.init(STEAM_APP_ID);
  console.log('[Steam] Initialized, user:', steam.localplayer.getName());
} catch (e) {
  console.warn('[Steam] Not available — game runs without Steam features:', e.message);
}

// ── Steam IPC 핸들러 ──────────────────────────────────────────────────────────

// 기본 정보
ipcMain.on('steam:available',    e => { e.returnValue = steam !== null; });
ipcMain.on('steam:getUserName',  e => { e.returnValue = steam ? steam.localplayer.getName() : null; });

// 클라우드 세이브
ipcMain.on('steamCloud:isEnabled', e => {
  e.returnValue = steam !== null && steam.cloud.isCloudEnabled();
});
ipcMain.handle('steamCloud:save', async (_, key, data) => {
  if (!steam) return false;
  try {
    steam.cloud.writeFile(key, Buffer.from(JSON.stringify(data), 'utf-8'));
    return true;
  } catch (e) { console.error('[SteamCloud] save:', e); return false; }
});
ipcMain.handle('steamCloud:load', async (_, key) => {
  if (!steam) return null;
  try {
    const buf = steam.cloud.readFile(key);
    return JSON.parse(buf.toString('utf-8'));
  } catch { return null; }
});
ipcMain.handle('steamCloud:delete', async (_, key) => {
  if (!steam) return false;
  try { steam.cloud.deleteFile(key); return true; }
  catch { return false; }
});

// 도전과제
ipcMain.handle('achievement:unlock', async (_, id) => {
  if (!steam) return false;
  try { steam.achievement.activate(id); return true; }
  catch (e) { console.error('[Achievement] unlock:', e); return false; }
});
ipcMain.on('achievement:isUnlocked', (e, id) => {
  e.returnValue = steam ? steam.achievement.isActivated(id) : false;
});

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
};

let server;

function startStaticServer(outDir) {
  server = http.createServer((req, res) => {
    let filePath = path.join(outDir, req.url.split('?')[0]);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(outDir, 'index.html');
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });

  return new Promise(resolve => {
    server.listen(0, '127.0.0.1', () => resolve(server.address().port));
  });
}

async function createWindow() {
  const outDir = path.join(__dirname, '..', 'out');
  const port = await startStaticServer(outDir);

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    title: `Lord of Poly v${pkg.version}`,
    autoHideMenuBar: true,
  });

  win.loadURL(`http://127.0.0.1:${port}`);

  // F11 — fullscreen toggle
  win.webContents.on('before-input-event', (_, input) => {
    if (input.key === 'F11' && input.type === 'keyDown') {
      win.setFullScreen(!win.isFullScreen());
    }
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (server) server.close();
  app.quit();
});
