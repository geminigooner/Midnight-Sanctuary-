# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: test-ui-sanity.spec.ts >> basic message flow
- Location: test-ui-sanity.spec.ts:2:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('textarea')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('textarea')

```

```yaml
- img
- heading "Application Error" [level=2]
- paragraph: The application encountered an unexpected error. If this happens continuously, it might be caused by a corrupted conversation state.
- text: useCallback is not defined
- button "Reload App"
- button "Clear Data & Reload"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | test('basic message flow', async ({ page }) => {
  3  |   await page.goto('http://localhost:3000');
  4  |   
  5  |   // Click new conversation if empty state
  6  |   const isTextareaVisible = await page.locator('textarea').isVisible();
  7  |   if (!isTextareaVisible) {
  8  |      await page.getByRole('button', { name: /New Sanctuary/i }).click(); 
  9  |      await page.waitForTimeout(1000);
  10 |   }
  11 | 
  12 |   const textarea = page.locator('textarea');
> 13 |   await expect(textarea).toBeVisible();
     |                          ^ Error: expect(locator).toBeVisible() failed
  14 | 
  15 |   // Mock the backend
  16 |   await page.route(/\/api\/chat/, async route => {
  17 |     await route.fulfill({
  18 |       status: 200,
  19 |       contentType: 'text/event-stream',
  20 |       body: 'data: {"type":"thought", "text":"Thinking..."}\n\ndata: {"type":"text", "text":"Hello user!"}\n\ndata: [DONE]\n\n'
  21 |     });
  22 |   });
  23 | 
  24 |   await textarea.fill('test sanity');
  25 |   await page.keyboard.press('Enter');
  26 |   
  27 |   await expect(page.locator('.prose-invert').last()).toContainText('Hello user!');
  28 |   await expect(page.getByText('test sanity')).toBeVisible();
  29 | });
  30 | 
```