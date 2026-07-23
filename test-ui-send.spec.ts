import { test, expect } from '@playwright/test';
test('switch model error', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  await page.evaluate(() => {
    window.localStorage.setItem('sanctuary-storage', JSON.stringify({
      state: {
        settings: {
          systemInstruction: "",
          temperature: 1.0,
          topP: 0.95,
          maxOutputTokens: 4096,
          model: "models/gemini-2.5-flash",
          memoriesEnabled: false
        },
        conversations: [{
          id: "123",
          title: "test",
          messages: [
            { id: "1", role: "user", parts: [{ text: "hello" }], timestamp: 1 },
            { id: "2", role: "model", parts: [{ text: "thinking", thought: true }, { text: "hello back", thoughtSignature: "123" }], timestamp: 2 }
          ]
        }],
        currentId: "123"
      },
      version: 0
    }));
  });
  await page.reload();
  await page.waitForTimeout(1000);

  page.on('response', response => {
     if (response.url().includes('/api/chat')) {
       console.log('API Response Status:', response.status());
     }
  });

  const textarea = page.locator('textarea[placeholder="Whisper to the void..."]');
  await textarea.fill('are you there?');
  await page.keyboard.press('Enter');
  
  await page.waitForTimeout(3000);
});
