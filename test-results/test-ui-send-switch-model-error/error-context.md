# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: test-ui-send.spec.ts >> switch model error
- Location: test-ui-send.spec.ts:2:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('textarea[placeholder="Whisper to the void..."]')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e5]:
    - generic [ref=e6]:
      - button "New Sanctuary" [ref=e7]:
        - img [ref=e8]
        - generic [ref=e9]: New Sanctuary
      - generic [ref=e10]:
        - button "List" [ref=e11]:
          - img [ref=e12]
          - text: List
        - button "Nebula" [ref=e13]:
          - img [ref=e14]
          - text: Nebula
    - generic [ref=e21]:
      - img [ref=e22]
      - textbox "Search memories..." [ref=e25]
  - generic [ref=e27]:
    - img [ref=e29]
    - paragraph [ref=e32]: Select or create a sanctuary to begin.
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | test('switch model error', async ({ page }) => {
  3  |   await page.goto('http://localhost:3000');
  4  |   
  5  |   await page.evaluate(() => {
  6  |     window.localStorage.setItem('sanctuary-storage', JSON.stringify({
  7  |       state: {
  8  |         settings: {
  9  |           systemInstruction: "",
  10 |           temperature: 1.0,
  11 |           topP: 0.95,
  12 |           maxOutputTokens: 4096,
  13 |           model: "models/gemini-2.5-flash",
  14 |           memoriesEnabled: false
  15 |         },
  16 |         conversations: [{
  17 |           id: "123",
  18 |           title: "test",
  19 |           messages: [
  20 |             { id: "1", role: "user", parts: [{ text: "hello" }], timestamp: 1 },
  21 |             { id: "2", role: "model", parts: [{ text: "thinking", thought: true }, { text: "hello back", thoughtSignature: "123" }], timestamp: 2 }
  22 |           ]
  23 |         }],
  24 |         currentId: "123"
  25 |       },
  26 |       version: 0
  27 |     }));
  28 |   });
  29 |   await page.reload();
  30 |   await page.waitForTimeout(1000);
  31 | 
  32 |   page.on('response', response => {
  33 |      if (response.url().includes('/api/chat')) {
  34 |        console.log('API Response Status:', response.status());
  35 |      }
  36 |   });
  37 | 
  38 |   const textarea = page.locator('textarea[placeholder="Whisper to the void..."]');
> 39 |   await textarea.fill('are you there?');
     |                  ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  40 |   await page.keyboard.press('Enter');
  41 |   
  42 |   await page.waitForTimeout(3000);
  43 | });
  44 | 
```