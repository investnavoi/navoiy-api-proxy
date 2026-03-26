const COUNTRY_DEFS = [
  { iso3: 'UZB', wb: 'UZB', iea: 'Uzbekistan', display: 'Uzbekistan', aliases: ['uzbekistan', "o'zbekiston", 'ozbekiston', 'uzbekiston'] },
  { iso3: 'USA', wb: 'USA', iea: 'United States', display: 'United States', aliases: ['united states', 'united states of america', 'usa', 'us', 'amerika', 'aqsh'] },
  { iso3: 'DEU', wb: 'DEU', iea: 'Germany', display: 'Germany', aliases: ['germany', 'germaniya', 'deutschland'] },
  { iso3: 'FRA', wb: 'FRA', iea: 'France', display: 'France', aliases: ['france', 'fransiya'] },
  { iso3: 'ITA', wb: 'ITA', iea: 'Italy', display: 'Italy', aliases: ['italy', 'italiya'] },
  { iso3: 'ESP', wb: 'ESP', iea: 'Spain', display: 'Spain', aliases: ['spain', 'ispaniya'] },
  { iso3: 'GBR', wb: 'GBR', iea: 'United Kingdom', display: 'United Kingdom', aliases: ['united kingdom', 'uk', 'great britain', 'britain', 'england', 'buyuk britaniya'] },
  { iso3: 'NLD', wb: 'NLD', iea: 'Netherlands', display: 'Netherlands', aliases: ['netherlands', 'niderlandiya', 'holland'] },
  { iso3: 'BEL', wb: 'BEL', iea: 'Belgium', display: 'Belgium', aliases: ['belgium', 'belgiya'] },
  { iso3: 'CHE', wb: 'CHE', iea: 'Switzerland', display: 'Switzerland', aliases: ['switzerland', 'shveytsariya'] },
  { iso3: 'AUT', wb: 'AUT', iea: 'Austria', display: 'Austria', aliases: ['austria', 'avstriya'] },
  { iso3: 'POL', wb: 'POL', iea: 'Poland', display: 'Poland', aliases: ['poland', 'polsha'] },
  { iso3: 'CZE', wb: 'CZE', iea: 'Czechia', display: 'Czechia', aliases: ['czechia', 'czech republic', 'chexiya'] },
  { iso3: 'TUR', wb: 'TUR', iea: 'Republic of Türkiye', display: 'Türkiye', aliases: ['turkiye', 'türkiye', 'turkey', 'turkiya'] },
  { iso3: 'ARE', wb: 'ARE', iea: 'United Arab Emirates', display: 'United Arab Emirates', aliases: ['united arab emirates', 'uae', 'bae', 'amirliklar', "birlashgan arab amirliklari"] },
  { iso3: 'SAU', wb: 'SAU', iea: 'Saudi Arabia', display: 'Saudi Arabia', aliases: ['saudi arabia', 'saudiya', 'saudiya arabistoni'] },
  { iso3: 'QAT', wb: 'QAT', iea: 'Qatar', display: 'Qatar', aliases: ['qatar'] },
  { iso3: 'CHN', wb: 'CHN', iea: "People's Republic of China", display: 'China', aliases: ['china', 'xitoy', "people's republic of china", 'prc'] },
  { iso3: 'JPN', wb: 'JPN', iea: 'Japan', display: 'Japan', aliases: ['japan', 'yaponiya'] },
  { iso3: 'KOR', wb: 'KOR', iea: 'Korea', display: 'South Korea', aliases: ['south korea', 'korea', 'janubiy koreya', 'koreya'] },
  { iso3: 'IND', wb: 'IND', iea: 'India', display: 'India', aliases: ['india', 'hindiston'] },
  { iso3: 'CAN', wb: 'CAN', iea: 'Canada', display: 'Canada', aliases: ['canada', 'kanada'] },
  { iso3: 'AUS', wb: 'AUS', iea: 'Australia', display: 'Australia', aliases: ['australia', 'avstraliya'] },
  { iso3: 'BRA', wb: 'BRA', iea: 'Brazil', display: 'Brazil', aliases: ['brazil', 'braziliya'] },
  { iso3: 'MEX', wb: 'MEX', iea: 'Mexico', display: 'Mexico', aliases: ['mexico', 'meksika'] },
  { iso3: 'SGP', wb: 'SGP', iea: 'Singapore', display: 'Singapore', aliases: ['singapore', 'singapur'] },
  { iso3: 'RUS', wb: 'RUS', iea: 'Russian Federation', display: 'Russia', aliases: ['russia', 'rossiya', 'russian federation'] },
  { iso3: 'KAZ', wb: 'KAZ', iea: 'Kazakhstan', display: 'Kazakhstan', aliases: ['kazakhstan', "qozog'iston", 'qozogiston', 'kazakstan'] },
  { iso3: 'KGZ', wb: 'KGZ', iea: 'Kyrgyzstan', display: 'Kyrgyzstan', aliases: ['kyrgyzstan', "qirg'iziston", 'qirgiziston', 'kirgizstan'] },
  { iso3: 'TJK', wb: 'TJK', iea: 'Tajikistan', display: 'Tajikistan', aliases: ['tajikistan', 'tojikiston'] },
  { iso3: 'TKM', wb: 'TKM', iea: 'Turkmenistan', display: 'Turkmenistan', aliases: ['turkmenistan', 'turkmaniston'] },
  { iso3: 'MNG', wb: 'MNG', iea: 'Mongolia', display: 'Mongolia', aliases: ['mongolia', 'mongoliya'] },
  { iso3: 'AZE', wb: 'AZE', iea: 'Azerbaijan', display: 'Azerbaijan', aliases: ['azerbaijan', 'ozarbayjon', 'azerbayjan'] },
  { iso3: 'GEO', wb: 'GEO', iea: 'Georgia', display: 'Georgia', aliases: ['georgia', 'gruziya'] },
  { iso3: 'ARM', wb: 'ARM', iea: 'Armenia', display: 'Armenia', aliases: ['armenia', 'armaniston'] },
  { iso3: 'IRN', wb: 'IRN', iea: 'Islamic Republic of Iran', display: 'Iran', aliases: ['iran', 'eron', 'islamic republic of iran'] },
  { iso3: 'AFG', wb: 'AFG', iea: 'Afghanistan', display: 'Afghanistan', aliases: ['afghanistan', "afg'oniston", 'afgoniston'] },
  { iso3: 'PAK', wb: 'PAK', iea: 'Pakistan', display: 'Pakistan', aliases: ['pakistan', 'pokiston'] }
];

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function normalizeCountryKey(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’`"]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function resolveCountry(input) {
  const raw = String(input || '').trim();
  if (!raw) return null;
  const key = normalizeCountryKey(raw);
  if (!key) return null;
  for (const def of COUNTRY_DEFS) {
    if (normalizeCountryKey(def.iso3) === key || normalizeCountryKey(def.display) === key) return def;
    if ((def.aliases || []).some((alias) => normalizeCountryKey(alias) === key)) return def;
  }
  const partial = COUNTRY_DEFS.find((def) => (def.aliases || []).some((alias) => normalizeCountryKey(alias).includes(key) || key.includes(normalizeCountryKey(alias))));
  return partial || null;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (ch !== '\r') {
      field += ch;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  if (!rows.length) return [];
  const headers = rows[0];
  return rows.slice(1).filter((r) => r.some((v) => String(v || '').trim() !== '')).map((r) => {
    const obj = {};
    headers.forEach((header, idx) => {
      obj[header] = r[idx];
    });
    return obj;
  });
}

async function fetchText(url) {
  const resp = await fetch(url, { headers: { Accept: 'text/csv,text/plain,application/json' } });
  if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`);
  return resp.text();
}

async function fetchJson(url) {
  const resp = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`);
  return resp.json();
}

function latestWorldBankValue(rows) {
  const data = Array.isArray(rows) && Array.isArray(rows[1]) ? rows[1] : [];
  const sorted = data
    .filter((row) => row && row.value !== null && row.value !== undefined)
    .sort((a, b) => Number(b.date || 0) - Number(a.date || 0));
  if (!sorted.length) return null;
  return {
    value: Number(sorted[0].value),
    year: String(sorted[0].date || ''),
    unit: sorted[0].unit || '',
    source: 'World Bank Open Data API'
  };
}

async function fetchWorldBankIndicator(iso3, indicator) {
  const url = `https://api.worldbank.org/v2/country/${encodeURIComponent(iso3)}/indicator/${encodeURIComponent(indicator)}?format=json&per_page=20`;
  const json = await fetchJson(url);
  return latestWorldBankValue(json);
}

function latestIloUsdValue(rows) {
  const preferredLabels = ['Currency: U.S. dollars', 'Currency: 2021 PPP $', 'Currency: Local currency'];
  for (const label of preferredLabels) {
    const matches = rows
      .filter((row) => String(row['classif1.label'] || '').trim() === label)
      .filter((row) => row.obs_value !== undefined && row.obs_value !== null && String(row.obs_value).trim() !== '')
      .sort((a, b) => Number(b.time || 0) - Number(a.time || 0));
    if (matches.length) {
      const row = matches[0];
      return {
        value: Number(row.obs_value),
        year: String(row.time || ''),
        currencyLabel: label,
        sourceLabel: row['source.label'] || '',
        noteIndicator: row['note_indicator.label'] || '',
        noteSource: row['note_source.label'] || ''
      };
    }
  }
  return null;
}

async function fetchIlostatMonthlyWage(iso3) {
  const url = `https://rplumber.ilo.org/data/indicator?id=EAR_EMTA_SEX_CUR_NB_A&ref_area=${encodeURIComponent(iso3)}&sex=SEX_T&latestyear=TRUE&format=.csv&type=label&mode=B`;
  const csv = await fetchText(url);
  const rows = parseCsv(csv);
  const value = latestIloUsdValue(rows);
  if (!value) return null;
  const unit = value.currencyLabel === 'Currency: U.S. dollars'
    ? 'USD/month'
    : value.currencyLabel === 'Currency: 2021 PPP $'
      ? 'PPP$/month'
      : 'Local currency/month';
  return {
    ...value,
    source: 'ILOSTAT API',
    indicator: 'EAR_EMTA_SEX_CUR_NB_A',
    unit
  };
}

function latestIeaProductValue(rows, productCode) {
  const matches = (Array.isArray(rows) ? rows : [])
    .filter((row) => String(row.CODE_PRODUCT || '').toUpperCase() === String(productCode || '').toUpperCase())
    .filter((row) => row.Value !== null && row.Value !== undefined)
    .map((row) => ({ ...row, Value: Number(row.Value) }))
    .filter((row) => !Number.isNaN(row.Value))
    .sort((a, b) => Number(b.CODE_YEAR || 0) - Number(a.CODE_YEAR || 0));
  if (!matches.length) return null;
  const row = matches[0];
  return {
    value: row.Value,
    year: String(row.CODE_YEAR || ''),
    unit: row.Unit || '',
    product: row.Product || '',
    source: 'IEA Prices API',
    indicator: 'PRICE'
  };
}

async function fetchIeaIndustrialBundle(countryName) {
  const url = `https://api.iea.org/prices?Country=${encodeURIComponent(countryName)}&CODE_INDICATOR=PRICE&CODE_SECTOR=IND&CODE_UNIT=USDCUR`;
  const rows = await fetchJson(url);
  return {
    electricity: latestIeaProductValue(rows, 'ELECTR'),
    naturalGas: latestIeaProductValue(rows, 'NATGAS')
  };
}

async function fetchUsEiaIndustrialElectricity() {
  const url = 'https://api.eia.gov/v2/electricity/retail-sales/data/?api_key=DEMO_KEY&frequency=annual&data[0]=price&facets[sectorid][]=IND&facets[stateid][]=US&sort[0][column]=period&sort[0][direction]=desc&length=1';
  const json = await fetchJson(url);
  const row = json?.response?.data?.[0];
  if (!row || row.price === undefined || row.price === null) return null;
  return {
    value: Number(row.price) * 10,
    year: String(row.period || ''),
    unit: 'USD/MWh',
    product: 'Electricity',
    source: 'U.S. EIA API',
    indicator: 'electricity/retail-sales industrial price'
  };
}

function ratio(base, compare) {
  const a = Number(base);
  const b = Number(compare);
  if (!(a > 0) || !(b > 0)) return null;
  return a / b;
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const input = String(req.query.country || '').trim();
    if (!input) return res.status(400).json({ error: 'country param kerak' });

    const country = resolveCountry(input);
    if (!country) {
      return res.status(400).json({ error: `Davlat aniqlanmadi: ${input}` });
    }

    const uzbekistan = COUNTRY_DEFS.find((row) => row.iso3 === 'UZB');

    const [countryGdp, countryIndustryShare, countryWage, countryIea, uzGdp, uzIndustryShare, uzWage, uzIea] = await Promise.all([
      fetchWorldBankIndicator(country.wb, 'NY.GDP.PCAP.CD').catch(() => null),
      fetchWorldBankIndicator(country.wb, 'NV.IND.TOTL.ZS').catch(() => null),
      fetchIlostatMonthlyWage(country.iso3).catch(() => null),
      fetchIeaIndustrialBundle(country.iea).catch(() => ({ electricity: null, naturalGas: null })),
      fetchWorldBankIndicator(uzbekistan.wb, 'NY.GDP.PCAP.CD').catch(() => null),
      fetchWorldBankIndicator(uzbekistan.wb, 'NV.IND.TOTL.ZS').catch(() => null),
      fetchIlostatMonthlyWage(uzbekistan.iso3).catch(() => null),
      fetchIeaIndustrialBundle(uzbekistan.iea).catch(() => ({ electricity: null, naturalGas: null }))
    ]);

    let countryElectricity = countryIea.electricity;
    if (!countryElectricity && country.iso3 === 'USA') {
      countryElectricity = await fetchUsEiaIndustrialElectricity().catch(() => null);
    }

    const payload = {
      status: 'ok',
      country: {
        input,
        display: country.display,
        iso3: country.iso3
      },
      uzbekistan: {
        display: uzbekistan.display,
        iso3: uzbekistan.iso3
      },
      metrics: {
        gdpPerCapita: {
          country: countryGdp ? countryGdp.value : null,
          countryYear: countryGdp ? countryGdp.year : null,
          uzbekistan: uzGdp ? uzGdp.value : null,
          uzbekistanYear: uzGdp ? uzGdp.year : null,
          unit: 'USD/person',
          source: countryGdp?.source || uzGdp?.source || 'World Bank Open Data API',
          indicator: 'NY.GDP.PCAP.CD'
        },
        industryShare: {
          country: countryIndustryShare ? countryIndustryShare.value : null,
          countryYear: countryIndustryShare ? countryIndustryShare.year : null,
          uzbekistan: uzIndustryShare ? uzIndustryShare.value : null,
          uzbekistanYear: uzIndustryShare ? uzIndustryShare.year : null,
          unit: '% of GDP',
          source: countryIndustryShare?.source || uzIndustryShare?.source || 'World Bank Open Data API',
          indicator: 'NV.IND.TOTL.ZS'
        },
        monthlyWage: {
          country: countryWage ? countryWage.value : null,
          countryYear: countryWage ? countryWage.year : null,
          uzbekistan: uzWage ? uzWage.value : null,
          uzbekistanYear: uzWage ? uzWage.year : null,
          unit: countryWage?.unit || uzWage?.unit || 'USD/month',
          source: countryWage?.source || uzWage?.source || 'ILOSTAT API',
          indicator: 'EAR_EMTA_SEX_CUR_NB_A',
          countryCurrencyBasis: countryWage ? countryWage.currencyLabel : null,
          uzbekistanCurrencyBasis: uzWage ? uzWage.currencyLabel : null
        },
        electricityPrice: {
          country: countryElectricity ? countryElectricity.value : null,
          countryYear: countryElectricity ? countryElectricity.year : null,
          uzbekistan: uzIea.electricity ? uzIea.electricity.value : null,
          uzbekistanYear: uzIea.electricity ? uzIea.electricity.year : null,
          unit: 'USD/MWh',
          source: countryElectricity?.source || uzIea.electricity?.source || 'Official energy price API',
          indicator: 'PRICE/ELECTR/IND/USDCUR'
        },
        naturalGasPrice: {
          country: countryIea.naturalGas ? countryIea.naturalGas.value : null,
          countryYear: countryIea.naturalGas ? countryIea.naturalGas.year : null,
          uzbekistan: uzIea.naturalGas ? uzIea.naturalGas.value : null,
          uzbekistanYear: uzIea.naturalGas ? uzIea.naturalGas.year : null,
          unit: 'USD/MWh',
          source: countryIea.naturalGas?.source || uzIea.naturalGas?.source || 'IEA Prices API',
          indicator: 'PRICE/NATGAS/IND/USDCUR'
        }
      }
    };

    payload.comparisons = {
      gdpRatio: ratio(payload.metrics.gdpPerCapita.country, payload.metrics.gdpPerCapita.uzbekistan),
      wageRatio: ratio(payload.metrics.monthlyWage.country, payload.metrics.monthlyWage.uzbekistan),
      electricityRatio: ratio(payload.metrics.electricityPrice.country, payload.metrics.electricityPrice.uzbekistan),
      naturalGasRatio: ratio(payload.metrics.naturalGasPrice.country, payload.metrics.naturalGasPrice.uzbekistan),
      industryShareRatio: ratio(payload.metrics.industryShare.country, payload.metrics.industryShare.uzbekistan)
    };

    res.json(payload);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server xatosi' });
  }
}
