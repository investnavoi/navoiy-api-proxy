/* ═══════════════════════════════════════════════════════════════
   WITS Trade Data Handler — World Bank WITS Public API
   Free, no key required, ~2 year data lag.
   Falls back through years: requested → requested-1 → 2022 → 2021
═══════════════════════════════════════════════════════════════ */

const ISO_MAP = {
  '860':'UZB','398':'KAZ','417':'KGZ','762':'TJK','795':'TKM',
  '643':'RUS','031':'AZE','268':'GEO','051':'ARM','112':'BLR','804':'UKR','498':'MDA',
  '156':'CHN','392':'JPN','410':'KOR','496':'MNG','158':'TWN','344':'HKG',
  '360':'IDN','458':'MYS','764':'THA','704':'VNM','608':'PHL','702':'SGP','104':'MMR','116':'KHM',
  '356':'IND','586':'PAK','050':'BGD','144':'LKA','004':'AFG','524':'NPL',
  '792':'TUR','364':'IRN','368':'IRQ','682':'SAU','784':'ARE','634':'QAT','414':'KWT','512':'OMN','048':'BHR','400':'JOR','887':'YEM',
  '276':'DEU','250':'FRA','826':'GBR','380':'ITA','724':'ESP','528':'NLD','056':'BEL','040':'AUT','756':'CHE','372':'IRL',
  '752':'SWE','578':'NOR','208':'DNK','246':'FIN','616':'POL','203':'CZE','348':'HUN','642':'ROU','688':'SRB',
  '842':'USA','124':'CAN','484':'MEX',
  '076':'BRA','032':'ARG','152':'CHL','170':'COL','604':'PER',
  '818':'EGY','504':'MAR','012':'DZA','788':'TUN','566':'NGA','710':'ZAF','404':'KEN','834':'TZA',
  '036':'AUS','554':'NZL',
};

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/* Parse WITS JSON response (v1 REST format) */
function parseWitsJson(json, year, flow) {
  /* Format 1: wits_TradeStats.tradestats.WITS_Trade_Summary */
  try {
    const ts = json?.wits_TradeStats?.tradestats?.WITS_Trade_Summary
             || json?.tradestats?.WITS_Trade_Summary
             || json?.WITS_Trade_Summary;
    if (ts) {
      const countries = Array.isArray(ts.country) ? ts.country : [ts.country].filter(Boolean);
      const rows = [];
      for (const ctry of countries) {
        const commodities = Array.isArray(ctry.commodity) ? ctry.commodity : [ctry.commodity].filter(Boolean);
        for (const c of commodities) {
          const val = parseFloat(c.TradeValue || c.tradevalue || c.value || 0);
          if (val > 0) {
            rows.push({
              cmdCode: String(c.productcode || c.ProductCode || '').padStart(2, '0'),
              cmdDesc: c.description || c.ProductDescription || '',
              primaryValue: val * 1000, // WITS values in USD thousands
              netWgt: 0,
              period: year,
              partnerDesc: 'World',
              flowCode: flow,
            });
          }
        }
      }
      return rows;
    }
  } catch (_e) { /* try next format */ }

  /* Format 2: flat array */
  if (Array.isArray(json)) {
    return json.map(r => ({
      cmdCode: String(r.productcode || r.ProductCode || r.cmdCode || '').padStart(2, '0'),
      cmdDesc: r.description || r.ProductDescription || r.cmdDesc || '',
      primaryValue: parseFloat(r.TradeValue || r.tradevalue || r.primaryValue || 0) * 1000,
      netWgt: 0,
      period: year,
      partnerDesc: 'World',
      flowCode: flow,
    })).filter(r => r.primaryValue > 0);
  }

  /* Format 3: nested data key */
  if (Array.isArray(json?.data)) {
    return json.data.map(r => ({
      cmdCode: String(r.cmdCode || r.productcode || '').padStart(2, '0'),
      cmdDesc: r.cmdDesc || r.description || '',
      primaryValue: parseFloat(r.primaryValue || r.TradeValue || 0),
      netWgt: parseFloat(r.netWgt || 0),
      period: year,
      partnerDesc: 'World',
      flowCode: flow,
    })).filter(r => r.primaryValue > 0);
  }

  return [];
}

async function fetchWitsYear(iso3, year, flow) {
  const tradeDir = flow === 'X' ? 'exports' : 'imports';

  /* Attempt 1: WITS REST tradestats API */
  try {
    const url1 = `https://wits.worldbank.org/API/V1/wits/country/${iso3}/tradestats/tradedirection/${tradeDir}/startyear/${year}/endyear/${year}/partner/WLD/indicator/TXVALUE?format=JSON`;
    const r1 = await fetch(url1, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
    if (r1.ok) {
      const j1 = await r1.json();
      const rows = parseWitsJson(j1, year, flow);
      if (rows.length) return rows;
    }
  } catch (_e) { /* try next */ }

  /* Attempt 2: WITS datasource tradestats-trade API */
  try {
    const url2 = `https://wits.worldbank.org/API/V1/wits/datasource/tradestats-trade/indicator/TXVALUE/reporter/${iso3}/year/${year}/partner/WLD/product/all/dataformat/JSON`;
    const r2 = await fetch(url2, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
    if (r2.ok) {
      const j2 = await r2.json();
      const rows = parseWitsJson(j2, year, flow);
      if (rows.length) return rows;
    }
  } catch (_e) { /* try next */ }

  return [];
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { reporter, year = '2023', flow = 'M' } = req.query;
    if (!reporter) return res.json({ data: [], error: 'reporter kerak' });

    const iso3 = ISO_MAP[String(reporter)] || String(reporter);
    const reqYear = parseInt(year) || 2023;

    /* WITS has ~2 year data lag. Try years in order: requested → -1 → 2022 → 2021 */
    const yearsToTry = [...new Set([reqYear, reqYear - 1, 2022, 2021])].filter(y => y >= 2018);

    for (const tryYear of yearsToTry) {
      const rows = await fetchWitsYear(iso3, String(tryYear), flow);
      if (rows.length) {
        return res.json({
          data: rows,
          source: `WITS (${iso3})`,
          count: rows.length,
          actual_year: tryYear,
          requested_year: year,
        });
      }
    }

    res.json({ data: [], source: `WITS (${iso3})`, count: 0 });
  } catch (e) {
    res.json({ data: [], error: e.message });
  }
}
