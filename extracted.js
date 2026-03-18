// v=20240318d
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

    selectFolderBtn.addEventListener('click', () => {
      const userPath = prompt(
        'Enter download folder path:
Examples: C:/Users/Admin/Documents',
        downloadPathInput.value || 'C:/Users/Admin/Documents'
      );
      if (userPath) {
        downloadPathInput.value = userPath;
        document.getElementById('pathDisplay').textContent = 'Save to: ' + userPath;
      }
    });
    
    document.getElementById('folderInput').addEventListener('change', (e) => {
      const path = prompt(
        'Cannot get folder path from browser. Enter path:',
        downloadPathInput.value || 'C:/Users/Admin/Documents'
      );
      if (path) {
        downloadPathInput.value = path;
        document.getElementById('pathDisplay').textContent = 'Save to: ' + path;
      }
    });

    downloadPathInput.addEventListener('input', () => {
      document.getElementById('pathDisplay').textContent = 'Save to: ' + downloadPathInput.value;
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
          const videoId = r.videoId.replace(/'/g, "\'");
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
      const songs = songListInput.value.split('\n').filter(s => s.trim());
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
      const songs = songListInput.value.split('\n').filter(s => s.trim());
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
            log('✅ Done: ' + result.title + ' → ' + result.savedTo, 'success');
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
  