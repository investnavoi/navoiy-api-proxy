const ISO3 = {
  '860':'UZB','398':'KAZ','417':'KGZ','762':'TJK','795':'TKM',
  '643':'RUS','031':'AZE','268':'GEO','051':'ARM','112':'BLR','804':'UKR','498':'MDA',
  '156':'CHN','392':'JPN','410':'KOR','496':'MNG',
  '360':'IDN','458':'MYS','764':'THA','704':'VNM','608':'PHL','702':'SGP',
  '356':'IND','586':'PAK','050':'BGD','144':'LKA','004':'AFG',
  '792':'TUR','364':'IRN','682':'SAU','784':'ARE','634':'QAT',
  '276':'DEU','250':'FRA','826':'GBR','380':'ITA','724':'ESP','528':'NLD',
  '752':'SWE','578':'NOR','208':'DNK','246':'FIN',
  '616':'POL','203':'CZE','348':'HUN','642':'ROU','100':'BGR',
  '842':'USA','124':'CAN','484':'MEX',
  '192':'CUB','214':'DOM',
  '076':'BRA','032':'ARG','152':'CHL','170':'COL','604':'PER','862':'VEN',
  '818':'EGY','504':'MAR','566':'NGA','710':'ZAF','404':'KEN',
  '036':'AUS','554':'NZL',
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  if(req.method==='OPTIONS') return res.status(200).end();
  
  try {
    const {reporter,year='2023',flow='M'} = req.query;
    const iso3 = ISO3[reporter]||reporter;
    if(!iso3) return res.json({data:[],error:'reporter kerak'});
    
    const indicator = flow==='X'?'XPRT-TRD-VL':'MPRT-TRD-VL';
    let data = [];
    
    const urls = [
      `https://wits.worldbank.org/API/V1/wits/datasource/tradestats-trade/reporter/${iso3}/year/${year}/partner/WLD/product/all/indicator/${indicator}`,
      `https://wits.worldbank.org/API/V1/SDMX/V21/datasource/tradestats-trade/reporter/${iso3}/year/${year}/partner/WLD/product/all/indicator/${indicator}`,
    ];
    
    for(const url of urls){
      if(data.length) break;
      try {
        const r = await fetch(url);
        if(!r.ok) continue;
        const text = await r.text();
        
        if(text.trim().startsWith('{')||text.trim().startsWith('[')){
          try {
            const json = JSON.parse(text);
            if(json.dataSets&&json.dataSets[0]){
              const obs=json.dataSets[0].observations||{};
              const dims=json.structure?.dimensions?.observation||[];
              const prods=(dims.find(d=>d.id==='PRODUCT')||{}).values||[];
              Object.keys(obs).forEach(k=>{
                const idx=k.split(':').map(Number);
                const p=prods[idx.length>2?idx[2]:idx[0]]||{};
                const v=Array.isArray(obs[k])?obs[k][0]:obs[k];
                if(v>0&&p.id&&p.id!=='Total'&&p.id!=='ALL')
                  data.push({cmdCode:p.id,cmdDesc:p.name||p.id,primaryValue:v*1000,netWgt:0,period:year});
              });
            }
          } catch(e){}
        }
        
        if(!data.length&&text.includes('<')){
          const re=/<generic:Value id="PRODUCT" value="([^"]+)"[\s\S]*?<generic:ObsValue value="([^"]+)"/g;
          let m;
          while((m=re.exec(text))!==null){
            const v=parseFloat(m[2])||0;
            if(v>0&&m[1]!=='Total') data.push({cmdCode:m[1],cmdDesc:m[1],primaryValue:v*1000,netWgt:0,period:year});
          }
        }
      } catch(e){}
    }
    res.json({data,source:'WITS ('+iso3+')',count:data.length});
  } catch(e) {
    res.json({data:[],error:e.message});
  }
}
