const {app, BrowserWindow, ipcMain, dialog} = require('electron');
const CRDL = require('./crdl');
const path = require('path');

if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

let window;
let queSize = 0;
let downloadFolder;

ipcMain.on('start', (event, type, link, subtitle) => {
  if (queSize >= 2) return;
  if (type === 'crdl') {
    console.log('starting');
    const crdl = new CRDL();
    crdl.on('progress', p => event.reply('update', 'crdl', crdl.instance, `${p}% done`));
    crdl.on('status', s => event.reply('update', 'crdl', crdl.instance, s));
    crdl.on('end', () => {
      event.reply('end', 'crdl', crdl.instance);
      queSize--;
    });
    while (!downloadFolder) downloadFolder = dialog.showOpenDialogSync({properties: ['openDirectory']});
    crdl.start(link, subtitle, path.join(downloadFolder[0], `${crdl.instance}.mp4`));
    queSize++;
  }
});

const init = () => {
  window = new BrowserWindow({
    icon: path.join(__dirname, '../assets/icons/512x512.png'),
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
