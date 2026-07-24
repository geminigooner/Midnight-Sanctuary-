import { test, expect } from '@playwright/test';
test('basic message flow', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // Click new conversation if empty state
  const isTextareaVisible = await page.locator('textarea').isVisible();
  if (!isTextareaVisible) {
     await page.getByRole('button', { name: /New Sanctuary/i }).click(); 
     await page.waitForTimeout(1000);
  }

  const textarea = page.locator('textarea');
  await expect(textarea).toBeVisible();

  // Mock the backend
  await page.route(/\/api\/chat/, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: 'data: {"type":"thought", "text":"Thinking..."}\n\ndata: {"type":"text", "text":"Hello user!"}\n\ndata: [DONE]\n\n'
    });
  });

  await textarea.fill('test sanity');
  await page.keyboard.press('Enter');
  
  await expect(page.locator('.prose-invert').last()).toContainText('Hello user!');
  await expect(page.getByText('test sanity')).toBeVisible();
});
