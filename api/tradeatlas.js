const TRADEATLAS_BASE = 'https://api.tradeatlas.com';
const TRADEATLAS_LOGIN_URL = TRADEATLAS_BASE + '/api/v1/user/login';
const TRADEATLAS_FIRMS_URL = TRADEATLAS_BASE + '/api/v1/firms/search';
const TRADEATLAS_IMPORTERS_URL = TRADEATLAS_BASE + '/api/v1/importers/search';
const TRADEATLAS_SHIPMENTS_URL = TRADEATLAS_BASE + '/api/v1/shipments/search';
const TRADEATLAS_USAGE_URL = TRADEATLAS_BASE + '/api/v1/statistics/usage';
const TRADEATLAS_FIRMS_COUNT_URL = TRADEATLAS_BASE + '/api/v1/firms/count';
const TRADEATLAS_SHIPMENTS_COUNT_URL = TRADEATLAS_BASE + '/api/v1/shipments/count';

let _tradeAtlasToken = '';
let _tradeAtlasTokenExpiresAt = 0;

function setCors(res){
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function parseBody(req){
  if(!req || req.body == null) return {};
  if(typeof req.body === 'string'){
    try { return JSON.parse(req.body); } catch(_e){ return {}; }
  }
  return req.body || {};
}

function normalizeArray(value){
  if(Array.isArray(value)){
    return value.map(function(item){ return String(item || '').trim(); }).filter(Boolean);
  }
  if(typeof value === 'string'){
    return value.split(/[|,]/).map(function(item){ return String(item || '').trim(); }).filter(Boolean);
  }
  return [];
}

function uniqueStrings(list){
  return Array.from(new Set((list || []).map(function(item){
    return String(item || '').trim();
  }).filter(Boolean)));
}

function chunkArray(list, size){
  const out = [];
  const safeSize = Math.max(1, Number(size || 1) || 1);
  for(let i=0;i<list.length;i+=safeSize){
    out.push(list.slice(i, i + safeSize));
  }
  return out;
}

function normalizeHsCode(value){
  return String(value || '').replace(/\D/g, '').slice(0, 6);
}

function normalizeKeyword(value){
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 120);
}

function normalizeSize(value){
  const num = parseInt(value, 10);
  if(!num || num < 100) return 100;
  return Math.min(500, num);
}

function normalizeMode(value){
  return String(value || '').toLowerCase() === 'importers' ? 'importers' : 'exporters';
}

function normalizeCountryCode(value){
  return String(value || '').trim().toUpperCase().slice(0, 2);
}

function getTradeAtlasCredentials(){
  const userName = String(
    process.env.TRADEATLAS_USERNAME ||
    process.env.TRADEATLAS_USER ||
    'investnavoi.uz'
  ).trim();
  const password = String(
    process.env.TRADEATLAS_PASSWORD ||
    '3CUJKeVWGZReWAA'
  ).trim();
  return { userName, password };
}

async function readJsonSafe(response){
  const text = await response.text();
  if(!text) return {};
  try { return JSON.parse(text); } catch(_e){ return { raw: text }; }
}

function getErrorMessage(payload, fallback){
  if(!payload) return fallback;
  return payload.message || payload.error || payload.detail || payload.raw || fallback;
}

async function loginTradeAtlas(forceRefresh){
  const now = Date.now();
  if(!forceRefresh && _tradeAtlasToken && _tradeAtlasTokenExpiresAt > now + 60000){
    return _tradeAtlasToken;
  }
  const creds = getTradeAtlasCredentials();
  const response = await fetch(TRADEATLAS_LOGIN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userName: creds.userName, password: creds.password })
  });
  const data = await readJsonSafe(response);
  if(!response.ok){
    throw new Error(getErrorMessage(data, 'TradeAtlas login xatosi: ' + response.status));
  }
  const token = String(data.access_token || '').trim();
  if(!token) throw new Error('TradeAtlas access token qaytmadi');
  _tradeAtlasToken = token;
  const expireAt = Date.parse(data.expire_date || '');
  _tradeAtlasTokenExpiresAt = Number.isFinite(expireAt) ? expireAt : (now + 45 * 60 * 1000);
  return _tradeAtlasToken;
}

async function tradeAtlasPost(url, payload, retryAuth){
  const token = await loginTradeAtlas(false);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token
    },
    body: JSON.stringify(payload)
  });
  const data = await readJsonSafe(response);
  if(response.status === 401 && retryAuth !== false){
    await loginTradeAtlas(true);
    return tradeAtlasPost(url, payload, false);
  }
  if(!response.ok){
    throw new Error(getErrorMessage(data, 'TradeAtlas xato: ' + response.status));
  }
  return data;
}

async function tradeAtlasGet(url, retryAuth){
  const token = await loginTradeAtlas(false);
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Authorization': token }
  });
  const data = await readJsonSafe(response);
  if(response.status === 401 && retryAuth !== false){
    await loginTradeAtlas(true);
    return tradeAtlasGet(url, false);
  }
  if(!response.ok){
    throw new Error(getErrorMessage(data, 'TradeAtlas xato: ' + response.status));
  }
  return data;
}

function normalizeFirmList(data){
  if(Array.isArray(data)) return data;
  if(data && Array.isArray(data.firms)) return data.firms;
  if(data && Array.isArray(data.data)) return data.data;
  if(data && data.data && Array.isArray(data.data.firms)) return data.data.firms;
  return [];
}

function normalizeShipmentList(data){
  if(Array.isArray(data)) return data;
  if(data && Array.isArray(data.shipments)) return data.shipments;
  if(data && Array.isArray(data.data)) return data.data;
  if(data && data.data && Array.isArray(data.data.shipments)) return data.data.shipments;
  return [];
}

function shipmentTradeValueUsd(row){
  return Number(
    row && (
      row.statisticalValueUsd ||
      row.usdFob ||
      row.usdCif ||
      row.fobValue ||
      row.cifValue ||
      0
    )
  ) || 0;
}

function shipmentQuantity(row){
  return Number(
    row && (
      row.quantity ||
      row.netWeight ||
      row.grossWeight ||
      0
    )
  ) || 0;
}

function buildShipmentFirmSide(row, side){
  const prefix = side === 'importer' ? 'importer' : 'exporter';
  return {
    firm_name: String(row && row[prefix + 'Name'] || '').trim(),
    firm_country: String(row && row[prefix + 'Country'] || '').trim(),
    firm_country_code: normalizeCountryCode(row && row[prefix + 'CountryCode']),
    city_state: String(row && row[prefix + 'CityState'] || '').trim(),
    e_mail: String(row && row[prefix + 'Email'] || '').trim(),
    tel: String(row && row[prefix + 'Tel'] || '').trim(),
    web: String(row && row[prefix + 'Web'] || '').trim(),
    linkedin: String(row && row[prefix + 'Linkedin'] || '').trim(),
    firm_address: String(row && row[prefix + 'Address'] || '').trim()
  };
}

function aggregateShipmentsToFirms(rows, mode, sourceCountries){
  const sourceSet = new Set((sourceCountries || []).map(normalizeCountryCode).filter(Boolean));
  const side = mode === 'importers' ? 'importer' : 'exporter';
  const counterpartSide = side === 'importer' ? 'exporter' : 'importer';
  const map = new Map();

  (rows || []).forEach(function(row){
    const exporterCode = normalizeCountryCode(row && row.exporterCountryCode);
    if(sourceSet.size && !sourceSet.has(exporterCode)) return;
    const firm = buildShipmentFirmSide(row, side);
    if(!firm.firm_name) return;
    const key = [
      String(firm.firm_name || '').toLowerCase(),
      String(firm.firm_country_code || firm.firm_country || '').toLowerCase()
    ].join('|');
    const tradeValue = shipmentTradeValueUsd(row);
    const qty = shipmentQuantity(row);
    const counterpartCountry = String(row && row[counterpartSide + 'Country'] || '').trim();
    const counterpartCountryCode = normalizeCountryCode(row && row[counterpartSide + 'CountryCode']);
    const unit = String(row && (row.quantityUnit || row.netWeightUnit || row.grossWeightUnit) || '').trim();

    if(!map.has(key)){
      map.set(key, {
        firm_name: firm.firm_name,
        firm_country: firm.firm_country,
        firm_country_code: firm.firm_country_code,
        city_state: firm.city_state,
        e_mail: firm.e_mail,
        tel: firm.tel,
        web: firm.web,
        linkedin: firm.linkedin,
        firm_address: firm.firm_address,
        doc_count: 0,
        total_trade_value_usd: 0,
        total_quantity: 0,
        quantity_unit: unit,
        counterpart_countries: [],
        counterpart_country_codes: [],
        shipment_examples: []
      });
    }

    const existing = map.get(key);
    existing.doc_count += 1;
    existing.total_trade_value_usd += tradeValue;
    existing.total_quantity += qty;
    if(!existing.e_mail && firm.e_mail) existing.e_mail = firm.e_mail;
    if(!existing.tel && firm.tel) existing.tel = firm.tel;
    if(!existing.web && firm.web) existing.web = firm.web;
    if(!existing.linkedin && firm.linkedin) existing.linkedin = firm.linkedin;
    if(!existing.city_state && firm.city_state) existing.city_state = firm.city_state;
    if(!existing.firm_address && firm.firm_address) existing.firm_address = firm.firm_address;
    if(unit && !existing.quantity_unit) existing.quantity_unit = unit;
    if(counterpartCountry && existing.counterpart_countries.indexOf(counterpartCountry) === -1){
      existing.counterpart_countries.push(counterpartCountry);
    }
    if(counterpartCountryCode && existing.counterpart_country_codes.indexOf(counterpartCountryCode) === -1){
      existing.counterpart_country_codes.push(counterpartCountryCode);
    }
    if(existing.shipment_examples.length < 5){
      existing.shipment_examples.push({
        importerCountry: row && row.importerCountry,
        exporterCountry: row && row.exporterCountry,
        productDetails: row && row.productDetails,
        hsCode: row && row.hsCode,
        statisticalValueUsd: tradeValue,
        quantity: qty,
        quantityUnit: unit
      });
    }
  });

  return Array.from(map.values()).sort(function(a, b){
    return (b.total_trade_value_usd || 0) - (a.total_trade_value_usd || 0) ||
      (b.doc_count || 0) - (a.doc_count || 0);
  });
}

async function performLegacyFirmSearch(body, req){
  const countries = normalizeArray(body.countries || req.query.countries).map(normalizeCountryCode).filter(Boolean);
  const hsCode = normalizeHsCode(body.hsCode || req.query.hsCode || body.hs || req.query.hs);
  const mode = normalizeMode(body.mode || req.query.mode || 'exporters');
  const productKeyword = normalizeKeyword(body.productKeyword || req.query.productKeyword || body.keyword || req.query.keyword);
  const page = Math.max(1, parseInt(body.page || req.query.page || '1', 10) || 1);

  if(!countries.length) return { source: 'TradeAtlas', firms: [], count: 0, error: 'countries kerak' };
  if(!hsCode) return { source: 'TradeAtlas', firms: [], count: 0, error: 'hsCode kerak' };

  const payload = {
    countries: countries.slice(0, 5),
    firmType: mode === 'importers' ? 'IMPORTER' : 'EXPORTER',
    flowType: mode === 'importers' ? 'IMPORT' : 'EXPORT',
    page: page,
    firmFilter: [1, 2],
    parameters: [{ HS_CODE: hsCode }]
  };
  if(productKeyword){
    payload.parameters.push({ PRODUCT_DETAILS: productKeyword });
  }

  const endpoint = mode === 'importers' ? TRADEATLAS_IMPORTERS_URL : TRADEATLAS_FIRMS_URL;
  const data = await tradeAtlasPost(endpoint, payload, true);
  const firms = normalizeFirmList(data);
  return {
    source: 'TradeAtlas',
    mode: mode,
    hsCode: hsCode,
    countries: countries,
    count: Number(data.firms_count || data.total_entries || firms.length || 0),
    firms: firms,
    page: page
  };
}

async function performShipmentCompanySearch(body, req){
  const targetCountries = uniqueStrings(
    normalizeArray(body.targetCountries || body.countries || req.query.targetCountries || req.query.countries)
      .map(normalizeCountryCode)
      .filter(Boolean)
  );
  const sourceCountries = uniqueStrings(
    normalizeArray(body.sourceCountries || req.query.sourceCountries)
      .map(normalizeCountryCode)
      .filter(Boolean)
  );
  const hsCode = normalizeHsCode(body.hsCode || req.query.hsCode || body.hs || req.query.hs);
  const mode = normalizeMode(body.mode || req.query.mode || 'exporters');
  const productKeyword = normalizeKeyword(body.productKeyword || req.query.productKeyword || body.keyword || req.query.keyword);
  const size = normalizeSize(body.size || req.query.size || 200);

  if(!targetCountries.length){
    return { source: 'TradeAtlas', firms: [], count: 0, error: 'targetCountries kerak' };
  }
  if(!hsCode){
    return { source: 'TradeAtlas', firms: [], count: 0, error: 'hsCode kerak' };
  }

  const targetChunks = chunkArray(targetCountries, 5);
  const useDirectSourceFilter = sourceCountries.length > 0 && sourceCountries.length <= 5;
  const allRows = [];

  for(const targetChunk of targetChunks){
    if(useDirectSourceFilter){
      for(const sourceCode of sourceCountries){
        const parameters = [{ HS_CODE: hsCode }, { EXPORTER_COUNTRY_CODE: sourceCode }];
        if(productKeyword) parameters.push({ PRODUCT_DETAILS: productKeyword });
        const data = await tradeAtlasPost(TRADEATLAS_SHIPMENTS_URL, {
          countries: targetChunk,
          flowType: 'IMPORT',
          size: size,
          firmFilter: [1, 2],
          parameters: parameters
        }, true);
        normalizeShipmentList(data).forEach(function(row){ allRows.push(row); });
      }
    } else {
      const parameters = [{ HS_CODE: hsCode }];
      if(productKeyword) parameters.push({ PRODUCT_DETAILS: productKeyword });
      const data = await tradeAtlasPost(TRADEATLAS_SHIPMENTS_URL, {
        countries: targetChunk,
        flowType: 'IMPORT',
        size: size,
        firmFilter: [1, 2],
        parameters: parameters
      }, true);
      normalizeShipmentList(data).forEach(function(row){ allRows.push(row); });
    }
  }

  const firms = aggregateShipmentsToFirms(allRows, mode, sourceCountries);
  return {
    source: 'TradeAtlas Shipments',
    mode: mode,
    hsCode: hsCode,
    targetCountries: targetCountries,
    sourceCountries: sourceCountries,
    count: firms.length,
    firms: firms
  };
}

export default async function handler(req, res){
  setCors(res);
  if(req.method === 'OPTIONS') return res.status(200).end();

  try {
    const body = parseBody(req);
    const mode = String((body && body.mode) || (req && req.query && req.query.mode) || '').toLowerCase();

    // Kredit holati — GET /statistics/usage (kredit yemaydi)
    if(mode === 'usage' || (body && body.endpoint === 'statistics/usage')){
      const usage = await tradeAtlasGet(TRADEATLAS_USAGE_URL, true);
      return res.json({ source: 'TradeAtlas', mode: 'usage', usage: usage, raw: usage });
    }

    // Count endpointlari — kredit yemaydi, dastlabki tekshiruv uchun
    if(mode === 'firms_count' || (body && body.endpoint === 'firms/count')){
      const data = await tradeAtlasPost(TRADEATLAS_FIRMS_COUNT_URL, body.payload || body, true);
      return res.json({ source: 'TradeAtlas', mode: 'firms_count', data: data });
    }
    if(mode === 'shipments_count' || (body && body.endpoint === 'shipments/count')){
      const data = await tradeAtlasPost(TRADEATLAS_SHIPMENTS_COUNT_URL, body.payload || body, true);
      return res.json({ source: 'TradeAtlas', mode: 'shipments_count', data: data });
    }

    const hasTargetShape = !!(
      (body && (body.targetCountries || body.sourceCountries)) ||
      (req && req.query && (req.query.targetCountries || req.query.sourceCountries))
    );
    const payload = hasTargetShape
      ? await performShipmentCompanySearch(body, req)
      : await performLegacyFirmSearch(body, req);
    return res.json(payload);
  } catch(e){
    return res.json({
      source: 'TradeAtlas',
      firms: [],
      count: 0,
      error: e && e.message ? e.message : 'TradeAtlas unknown error'
    });
  }
}
