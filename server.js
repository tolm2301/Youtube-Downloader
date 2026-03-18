const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const search = require('yt-search');

const app = express();
const PORT = 3001;

const downloadPath = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadPath)) {
  fs.mkdirSync(downloadPath, { recursive: true });
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>YouTube Music Downloader</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      max-width: 700px;
      margin: 0 auto;
      background: white;
      border-radius: 15px;
      padding: 30px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    }
    h1 { text-align: center; color: #333; margin-bottom: 20px; }
    .input-group { margin-bottom: 20px; }
    label { display: block; margin-bottom: 8px; color: #555; font-weight: 600; }
    textarea {
      width: 100%; height: 150px; padding: 12px;
      border: 2px solid #ddd; border-radius: 8px; font-size: 14px; resize: vertical;
    }
    textarea:focus { outline: none; border-color: #667eea; }
    .btn {
      width: 100%; padding: 14px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white; border: none; border-radius: 8px;
      font-size: 16px; font-weight: 600; cursor: pointer;
    }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-preview {
      background: linear-gradient(135deg, #48c6ef 0%, #6f86d6 100%);
      margin-bottom: 10px;
    }
    .progress {
      margin-top: 20px; padding: 15px;
      background: #f5f5f5; border-radius: 8px;
      max-height: 250px; overflow-y: auto;
    }
    .progress p { padding: 5px 0; font-size: 13px; color: #666; }
    .progress p.error { color: #e74c3c; }
    .progress p.success { color: #27ae60; }
    .path-display {
      margin-top: 15px; padding: 10px;
      background: #e8f4f8; border-radius: 6px; font-size: 13px; color: #2980b9;
    }
    .stats {
      display: flex; justify-content: space-between;
      margin-top: 15px; padding: 10px;
      background: #f8f9fa; border-radius: 6px;
    }
    .stat-item { text-align: center; }
    .stat-item span { font-size: 24px; font-weight: bold; color: #667eea; }
    .stat-item p { font-size: 12px; color: #666; }
    .preview-container {
      margin-top: 20px;
      max-height: 400px;
      overflow-y: auto;
    }
    .preview-item {
      display: flex;
      align-items: center;
      padding: 10px;
      background: #f8f9fa;
      border-radius: 8px;
      margin-bottom: 8px;
    }
    .preview-item img {
      width: 120px;
      height: 68px;
      object-fit: cover;
      border-radius: 4px;
      margin-right: 12px;
    }
    .preview-info { flex: 1; }
    .preview-info .title { font-size: 14px; font-weight: 600; color: #333; }
    .preview-info .meta { font-size: 12px; color: #666; }
    .preview-item.error { background: #ffeaea; }
    .preview-loading { text-align: center; padding: 20px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <h1>YouTube Music Downloader</h1>
    <div class="input-group">
      <label>Danh sách bài hát (mỗi bài một dòng):</label>
      <textarea id="songList" placeholder="Tên bài hát 1\nTên bài hát 2\nTên bài hát 3"></textarea>
    </div>
    <button id="previewBtn" class="btn btn-preview">Xem trước</button>
    <button id="downloadBtn" class="btn">Tải xuống</button>
    <div class="path-display" id="pathDisplay">Thư mục lưu: downloads</div>
    <div class="stats">
      <div class="stat-item"><span id="successCount">0</span><p>Thành công</p></div>
      <div class="stat-item"><span id="errorCount">0</span><p>Thất bại</p></div>
    </div>
    <div class="preview-container" id="previewArea"></div>
    <div class="progress" id="logArea"></div>
  </div>
  <script>
    const songListInput = document.getElementById('songList');
    const previewBtn = document.getElementById('previewBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const logArea = document.getElementById('logArea');
    const previewArea = document.getElementById('previewArea');
    const successCount = document.getElementById('successCount');
    const errorCount = document.getElementById('errorCount');

    function log(msg, type) {
      const p = document.createElement('p');
      p.textContent = msg;
      if (type === 'error') p.className = 'error';
      if (type === 'success') p.className = 'success';
      logArea.appendChild(p);
      logArea.scrollTop = logArea.scrollHeight;
    }

    function renderPreview(results) {
      previewArea.innerHTML = '';
      results.forEach(r => {
        const div = document.createElement('div');
        div.className = 'preview-item' + (r.error ? ' error' : '');
        if (r.error) {
          div.innerHTML = '<span style="color:#e74c3c">' + r.name + ' - Không tìm thấy</span>';
        } else {
          div.innerHTML = '<img src="' + r.thumbnail + '"><div class="preview-info"><div class="title">' + r.title + '</div><div class="meta">' + r.name + ' - ' + r.duration + '</div></div>';
        }
        previewArea.appendChild(div);
      });
    }

    previewBtn.addEventListener('click', async () => {
      const songs = songListInput.value.split('\\n').filter(s => s.trim());
      if (songs.length === 0) { log('Vui lòng nhập danh sách bài hát!', 'error'); return; }
      
      previewBtn.disabled = true;
      previewArea.innerHTML = '<div class="preview-loading">Đang tìm kiếm...</div>';
      
      try {
        const res = await fetch('/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ songs })
        });
        const data = await res.json();
        if (data.success) {
          renderPreview(data.results);
        }
      } catch (e) {
        previewArea.innerHTML = '';
      }
      previewBtn.disabled = false;
    });

    downloadBtn.addEventListener('click', async () => {
      const songs = songListInput.value.split('\\n').filter(s => s.trim());
      if (songs.length === 0) { log('Vui lòng nhập danh sách bài hát!', 'error'); return; }

      downloadBtn.disabled = true;
      previewBtn.disabled = true;
      successCount.textContent = '0';
      errorCount.textContent = '0';
      logArea.innerHTML = '';
      let success = 0, error = 0;

      log('Bắt đầu tải ' + songs.length + ' bài hát...');

      for (const songName of songs) {
        try {
          log('Searching: ' + songName);
          const res = await fetch('/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ songName })
          });
          const result = await res.json();
          if (result.success) {
            log('Done: ' + result.title, 'success');
            success++;
          } else {
            log('Error: ' + songName + ' - ' + result.error, 'error');
            error++;
          }
        } catch (e) {
          log('Error: ' + songName + ' - ' + e.message, 'error');
          error++;
        }
        successCount.textContent = success;
        errorCount.textContent = error;
      }
      log('Hoàn tất!', 'success');
      downloadBtn.disabled = false;
      previewBtn.disabled = false;
    });
  </script>
</body>
</html>`);
});

app.post('/download', async (req, res) => {
  const { songName } = req.body;
  
  try {
    const searchResults = await search(songName + ' audio');
    const video = searchResults.all[0];
    
    if (!video) {
      return res.json({ success: false, error: 'No video found' });
    }

    const safeName = songName.replace(/[<>:"/\\|?*]/g, '');
    const outputTemplate = path.join(downloadPath, safeName + '.mp3').replace(/\\/g, '/');

    await new Promise((resolve, reject) => {
      const cmd = 'yt-dlp -x --audio-format mp3 -o "' + outputTemplate + '" "https://www.youtube.com/watch?v=' + video.videoId + '"';
      exec(cmd, (err, stdout, stderr) => {
        if (err) reject(new Error(stderr || err.message));
        else resolve();
      });
    });

    res.json({ success: true, title: video.title, path: outputTemplate });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.post('/preview', async (req, res) => {
  const { songs } = req.body;
  
  try {
    const results = [];
    for (const songName of songs) {
      try {
        const searchResults = await search(songName + ' audio');
        const video = searchResults.all[0];
        if (video) {
          results.push({
            name: songName,
            title: video.title,
            thumbnail: video.thumbnail,
            videoId: video.videoId,
            duration: video.timestamp
          });
        } else {
          results.push({ name: songName, error: true });
        }
      } catch (e) {
        results.push({ name: songName, error: true });
      }
    }
    res.json({ success: true, results });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log('YouTube Music Downloader running at http://localhost:' + PORT);
  console.log('Download path: ' + downloadPath);
});
