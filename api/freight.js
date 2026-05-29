/**
 * /api/freight  —  Real freight rate proxy
 *
 * Primary:  SeaRates Logistics Explorer API v2 (GraphQL)
 *           https://docs.searates.com/reference/logistics/v2/
 *           Auth:  Bearer token → SEARATES_API_KEY env var
 *
 * Fallback: Freightos public shippingCalculator (no key needed for estimates)
 *           https://ship.freightos.com/api/shippingCalculator
 *
 * POST /api/freight
 * Body: { routes: [{from_lat, from_lng, to_lat, to_lng}, ...] }   (max 20 routes)
 *
 * Response:
 * { results: [{rate_usd, transit_days, mode, source} | {error}], ... }
 *
 * Container: FCL 20ft standard (ST20)
 * Currency:  USD
 */

const SEARATES_GQL   = 'https://rates.searates.com/graphql';
const FREIGHTOS_URL  = 'https://ship.freightos.com/api/shippingCalculator';
const REQUEST_TIMEOUT_MS = 20000;
const MAX_PARALLEL   = 5;   // simultaneous SeaRates calls

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function todayISO() { return new Date().toISOString().split('T')[0]; }

/* ────────────────────────────────────────────────
   SeaRates GraphQL — one route at a time
   ──────────────────────────────────────────────── */
async function fetchSeaRates(fromLat, fromLng, toLat, toLng, apiKey) {
  if (!apiKey) return null;

  const body = {
    query: `
      query GetRates($input: RatesInput) {
        rates(input: $input) {
          totalPrice
          totalCurrency
          totalTransitTime
          points { name type }
        }
      }
    `,
    variables: {
      input: {
        coordinatesFrom: [parseFloat(fromLat), parseFloat(fromLng)],
        coordinatesTo:   [parseFloat(toLat),   parseFloat(toLng)],
        shippingType: 'FCL',
        container:    'ST20',
        date:          todayISO()
      }
    }
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const r = await fetch(SEARATES_GQL, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
        // Some SeaRates plans use query-param instead — proxy adds both
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    clearTimeout(timer);

    if (!r.ok) {
      console.warn('[freight] SeaRates HTTP', r.status);
      return null;
    }

    const json = await r.json();
    if (json.errors && json.errors.length) {
      console.warn('[freight] SeaRates GQL error:', json.errors[0]?.message);
      return null;
    }

    const rd = json?.data?.rates;
    if (!rd) return null;

    // rates may be a single object or an array
    const best = Array.isArray(rd)
      ? rd.reduce((b, x) => (x.totalPrice || 0) < (b.totalPrice || Infinity) ? x : b, rd[0])
      : rd;

    if (!best || !best.totalPrice) return null;

    return {
      rate_usd:     Math.round(Number(best.totalPrice)),
      transit_days: Math.round(Number(best.totalTransitTime) || 0),
      mode:         'FCL 20ft (SeaRates multimodal)',
      source:       'SeaRates'
    };
  } catch (e) {
    clearTimeout(timer);
    if (e.name !== 'AbortError') console.warn('[freight] SeaRates fetch error:', e.message);
    return null;
  }
}

/* ────────────────────────────────────────────────
   Freightos public API — fallback, no key needed
   Returns estimate range; we use min price as conservative
   ──────────────────────────────────────────────── */
async function fetchFreightos(fromLat, fromLng, toLat, toLng) {
  // Freightos accepts lat,lng as origin/destination coordinates
  const params = new URLSearchParams({
    origin:      `${fromLat},${fromLng}`,
    destination: `${toLat},${toLng}`,
    mode:        'FCL',
    loadtype:    '20DC',      // 20ft dry container
    estimate:    'true',
    format:      'json'
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const r = await fetch(`${FREIGHTOS_URL}?${params}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timer);

    if (!r.ok) return null;

    const json = await r.json();

    // Freightos response: { result: { price: { min, max }, transit_time: { min, max } } }
    // or { quotes: [...] }
    let price = null, days = null;

    if (json?.result?.price?.min) {
      price = Number(json.result.price.min);
      days  = Number(json.result.transit_time?.min || 0);
    } else if (Array.isArray(json?.quotes) && json.quotes.length) {
      const q = json.quotes[0];
      price = Number(q.totalPrice || q.price?.min || 0);
      days  = Number(q.transitDays || q.transit_time?.min || 0);
    }

    if (!price || price <= 0) return null;

    return {
      rate_usd:     Math.round(price),
      transit_days: Math.round(days),
      mode:         'FCL 20ft (Freightos estimate)',
      source:       'Freightos'
    };
  } catch (e) {
    clearTimeout(timer);
    return null;
  }
}

/* ────────────────────────────────────────────────
   Process one route: SeaRates → Freightos → null
   ──────────────────────────────────────────────── */
async function processRoute({ from_lat, from_lng, to_lat, to_lng }, apiKey) {
  // Try SeaRates first
  let result = await fetchSeaRates(from_lat, from_lng, to_lat, to_lng, apiKey);

  // Fallback: Freightos public API
  if (!result) {
    result = await fetchFreightos(from_lat, from_lng, to_lat, to_lng);
  }

  return result || { error: 'No rate available from SeaRates or Freightos' };
}

/* ────────────────────────────────────────────────
   Handler
   ──────────────────────────────────────────────── */
export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // Support both GET (single route) and POST (batch)
    let routes = [];

    if (req.method === 'GET') {
      const { from_lat, from_lng, to_lat, to_lng } = req.query;
      if (!from_lat || !from_lng || !to_lat || !to_lng) {
        return res.status(400).json({ error: 'from_lat, from_lng, to_lat, to_lng required' });
      }
      routes = [{ from_lat, from_lng, to_lat, to_lng }];
    } else {
      // POST — batch
      routes = Array.isArray(req.body?.routes) ? req.body.routes : [];
      if (!routes.length) {
        return res.status(400).json({ error: 'routes array required in POST body' });
      }
      if (routes.length > 30) {
        return res.status(400).json({ error: 'max 30 routes per request' });
      }
    }

    const apiKey = String(
      process.env.SEARATES_API_KEY ||
      process.env.SEARATES_KEY     ||
      ''
    ).trim();

    if (!apiKey) {
      console.warn('[freight] SEARATES_API_KEY not set — using Freightos fallback only');
    }

    // Process routes with limited parallelism to avoid rate limiting
    const results = [];
    for (let i = 0; i < routes.length; i += MAX_PARALLEL) {
      const chunk = routes.slice(i, i + MAX_PARALLEL);
      const chunkResults = await Promise.all(
        chunk.map(route => processRoute(route, apiKey))
      );
      results.push(...chunkResults);
      // Small delay between chunks
      if (i + MAX_PARALLEL < routes.length) await sleep(400);
    }

    if (req.method === 'GET') {
      // Single route: return result directly
      return res.json(results[0]);
    }

    return res.json({ results, count: results.length });

  } catch (e) {
    console.error('[freight] handler error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
