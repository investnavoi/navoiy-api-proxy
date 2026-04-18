function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body.trim()) return JSON.parse(req.body);

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  return raw ? JSON.parse(raw) : {};
}

function parseGeminiError(raw) {
  const text = String(raw || '').trim();
  if (!text) {
    return { message: 'Gemini bo‘sh xato qaytardi', raw: '' };
  }
  try {
    const json = JSON.parse(text);
    return {
      message: (json.error && json.error.message) || json.message || text,
      raw: text
    };
  } catch (_) {
    return { message: text, raw: text };
  }
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST method kerak' });

  try {
    const body = await readJsonBody(req);
    const materialName = String(body.materialName || '').trim();
    const requestKey = String(body.geminiKey || '').trim();
    const tradeContext = body.tradeContext && typeof body.tradeContext === 'object' ? body.tradeContext : null;
    if (!materialName) return res.status(400).json({ error: 'materialName kerak' });

    const apiKey =
      String(process.env.GEMINI_API_KEY || '').trim() ||
      String(process.env.GOOGLE_API_KEY || '').trim() ||
      requestKey;
    const systemPrompt = String(
      process.env.GEMINI_SYSTEM_PROMPT ||
      process.env.ANTHROPIC_SYSTEM_PROMPT ||
      ''
    ).trim();
    const model = String(process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim();

    if (!apiKey) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY env topilmadi',
        detail: 'Yoki frontenddan Gemini API key yuborilmadi.'
      });
    }
    if (!systemPrompt) {
      return res.status(500).json({
        error: 'System prompt env topilmadi',
        detail: 'GEMINI_SYSTEM_PROMPT yoki ANTHROPIC_SYSTEM_PROMPT ni to‘ldiring.'
      });
    }
    if (/INSERT YOUR FULL SYSTEM PROMPT HERE/i.test(systemPrompt)) {
      return res.status(400).json({
        error: 'System prompt placeholder holatda qolgan',
        detail: 'Vercel env ichiga haqiqiy to‘liq system promptni paste qiling.'
      });
    }

    if (!tradeContext || !tradeContext.officialDataAvailable) {
      return res.status(400).json({
        error: 'UN Comtrade context topilmadi',
        detail: 'AI Invest Tahlil faqat rasmiy UN Comtrade ma\'lumotlari bilan ishlaydi.'
      });
    }

    const contextText = [
      `Selected raw material: ${materialName}`,
      '',
      'Strict instruction:',
      '- Analyze ONLY the selected raw material.',
      '- Use ONLY the products listed in the official UN Comtrade context below.',
      '- Do NOT use any sample Excel/template data.',
      '- Do NOT add other downstream products unless they are present in the context JSON.',
      '- If data is missing, say it is missing.',
      '',
      'Official UN Comtrade context:',
      JSON.stringify(tradeContext, null, 2)
    ].join('\n');

    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: contextText }]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 8192
          }
        })
      }
    );

    if (!upstream.ok) {
      const detail = await upstream.text();
      const err = parseGeminiError(detail);
      return res.status(upstream.status).json({
        error: err.message || 'Gemini API xato qaytardi',
        detail: err.raw,
        model
      });
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    if (typeof res.flushHeaders === 'function') res.flushHeaders();

    const reader = upstream.body && upstream.body.getReader ? upstream.body.getReader() : null;
    if (!reader) {
      return res.end('event: error\ndata: {"error":{"message":"Gemini stream mavjud emas"}}\n\n');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) res.write(Buffer.from(value));
    }

    res.end();
  } catch (error) {
    console.error('analyze-material error:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: error.message || 'Server xatosi' });
    }
    res.write(`event: error\ndata: ${JSON.stringify({ error: { message: error.message || 'Server xatosi' } })}\n\n`);
    res.end();
  }
}
