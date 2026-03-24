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

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function fetchTariffRows(url, fallbackPartner, fallbackIndicator) {
  const r = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error(`WITS Tariff: ${r.status}`);
  const json = await r.json();
  const series = json?.dataSets?.[0]?.series || {};
  const dims = json?.structure?.dimensions?.series || [];
  const productDimIndex = dims.findIndex((d) => d.id === 'PRODUCTCODE');
  const partnerDimIndex = dims.findIndex((d) => d.id === 'PARTNER');
  const indicatorDimIndex = dims.findIndex((d) => d.id === 'INDICATOR');
  const products = productDimIndex >= 0 ? (dims[productDimIndex]?.values || []) : [];
  const partners = partnerDimIndex >= 0 ? (dims[partnerDimIndex]?.values || []) : [];
  const indicators = indicatorDimIndex >= 0 ? (dims[indicatorDimIndex]?.values || []) : [];
  const rows = [];

  Object.keys(series).forEach((key) => {
    const indexes = key.split(':').map((n) => Number(n));
    const product = products[indexes[productDimIndex]] || {};
    const partner = partners[indexes[partnerDimIndex]] || {};
    const indicator = indicators[indexes[indicatorDimIndex]] || {};
    const observations = series[key]?.observations || {};
    const obsKey = Object.keys(observations)[0];
    const rawValue = obsKey !== undefined ? observations[obsKey] : null;
    const value = Array.isArray(rawValue) ? Number(rawValue[0]) : Number(rawValue);
    if (!product.id || product.id === 'Total' || Number.isNaN(value)) return;
    rows.push({
      productCode: product.id,
      productName: product.name || product.id,
      partner: partner.id || fallbackPartner || '',
      indicator: indicator.id || fallbackIndicator || '',
      indicatorName: indicator.name || fallbackIndicator || '',
      rate: value
    });
  });

  return rows;
}

async function fetchTariffSet(reporterIso, partnerIso, year) {
  const appliedUrl = `https://wits.worldbank.org/API/V1/SDMX/V21/datasource/tradestats-tariff/reporter/${reporterIso}/year/${year}/partner/${partnerIso}/product/all/indicator/AHS-WGHTD-AVRG?format=JSON`;
  const mfnUrl = `https://wits.worldbank.org/API/V1/SDMX/V21/datasource/tradestats-tariff/reporter/${reporterIso}/year/${year}/partner/WLD/product/all/indicator/MFN-WGHTD-AVRG?format=JSON`;

  const [appliedRows, mfnRows] = await Promise.all([
    fetchTariffRows(appliedUrl, partnerIso, 'AHS-WGHTD-AVRG').catch(() => []),
    fetchTariffRows(mfnUrl, 'WLD', 'MFN-WGHTD-AVRG').catch(() => [])
  ]);

  const grouped = {};
  appliedRows.forEach((row) => {
    if (!grouped[row.productCode]) grouped[row.productCode] = { productCode: row.productCode, productName: row.productName };
    grouped[row.productCode].appliedRate = row.rate;
    grouped[row.productCode].appliedIndicator = row.indicator;
    grouped[row.productCode].appliedPartner = row.partner;
  });
  mfnRows.forEach((row) => {
    if (!grouped[row.productCode]) grouped[row.productCode] = { productCode: row.productCode, productName: row.productName };
    grouped[row.productCode].mfnRate = row.rate;
    grouped[row.productCode].mfnIndicator = row.indicator;
    grouped[row.productCode].mfnPartner = row.partner;
  });

  return Object.values(grouped);
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { reporter, year = '2024', partner = 'UZB' } = req.query;
    const reporterIso = ISO3[String(reporter)] || String(reporter || '').toUpperCase();
    const partnerIso = ISO3[String(partner)] || String(partner || '').toUpperCase() || 'UZB';
    if (!reporterIso) return res.json({ data: [], error: 'reporter kerak' });
    const requestedYear = Number(year) || 2024;
    const candidateYears = [requestedYear, requestedYear - 1, requestedYear - 2, requestedYear - 3]
      .filter((v, idx, arr) => v > 0 && arr.indexOf(v) === idx);
    let usedYear = requestedYear;
    let rows = [];
    for (const y of candidateYears) {
      rows = await fetchTariffSet(reporterIso, partnerIso, y);
      if (rows.length) {
        usedYear = y;
        break;
      }
    }

    res.json({
      data: rows,
      source: 'WITS - UNCTAD TRAINS',
      reporter: reporterIso,
      partner: partnerIso,
      requestedYear: String(requestedYear),
      year: String(usedYear),
      isFallback: String(usedYear) !== String(requestedYear),
      count: rows.length
    });
  } catch (e) {
    res.json({ data: [], error: e.message, source: 'WITS - UNCTAD TRAINS' });
  }
}
