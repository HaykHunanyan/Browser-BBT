const { contextBridge, ipcRenderer } = require('electron');

async function applyFingerprint() {
  const fp = await ipcRenderer.invoke('get-active-fingerprint');
  console.log('🧠 preload fingerprint:', fp);

  if (!fp) {
    console.warn('⚠️ No fingerprint received');
    return;
  }

  // 🌍 TIMEZONE
  Intl.DateTimeFormat = new Proxy(Intl.DateTimeFormat, {
    apply(target) {
      return new target('en-US', { timeZone: fp.timezone });
    }
  });

  // 🖥 PLATFORM
  Object.defineProperty(navigator, 'platform', {
    get: () => fp.platform
  });

  // 🌐 LANGUAGE
  Object.defineProperty(navigator, 'language', {
    get: () => fp.language
  });

  // 🎮 WEBGL
  const getParameter = WebGLRenderingContext.prototype.getParameter;
  WebGLRenderingContext.prototype.getParameter = function (param) {
    if (param === 37445) return fp.webgl.vendor;
    if (param === 37446) return fp.webgl.renderer;
    return getParameter.call(this, param);
  };

  console.log('✅ Fingerprint applied');
}

process.once('loaded', applyFingerprint);

contextBridge.exposeInMainWorld('api', {
  switchProfile: (profile) => ipcRenderer.send('switch-profile', profile),
  getProfiles: () => ipcRenderer.invoke('get-profiles'),
  createProfile: () => ipcRenderer.invoke('create-profile'),
  log: (msg) => console.log(msg),
  loadURL: (url) => ipcRenderer.send('load-url', url)
});
