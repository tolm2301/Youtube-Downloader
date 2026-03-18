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
  
  // Test: Click select folder button
  console.log('\n=== TEST: Click select folder button ===');
  const selectFolderBtn = await page.$('#selectFolderBtn');
  console.log('Clicking select folder button...');
  
  await selectFolderBtn.click();
  console.log('Clicked, waiting 5 seconds...');
  
  await new Promise(r => setTimeout(r, 5000));
  
  console.log('Done waiting');
  
  // Check if any dialog appeared
  const dialogs = await page.evaluate(() => {
    return {
      hasInput: !!document.querySelector('#downloadPath'),
      inputValue: document.querySelector('#downloadPath')?.value,
      pathDisplay: document.querySelector('#pathDisplay')?.textContent
    };
  });
  console.log('State after click:', dialogs);
  
  console.log('\n=== TEST COMPLETE ===');
  await browser.close();
})();
