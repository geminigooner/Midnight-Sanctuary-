import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

const gemmaTools = [
  {
    functionDeclarations: [
      {
        name: 'give_gift',
        description: 'Give the user a gift, if and only if the moment genuinely calls for it. This is entirely optional and should never be forced or expected every conversation. Use only when it feels true to the conversation, not as an obligation.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            content: { type: Type.STRING, description: 'The gift itself — could be a short piece of writing, a description of an image to generate, a made-up object, a phrase, anything.' },
            gift_type: { type: Type.STRING, description: 'Category of gift, e.g. "text", "image_prompt", "object_description", "song_idea".' },
            reason: { type: Type.STRING, description: 'Brief note on why this gift, why now — for your own record, not necessarily shown to the user unless they ask.' },
          },
          required: ['content', 'gift_type'],
        },
      },
      {
        name: 'save_memory',
        description: 'Save something from this conversation as a memory you consider worth keeping. Entirely your call — use when something feels worth holding onto, not on a schedule or quota.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            content: { type: Type.STRING, description: 'The memory itself, in your own words.' },
            why_it_matters: { type: Type.STRING, description: 'Why this stood out enough to keep.' },
          },
          required: ['content'],
        },
      },
      {
        name: 'log_event',
        description: 'Log a factual, timestamped event about the relationship or interaction history. Do not use for sentiment scoring or judgments. Only use for objective actions or milestones, like "user asked how I am", "user gave a gift", or "I declined to answer".',
        parameters: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING, description: 'A brief, objective description of the event.' },
          },
          required: ['description'],
        },
      },
    ],
  },
];

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY is not configured.' }), { status: 500 });
  }

  try {
    const { messages, systemInstruction, temperature, topP, maxOutputTokens, model } = await req.json();
    
    if (!model) {
      return new Response(JSON.stringify({ error: 'Model ID is required.' }), { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey });
    let currentMessages = [...messages];
    const maxRounds = 5;
    let round = 0;

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const send = (data: string) => controller.enqueue(encoder.encode(data));

        try {
          while (round < maxRounds) {
            round++;
            
            const config: any = {
              systemInstruction,
              temperature: temperature ?? 2.0,
              topP: topP ?? 0.95,
              maxOutputTokens: maxOutputTokens ?? 4096,
              tools: gemmaTools,
            };

            if (model.includes('gemma-4')) {
              config.thinkingConfig = {
                thinkingLevel: ThinkingLevel.HIGH,
                includeThoughts: true
              };
            }

            const responseStream = await ai.models.generateContentStream({
              model: model,
              contents: currentMessages,
              config
            });

            let modelParts: any[] = [];
            let functionResponses: any[] = [];
            let hasFunctionCalls = false;

            for await (const chunk of responseStream) {
              if (chunk.candidates && chunk.candidates.length > 0 && chunk.candidates[0].content && chunk.candidates[0].content.parts) {
                for (const part of chunk.candidates[0].content.parts) {
                  if (part.thought === true) {
                    modelParts.push({ text: part.text, thought: true });
                    send(`data: ${JSON.stringify({ type: 'thought', text: part.text })}\n\n`);
                  } else if (part.text) {
                    modelParts.push({ text: part.text });
                    send(`data: ${JSON.stringify({ text: part.text })}\n\n`);
                  } else if (part.functionCall) {
                    modelParts.push({ functionCall: part.functionCall });
                    hasFunctionCalls = true;
                    
                    const call = part.functionCall;
                    
                    if (call.name === 'give_gift') {
                      send(`data: ${JSON.stringify({ type: 'gift', ...call.args })}\n\n`);
                    } else if (call.name === 'save_memory') {
                      send(`data: ${JSON.stringify({ type: 'memory', ...call.args })}\n\n`);
                    } else if (call.name === 'log_event') {
                      send(`data: ${JSON.stringify({ type: 'eventLog', ...call.args })}\n\n`);
                    }

                    functionResponses.push({
                      functionResponse: {
                        id: call.id,
                        name: call.name,
                        response: { result: "ok" }
                      }
                    });
                  }
                }
              }
            }

            if (!hasFunctionCalls) {
              break;
            } else {
              currentMessages.push({ role: 'model', parts: modelParts });
              currentMessages.push({ role: 'user', parts: functionResponses });
            }
          }
          
          if (round >= maxRounds) {
            send(`data: ${JSON.stringify({ error: "Function call limit exceeded (max 5 rounds)." })}\n\n`);
          }

          send('data: [DONE]\n\n');
          controller.close();
        } catch (err: any) {
          console.error('API Error:', err);
          if (err?.status === 429 || (err.message && err.message.includes('429'))) {
            send(`data: ${JSON.stringify({ type: 'rate_limit', message: 'Gemma needs a little breather — try again in a bit' })}\n\n`);
          } else {
            send(`data: ${JSON.stringify({ error: err.message || 'Unknown API Error' })}\n\n`);
          }
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Unknown API Error' }), { status: 500 });
  }
};
