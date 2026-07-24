import { test, expect } from '@playwright/test';
test('thought only response', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // Click new conversation if empty state
  const isTextareaVisible = await page.locator('textarea[placeholder="Whisper to the void..."]').isVisible();
  if (!isTextareaVisible) {
     await page.getByRole('button', { name: /New Sanctuary/i }).click(); 
     await page.waitForTimeout(1000);
  }

  // Set model to gemini-2.5-flash
  await page.evaluate(() => {
    window.localStorage.setItem('settings', JSON.stringify({ model: 'models/gemini-2.5-flash' }));
  });

  // Mock the backend
  await page.route(/\/api\/chat/, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: 'data: {"type":"thought", "text":"This is a thought."}\n\ndata: {"type":"thought", "text":" This is more thought."}\n\ndata: [DONE]\n\n'
    });
  });

  const textarea = page.locator('textarea[placeholder="Whisper to the void..."]');
  await textarea.fill('test thought only');
  await page.keyboard.press('Enter');
  
  await page.waitForTimeout(3000);
  
  const allText = await page.locator('body').textContent();
  console.log("ALL TEXT:", allText);
  await expect(page.locator('.prose-invert').last()).toContainText('This is a thought.');
});
