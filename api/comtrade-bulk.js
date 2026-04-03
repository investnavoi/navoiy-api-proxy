function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const rawHs = String(req.query.hs || '');
    const hsCodes = [...new Set(
      rawHs.split(',').map((s) => s.trim().replace(/\D/g, '').slice(0, 6)).filter(Boolean)
    )];
    if (!hsCodes.length) return res.json({ error: 'hs param kerak (vergul bilan ajrating)', results: {} });

    const year     = String(req.query.year     || '2023');
    const countries= String(req.query.countries|| '');
    const source   = String(req.query.source   || 'comtrade');
    const key      = String(req.query.key      || process.env.COMTRADE_API_KEY || process.env.COMTRADE_PRIMARY_KEY || process.env.COMTRADE_KEY || '').trim();

    const BASE = 'https://navoiy-api-proxy.vercel.app';

    const entries = await Promise.all(
      hsCodes.map(async (hs) => {
        try {
          let url = `${BASE}/api/comtrade?hs=${encodeURIComponent(hs)}&year=${encodeURIComponent(year)}&countries=${encodeURIComponent(countries)}&source=${encodeURIComponent(source)}`;
          if (key) url += `&key=${encodeURIComponent(key)}`;
          const resp = await fetch(url, { signal: AbortSignal.timeout(25000) });
          if (!resp.ok) return [hs, { countries: [], error: resp.status }];
          const data = await resp.json();
          return [hs, { countries: data.countries || [], source: data.source || 'UN Comtrade' }];
        } catch (e) {
          return [hs, { countries: [], error: e.message }];
        }
      })
    );

    res.json({
      results: Object.fromEntries(entries),
      fetchedCount: hsCodes.length,
      year
    });
  } catch (e) {
    res.json({ error: e.message, results: {} });
  }
}
