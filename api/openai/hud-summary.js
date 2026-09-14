/**
 * Universal Multi-Provider AI Waterfall Router for Aetheris Spatial HUD Summary
 * 
 * Supports:
 * 1. Google Gemini (GEMINI_API_KEY)
 * 2. Groq Free Tier (GROQ_API_KEY)
 * 3. OpenRouter Free Tier (OPENROUTER_API_KEY)
 * 4. NVIDIA NIM Free Tier (NVIDIA_NIM_API_KEY)
 * 5. OpenAI / Custom Base URL (OPENAI_API_KEY / OPENAI_BASE_URL)
 * 6. Deterministic Spatial Sensor Fallback (Zero downtime / Zero key required)
 */

function toFiveWordHudSummary(value) {
  return String(value || '')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5)
    .join(' ');
}

function buildDeterministicSummary(context) {
  const place = context?.place || context?.nearbyPlaces?.[0] || 'ORBITAL SECTOR';
  const layer = context?.layers?.[0] || 'SURVEILLANCE';
  const candidate = `${place} ${layer} GRID ACTIVE`;
  return toFiveWordHudSummary(candidate) || 'GLOBAL SPATIAL SURVEILLANCE GRID ACTIVE';
}

async function tryGemini(prompt, context) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const models = [
    process.env.GEMINI_MODEL,
    'gemini-flash-latest',
    'gemini-flash-lite-latest',
    'gemini-2.5-flash-lite'
  ].filter(Boolean);

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${prompt}\nContext: ${JSON.stringify(context)}`
            }]
          }],
          generationConfig: {
            maxOutputTokens: 50,
            temperature: 0.2
          }
        }),
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        const summary = toFiveWordHudSummary(text);
        if (summary) return summary;
      } else {
        const errText = await res.text().catch(() => '');
        console.warn(`[Gemini HTTP ${res.status}] ${model}:`, errText.slice(0, 200));
      }
    } catch (e) {
      console.warn(`[Gemini error] ${model}:`, e?.message);
    }
  }

  throw new Error('All Gemini model candidates failed');
}

async function tryGroq(prompt, context) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  const models = [
    process.env.GROQ_MODEL,
    'qwen/qwen3.6-27b',
    'groq/compound-mini',
    'openai/gpt-oss-20b'
  ].filter(Boolean);

  for (const model of models) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: prompt },
            { role: 'user', content: JSON.stringify(context) }
          ],
          max_tokens: 40,
          temperature: 0.2
        }),
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        const summary = toFiveWordHudSummary(text);
        if (summary) return summary;
      } else {
        const errText = await res.text().catch(() => '');
        console.warn(`[Groq HTTP ${res.status}] ${model}:`, errText.slice(0, 200));
      }
    } catch (e) {
      console.warn(`[Groq error] ${model}:`, e?.message);
    }
  }

  throw new Error('All Groq model candidates failed');
}

async function tryOpenRouter(prompt, context) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;
  const models = [
    process.env.OPENROUTER_MODEL,
    'openrouter/free',
    'nvidia/nemotron-3.5-lightning:free',
    'liquid/lfm-2.5-2.6b:free',
    'nex-agi/nex-n2.5-mini:free',
    'google/gemma-4-31b-it:free'
  ].filter(Boolean);

  for (const model of models) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://aetheris-spatial.vercel.app',
          'X-Title': 'Aetheris Spatial'
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: prompt },
            { role: 'user', content: JSON.stringify(context) }
          ],
          max_tokens: 40,
          temperature: 0.2
        }),
        signal: AbortSignal.timeout(7000),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        const summary = toFiveWordHudSummary(text);
        if (summary) return summary;
      } else {
        const errText = await res.text().catch(() => '');
        console.warn(`[OpenRouter HTTP ${res.status}] ${model}:`, errText.slice(0, 150));
      }
    } catch (e) {
      console.warn(`[OpenRouter error] ${model}:`, e?.message);
    }
  }
  throw new Error('All OpenRouter model candidates failed');
}

async function tryNvidiaNim(prompt, context) {
  const apiKey = process.env.NVIDIA_NIM_API_KEY;
  if (!apiKey) return null;
  const models = [process.env.NVIDIA_NIM_MODEL, 'meta/llama-3.1-8b-instruct', 'nvidia/llama-3.1-nemotron-70b-instruct'].filter(Boolean);

  for (const model of models) {
    try {
      const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: prompt },
            { role: 'user', content: JSON.stringify(context) }
          ],
          max_tokens: 40,
          temperature: 0.2
        }),
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        const summary = toFiveWordHudSummary(text);
        if (summary) return summary;
      }
    } catch {
      // try next
    }
  }
  throw new Error('All NVIDIA NIM model candidates failed');
}

async function tryOpenAI(prompt, context) {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
  if (!apiKey && !process.env.OPENAI_BASE_URL) return null;

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey || 'none'}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: process.env.OPENAI_HUD_SUMMARY_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: JSON.stringify(context) }
      ],
      max_tokens: 40,
      temperature: 0.2
    }),
    signal: AbortSignal.timeout(6000),
  });

  if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  return toFiveWordHudSummary(text);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const prompt = [
    "Write one concise intelligence-HUD summary for Aetheris Spatial.",
    "Use only the supplied place, street, nearby-place, and enabled-layer text labels.",
    "Prefer the clearest named place and include a relevant enabled layer only when useful.",
    "Do not infer from coordinates or invent a place.",
    "Output exactly five words with no title, punctuation, markdown, or introductory phrase."
  ].join(' ');

  let context = {};
  try {
    context = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  } catch {
    context = {};
  }

  // Waterfall cascading
  const providers = [
    { name: 'Gemini', fn: () => tryGemini(prompt, context) },
    { name: 'Groq', fn: () => tryGroq(prompt, context) },
    { name: 'OpenRouter', fn: () => tryOpenRouter(prompt, context) },
    { name: 'NvidiaNIM', fn: () => tryNvidiaNim(prompt, context) },
    { name: 'OpenAI', fn: () => tryOpenAI(prompt, context) }
  ];

  for (const provider of providers) {
    try {
      const summary = await provider.fn();
      if (summary) {
        return res.status(200).json({
          summary,
          provider: provider.name,
          error: null
        });
      }
    } catch (err) {
      // Cascade to next provider on failure
      console.warn(`[AI Router] ${provider.name} failed:`, err?.message || err);
    }
  }

  // Graceful deterministic fallback if no keys configured or providers down
  const deterministic = buildDeterministicSummary(context);
  return res.status(200).json({
    summary: deterministic,
    provider: 'DeterministicFallback',
    error: null
  });
}
