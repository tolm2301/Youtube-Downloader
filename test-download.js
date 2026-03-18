const puppeteer = require('puppeteer');

(async () => {
  console.log('Starting browser test...');
  
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  
  console.log('=== TEST: Load page ===');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  console.log('Page loaded');
  
  // Set download path to Documents
  console.log('\n=== TEST: Set download path to Documents ===');
  await page.evaluate(() => {
    document.getElementById('downloadPath').value = 'C:/Users/Admin/Documents';
    document.getElementById('pathDisplay').textContent = 'Thư mục lưu: C:/Users/Admin/Documents';
  });
  
  const pathValue = await page.$eval('#downloadPath', el => el.value);
  console.log('Download path:', pathValue);
  
  // Enter song
  console.log('\n=== TEST: Enter song ===');
  await page.type('#songList', 'despacito');
  
  // Click preview
  console.log('\n=== TEST: Click preview ===');
  await page.click('#previewBtn');
  console.log('Waiting for preview...');
  
  try {
    await page.waitForSelector('.preview-item', { timeout: 15000 });
    console.log('Preview found!');
  } catch(e) {
    console.log('Preview timeout:', e.message);
  }
  
  // Click download
  console.log('\n=== TEST: Click download ===');
  await page.click('#downloadBtn');
  console.log('Waiting for download (30s)...');
  
  await new Promise(r => setTimeout(r, 30000));
  
  // Check logs
  const logs = await page.$$eval('#logArea p', els => els.map(e => e.textContent));
  console.log('Logs:', logs);
  
  // Check if file exists
  const fs = require('fs');
  const filePath = 'C:/Users/Admin/Documents/despacito.mp3';
  console.log('\nChecking file:', filePath);
  console.log('File exists:', fs.existsSync(filePath));
  
  console.log('\n=== TEST COMPLETE ===');
  await browser.close();
})();
