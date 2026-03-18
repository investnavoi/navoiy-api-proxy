export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  if(req.method==='OPTIONS') return res.status(200).end();
  try {
    const {hs='2516',countries='398,417,762,156,792,364,586,004,643,356,784,276'} = req.query;
    const cc = countries.split(',');
    const results = [];
    for(const c of cc.slice(0,12)){
      try {
        const url = `https://comtradeapi.un.org/public/v1/preview/C/A/HS?reporterCode=${c.trim()}&period=2023&flowCode=M&cmdCode=${hs}&maxRecords=10&includeDesc=true`;
        const r = await fetch(url);
        if(r.ok){const j=await r.json();if(j.data)results.push(...j.data);}
      } catch(e){}
    }
    res.json({data:results,count:results.length});
  } catch(e) { res.json({data:[],error:e.message}); }
}
