const WTO_MAP = {
  '860':'UZB','398':'KAZ','417':'KGZ','762':'TJK','795':'TKM',
  '643':'RUS','031':'AZE','268':'GEO','051':'ARM','112':'BLR','804':'UKR','498':'MDA',
  '156':'CHN','392':'JPN','410':'KOR','496':'MNG','158':'TWN','344':'HKG',
  '360':'IDN','458':'MYS','764':'THA','704':'VNM','608':'PHL','702':'SGP','104':'MMR','116':'KHM',
  '356':'IND','586':'PAK','050':'BGD','144':'LKA','004':'AFG','524':'NPL',
  '792':'TUR','364':'IRN','368':'IRQ','682':'SAU','784':'ARE','634':'QAT','414':'KWT','512':'OMN','048':'BHR','400':'JOR','887':'YEM','196':'CYP',
  '276':'DEU','250':'FRA','826':'GBR','380':'ITA','724':'ESP','528':'NLD','056':'BEL','040':'AUT','756':'CHE','372':'IRL',
  '752':'SWE','578':'NOR','208':'DNK','246':'FIN','352':'ISL','233':'EST','428':'LVA','440':'LTU',
  '616':'POL','203':'CZE','348':'HUN','642':'ROU','100':'BGR','703':'SVK','705':'SVN','191':'HRV','688':'SRB','008':'ALB',
  '620':'PRT','300':'GRC',
  '842':'USA','124':'CAN','484':'MEX',
  '192':'CUB','214':'DOM','320':'GTM','188':'CRI','591':'PAN',
  '076':'BRA','032':'ARG','152':'CHL','170':'COL','604':'PER','862':'VEN','218':'ECU','068':'BOL','858':'URY',
  '818':'EGY','504':'MAR','012':'DZA','788':'TUN','566':'NGA','710':'ZAF','404':'KEN','834':'TZA','231':'ETH',
  '036':'AUS','554':'NZL',
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  if(req.method==='OPTIONS') return res.status(200).end();
  
  try {
    const {reporter,year='2023',flow='M',key} = req.query;
    const wtoKey = key || process.env.WTO_API_KEY || '';
    if(!reporter||!wtoKey) return res.json({data:[],error:'reporter/key kerak'});
    
    const wtoCode = WTO_MAP[reporter] || reporter;
    const headers = {'Ocp-Apim-Subscription-Key':wtoKey,'Accept':'application/json'};
    
    // Get indicators first
    let indicatorCodes = [];
    try {
      const indResp = await fetch('https://api.wto.org/timeseries/v1/indicators?lang=1',{headers});
      if(indResp.ok){
        const indicators = await indResp.json();
        const terms = flow==='X'?['export','merchandise','product']:['import','merchandise','product'];
        indicatorCodes = indicators.filter(i=>{const n=(i.name||'').toLowerCase();return terms.every(t=>n.includes(t))&&n.includes('value');}).map(i=>i.code).slice(0,3);
      }
    } catch(e){}
    if(!indicatorCodes.length) indicatorCodes = flow==='X'?['ITS_MTV_AX']:['ITS_MTV_AM'];
    
    let data = [];
    for(const ind of indicatorCodes){
      if(data.length) break;
      try {
        const r = await fetch(`https://api.wto.org/timeseries/v1/data?i=${ind}&r=${wtoCode}&p=000&ps=${year}&pc=HS2&spc=false&fmt=json&mode=full&dec=default&off=0&max=500&head=H&lang=1&meta=false`,{headers});
        if(r.ok){
          const j = await r.json();
          data = (j.Dataset||[]).map(r=>({cmdCode:String(r.ProductOrSectorCode||'').replace(/^HS/,''),cmdDesc:r.ProductOrSector||'',primaryValue:parseFloat(r.Value)*1e6||0,netWgt:0,period:r.Year||year})).filter(r=>r.primaryValue>0);
        }
      } catch(e){}
    }
    res.json({data,source:'WTO ('+wtoCode+')',count:data.length});
  } catch(e) {
    res.json({data:[],error:e.message});
  }
}
