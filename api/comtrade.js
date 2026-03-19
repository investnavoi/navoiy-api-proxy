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

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
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

function buildUrl({ reporterCode, hs, year, hasKey, maxRecords }) {
  const base = hasKey
    ? "https://comtradeapi.un.org/data/v1/get/C/A/HS"
    : "https://comtradeapi.un.org/public/v1/preview/C/A/HS";
  const params = new URLSearchParams({
    reporterCode,
    period: String(year),
    flowCode: "M",
    cmdCode: String(hs),
    maxRecords: String(maxRecords),
    includeDesc: "true"
  });
  return `${base}?${params.toString()}`;
}

async function fetchTradeYear({ reporterCode, hs, year, key }) {
  const hasKey = Boolean(key);
  const maxRecords = hasKey ? 5000 : 500;
  const url = buildUrl({ reporterCode, hs, year, hasKey, maxRecords });
  const headers = hasKey ? { "Ocp-Apim-Subscription-Key": key } : {};
  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`Comtrade ${reporterCode} ${year}: ${response.status}`);
  }

  const json = await response.json();
  const rows = Array.isArray(json?.data)
    ? json.data
    : Array.isArray(json?.dataset)
      ? json.dataset
      : [];

  const totalValue = rows.reduce((sum, row) => sum + Number(row?.primaryValue || 0), 0);
  const totalWeight = rows.reduce((sum, row) => sum + Number(row?.netWgt || 0), 0);
  const firstDesc = rows.find((row) => row?.cmdDesc)?.cmdDesc || "";

  return {
    rows,
    totalValue,
    totalWeight,
    desc: firstDesc
  };
}

function calcTrend(currentValue, previousValue) {
  if (!previousValue && !currentValue) return 0;
  if (!previousValue && currentValue > 0) return 100;
  return Math.round(((currentValue - previousValue) / previousValue) * 100);
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const hs = String(req.query.hs || "2516").replace(/\D/g, "").slice(0, 6) || "2516";
    const year = parseInt(req.query.year || "2023", 10) || 2023;
    const key = String(req.query.key || "").trim();
    const requestedCountries = normalizeCountryList(req.query.countries);

    const countries = [];

    for (const country of requestedCountries) {
      try {
        const current = await fetchTradeYear({
          reporterCode: country.reporterCode,
          hs,
          year,
          key
        });

        let previousValue = 0;
        if (key) {
          try {
            const previous = await fetchTradeYear({
              reporterCode: country.reporterCode,
              hs,
              year: year - 1,
              key
            });
            previousValue = previous.totalValue;
          } catch (previousError) {
            console.log("Comtrade previous-year warning:", country.reporterCode, previousError.message);
          }
        }

        countries.push({
          code: country.code,
          name: country.name,
          reporterCode: country.reporterCode,
          import_usd: current.totalValue,
          volume_tons: Math.round(current.totalWeight / 1000),
          trend_pct: key ? calcTrend(current.totalValue, previousValue) : 0,
          products: current.rows.map((row) => ({
            hs: row?.cmdCode || hs,
            desc: row?.cmdDesc || current.desc || "",
            value: Number(row?.primaryValue || 0),
            weight: Number(row?.netWgt || 0)
          }))
        });
      } catch (error) {
        console.log("Comtrade error:", country.reporterCode, error.message);
        countries.push({
          code: country.code,
          name: country.name,
          reporterCode: country.reporterCode,
          import_usd: 0,
          volume_tons: 0,
          trend_pct: 0,
          products: []
        });
      }
    }

    const total = countries.reduce((sum, country) => sum + Number(country.import_usd || 0), 0);
    const biggest = countries.slice().sort((a, b) => (b.import_usd || 0) - (a.import_usd || 0))[0] || {};
    const fastest = countries.slice().sort((a, b) => (b.trend_pct || 0) - (a.trend_pct || 0))[0] || {};

    res.status(200).json({
      countries,
      total_usd: total,
      biggest_market: biggest.name || "",
      fastest_growing: fastest.name || "",
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
