export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS') return res.status(200).end();
  
  try {
    const {reporter,year='2023',flow='M',hs,key} = req.query;
    if(!reporter) return res.json({error:'reporter kerak',data:[]});
    
    const flowCode = flow==='X'?'X':'M';
    const comtradeKey = key || process.env.COMTRADE_KEY || '';
    
    let url;
    if(comtradeKey){
      url = `https://comtradeapi.un.org/data/v1/get/C/A/HS?reporterCode=${reporter}&period=${year}&flowCode=${flowCode}&maxRecords=5000&includeDesc=true${hs?'&cmdCode='+hs:''}`;
    } else {
      url = `https://comtradeapi.un.org/public/v1/preview/C/A/HS?reporterCode=${reporter}&period=${year}&flowCode=${flowCode}&maxRecords=500&includeDesc=true${hs?'&cmdCode='+hs:''}`;
    }
    
    const headers = {'Accept':'application/json'};
    if(comtradeKey) headers['Ocp-Apim-Subscription-Key'] = comtradeKey;
    
    const resp = await fetch(url, {headers});
    if(!resp.ok) return res.json({data:[], error:'Comtrade: '+resp.status});
    
    const json = await resp.json();
    res.json({data: json.data||[], source:'UN Comtrade', count:(json.data||[]).length});
  } catch(e) {
    res.json({data:[], error:e.message});
  }
}
