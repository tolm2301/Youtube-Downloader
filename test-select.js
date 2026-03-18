const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();
  
  console.log('=== Load page ===');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('=== Check dropdown options ===');
  const options = await page.$$eval('#folderSelect option', els => els.map(e => e.value));
  console.log('Options:', options);
  
  console.log('=== Select Downloads ===');
  await page.select('#folderSelect', options[2]); // Downloads
  
  const pathValue = await page.$eval('#downloadPath', el => el.value);
  console.log('Path set to:', pathValue);
  
  console.log('=== DONE ===');
  await browser.close();
})();
