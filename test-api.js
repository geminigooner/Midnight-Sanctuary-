const fetch = require('node-fetch');
(async () => {
  const msgs = [
    { role: 'user', parts: [{ text: 'Hello' }] },
    { role: 'model', parts: [{ text: 'Hi there' }] },
    { role: 'user', parts: [{ text: 'How are you?' }] }
  ];
  const res = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'models/gemini-3.1-pro-preview',
      messages: msgs
    })
  });
  const text = await res.text();
  console.log(text);
})();
