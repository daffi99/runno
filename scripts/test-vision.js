import * as dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.OPENROUTER_API_KEY;

// 1x1 test image base64
const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

async function testImageExtraction() {
  console.log('Testing Multimodal Image Extraction with google/gemini-2.5-flash-lite...');
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
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract running metrics if visible. Return JSON: {"date": null, "distance_km": null, "duration_seconds": null, "pace_seconds_per_km": null, "source": null}',
              },
              {
                type: 'image_url',
                image_url: {
                  url: testImage,
                },
              },
            ],
          },
        ],
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      }),
    });

    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Result:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error:', e);
  }
}

testImageExtraction();
