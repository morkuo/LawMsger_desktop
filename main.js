const { join } = require('path');

const { app, BrowserWindow, Tray, nativeImage, ipcMain } = require('electron');

function createWindow() {
  const win = new BrowserWindow({
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
    },
    // autoHideMenuBar: true,
  });

  win.loadFile(join(__dirname, 'public/index.html'));
  win.maximize();

  return win;
}

function createTray(win) {
  const image = nativeImage.createFromPath(join(__dirname, 'public/images/icon.png'));

  let tray = new Tray(image.resize({ width: 16, height: 16 }));

  tray.setToolTip('Law Msger');

  tray.on('click', () => {
    win.show();
  });

  return tray;
}

app.commandLine.appendSwitch('ignore-certificate-errors');
app.commandLine.appendSwitch('disable-http-cache');

app.whenReady().then(() => {
  const win = createWindow();
  createTray(win);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
