import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Diagnostics:') || text.includes('ChatArea render:')) {
      console.log('BROWSER CONSOLE:', text);
    }
  });

  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000);
  
  const hasTextarea = await page.$('textarea');
  if (!hasTextarea) {
     console.log('Clicking button to create conversation...');
     await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const createBtn = btns.find(b => b.innerText.includes('Create') || b.innerText.includes('New'));
        if (createBtn) createBtn.click();
        else if (btns.length > 0) btns[0].click();
     });
  }

  await page.waitForSelector('textarea');
  
  console.log('Typing hi...');
  await page.fill('textarea', 'hi say hi to gemma');
  await page.keyboard.press('Enter');
  
  console.log('Waiting for first response...');
  await page.waitForTimeout(10000);

  console.log('Typing wyd...');
  await page.fill('textarea', 'wyd');
  await page.keyboard.press('Enter');
  
  console.log('Waiting for second response...');
  await page.waitForTimeout(10000);

  const html = await page.content();
  
  if (html.includes('wyd')) {
     console.log('BUG NOT REPRODUCED: wyd is visible in HTML.');
  } else {
     console.log('BUG CONFIRMED: wyd is MISSING from HTML.');
  }

  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.title === 'Toggle Debug Info');
    if (btn) btn.click();
  });
  
  await page.waitForTimeout(1000);
  
  const debugText = await page.evaluate(() => {
    const diag = document.querySelector('.bg-black\\/90');
    return diag ? diag.innerText : 'No diagnostic panel found';
  });
  
  console.log('DEBUG PANEL:', debugText);

  await browser.close();
})();
