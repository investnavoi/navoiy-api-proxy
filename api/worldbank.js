export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  if(req.method==='OPTIONS') return res.status(200).end();
  try {
    const {country='UZB',indicator='NY.GDP.MKTP.CD'} = req.query;
    const url = `https://api.worldbank.org/v2/country/${country}/indicator/${indicator}?format=json&per_page=10`;
    const r = await fetch(url);
    const data = await r.json();
    res.json(data);
  } catch(e) { res.json({error:e.message}); }
}
