const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const ytdl = require('ytdl-core');
const search = require('yt-search');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
    width: 800,
    height: 750,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('download-music', async (event, songList, downloadPath) => {
  const results = [];
  
  if (!downloadPath) {
    downloadPath = app.getPath('music');
  }

  if (!fs.existsSync(downloadPath)) {
    fs.mkdirSync(downloadPath, { recursive: true });
  }

  for (const songName of songList) {
    try {
      mainWindow.webContents.send('log', `Searching: ${songName}`);
      
      const searchResults = await search(songName + ' audio');
      const video = searchResults.all[0];
      
      if (!video) {
        throw new Error('No video found');
      }

      const safeName = songName.replace(/[<>:"/\\|?*]/g, '');
      const outputPath = path.join(downloadPath, `${safeName}.webm`);

      mainWindow.webContents.send('log', `Downloading: ${video.title}`);

      await new Promise((resolve, reject) => {
        ytdl('https://www.youtube.com/watch?v=' + video.videoId, { quality: 'highestaudio' })
          .pipe(fs.createWriteStream(outputPath))
          .on('finish', resolve)
          .on('error', reject);
      });

      results.push({ song: songName, status: 'success', path: outputPath });
      mainWindow.webContents.send('log', `Done: ${video.title}`, 'success');
      
    } catch (error) {
      results.push({ song: songName, status: 'error', message: error.message });
      mainWindow.webContents.send('log', `Error: ${songName} - ${error.message}`, 'error');
    }
  }

  return results;
});

ipcMain.handle('select-download-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Chọn thư mục lưu nhạc'
  });
  
  if (result.canceled) {
    return null;
  }
  return result.filePaths[0];
});

ipcMain.handle('get-download-path', () => {
  return app.getPath('music');
});

ipcMain.handle('preview-songs', async (event, songList) => {
  const results = [];
  
  for (const songName of songList) {
    try {
      const searchResults = await search(songName + ' audio');
      const video = searchResults.all[0];
      
      if (video) {
        results.push({
          title: video.title,
          thumbnail: video.thumbnail,
          timestamp: video.timestamp,
          videoId: video.videoId
        });
      } else {
        results.push(null);
      }
    } catch (error) {
      results.push(null);
    }
  }

  return results;
});
