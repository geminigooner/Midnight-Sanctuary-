import fetch from 'node-fetch';
async function run() {
  const res = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{role: 'user', parts: [{text: 'say hello'}]}],
      model: 'models/gemini-3.1-pro-preview',
      temperature: 1.0,
      topP: 0.95,
      maxOutputTokens: 4096
    })
  });
  console.log(res.status, res.headers.get('content-type'));
  const body = await res.text();
  console.log(body);
}
run();
