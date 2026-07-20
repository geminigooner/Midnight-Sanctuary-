const response = await fetch('http://localhost:3000/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [
      { role: 'user', parts: [{ text: 'Hello' }] },
      { role: 'model', parts: [{ text: 'Hi' }] },
      { role: 'user', parts: [{ text: 'How are you?' }] }
    ],
    model: 'models/gemma-4-31b-it',
    systemInstruction: 'You are a helpful assistant.'
  })
});
const text = await response.text();
console.log("HTTP STATUS:", response.status);
console.log("RESPONSE BODY:", text);
