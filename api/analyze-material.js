function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function uniq(arr) {
  return Array.from(new Set((arr || []).filter(Boolean)));
}

function parseAnthropicError(raw) {
  const rawText = String(raw || '').trim();
  if (!rawText) {
    return { message: 'Anthropic bo‘sh xato qaytardi', raw: '', type: '' };
  }
  try {
    const json = JSON.parse(rawText);
    const message =
      (json.error && json.error.message) ||
      json.message ||
      rawText;
    const type =
      (json.error && json.error.type) ||
      json.type ||
      '';
    return { message, raw: rawText, type };
  } catch (_) {
    return { message: rawText, raw: rawText, type: '' };
  }
}

function shouldTryFallback(status, errInfo) {
  const msg = String((errInfo && (errInfo.message || errInfo.raw || errInfo.type)) || '').toLowerCase();
  if (status !== 400) return false;
  return /model|not[_ -]?found|invalid|access|permission|available|unsupported/.test(msg);
}

async function callAnthropic({ apiKey, systemPrompt, materialName, model }) {
  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'x-api-key': apiKey
    },
    body: JSON.stringify({
      model,
      max_tokens: 8000,
      stream: true,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: materialName }
          ]
        }
      ]
    })
  });

  if (upstream.ok) {
    return { ok: true, upstream, model };
  }

  const detail = await upstream.text();
  return {
    ok: false,
    status: upstream.status,
    model,
    error: parseAnthropicError(detail)
  };
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body.trim()) return JSON.parse(req.body);

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  return raw ? JSON.parse(raw) : {};
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST method kerak' });

  try {
    const body = await readJsonBody(req);
    const materialName = String(body.materialName || '').trim();
    if (!materialName) return res.status(400).json({ error: 'materialName kerak' });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    const systemPrompt = String(process.env.ANTHROPIC_SYSTEM_PROMPT || '').trim();
    const configuredModel = String(process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514').trim();

    if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY env topilmadi' });
    if (!systemPrompt) return res.status(500).json({ error: 'ANTHROPIC_SYSTEM_PROMPT env topilmadi' });

    if (/INSERT YOUR FULL SYSTEM PROMPT HERE/i.test(systemPrompt)) {
      return res.status(400).json({
        error: 'ANTHROPIC_SYSTEM_PROMPT placeholder holatda qolgan',
        detail: 'Vercel env ichiga haqiqiy to‘liq system promptni paste qiling.'
      });
    }

    const modelCandidates = uniq([
      configuredModel,
      'claude-sonnet-4-20250514',
      'claude-3-7-sonnet-latest'
    ]);

    let upstream = null;
    let lastFailure = null;
    const tried = [];

    for (const model of modelCandidates) {
      tried.push(model);
      const attempt = await callAnthropic({ apiKey, systemPrompt, materialName, model });
      if (attempt.ok) {
        upstream = attempt.upstream;
        break;
      }
      lastFailure = attempt;
      if (!shouldTryFallback(attempt.status, attempt.error)) {
        break;
      }
    }

    if (!upstream) {
      return res.status((lastFailure && lastFailure.status) || 500).json({
        error: (lastFailure && lastFailure.error && lastFailure.error.message) || 'Anthropic API xato qaytardi',
        detail: (lastFailure && lastFailure.error && lastFailure.error.raw) || '',
        model: (lastFailure && lastFailure.model) || configuredModel,
        tried_models: tried
      });
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    if (typeof res.flushHeaders === 'function') res.flushHeaders();

    const reader = upstream.body && upstream.body.getReader ? upstream.body.getReader() : null;
    if (!reader) {
      return res.end('event: error\ndata: {"type":"error","message":"Anthropic stream mavjud emas"}\n\n');
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
    res.write(`event: error\ndata: ${JSON.stringify({ type: 'error', message: error.message || 'Server xatosi' })}\n\n`);
    res.end();
  }
}
