/**
 * /api/freight  —  Real freight rate proxy
 *
 * Tier 1 (primary):  SeaRates Logistics Explorer REST API
 *   GET https://sirius.searates.com/port/api-fcl
 *   ?apiKey=KEY&lat_from=LAT&lng_from=LNG&lat_to=LAT&lng_to=LNG
 *   Auth: apiKey query param  →  SEARATES_API_KEY env var
 *
 * Tier 2 (secondary): SeaRates Logistics Explorer GraphQL v2
 *   POST https://rates.searates.com/graphql
 *   Auth: Bearer token  →  SEARATES_API_KEY env var
 *   Response: data.rates.General.totalPrice / totalTransitTime
 *
 * Tier 3 (fallback):  Freightos public shippingCalculator (no key needed)
 *   https://ship.freightos.com/api/shippingCalculator
 *
 * POST /api/freight
 *   Body: { routes: [{from_lat, from_lng, to_lat, to_lng}, ...] }  (max 30)
 *
 * GET /api/freight
 *   Query: ?from_lat=&from_lng=&to_lat=&to_lng=
 *
 * Response:
 *   POST → { results: [{rate_usd, transit_days, mode, source} | {error}], count }
 *   GET  → {rate_usd, transit_days, mode, source} | {error}
 *
 * Container: FCL 20ft standard (ST20 / 20st)
 * Currency:  USD
 */

const SEARATES_REST = 'https://sirius.searates.com/port/api-fcl';
const SEARATES_GQL  = 'https://rates.searates.com/graphql';
const FREIGHTOS_URL = 'https://ship.freightos.com/api/shippingCalculator';
const REQUEST_TIMEOUT_MS = 20000;
const MAX_PARALLEL  = 5;   // simultaneous calls per tier

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function todayISO() { return new Date().toISOString().split('T')[0]; }

function abortTimer(ms) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, clear: () => clearTimeout(id) };
}

/* ══════════════════════════════════════════════════════════════════
   TIER 1 — SeaRates REST API (sirius.searates.com/port/api-fcl)
   Auth: apiKey as query param
   ══════════════════════════════════════════════════════════════════ */
async function fetchSeaRatesREST(fromLat, fromLng, toLat, toLng, apiKey) {
  if (!apiKey) return null;

  const params = new URLSearchParams({
    apiKey:   apiKey,
    lat_from: String(parseFloat(fromLat)),
    lng_from: String(parseFloat(fromLng)),
    lat_to:   String(parseFloat(toLat)),
    lng_to:   String(parseFloat(toLng))
  });

  const { signal, clear } = abortTimer(REQUEST_TIMEOUT_MS);
  try {
    const r = await fetch(`${SEARATES_REST}?${params}`, {
      headers: { Accept: 'application/json' },
      signal
    });
    clear();

    if (!r.ok) {
      console.warn('[freight] SeaRates REST HTTP', r.status);
      return null;
    }

    const json = await r.json();
    console.log('[freight] SeaRates REST raw:', JSON.stringify(json).slice(0, 300));

    // Parse multiple possible response shapes
    // Shape A: { price: 1234, duration: 14 }
    // Shape B: { rates: [{ price: 1234, transit_time: 14, type: '20ST' }] }
    // Shape C: { data: { price: 1234, duration: 14 } }
    // Shape D: { status: 'ok', price: 1234, transit_time: 14 }
    let price = null, days = null;

    if (json && typeof json === 'object') {
      // Direct top-level fields
      price = Number(json.price || json.total_price || json.totalPrice || 0);
      days  = Number(json.duration || json.transit_time || json.transitTime || json.days || 0);

      // Nested in rates array (pick cheapest 20ft container)
      if ((!price || price <= 0) && Array.isArray(json.rates) && json.rates.length) {
        const r20 = json.rates.find(r =>
          /20/i.test(String(r.type || r.container || ''))
        ) || json.rates[0];
        if (r20) {
          price = Number(r20.price || r20.total_price || r20.totalPrice || 0);
          days  = Number(r20.transit_time || r20.duration || r20.transitTime || 0);
        }
      }

      // Nested in data object
      if ((!price || price <= 0) && json.data && typeof json.data === 'object') {
        price = Number(json.data.price || json.data.total_price || 0);
        days  = Number(json.data.duration || json.data.transit_time || 0);
      }
    }

    if (!price || price <= 0) return null;

    return {
      rate_usd:     Math.round(price),
      transit_days: Math.max(0, Math.round(days)),
      mode:         'FCL 20ft (SeaRates REST)',
      source:       'SeaRates'
    };
  } catch (e) {
    clear();
    if (e.name !== 'AbortError') console.warn('[freight] SeaRates REST error:', e.message);
    return null;
  }
}

/* ══════════════════════════════════════════════════════════════════
   TIER 2 — SeaRates GraphQL v2 (rates.searates.com/graphql)
   Auth: Bearer token
   Response: data.rates.General.totalPrice / totalTransitTime
             OR data.rates[].General.totalPrice  (if array)
   ══════════════════════════════════════════════════════════════════ */
async function fetchSeaRatesGQL(fromLat, fromLng, toLat, toLng, apiKey) {
  if (!apiKey) return null;

  const body = {
    query: `
      query GetRates($input: RatesInput) {
        rates(input: $input) {
          General {
            totalPrice
            totalCurrency
            totalTransitTime
          }
          points {
            totalPrice
            totalCurrency
            transitTime { rate }
          }
        }
      }
    `,
    variables: {
      input: {
        coordinatesFrom: [parseFloat(fromLat), parseFloat(fromLng)],
        coordinatesTo:   [parseFloat(toLat),   parseFloat(toLng)],
        shippingType:    'FCL',
        container:       'ST20',
        date:             todayISO()
      }
    }
  };

  const { signal, clear } = abortTimer(REQUEST_TIMEOUT_MS);
  try {
    const r = await fetch(SEARATES_GQL, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body:   JSON.stringify(body),
      signal
    });
    clear();

    if (!r.ok) {
      console.warn('[freight] SeaRates GQL HTTP', r.status);
      return null;
    }

    const json = await r.json();
    if (json.errors && json.errors.length) {
      console.warn('[freight] SeaRates GQL errors:', json.errors[0]?.message);
      return null;
    }

    const rd = json?.data?.rates;
    if (!rd) return null;

    // rates may be a single object or array — normalize to array
    const ratesArr = Array.isArray(rd) ? rd : [rd];
    if (!ratesArr.length) return null;

    let price = null, days = null;

    // Try General block first (summary of entire route)
    for (const entry of ratesArr) {
      const g = entry?.General;
      if (g && Number(g.totalPrice) > 0) {
        price = Number(g.totalPrice);
        days  = Number(g.totalTransitTime || 0);
        break;
      }
    }

    // Fall back to cheapest individual point
    if (!price || price <= 0) {
      for (const entry of ratesArr) {
        const pts = Array.isArray(entry?.points) ? entry.points : [];
        for (const pt of pts) {
          const p = Number(pt.totalPrice || 0);
          if (p > 0 && (!price || p < price)) {
            price = p;
            days  = Number(pt.transitTime?.rate || pt.transitTime || 0);
          }
        }
      }
    }

    if (!price || price <= 0) return null;

    return {
      rate_usd:     Math.round(price),
      transit_days: Math.max(0, Math.round(days)),
      mode:         'FCL 20ft (SeaRates GQL v2)',
      source:       'SeaRates'
    };
  } catch (e) {
    clear();
    if (e.name !== 'AbortError') console.warn('[freight] SeaRates GQL error:', e.message);
    return null;
  }
}

/* ══════════════════════════════════════════════════════════════════
   TIER 3 — Freightos public API (no key needed)
   ══════════════════════════════════════════════════════════════════ */
async function fetchFreightos(fromLat, fromLng, toLat, toLng) {
  const params = new URLSearchParams({
    origin:      `${fromLat},${fromLng}`,
    destination: `${toLat},${toLng}`,
    mode:        'FCL',
    loadtype:    '20DC',
    estimate:    'true',
    format:      'json'
  });

  const { signal, clear } = abortTimer(REQUEST_TIMEOUT_MS);
  try {
    const r = await fetch(`${FREIGHTOS_URL}?${params}`, {
      headers: { Accept: 'application/json' },
      signal
    });
    clear();

    if (!r.ok) return null;

    const json = await r.json();
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
      transit_days: Math.max(0, Math.round(days)),
      mode:         'FCL 20ft (Freightos estimate)',
      source:       'Freightos'
    };
  } catch (e) {
    clear();
    return null;
  }
}

/* ══════════════════════════════════════════════════════════════════
   Process one route: REST → GQL v2 → Freightos → error
   ══════════════════════════════════════════════════════════════════ */
async function processRoute({ from_lat, from_lng, to_lat, to_lng }, apiKey) {
  // Tier 1: old REST endpoint
  let result = await fetchSeaRatesREST(from_lat, from_lng, to_lat, to_lng, apiKey);

  // Tier 2: GraphQL v2
  if (!result) {
    result = await fetchSeaRatesGQL(from_lat, from_lng, to_lat, to_lng, apiKey);
  }

  // Tier 3: Freightos public fallback
  if (!result) {
    result = await fetchFreightos(from_lat, from_lng, to_lat, to_lng);
  }

  return result || { error: 'No rate available from SeaRates or Freightos' };
}

/* ══════════════════════════════════════════════════════════════════
   Handler
   ══════════════════════════════════════════════════════════════════ */
export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    let routes = [];

    if (req.method === 'GET') {
      const { from_lat, from_lng, to_lat, to_lng } = req.query;
      if (!from_lat || !from_lng || !to_lat || !to_lng) {
        return res.status(400).json({ error: 'from_lat, from_lng, to_lat, to_lng required' });
      }
      routes = [{ from_lat, from_lng, to_lat, to_lng }];
    } else {
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
      console.warn('[freight] SEARATES_API_KEY not set — Freightos fallback only');
    }

    const results = [];
    for (let i = 0; i < routes.length; i += MAX_PARALLEL) {
      const chunk = routes.slice(i, i + MAX_PARALLEL);
      const chunkResults = await Promise.all(
        chunk.map(route => processRoute(route, apiKey))
      );
      results.push(...chunkResults);
      if (i + MAX_PARALLEL < routes.length) await sleep(400);
    }

    if (req.method === 'GET') {
      return res.json(results[0]);
    }

    return res.json({ results, count: results.length });

  } catch (e) {
    console.error('[freight] handler error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
