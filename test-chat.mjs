const response = await fetch('http://localhost:3000/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [
      { role: 'user', parts: [{ text: 'Give me a gift.' }] }
    ],
    model: 'models/gemma-4-31b-it',
    systemInstruction: 'You are a helpful assistant.'
  })
});
const text = await response.text();
console.log(text);
