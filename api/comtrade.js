const DEFAULT_COUNTRIES = [
  { reporterCode: "860", code: "UZ", iso3: "UZB", name: "Uzbekistan" },
  { reporterCode: "795", code: "TM", iso3: "TKM", name: "Turkmenistan" },
  { reporterCode: "762", code: "TJ", iso3: "TJK", name: "Tajikistan" },
  { reporterCode: "417", code: "KG", iso3: "KGZ", name: "Kyrgyzstan" },
  { reporterCode: "398", code: "KZ", iso3: "KAZ", name: "Kazakhstan" },
  { reporterCode: "496", code: "MN", iso3: "MNG", name: "Mongolia" },
  { reporterCode: "643", code: "RU", iso3: "RUS", name: "Russia" },
  { reporterCode: "031", code: "AZ", iso3: "AZE", name: "Azerbaijan" },
  { reporterCode: "268", code: "GE", iso3: "GEO", name: "Georgia" },
  { reporterCode: "051", code: "AM", iso3: "ARM", name: "Armenia" },
  { reporterCode: "364", code: "IR", iso3: "IRN", name: "Iran" },
  { reporterCode: "004", code: "AF", iso3: "AFG", name: "Afghanistan" },
  { reporterCode: "586", code: "PK", iso3: "PAK", name: "Pakistan" }
];

const YEARS = [2021, 2022, 2023, 2024];
const REPORTERS_URL = "https://comtradeapi.un.org/files/v1/app/reference/Reporters.json";
const WITS_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Referer": "https://wits.worldbank.org/",
  "Origin": "https://wits.worldbank.org"
};
const COUNTRY_ALIASES = {
  "bolivia": "Bolivia (Plurinational State of)",
  "bosnia and herzegovina": "Bosnia Herzegovina",
  "brunei": "Brunei Darussalam",
  "central african republic": "Central African Rep.",
  "czech republic": "Czechia",
  "dr congo": "Dem. Rep. of the Congo",
  "dominican republic": "Dominican Rep.",
  "ivory coast": "CI",
  "laos": "Lao People's Dem. Rep.",
  "liechtenstein": "CH",
  "marshall islands": "Marshall Isds",
  "micronesia": "FS Micronesia",
  "moldova": "Rep. of Moldova",
  "monaco": "FR",
  "north korea": "Dem. People's Rep. of Korea",
  "palestine": "State of Palestine",
  "russia": "Russian Federation",
  "solomon islands": "Solomon Isds",
  "south korea": "Rep. of Korea",
  "tanzania": "United Rep. of Tanzania",
  "turkey": "TR",
  "united states": "US",
  "vatican city": "Holy See (Vatican City State)",
  "vietnam": "Viet Nam"
};
let reportersLookupPromise = null;

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(url, { ...options, signal: controller.signal }); }
  finally { clearTimeout(timer); }
}

function normalizeText(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

function buildReporterEntry(item, preferredName) {
  return {
    reporterCode: String(item.reporterCode || "").padStart(3, "0"),
    iso3: item.reporterCodeIsoAlpha3 || "",
    code: item.reporterCodeIsoAlpha2 || preferredName || item.text || "",
    name: preferredName || item.text || ""
  };
}

async function getReportersLookup() {
  if (!reportersLookupPromise) {
    reportersLookupPromise = fetch(REPORTERS_URL)
      .then(async r => { if (!r.ok) throw new Error(`Reporters ${r.status}`); return r.json(); })
      .then(json => {
        const results = Array.isArray(json?.results) ? json.results.filter(i => !i?.isGroup) : [];
        const byCode = new Map(), byIso2 = new Map(), byIso3 = new Map(), byName = new Map();
        results.forEach(item => {
          const rc = String(item?.reporterCode || "").padStart(3, "0");
          if (rc) byCode.set(rc, item);
          if (item?.reporterCodeIsoAlpha2) byIso2.set(String(item.reporterCodeIsoAlpha2).toUpperCase(), item);
          if (item?.reporterCodeIsoAlpha3) byIso3.set(String(item.reporterCodeIsoAlpha3).toUpperCase(), item);
          [item?.text, item?.reporterDesc, item?.reporterNote].forEach(v => {
            const n = normalizeText(v);
            if (n && !byName.has(n)) byName.set(n, item);
          });
        });
        return { byCode, byIso2, byIso3, byName };
      })
      .catch(e => { reportersLookupPromise = null; throw e; });
  }
  return reportersLookupPromise;
}

async function normalizeCountryList(rawCodes) {
  if (!rawCodes) return DEFAULT_COUNTRIES;
  const lookup = await getReportersLookup();
  const tokens = String(rawCodes).split(/[|,]/).map(t => t.trim()).filter(Boolean);
  const resolved = [], seen = new Set();
  tokens.forEach(token => {
    let item = null;
    const numeric = /^\d+$/.test(token) ? String(token).padStart(3, "0") : "";
    if (numeric && lookup.byCode.has(numeric)) item = lookup.byCode.get(numeric);
    else {
      const upper = token.toUpperCase(), normalized = normalizeText(token);
      const alias = COUNTRY_ALIASES[normalized];
      const aliasNormalized = alias ? normalizeText(alias) : "";
      const aliasUpper = alias ? String(alias).toUpperCase() : "";
      const aliasNumeric = alias && /^\d+$/.test(String(alias)) ? String(alias).padStart(3, "0") : "";
      item = lookup.byIso2.get(upper) || lookup.byIso3.get(upper) ||
        (aliasUpper ? lookup.byIso2.get(aliasUpper) : null) ||
        (aliasUpper ? lookup.byIso3.get(aliasUpper) : null) ||
        (aliasNumeric ? lookup.byCode.get(aliasNumeric) : null) ||
        lookup.byName.get(normalized) ||
        (aliasNormalized ? lookup.byName.get(aliasNormalized) : null) || null;
    }
    if (!item) return;
    const entry = buildReporterEntry(item, token);
    if (!entry.reporterCode || seen.has(entry.reporterCode)) return;
    seen.add(entry.reporterCode);
    resolved.push(entry);
  });
  return resolved;
}

function buildUrl({ reporterCode, hs, periods, hasKey, maxRecords }) {
  const base = hasKey
    ? "https://comtradeapi.un.org/data/v1/get/C/A/HS"
    : "https://comtradeapi.un.org/public/v1/preview/C/A/HS";
  const params = new URLSearchParams({
    reporterCode,
    period: periods.join(","),
    flowCode: "M",
    partnerCode: "0",
    partner2Code: "0",
    customsCode: "C00",
    motCode: "0",
    cmdCode: String(hs),
    maxRecords: String(maxRecords),
    includeDesc: "true"
  });
  return `${base}?${params.toString()}`;
}

async function fetchTradeSeries({ reporterCode, hs, key }) {
  const hasKey = Boolean(key);
  const headers = hasKey ? { "Ocp-Apim-Subscription-Key": key } : {};
  const maxRecords = hasKey ? 500 : 200;

  // MUHIM: Public API 6-raqamli HS kodni qabul qilmaydi — faqat 2 yoki 4 raqam
  // Key bo'lmasa, HS kodni 4 raqamga qisqartirish KERAK
  const effectiveHs = hasKey ? hs : (hs.length > 4 ? hs.slice(0, 4) : hs);

  async function requestPeriods(periods) {
    const url = buildUrl({ reporterCode, hs: effectiveHs, periods, hasKey, maxRecords });
    let response = null, lastError = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        response = await fetchWithTimeout(url, { headers }, 12000 + (attempt * 4000));
        if (response.ok) return await response.json();
        if (response.status !== 429 || attempt === 2) throw new Error(`Comtrade ${reporterCode}: ${response.status}`);
      } catch (e) {
        lastError = e;
        if (attempt === 2) throw e?.name === "AbortError" ? new Error(`Comtrade ${reporterCode}: timeout`) : e;
      }
      await sleep(1200 * (attempt + 1));
    }
    throw lastError || new Error(`Comtrade ${reporterCode}: failed`);
  }

  let payload = null;
  try { payload = await requestPeriods(YEARS); }
  catch (error) {
    const fallbackRows = [];
    for (const year of YEARS) {
      try {
        const yp = await requestPeriods([year]);
        const yr = Array.isArray(yp?.data) ? yp.data : Array.isArray(yp?.dataset) ? yp.dataset : [];
        fallbackRows.push(...yr);
      } catch (_) {}
    }
    if (!fallbackRows.length) throw error;
    payload = { data: fallbackRows };
  }

  const rows = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload?.dataset) ? payload.dataset : [];

  // MUHIM FIX: faqat so'ralgan cmdCode ga mos qatorlarni filtrlash
  // Public API ba'zan boshqa sub-code'larni ham qaytaradi
  const hsFilteredRows = rows.filter(row => {
    const rowCmd = String(row?.cmdCode || "");
    // Aniq mos yoki parent code mos
    return rowCmd === effectiveHs || rowCmd.startsWith(effectiveHs) || effectiveHs.startsWith(rowCmd);
  });

  // partnerCode=0 (World total) qatorlarni filtrlash
  const totalRows = hsFilteredRows.filter(row => {
    return Number(row?.partnerCode ?? -1) === 0 &&
           Number(row?.partner2Code ?? -1) === 0 &&
           String(row?.customsCode || "") === "C00" &&
           Number(row?.motCode ?? -1) === 0;
  });

  // Agar World total qatorlar bo'lmasa — individual partner qatorlarini YILLIK yig'ish
  const useAggregation = totalRows.length === 0 && hsFilteredRows.length > 0;
  
  const yearImports = {}, yearWeights = {}, yearStatuses = {};
  YEARS.forEach(y => { yearImports[String(y)] = 0; yearWeights[String(y)] = 0; yearStatuses[String(y)] = "no_data"; });

  if (useAggregation) {
    // Individual partners — yillik yig'ish
    const yearSeen = {};
    hsFilteredRows.forEach(row => {
      const year = String(row?.period || "");
      if (!yearImports.hasOwnProperty(year)) return;
      const partnerKey = year + "_" + String(row?.partnerCode || "");
      if (yearSeen[partnerKey]) return; // dublikat oldini olish
      yearSeen[partnerKey] = true;
      yearImports[year] += Number(row?.primaryValue || 0);
      yearWeights[year] += Number(row?.netWgt || 0);
      yearStatuses[year] = "ok";
    });
  } else {
    // World total — to'g'ridan-to'g'ri
    totalRows.forEach(row => {
      const year = String(row?.period || "");
      if (!yearImports.hasOwnProperty(year)) return;
      yearImports[year] = Number(row?.primaryValue || 0);
      yearWeights[year] = Number(row?.netWgt || 0);
      yearStatuses[year] = (yearImports[year] || yearWeights[year]) ? "ok" : yearStatuses[year];
    });
  }

  const sourceRows = totalRows.length ? totalRows : hsFilteredRows;
  const totalValue = YEARS.reduce((s, y) => s + Number(yearImports[String(y)] || 0), 0);
  const totalWeight = YEARS.reduce((s, y) => s + Number(yearWeights[String(y)] || 0), 0);
  const firstDesc = sourceRows.find(r => r?.cmdDesc)?.cmdDesc || "";

  return {
    rows: sourceRows,
    totalValue, totalWeight,
    desc: firstDesc,
    latestValue: Number(yearImports["2024"] || 0),
    yearImports, yearStatuses,
    weightUnit: "kg",
    status: sourceRows.length > 0 ? "ok" : "no_data",
    hs_requested: hs,
    hs_used: effectiveHs,
    hs_level: hasKey ? "HS" + effectiveHs.length : "HS" + effectiveHs.length + " (key yo'q, public API)"
  };
}

function normalizeWitsHtml(html) {
  return String(html || "").replace(/[\r\n\t]+/g, " ").replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/gi, " ").replace(/\s+/g, " ").trim();
}

function parseWitsSummary(html) {
  const text = normalizeWitsHtml(html);
  const m = text.match(/was\s+\$([\d,]+(?:\.\d+)?)K\s+and quantity\s+([\d,]+)\s*Kg/i);
  if (!m) return { importUsd: 0, quantityTons: 0, status: /no trade data|no data/i.test(text) ? "no_data" : "error" };
  return { importUsd: Number(String(m[1]).replace(/,/g, "")) * 1000, quantityTons: Number(String(m[2]).replace(/,/g, "")) / 1000, status: "ok" };
}

async function fetchWitsTradeSeries({ iso3, hs }) {
  if (!iso3) throw new Error("WITS reporter missing");
  const yearImports = {}, yearWeights = {}, yearStatuses = {};
  for (const year of YEARS) {
    yearImports[String(year)] = 0; yearWeights[String(year)] = 0; yearStatuses[String(year)] = "no_data";
    const url = `https://wits.worldbank.org/trade/comtrade/en/country/${String(iso3).toUpperCase()}/year/${year}/tradeflow/Imports/partner/ALL/product/${encodeURIComponent(hs)}`;
    try {
      const r = await fetch(url, { headers: WITS_HEADERS });
      if (!r.ok) { yearStatuses[String(year)] = "error"; continue; }
      const parsed = parseWitsSummary(await r.text());
      yearImports[String(year)] = parsed.importUsd;
      yearWeights[String(year)] = parsed.quantityTons;
      yearStatuses[String(year)] = parsed.status;
    } catch (_) { yearStatuses[String(year)] = "error"; }
  }
  const totalValue = YEARS.reduce((s, y) => s + Number(yearImports[String(y)] || 0), 0);
  const totalWeight = YEARS.reduce((s, y) => s + Number(yearWeights[String(y)] || 0), 0);
  return {
    totalValue, totalWeight,
    latestValue: Number(yearImports["2024"] || yearImports["2023"] || 0),
    yearImports, yearStatuses, weightUnit: "tons",
    status: YEARS.some(y => yearStatuses[String(y)] === "ok") ? "ok" : "no_data",
    rows: [], hs_requested: hs, hs_used: hs, hs_level: "WITS"
  };
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  try {
    const hs = String(req.query.hs || "2516").replace(/\D/g, "").slice(0, 6) || "2516";
    const source = String(req.query.source || "comtrade").trim().toLowerCase();
    const key = String(process.env.COMTRADE_API_KEY || process.env.COMTRADE_PRIMARY_KEY || req.query.key || "").trim();
    const requestedCountries = await normalizeCountryList(req.query.countries);
    const countries = [];

    for (const country of requestedCountries) {
      try {
        let current = source === "wits"
          ? await fetchWitsTradeSeries({ iso3: country.iso3, hs })
          : await fetchTradeSeries({ reporterCode: country.reporterCode, hs, key });
        let sourceUsed = source === "wits" ? "WITS (World Bank)" : "UN Comtrade";

        if (source !== "wits" && (!current || current.status !== "ok") && country.iso3) {
          try {
            const fb = await fetchWitsTradeSeries({ iso3: country.iso3, hs });
            if (fb && fb.status === "ok") { current = fb; sourceUsed = "WITS (fallback)"; }
          } catch (_) {}
        }

        countries.push({
          code: country.code, name: country.name, reporterCode: country.reporterCode,
          import_usd: current.totalValue,
          latest_import_usd: current.latestValue,
          volume_tons: current.weightUnit === "tons" ? Math.round(current.totalWeight || 0) : Math.round((current.totalWeight || 0) / 1000),
          trend_pct: null,
          status: current.status,
          source_used: sourceUsed,
          year_imports: current.yearImports,
          year_statuses: current.yearStatuses,
          hs_requested: current.hs_requested || hs,
          hs_used: current.hs_used || hs,
          hs_level: current.hs_level || "",
          products: Array.isArray(current.rows) ? current.rows.map(r => ({
            hs: r?.cmdCode || hs, period: r?.period || "",
            desc: r?.cmdDesc || current.desc || "",
            value: Number(r?.primaryValue || 0), weight: Number(r?.netWgt || 0)
          })) : []
        });
      } catch (error) {
        const ys = {}; YEARS.forEach(y => { ys[String(y)] = "error"; });
        countries.push({
          code: country.code, name: country.name, reporterCode: country.reporterCode,
          import_usd: 0, latest_import_usd: 0, volume_tons: 0, trend_pct: null,
          status: String(error.message || "").includes("429") ? "rate_limited" : "error",
          year_imports: { "2021": 0, "2022": 0, "2023": 0, "2024": 0 },
          year_statuses: ys, products: []
        });
      }
    }

    const okC = countries.filter(c => c.status === "ok");
    const total = okC.reduce((s, c) => s + Number(c.import_usd || 0), 0);
    const biggest = okC.slice().sort((a, b) => (b.import_usd || 0) - (a.import_usd || 0))[0] || {};

    res.status(200).json({
      countries, total_usd: total, biggest_market: biggest.name || "",
      count: countries.length, hs_requested: hs, hs_used: key ? hs : (hs.length > 4 ? hs.slice(0,4) : hs),
      has_key: Boolean(key),
      source: source === "wits" ? "WITS (World Bank)" : "UN Comtrade"
    });
  } catch (error) {
    res.status(200).json({
      countries: [], total_usd: 0, count: 0, error: error.message,
      source: String(req.query.source || "comtrade").trim().toLowerCase() === "wits" ? "WITS" : "UN Comtrade"
    });
  }
}
