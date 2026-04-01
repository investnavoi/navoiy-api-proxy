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
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS') return res.status(200).end();
  try {
    const {
      country='UZB',
      indicator='NY.GDP.MKTP.CD',
      date='2020:2024',
      per_page='500',
      format='json'
    } = req.query;
    const url = `https://api.worldbank.org/v2/country/${encodeURIComponent(country)}/indicator/${encodeURIComponent(indicator)}?format=${encodeURIComponent(format)}&date=${encodeURIComponent(date)}&per_page=${encodeURIComponent(per_page)}`;
    const r = await fetch(url);
    if(!r.ok){
      const text = await r.text();
      return res.status(r.status).json({error:`World Bank ${r.status}`, details:text, url});
    }
    const data = await r.json();
    res.json(data);
  } catch(e) { res.json({error:e.message}); }
}
