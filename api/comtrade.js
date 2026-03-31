const DEFAULT_COUNTRIES = [
  { reporterCode: "860", code: "UZ", name: "Uzbekistan" },
  { reporterCode: "795", code: "TM", name: "Turkmenistan" },
  { reporterCode: "762", code: "TJ", name: "Tajikistan" },
  { reporterCode: "417", code: "KG", name: "Kyrgyzstan" },
  { reporterCode: "398", code: "KZ", name: "Kazakhstan" },
  { reporterCode: "496", code: "MN", name: "Mongolia" },
  { reporterCode: "643", code: "RU", name: "Russia" },
  { reporterCode: "031", code: "AZ", name: "Azerbaijan" },
  { reporterCode: "268", code: "GE", name: "Georgia" },
  { reporterCode: "051", code: "AM", name: "Armenia" },
  { reporterCode: "364", code: "IR", name: "Iran" },
  { reporterCode: "004", code: "AF", name: "Afghanistan" },
  { reporterCode: "586", code: "PK", name: "Pakistan" }
];

const YEARS = [2021, 2022, 2023, 2024];
const REPORTERS_URL = "https://comtradeapi.un.org/files/v1/app/reference/Reporters.json";
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function buildReporterEntry(item, preferredName) {
  return {
    reporterCode: String(item.reporterCode || "").padStart(3, "0"),
    code: item.reporterCodeIsoAlpha2 || preferredName || item.text || "",
    name: preferredName || item.text || ""
  };
}

async function getReportersLookup() {
  if (!reportersLookupPromise) {
    reportersLookupPromise = fetch(REPORTERS_URL)
      .then(async (response) => {
        if (!response.ok) throw new Error(`Reporters ${response.status}`);
        return response.json();
      })
      .then((json) => {
        const results = Array.isArray(json?.results) ? json.results.filter((item) => !item?.isGroup) : [];
        const byCode = new Map();
        const byIso2 = new Map();
        const byIso3 = new Map();
        const byName = new Map();
        results.forEach((item) => {
          const reporterCode = String(item?.reporterCode || "").padStart(3, "0");
          if (reporterCode) byCode.set(reporterCode, item);
          if (item?.reporterCodeIsoAlpha2) byIso2.set(String(item.reporterCodeIsoAlpha2).toUpperCase(), item);
          if (item?.reporterCodeIsoAlpha3) byIso3.set(String(item.reporterCodeIsoAlpha3).toUpperCase(), item);
          [item?.text, item?.reporterDesc, item?.reporterNote].forEach((value) => {
            const normalized = normalizeText(value);
            if (normalized && !byName.has(normalized)) byName.set(normalized, item);
          });
        });
        return { byCode, byIso2, byIso3, byName };
      })
      .catch((error) => {
        reportersLookupPromise = null;
        throw error;
      });
  }
  return reportersLookupPromise;
}

async function normalizeCountryList(rawCodes) {
  if (!rawCodes) return DEFAULT_COUNTRIES;
  const lookup = await getReportersLookup();
  const tokens = String(rawCodes)
    .split(/[|,]/)
    .map((token) => token.trim())
    .filter(Boolean);
  const resolved = [];
  const seen = new Set();

  tokens.forEach((token) => {
    let item = null;
    const numeric = /^\d+$/.test(token) ? String(token).padStart(3, "0") : "";
    if (numeric && lookup.byCode.has(numeric)) {
      item = lookup.byCode.get(numeric);
    } else {
      const upper = token.toUpperCase();
      const normalized = normalizeText(token);
      const alias = COUNTRY_ALIASES[normalized];
      const aliasNormalized = alias ? normalizeText(alias) : "";
      const aliasUpper = alias ? String(alias).toUpperCase() : "";
      const aliasNumeric = alias && /^\d+$/.test(String(alias)) ? String(alias).padStart(3, "0") : "";
      item =
        lookup.byIso2.get(upper) ||
        lookup.byIso3.get(upper) ||
        (aliasUpper ? lookup.byIso2.get(aliasUpper) : null) ||
        (aliasUpper ? lookup.byIso3.get(aliasUpper) : null) ||
        (aliasNumeric ? lookup.byCode.get(aliasNumeric) : null) ||
        lookup.byName.get(normalized) ||
        (aliasNormalized ? lookup.byName.get(aliasNormalized) : null) ||
        null;
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
    cmdCode: String(hs),
    maxRecords: String(maxRecords),
    includeDesc: "true"
  });
  return `${base}?${params.toString()}`;
}

async function fetchTradeSeries({ reporterCode, hs, key }) {
  const hasKey = Boolean(key);
  const maxRecords = hasKey ? 5000 : 1000;
  const url = buildUrl({ reporterCode, hs, periods: YEARS, hasKey, maxRecords });
  const headers = hasKey ? { "Ocp-Apim-Subscription-Key": key } : {};
  let response = null;
  let lastStatus = 0;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    response = await fetch(url, { headers });
    lastStatus = response.status;
    if (response.ok) break;
    if (response.status !== 429 || attempt === 2) {
      throw new Error(`Comtrade ${reporterCode}: ${response.status}`);
    }
    await sleep(1200 * (attempt + 1));
  }

  if (!response || !response.ok) {
    throw new Error(`Comtrade ${reporterCode}: ${lastStatus || 0}`);
  }

  const json = await response.json();
  const rows = Array.isArray(json?.data)
    ? json.data
    : Array.isArray(json?.dataset)
      ? json.dataset
      : [];

  const yearImports = {};
  const yearWeights = {};
  const yearStatuses = {};
  YEARS.forEach((year) => {
    yearImports[String(year)] = 0;
    yearWeights[String(year)] = 0;
    yearStatuses[String(year)] = "no_data";
  });

  rows.forEach((row) => {
    const year = String(row?.period || "");
    if (!yearImports.hasOwnProperty(year)) return;
    yearImports[year] += Number(row?.primaryValue || 0);
    yearWeights[year] += Number(row?.netWgt || 0);
    yearStatuses[year] = "ok";
  });

  const totalValue = YEARS.reduce((sum, year) => sum + Number(yearImports[String(year)] || 0), 0);
  const totalWeight = YEARS.reduce((sum, year) => sum + Number(yearWeights[String(year)] || 0), 0);
  const firstDesc = rows.find((row) => row?.cmdDesc)?.cmdDesc || "";

  return {
    rows,
    totalValue,
    totalWeight,
    desc: firstDesc,
    latestValue: Number(yearImports["2024"] || 0),
    yearImports,
    yearStatuses,
    status: rows.length > 0 ? "ok" : "no_data"
  };
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const hs = String(req.query.hs || "2516").replace(/\D/g, "").slice(0, 6) || "2516";
    const key = String(
      process.env.COMTRADE_API_KEY ||
      process.env.COMTRADE_PRIMARY_KEY ||
      req.query.key ||
      ""
    ).trim();
    const requestedCountries = await normalizeCountryList(req.query.countries);

    const countries = [];

    for (const country of requestedCountries) {
      try {
        const current = await fetchTradeSeries({
          reporterCode: country.reporterCode,
          hs,
          key
        });

        countries.push({
          code: country.code,
          name: country.name,
          reporterCode: country.reporterCode,
          import_usd: current.totalValue,
          latest_import_usd: current.latestValue,
          volume_tons: Math.round(current.totalWeight / 1000),
          trend_pct: null,
          status: current.status,
          year_imports: current.yearImports,
          year_statuses: current.yearStatuses,
          products: current.rows.map((row) => ({
            hs: row?.cmdCode || hs,
            period: row?.period || "",
            desc: row?.cmdDesc || current.desc || "",
            value: Number(row?.primaryValue || 0),
            weight: Number(row?.netWgt || 0)
          }))
        });
      } catch (error) {
        console.log("Comtrade error:", country.reporterCode, error.message);
        const yearStatuses = {};
        YEARS.forEach((year) => {
          yearStatuses[String(year)] = String(error.message || "").includes("429") ? "rate_limited" : "error";
        });
        countries.push({
          code: country.code,
          name: country.name,
          reporterCode: country.reporterCode,
          import_usd: 0,
          latest_import_usd: 0,
          volume_tons: 0,
          trend_pct: null,
          status: String(error.message || "").includes("429") ? "rate_limited" : "error",
          year_imports: { "2021": 0, "2022": 0, "2023": 0, "2024": 0 },
          year_statuses: yearStatuses,
          products: []
        });
      }
    }

    const okCountries = countries.filter((country) => country.status === "ok");
    const total = okCountries.reduce((sum, country) => sum + Number(country.import_usd || 0), 0);
    const biggest = okCountries.slice().sort((a, b) => (b.import_usd || 0) - (a.import_usd || 0))[0] || {};

    res.status(200).json({
      countries,
      total_usd: total,
      biggest_market: biggest.name || "",
      fastest_growing: "",
      count: countries.length,
      source: "UN Comtrade"
    });
  } catch (error) {
    res.status(200).json({
      countries: [],
      total_usd: 0,
      biggest_market: "",
      fastest_growing: "",
      count: 0,
      source: "UN Comtrade",
      error: error.message
    });
  }
}
