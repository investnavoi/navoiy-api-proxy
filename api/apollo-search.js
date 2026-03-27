export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS') return res.status(200).end();
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const apiKey = body.api_key || process.env.APOLLO_KEY || process.env.APOLLO_API_KEY || '';
    if(!apiKey) return res.status(400).json({ error: 'Apollo API key topilmadi' });

    const searchType = body.search_type === 'organizations' ? 'organizations' : 'people';
    const payload = { ...body };
    delete payload.api_key;
    delete payload.search_type;

    if(payload.keyword && !payload.q_keywords){
      payload.q_keywords = String(payload.keyword || '').trim();
    }
    delete payload.keyword;

    const url = searchType === 'organizations'
      ? 'https://api.apollo.io/api/v1/mixed_companies/search'
      : 'https://api.apollo.io/api/v1/mixed_people/api_search';

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Accept': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify(payload)
    });

    const raw = await resp.text();
    let data;
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = { raw };
    }

    return res.status(resp.status).json(data);
  } catch(e) {
    return res.status(500).json({error:e.message});
  }
}
