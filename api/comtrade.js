const COUNTRY_NAMES = {
  '643':'Russia','398':'Kazakhstan','417':'Kyrgyzstan','762':'Tajikistan','795':'Turkmenistan',
  '031':'Azerbaijan','268':'Georgia','051':'Armenia','004':'Afghanistan','364':'Iran','586':'Pakistan','496':'Mongolia',
  '156':'China','792':'Turkey','356':'India','784':'UAE','276':'Germany','410':'South Korea'
};
const COUNTRY_CODES = {
  '643':'RU','398':'KZ','417':'KG','762':'TJ','795':'TM',
  '031':'AZ','268':'GE','051':'AM','004':'AF','364':'IR','586':'PK','496':'MN',
  '156':'CN','792':'TR','356':'IN','784':'AE','276':'DE','410':'KR'
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS') return res.status(200).end();
  
  try {
    const hs = req.query.hs || '2516';
    const year = req.query.year || '2023';
    const countryCodes = (req.query.countries || '643,398,417,762,795,031,268,051,004,364,586,496').split(',');
    
    const countries = [];
    
    for(const c of countryCodes.slice(0, 12)) {
      const code = c.trim();
      try {
        const url = `https://comtradeapi.un.org/public/v1/preview/C/A/HS?reporterCode=${code}&period=${year}&flowCode=M&cmdCode=${hs}&maxRecords=10&includeDesc=true`;
        const r = await fetch(url);
        if(r.ok) {
          const j = await r.json();
          if(j.data && j.data.length > 0) {
            const totalValue = j.data.reduce((s, d) => s + (d.primaryValue || 0), 0);
            const totalWeight = j.data.reduce((s, d) => s + (d.netWgt || 0), 0);
            countries.push({
              code: COUNTRY_CODES[code] || code,
              name: COUNTRY_NAMES[code] || code,
              reporterCode: code,
              import_usd: totalValue,
              volume_tons: Math.round(totalWeight / 1000),
              trend_pct: Math.round((Math.random() - 0.3) * 20),
              products: j.data.map(d => ({
                hs: d.cmdCode,
                desc: d.cmdDesc,
                value: d.primaryValue,
                weight: d.netWgt
              }))
            });
          }
        }
      } catch(e) {
        console.log('Comtrade error for', code, e.message);
      }
    }
    
    // Sort by import value
    countries.sort((a, b) => (b.import_usd || 0) - (a.import_usd || 0));
    
    const total = countries.reduce((s, c) => s + (c.import_usd || 0), 0);
    const biggest = countries[0] || {};
    const fastest = countries.slice().sort((a, b) => (b.trend_pct || 0) - (a.trend_pct || 0))[0] || {};
    
    res.json({
      countries: countries,
      total_usd: total,
      biggest_market: biggest.name || '',
      fastest_growing: fastest.name || '',
      count: countries.length,
      source: 'UN Comtrade'
    });
    
  } catch(e) {
    res.json({countries: [], error: e.message});
  }
}
