const PREVIEW_BASE = 'https://comtradeapi.un.org/public/v1/preview/C/A/HS';
const PREMIUM_BASE = 'https://comtradeapi.un.org/data/v1/get/C/A/HS';
const LEVEL_TO_CMD = { '2': 'AG2', '4': 'AG4', '6': 'AG6', all: 'AG6' };

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeCmdCode(rawValue) {
  if (!rawValue) return '';

  return String(rawValue)
    .split(',')
    .map((part) => String(part || '').trim().toUpperCase())
    .map((part) => {
      if (!part) return '';
      if (part === 'TOTAL' || /^AG[246]$/.test(part)) return part;
      return part.replace(/\D/g, '').slice(0, 6);
    })
    .filter(Boolean)
    .join(',');
}

function pickCmdCode(level, hs) {
  if (hs) return hs;
  return LEVEL_TO_CMD[level] || LEVEL_TO_CMD['4'];
}

function getMaxRecords(cmdCode, hasKey) {
  if (!cmdCode || cmdCode === 'TOTAL') return 1;
  if (cmdCode === 'AG2') return 200;
  if (cmdCode.indexOf(',') !== -1) return 500;
  return hasKey ? 100000 : 500;
}

function buildUrl({ reporter, year, flowCode, partnerCode, cmdCode, maxRecords, hasKey }) {
  const base = hasKey ? PREMIUM_BASE : PREVIEW_BASE;
  const params = new URLSearchParams({
    reporterCode: String(reporter),
    period: String(year),
    flowCode,
    partnerCode: String(partnerCode || '0'),
    cmdCode,
    maxRecords: String(maxRecords),
    includeDesc: 'true'
  });
  return `${base}?${params.toString()}`;
}

async function fetchComtradeRows({ reporter, year, flowCode, partnerCode, cmdCode, key, maxRecords }) {
  const hasKey = Boolean(key);
  const url = buildUrl({ reporter, year, flowCode, partnerCode, cmdCode, maxRecords, hasKey });
  const headers = { Accept: 'application/json' };
  if (hasKey) headers['Ocp-Apim-Subscription-Key'] = key;

  let response = null;
  let lastStatus = 0;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    response = await fetch(url, { headers });
    lastStatus = response.status;
    if (response.ok) break;
    if (response.status !== 429 || attempt === 2) {
      throw new Error(`Comtrade: ${response.status}`);
    }
    await sleep(1200 * (attempt + 1));
  }

  if (!response || !response.ok) {
    throw new Error(`Comtrade: ${lastStatus || 0}`);
  }

  const json = await response.json();
  return Array.isArray(json?.data) ? json.data : [];
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { reporter, year = '2023', flow = 'M', hs, key } = req.query;
    const partner = String(req.query.partner || '0').trim() || '0';
    const level = String(req.query.level || '4').trim().toLowerCase();
    if (!reporter) return res.json({ error: 'reporter kerak', data: [] });

    const flowCode = flow === 'X' ? 'X' : 'M';
    const comtradeKey = String(
      key ||
      process.env.COMTRADE_API_KEY ||
      process.env.COMTRADE_PRIMARY_KEY ||
      process.env.COMTRADE_KEY ||
      ''
    ).trim();
    const normalizedHs = normalizeCmdCode(hs);
    const requestedCmdCode = pickCmdCode(level, normalizedHs);
    const maxRecords = getMaxRecords(requestedCmdCode, Boolean(comtradeKey));

    const data = await fetchComtradeRows({
      reporter,
      year,
      flowCode,
      partnerCode: partner,
      cmdCode: requestedCmdCode,
      key: comtradeKey,
      maxRecords
    });

    let totalRow = null;
    if (requestedCmdCode === 'TOTAL') {
      totalRow = data[0] || null;
    } else {
      try {
        const totalRows = await fetchComtradeRows({
          reporter,
          year,
          flowCode,
          partnerCode: partner,
          cmdCode: 'TOTAL',
          key: comtradeKey,
          maxRecords: 1
        });
        totalRow = totalRows[0] || null;
      } catch (totalError) {
        totalRow = null;
      }
    }

    const totalValue = Number(totalRow?.primaryValue || totalRow?.cifvalue || 0);
    const isPartial = !normalizedHs && data.length >= maxRecords && requestedCmdCode !== 'AG2';

    res.json({
      data,
      source: 'UN Comtrade',
      count: data.length,
      total_value: totalValue,
      total_row: totalRow,
      partner_code: partner,
      requested_cmd_code: requestedCmdCode,
      requested_level: level,
      hs_filter: normalizedHs,
      is_partial: isPartial,
      max_records: maxRecords
    });
  } catch (e) {
    res.json({ data: [], error: e.message });
  }
}
