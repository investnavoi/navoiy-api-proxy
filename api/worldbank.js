function sendJson(res, payload, statusCode = 200) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

async function fetchText(url, accept = "application/json,text/plain,*/*") {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": accept
      },
      signal: controller.signal
    });
    return {
      statusCode: response.status,
      body: await response.text()
    };
  } catch (error) {
    if (error && error.name === "AbortError") {
      throw new Error("World Bank timeout");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === "\"") {
        if (text[i + 1] === "\"") {
          field += "\"";
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === "\"") {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") {
      field += ch;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  if (!rows.length) return [];
  const headers = rows[0];
  return rows
    .slice(1)
    .filter((r) => r.some((v) => String(v || "").trim() !== ""))
    .map((r) => {
      const obj = {};
      headers.forEach((header, idx) => {
        obj[header] = r[idx];
      });
      return obj;
    });
}

function latestIloUsdValue(rows) {
  const matches = rows
    .filter((row) => String(row["classif1.label"] || "").trim() === "Currency: U.S. dollars")
    .filter((row) => row.obs_value !== undefined && row.obs_value !== null && String(row.obs_value).trim() !== "")
    .sort((a, b) => Number(b.time || 0) - Number(a.time || 0));
  if (matches.length) {
    const row = matches[0];
    return {
      value: Number(row.obs_value),
      year: String(row.time || ""),
      currencyLabel: "Currency: U.S. dollars",
      sourceLabel: row["source.label"] || "",
      noteIndicator: row["note_indicator.label"] || "",
      noteSource: row["note_source.label"] || ""
    };
  }
  return null;
}

async function fetchWorldBankIndicatorForCountry(iso3, indicator, format, date, perPage) {
  const url =
    "https://api.worldbank.org/v2/country/" +
    encodeURIComponent(iso3) +
    "/indicator/" +
    encodeURIComponent(indicator) +
    "?format=" +
    encodeURIComponent(format) +
    "&date=" +
    encodeURIComponent(date) +
    "&per_page=" +
    encodeURIComponent(perPage);
  const response = await fetchText(url);
  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(`World Bank ${response.statusCode}`);
  }
  const json = JSON.parse(response.body);
  return Array.isArray(json) ? json : [null, []];
}

async function fetchWorldBankIndicatorMultiCountry(countries, indicator, format, date, perPage) {
  const combinedRows = [];
  let sourceMeta = null;
  for (const iso3 of countries) {
    try {
      const json = await fetchWorldBankIndicatorForCountry(iso3, indicator, format, date, perPage);
      if (!sourceMeta && json[0]) sourceMeta = json[0];
      if (Array.isArray(json[1])) combinedRows.push(...json[1]);
    } catch (_error) {
      // Skip failed countries and let the frontend show available rows.
    }
  }
  return [
    {
      page: 1,
      pages: 1,
      per_page: combinedRows.length || 0,
      total: combinedRows.length || 0,
      sourceid: sourceMeta?.sourceid || "2",
      lastupdated: sourceMeta?.lastupdated || ""
    },
    combinedRows
  ];
}

async function fetchIlostatMonthlyWage(iso3) {
  const url = `https://rplumber.ilo.org/data/indicator?id=EAR_EMTA_SEX_CUR_NB_A&ref_area=${encodeURIComponent(iso3)}&sex=SEX_T&latestyear=TRUE&format=.csv&type=label&mode=B`;
  const response = await fetchText(url, "text/csv,text/plain,application/json");
  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(`ILOSTAT ${response.statusCode}`);
  }
  const rows = parseCsv(response.body);
  const value = latestIloUsdValue(rows);
  if (!value || Number.isNaN(value.value)) return null;
  return {
    ...value,
    source: "ILOSTAT API",
    indicator: "EAR_EMTA_SEX_CUR_NB_A",
    unit: "USD/month"
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    res.end();
    return;
  }

  try {
    const query = req.query || {};
    const source = String(query.source || "").trim().toLowerCase();
    const country = String(query.country || "UZB").trim() || "UZB";
    if (source === "ilostat-wage") {
      const countries = country
        .split(";")
        .map((item) => String(item || "").trim().toUpperCase())
        .filter(Boolean);
      const uniqueCountries = [...new Set(countries)];
      const entries = await Promise.all(
        uniqueCountries.map(async (iso3) => {
          try {
            const wage = await fetchIlostatMonthlyWage(iso3);
            return [iso3, wage];
          } catch (error) {
            return [
              iso3,
              {
                error: error && error.message ? error.message : "ILOSTAT fetch failed"
              }
            ];
          }
        })
      );
      sendJson(res, {
        source: "ILOSTAT API",
        indicator: "EAR_EMTA_SEX_CUR_NB_A",
        countries: Object.fromEntries(entries)
      });
      return;
    }

    const indicator = String(query.indicator || "NY.GDP.MKTP.CD").trim() || "NY.GDP.MKTP.CD";
    const date = String(query.date || "2020:2024").trim() || "2020:2024";
    const perPage = String(query.per_page || "500").trim() || "500";
    const format = String(query.format || "json").trim() || "json";

    try {
      const countries = country
        .split(";")
        .map((item) => String(item || "").trim().toUpperCase())
        .filter(Boolean);
      const uniqueCountries = [...new Set(countries)];
      const data = uniqueCountries.length > 1
        ? await fetchWorldBankIndicatorMultiCountry(uniqueCountries, indicator, format, date, perPage)
        : await fetchWorldBankIndicatorForCountry(uniqueCountries[0] || country, indicator, format, date, perPage);
      sendJson(res, data);
    } catch (parseError) {
      sendJson(res, {
        error: parseError && parseError.message ? parseError.message : "World Bank invalid JSON"
      });
    }
  } catch (error) {
    sendJson(res, {
      error: error && error.message ? error.message : "Unknown worldbank proxy error"
    });
  }
}
