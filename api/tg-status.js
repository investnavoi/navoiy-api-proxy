export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS') return res.status(200).end();
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const apiKey = body.api_key || process.env.APOLLO_KEY || process.env.APOLLO_API_KEY || '';
    if(!apiKey) return res.status(400).json({ error: 'Apollo API key topilmadi' });

    let action = String(body.action || body.operation || '').trim();
    if(!action){
      action = body.search_type === 'organizations' ? 'organization_search' : 'people_search';
    }

    if(action === 'organization_info'){
      const orgId = String(body.organization_id || '').trim();
      if(!orgId) return res.status(400).json({ error: 'organization_id talab qilinadi' });

      const resp = await fetch('https://api.apollo.io/api/v1/organizations/' + encodeURIComponent(orgId), {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Accept': 'application/json',
          'x-api-key': apiKey
        }
      });

      const raw = await resp.text();
      let data;
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = { raw };
      }
      return res.status(resp.status).json(data);
    }

    const payload = { ...body };
    delete payload.api_key;
    delete payload.search_type;
    delete payload.operation;
    delete payload.action;
    delete payload.organization_id;

    if(payload.keyword && !payload.q_keywords){
      payload.q_keywords = String(payload.keyword || '').trim();
    }
    delete payload.keyword;

    let url = '';
    if(action === 'organization_search'){
      url = 'https://api.apollo.io/api/v1/mixed_companies/search';
    } else if(action === 'people_search'){
      url = 'https://api.apollo.io/api/v1/mixed_people/api_search';
    } else if(action === 'people_enrichment'){
      url = 'https://api.apollo.io/api/v1/people/match';
    } else if(action === 'bulk_people_enrichment'){
      url = 'https://api.apollo.io/api/v1/people/bulk_match';
    } else {
      return res.status(400).json({ error: 'Apollo action qo‘llab-quvvatlanmaydi: ' + action });
    }

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
