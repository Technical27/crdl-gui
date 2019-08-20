const { app, BrowserWindow } = require('electron');
const path = require('path');

if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

let window;

const init = () => {
  window = new BrowserWindow({
    icon: '../assets/icon.png',
    width: 812,
    height: 512,
    webPreferences: {
      nodeIntegration: true
    }
  });

  window.loadFile(path.join(__dirname, 'index.html'));

  window.on('closed', () => {
    window = null;
  });
};

app.on('ready', init);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (window === null) init();
});