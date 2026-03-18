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
  const downloadPathInput = await page.$('#downloadPath');
  
  console.log('Elements exist:', !!songList && !!previewBtn && !!downloadBtn && !!selectFolderBtn);
  
  if (hasError) {
    console.log('ERROR after page load');
    await browser.close();
    process.exit(1);
  }
  
  // Test 2: Set download path to Documents
  console.log('\n=== TEST 2: Set download path to Documents ===');
  await downloadPathInput.click({ clickCount: 3 });
  await page.keyboard.press('Backspace');
  await downloadPathInput.type('C:/Users/Admin/Documents');
  await new Promise(r => setTimeout(r, 500));
  
  const pathValue = await page.$eval('#downloadPath', el => el.value);
  console.log('Download path set to:', pathValue);
  
  // Test 3: Preview
  console.log('\n=== TEST 3: Preview ===');
  await page.type('#songList', 'Test song');
  await previewBtn.click();
  
  try {
    await page.waitForSelector('.preview-item', { timeout: 15000 });
    console.log('Preview items found!');
  } catch(e) {
    console.log('Preview test error:', e.message);
  }
  
  // Test 4: Download
  console.log('\n=== TEST 4: Download ===');
  const downloadBtnNew = await page.$('#downloadBtn');
  await downloadBtnNew.click();
  console.log('Download clicked, waiting...');
  
  // Wait for download to complete
  await new Promise(r => setTimeout(r, 20000));
  
  // Check log
  const logItems = await page.$$eval('#logArea p', els => els.map(el => el.textContent));
  console.log('Log entries:', logItems);
  
  console.log('\n=== TEST COMPLETE ===');
  console.log('Has errors:', hasError);
  
  await browser.close();
})();
