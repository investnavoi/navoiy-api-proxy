const TARGET_COUNTRIES = [
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

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeCountryList(rawCodes) {
  if (!rawCodes) return TARGET_COUNTRIES;
  const allowed = new Map(TARGET_COUNTRIES.map((item) => [item.reporterCode, item]));
  return rawCodes
    .split(",")
    .map((code) => code.trim())
    .filter((code) => allowed.has(code))
    .map((code) => allowed.get(code));
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
    const requestedCountries = normalizeCountryList(req.query.countries);

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
