import * as dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.OPENROUTER_API_KEY;
console.log('Testing OpenRouter key:', apiKey ? `${apiKey.substring(0, 15)}...` : 'NONE');

async function testOpenRouter() {
  const modelsToTest = [
    'google/gemini-2.5-flash-lite',
    'google/gemini-2.5-flash',
    'google/gemini-2.0-flash-lite:free',
    'google/gemini-2.0-flash-001',
    'google/gemini-flash-1.5',
    'google/gemini-flash-1.5-8b',
    'google/gemini-2.5-flash-lite-preview-02-05',
  ];

  for (const model of modelsToTest) {
    console.log(`\nTesting model: ${model}`);
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://runno.app',
          'X-Title': 'Runno Running Tracker',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'user',
              content: 'Ping! Return JSON: {"status": "ok"}',
            },
          ],
          response_format: { type: 'json_object' },
        }),
      });

      const text = await res.text();
      console.log(`Status: ${res.status} ${res.statusText}`);
      console.log(`Response: ${text.substring(0, 300)}`);
      if (res.ok) {
        console.log(`>>> MODEL ${model} WORKS!`);
      }
    } catch (e) {
      console.error('Fetch error:', e.message);
    }
  }
}

testOpenRouter();
