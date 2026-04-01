import https from "https";

function sendJson(res, payload, statusCode = 200) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function fetchText(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "application/json,text/plain,*/*"
        }
      },
      (resp) => {
        let raw = "";
        resp.on("data", (chunk) => {
          raw += chunk;
        });
        resp.on("end", () => {
          resolve({
            statusCode: resp.statusCode || 0,
            body: raw
          });
        });
      }
    );
    req.on("error", reject);
    req.setTimeout(20000, () => {
      req.destroy(new Error("World Bank timeout"));
    });
  });
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
    const country = String(query.country || "UZB").trim() || "UZB";
    const indicator = String(query.indicator || "NY.GDP.MKTP.CD").trim() || "NY.GDP.MKTP.CD";
    const date = String(query.date || "2020:2024").trim() || "2020:2024";
    const perPage = String(query.per_page || "500").trim() || "500";
    const format = String(query.format || "json").trim() || "json";

    const url =
      "https://api.worldbank.org/v2/country/" +
      encodeURIComponent(country) +
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
      sendJson(res, {
        error: `World Bank ${response.statusCode}`,
        url,
        details: response.body.slice(0, 1000)
      });
      return;
    }

    try {
      const data = JSON.parse(response.body);
      sendJson(res, data);
    } catch (parseError) {
      sendJson(res, {
        error: "World Bank invalid JSON",
        url,
        details: response.body.slice(0, 1000)
      });
    }
  } catch (error) {
    sendJson(res, {
      error: error && error.message ? error.message : "Unknown worldbank proxy error"
    });
  }
}
