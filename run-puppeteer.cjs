const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await page.waitForSelector('textarea');
  const input = await page.$('textarea');
  await input.type('Hello Gemma!');
  await input.press('Enter');
  await new Promise(r => setTimeout(r, 4000));
  await input.type('Are you still there?');
  await input.press('Enter');
  await new Promise(r => setTimeout(r, 4000));
  const bubbles = await page.$$eval('.bg-glass, .bg-copper', els => els.map(e => e.textContent));
  bubbles.forEach((b, i) => console.log(`[${i}] ${b}`));
  await browser.close();
})();
