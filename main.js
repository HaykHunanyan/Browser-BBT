const { app, BrowserWindow, session, ipcMain,BrowserView } = require('electron');
const path = require('path');
const fs = require('fs');

const profilesPath = path.join(__dirname, 'profiles.json');

let currentWindow = null;
let activeProfile = 'profile_1';
const profiles = loadProfiles();

function loadProfiles() {
  if (!fs.existsSync(profilesPath)) {
    fs.writeFileSync(
      profilesPath,
      JSON.stringify({
        profiles: {
          profile_1: {
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            platform: "Win32",
            timezone: "UTC",
            language: "en-US",
            webgl: {
              vendor: "Google Inc.",
              renderer: "ANGLE"
            }
          }
        }
      }, null, 2)
    );
  }

  return JSON.parse(fs.readFileSync(profilesPath, 'utf-8')).profiles;
}

function saveProfiles(profiles) {
  fs.writeFileSync(
    profilesPath,
    JSON.stringify({ profiles }, null, 2)
  );
}

function createWindow(profileName) {
  const profiles = loadProfiles();

  if (!profiles[profileName]) {
    console.warn('⚠️ Profile not found, fallback to profile_1');
    profileName = 'profile_1';
  }

  activeProfile = profileName;
  console.log('🔄 switching to profile:', activeProfile);

  const browserSession = session.fromPartition(`persist:${activeProfile}`);
  const fp = profiles[activeProfile];
  browserSession.setUserAgent(fp.userAgent);

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      session: browserSession
    }
  });

  win.loadFile('index.html', {
    query: { profile: profileName }
  });

  win.webContents.openDevTools({ mode: 'detach' });
  currentWindow = win;

  // ✅ Use BrowserView (v40 safe)
  const view = new BrowserView({
    webPreferences: {
      session: browserSession,
      contextIsolation: true
    }
  });

  // attach view to window
  win.setBrowserView(view);

  // position and size
  view.setBounds({
    x: 0,
    y: 80,
    width: 1200,
    height: 720
  });

  view.setAutoResize({ width: true, height: true });

  // store view in window object
  win.browserView = view;
  // optional: open devtools for the view itself
  view.webContents.openDevTools({ mode: 'detach' });

  // resize handler
  win.on('resize', () => {
    const [w, h] = win.getContentSize();
    view.setBounds({ x: 0, y: 80, width: w, height: h - 80 });
  });

  // IPC ready signal
  win.webContents.on('did-finish-load', () => {
    win.webContents.send('view-ready');
  });
}

/* IPC */

ipcMain.handle('get-active-profile', () => activeProfile);
ipcMain.handle('get-active-fingerprint', () => profiles[activeProfile]);

ipcMain.handle('get-profiles', () => {
  return loadProfiles();
});

ipcMain.handle('create-profile', () => {
  const profiles = loadProfiles()
  const nextIndex = Object.keys(profiles).length + 1;
  const newProfileName = `profile_${nextIndex}`;

  profiles[newProfileName] = {
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X)",
    platform: "MacIntel",
    timezone: "Europe/Berlin",
    language: "de-DE",
    webgl: {
      vendor: "Apple Inc.",
      renderer: "Apple GPU"
    }
  };

  saveProfiles(profiles);
  return newProfileName;
});

ipcMain.on('switch-profile', (e, profileName) => {
  if (currentWindow) currentWindow.close();
  createWindow(profileName);
});

ipcMain.on('load-url', (_, url) => {
  const win = BrowserWindow.getAllWindows()[0]; // or from event.sender
  if (!win?.browserView) return;
  win.browserView.webContents.loadURL(url);
});
/* APP */

app.whenReady().then(() => {
  createWindow('profile_1'); // ✅ EXPLICIT
});
