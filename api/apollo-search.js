export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  if(req.method==='OPTIONS') return res.status(200).end();
  try {
    const body = typeof req.body==='string'?JSON.parse(req.body):req.body;
    const apiKey = body.api_key || process.env.APOLLO_KEY || '';
    const resp = await fetch('https://api.apollo.io/v1/mixed_people/search',{
      method:'POST',headers:{'Content-Type':'application/json','Cache-Control':'no-cache'},
      body:JSON.stringify({...body,api_key:apiKey})
    });
    const data = await resp.json();
    res.json(data);
  } catch(e) { res.json({error:e.message}); }
}
