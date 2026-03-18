const puppeteer = require('puppeteer');

(async () => {
  console.log('Starting browser test...');
  
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();
  
  let hasError = false;
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => {
    console.log('BROWSER ERROR:', err.message);
    hasError = true;
  });
  
  console.log('=== TEST 1: Load page ===');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  console.log('Page title:', await page.title());
  
  // Check elements
  const songList = await page.$('#songList');
  const previewBtn = await page.$('#previewBtn');
  const downloadBtn = await page.$('#downloadBtn');
  const selectFolderBtn = await page.$('#selectFolderBtn');
  
  console.log('Elements exist:', !!songList && !!previewBtn && !!downloadBtn && !!selectFolderBtn);
  
  if (hasError) {
    console.log('ERROR after page load');
    await browser.close();
    process.exit(1);
  }
  
  // Test 2: Folder selection
  console.log('\n=== TEST 2: Folder selection ===');
  await selectFolderBtn.click();
  await new Promise(r => setTimeout(r, 1000));
  // Note: showDirectoryPicker requires user interaction, will fail in headless
  
  // Test 3: Preview
  console.log('\n=== TEST 3: Preview ===');
  await page.type('#songList', 'Test song');
  await previewBtn.click();
  
  try {
    await page.waitForSelector('.preview-item', { timeout: 10000 });
    console.log('Preview items found!');
    
    // Test 4: Click play button
    console.log('\n=== TEST 4: Play preview ===');
    const playBtn = await page.$('.preview-play-btn');
    if (playBtn) {
      await playBtn.click();
      await new Promise(r => setTimeout(r, 1000));
      
      // Check if iframe exists
      const iframe = await page.$('.preview-playing iframe');
      console.log('Iframe created:', !!iframe);
      
      // Check for layout issues
      const playerContainer = await page.$('.preview-playing.active');
      if (playerContainer) {
        const box = await playerContainer.boundingBox();
        console.log('Player box:', box);
      }
    }
  } catch(e) {
    console.log('Preview test error:', e.message);
  }
  
  console.log('\n=== TEST COMPLETE ===');
  console.log('Has errors:', hasError);
  
  await browser.close();
})();
