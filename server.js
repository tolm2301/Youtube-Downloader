const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const search = require('yt-search');

const app = express();
const PORT = 3000;

const downloadPath = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadPath)) {
  fs.mkdirSync(downloadPath, { recursive: true });
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>YouTube Music Downloader</title>
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: 'Nunito', sans-serif;
      background: 
        linear-gradient(to bottom,
          #1a1a2e 0%,
          #16213e 20%,
          #0f3460 50%,
          #1a1a2e 100%
        );
      background-attachment: fixed;
      min-height: 100vh;
      padding: 30px 20px;
    }
    
    .bg-decoration {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      overflow: hidden;
      z-index: 0;
    }
    
    .star {
      position: absolute;
      background: white;
      border-radius: 50%;
      animation: twinkle 3s infinite ease-in-out;
    }
    
    @keyframes twinkle {
      0%, 100% { opacity: 0.3; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.2); }
    }
    
    .container {
      position: relative;
      z-index: 1;
      max-width: 720px;
      margin: 0 auto;
      background: linear-gradient(145deg, rgba(255,255,255,0.95), rgba(248,250,252,0.95));
      border-radius: 24px;
      padding: 32px;
      box-shadow: 
        0 25px 50px -12px rgba(0, 0, 0, 0.25),
        0 0 0 1px rgba(255, 255, 255, 0.5),
        inset 0 1px 0 rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(10px);
    }
    
    h1 {
      text-align: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 8px;
      font-size: 28px;
      font-weight: 800;
    }
    
    .subtitle {
      text-align: center;
      color: #94a3b8;
      font-size: 14px;
      margin-bottom: 24px;
    }
    
    .input-group { margin-bottom: 20px; }
    
    label {
      display: block;
      margin-bottom: 10px;
      color: #475569;
      font-weight: 700;
      font-size: 15px;
    }
    
    textarea {
      width: 100%;
      height: 140px;
      padding: 16px;
      border: 2px solid #e2e8f0;
      border-radius: 16px;
      font-size: 15px;
      font-family: inherit;
      resize: vertical;
      transition: all 0.3s ease;
      background: #f8fafc;
    }
    
    textarea:focus {
      outline: none;
      border-color: #a78bfa;
      box-shadow: 0 0 0 4px rgba(167, 139, 250, 0.15);
      background: white;
    }
    
    .btn-group {
      display: flex;
      gap: 12px;
      margin-bottom: 12px;
    }
    
    .btn {
      flex: 1;
      padding: 14px 20px;
      border: none;
      border-radius: 14px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-family: inherit;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    
    .btn-preview {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
    }
    
    .btn-download {
      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
      color: white;
    }
    
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
    }
    
    .btn:active {
      transform: translateY(0);
    }
    
    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
    
    .path-display {
      margin-top: 12px;
      padding: 14px 18px;
      background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
      border-radius: 12px;
      font-size: 13px;
      color: #64748b;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .path-input-group {
      display: flex;
      gap: 8px;
      margin-top: 12px;
    }
    
    .path-input-group input {
      flex: 1;
      padding: 12px 16px;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      font-size: 14px;
      font-family: inherit;
      background: #f8fafc;
    }
    
    .path-input-group input:focus {
      outline: none;
      border-color: #a78bfa;
    }
    
    .btn-path {
      padding: 12px 20px;
      background: linear-gradient(135deg, #64748b, #475569);
      color: white;
      border: none;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
    }
    
    .btn-path:hover {
      background: linear-gradient(135deg, #475569, #334155);
    }
    
    .path-display::before {
      content: "📁";
    }
    
    .stats {
      display: flex;
      gap: 16px;
      margin-top: 20px;
      padding: 20px;
      background: linear-gradient(135deg, #f8fafc, #f1f5f9);
      border-radius: 16px;
    }
    
    .stat-item {
      flex: 1;
      text-align: center;
      padding: 12px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    
    .stat-item.success { border-left: 4px solid #10b981; }
    .stat-item.error { border-left: 4px solid #ef4444; }
    
    .stat-item span {
      font-size: 32px;
      font-weight: 800;
      display: block;
    }
    
    .stat-item.success span { color: #10b981; }
    .stat-item.error span { color: #ef4444; }
    
    .stat-item p {
      font-size: 12px;
      color: #94a3b8;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .preview-container {
      margin-top: 20px;
      max-height: 350px;
      overflow-y: auto;
      padding-right: 8px;
    }
    
    .preview-container::-webkit-scrollbar,
    .progress::-webkit-scrollbar {
      width: 6px;
    }
    
    .preview-container::-webkit-scrollbar-track,
    .progress::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 3px;
    }
    
    .preview-container::-webkit-scrollbar-thumb,
    .progress::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 3px;
    }
    
    .preview-item {
      display: flex;
      align-items: center;
      padding: 14px;
      background: white;
      border-radius: 14px;
      margin-bottom: 10px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      transition: all 0.2s ease;
      border: 1px solid #f1f5f9;
      position: relative;
    }
    
    .preview-item:hover {
      transform: translateX(4px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    
    .preview-item img {
      width: 100px;
      height: 56px;
      object-fit: cover;
      border-radius: 10px;
      margin-right: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .preview-info { flex: 1; min-width: 0; }
    .preview-info .title {
      font-size: 14px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .preview-info .meta {
      font-size: 12px;
      color: #94a3b8;
    }
    
    .preview-item.error {
      background: linear-gradient(135deg, #fef2f2, #fee2e2);
      border-color: #fecaca;
    }
    
    .preview-playing {
      display: none;
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 80%;
      max-width: 640px;
      aspect-ratio: 16/9;
      background: black;
      border-radius: 12px;
      z-index: 1000;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    }
    
    .preview-playing.active {
      display: block;
    }
    
    .preview-playing iframe {
      width: 100%;
      height: 100%;
      border-radius: 12px;
    }
    
    .preview-playing .close-btn {
      position: absolute;
      top: -40px;
      right: 0;
      background: white;
      color: black;
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 18px;
      font-weight: bold;
    }
    
    .preview-modal-overlay {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.7);
      z-index: 999;
    }
    
    .preview-modal-overlay.active {
      display: block;
    }
    
    .preview-play-btn {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 50px;
      height: 50px;
      background: rgba(239, 68, 68, 0.9);
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      border: none;
    }
    
    .preview-play-btn::after {
      content: '';
      border-style: solid;
      border-width: 10px 0 10px 16px;
      border-color: transparent transparent transparent white;
      margin-left: 4px;
    }
    
    .preview-play-btn:hover {
      transform: translate(-50%, -50%) scale(1.1);
      background: rgba(239, 68, 68, 1);
    }
    
    .preview-loading {
      text-align: center;
      padding: 30px;
      color: #94a3b8;
    }
    
    .progress {
      margin-top: 20px;
      padding: 16px;
      background: #f8fafc;
      border-radius: 14px;
      max-height: 220px;
      overflow-y: auto;
    }
    
    .progress p {
      padding: 8px 12px;
      font-size: 13px;
      color: #64748b;
      border-radius: 8px;
      margin-bottom: 6px;
      background: white;
    }
    
    .progress p.error {
      color: #dc2626;
      background: #fef2f2;
    }
    
    .progress p.success {
      color: #059669;
      background: #ecfdf5;
    }
  </style>
</head>
<body>
  <div class="bg-decoration" id="stars"></div>
  <div class="container">
    <h1>🎵 YouTube Music Downloader</h1>
    <p class="subtitle">Tải nhạc yêu thích về máy dễ dàng</p>
    
    <div class="input-group">
      <label>Danh sách bài hát (mỗi bài một dòng):</label>
      <textarea id="songList" placeholder="Tên bài hát 1
Tên bài hát 2
Tên bài hát 3"></textarea>
    </div>
    
    <div class="btn-group">
      <button id="previewBtn" class="btn btn-preview">✨ Xem trước</button>
      <button id="downloadBtn" class="btn btn-download">⬇️ Tải xuống</button>
    </div>
    
    <div class="path-input-group">
      <input type="text" id="downloadPath" placeholder="Đường dẫn thư mục lưu..." value="C:/Users/Admin/Desktop/MusicTool/downloads">
      <button id="selectFolderBtn" class="btn-path">📂 Chọn</button>
    </div>
    
    <div class="path-display" id="pathDisplay">Thư mục lưu: downloads</div>
    
    <div class="stats">
      <div class="stat-item success"><span id="successCount">0</span><p>Thành công</p></div>
      <div class="stat-item error"><span id="errorCount">0</span><p>Thất bại</p></div>
    </div>
    
    <div class="preview-container" id="previewArea"></div>
    <div class="progress" id="logArea"></div>
  </div>
  
  <script>// v=20240318d
    const starsContainer = document.getElementById('stars');
    for (let i = 0; i < 50; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      star.style.width = Math.random() * 3 + 1 + 'px';
      star.style.height = star.style.width;
      star.style.left = Math.random() * 100 + '%';
      star.style.top = Math.random() * 100 + '%';
      star.style.animationDelay = Math.random() * 3 + 's';
      starsContainer.appendChild(star);
    }
    
    const songListInput = document.getElementById('songList');
    const previewBtn = document.getElementById('previewBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const selectFolderBtn = document.getElementById('selectFolderBtn');
    const downloadPathInput = document.getElementById('downloadPath');
    const logArea = document.getElementById('logArea');
    const previewArea = document.getElementById('previewArea');
    const successCount = document.getElementById('successCount');
    const errorCount = document.getElementById('errorCount');

    selectFolderBtn.addEventListener('click', async () => {
      try {
        if (window.showDirectoryPicker) {
          const dirHandle = await window.showDirectoryPicker();
          downloadPathInput.value = dirHandle.name;
        } else {
          const path = prompt('Nhập đường dẫn thư mục lưu nhạc:');
          if (path) downloadPathInput.value = path;
        }
      } catch (e) {
        if (e.name !== 'AbortError') {
          const path = prompt('Nhập đường dẫn thư mục lưu nhạc:');
          if (path) downloadPathInput.value = path;
        }
      }
    });

    downloadPathInput.addEventListener('change', () => {
      document.getElementById('pathDisplay').textContent = 'Thư mục lưu: ' + downloadPathInput.value;
    });

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
      results.forEach((r, index) => {
        const div = document.createElement('div');
        div.className = 'preview-item' + (r.error ? ' error' : '');
        if (r.error) {
          div.innerHTML = '<span style="color:#dc2626">' + r.name + ' - Không tìm thấy</span>';
        } else {
          const videoId = r.videoId.replace(/'/g, "\\'");
          div.innerHTML = '<img src="' + r.thumbnail + '" id="thumb-' + index + '" style="cursor:pointer"><div class="preview-info"><div class="title">' + r.title + '</div><div class="meta">' + r.name + ' - ' + r.duration + '</div></div><button class="preview-play-btn" data-id="' + videoId + '" data-index="' + index + '"></button>';
          div.querySelector('#thumb-' + index).addEventListener('click', () => playPreview(videoId, index));
          div.querySelector('.preview-play-btn').addEventListener('click', () => playPreview(videoId, index));
        }
        previewArea.appendChild(div);
      });
    }

    function playPreview(videoId, index) {
      let overlay = document.getElementById('previewOverlay');
      let player = document.getElementById('previewPlayer');
      
      if (overlay && player) {
        overlay.classList.remove('active');
        player.classList.remove('active');
        player.innerHTML = '';
        return;
      }
      
      overlay = document.createElement('div');
      overlay.id = 'previewOverlay';
      overlay.className = 'preview-modal-overlay active';
      overlay.addEventListener('click', () => {
        overlay.classList.remove('active');
        player.classList.remove('active');
        player.innerHTML = '';
      });
      
      player = document.createElement('div');
      player.id = 'previewPlayer';
      player.className = 'preview-playing active';
      player.innerHTML = '<button class="close-btn" onclick="closePreview()">×</button><iframe src="https://www.youtube.com/embed/' + videoId + '?autoplay=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
      
      document.body.appendChild(overlay);
      document.body.appendChild(player);
    }
    
    window.closePreview = function() {
      const overlay = document.getElementById('previewOverlay');
      const player = document.getElementById('previewPlayer');
      if (overlay) { overlay.classList.remove('active'); overlay.remove(); }
      if (player) { player.classList.remove('active'); player.remove(); }
    };

    previewBtn.addEventListener('click', async () => {
      const songs = songListInput.value.split('\\n').filter(s => s.trim());
      if (songs.length === 0) { log('Vui lòng nhập danh sách bài hát!', 'error'); return; }
      
      previewBtn.disabled = true;
      previewArea.innerHTML = '<div class="preview-loading">🔍 Đang tìm kiếm...</div>';
      
      try {
        const res = await fetch('/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ songs })
        });
        const data = await res.json().catch(() => ({ success: false, error: 'Invalid response' }));
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

      log('🚀 Bắt đầu tải ' + songs.length + ' bài hát...');

      for (const songName of songs) {
        try {
          log('🔍 Searching: ' + songName);
          const res = await fetch('/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ songName, downloadPath: downloadPathInput.value })
          });
          const result = await res.json().catch(() => ({ success: false, error: 'Invalid response' }));
          if (result.success) {
            log('✅ Done: ' + result.title, 'success');
            success++;
          } else {
            log('❌ Error: ' + songName + ' - ' + result.error, 'error');
            error++;
          }
        } catch (e) {
          log('❌ Error: ' + songName + ' - ' + e.message, 'error');
          error++;
        }
        successCount.textContent = success;
        errorCount.textContent = error;
      }
      log('🎉 Hoàn tất!', 'success');
      downloadBtn.disabled = false;
      previewBtn.disabled = false;
    });
  </script>
</body>
</html>`);
});

app.post('/download', async (req, res) => {
  const { songName, downloadPath: customPath } = req.body;
  
  const targetPath = customPath || downloadPath;
  
  try {
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }
    
    const searchResults = await search(songName + ' audio');
    const video = searchResults.all[0];
    
    if (!video) {
      return res.json({ success: false, error: 'No video found' });
    }

    const safeName = songName.replace(/[<>:"/\\|?*]/g, '').trim();
    const outputTemplate = path.join(targetPath, safeName + '.mp3').replace(/\\/g, '/');

    await new Promise((resolve, reject) => {
      const cmd = `yt-dlp --no-warnings -x --audio-format mp3 -o "${outputTemplate}" "https://www.youtube.com/watch?v=${video.videoId}"`;
      exec(cmd, { encoding: 'utf8' }, (err, stdout, stderr) => {
        if (err) {
          const errorMsg = stderr || stdout || err.message;
          reject(new Error(errorMsg));
        } else {
          resolve();
        }
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

app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

app.get('/ping', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log('YouTube Music Downloader running at http://localhost:' + PORT);
  console.log('Download path: ' + downloadPath);
});
