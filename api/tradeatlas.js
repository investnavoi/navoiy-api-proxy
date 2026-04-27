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
    fax: String(row && row[prefix + 'Fax'] || '').trim(),
    web: String(row && row[prefix + 'Web'] || '').trim(),
    linkedin: String(row && row[prefix + 'Linkedin'] || '').trim(),
    facebook: String(row && row[prefix + 'Facebook'] || '').trim(),
    twitter: String(row && row[prefix + 'Twitter'] || '').trim(),
    instagram: String(row && row[prefix + 'Instagram'] || '').trim(),
    firm_address: String(row && row[prefix + 'Address'] || '').trim(),
    tax_id: String(row && row[prefix + 'TaxId'] || '').trim(),
    company_type_code: String(row && row[prefix + 'CompanyTypeCode'] || '').trim()
  };
}

function _taPushUnique(arr, val){
  if(val == null) return;
  const v = String(val).trim();
  if(!v || arr.indexOf(v) !== -1) return;
  arr.push(v);
}

function _taParseDateOrdinal(value){
  if(!value) return 0;
  const t = Date.parse(String(value));
  return Number.isFinite(t) ? t : 0;
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
    const counterpartName = String(row && row[counterpartSide + 'Name'] || '').trim();
    const unit = String(row && (row.quantityUnit || row.netWeightUnit || row.grossWeightUnit) || '').trim();
    const fobUsd = Number(row && (row.usdFob || row.fobValue)) || 0;
    const cifUsd = Number(row && (row.usdCif || row.cifValue)) || 0;
    const statUsd = Number(row && row.statisticalValueUsd) || 0;
    const unitPrice = Number(row && row.unitPrice) || 0;
    const freight = Number(row && row.freightAmount) || 0;
    const insurance = Number(row && row.insuranceAmount) || 0;
    const grossWeight = Number(row && row.grossWeight) || 0;
    const netWeight = Number(row && row.netWeight) || 0;
    const grossWeightUnit = String(row && row.grossWeightUnit || '').trim();
    const netWeightUnit = String(row && row.netWeightUnit || '').trim();
    const containerCount = Number(row && row.containerCount) || 0;
    const packageAmount = Number(row && row.packageAmount) || 0;
    const packagesUnit = String(row && row.packagesUnit || '').trim();
    const totalTeus = Number(row && row.totalTeus) || 0;
    const arrivalDate = String(row && row.arrivalDate || '').trim();
    const arrivalOrdinal = _taParseDateOrdinal(arrivalDate);

    if(!map.has(key)){
      map.set(key, {
        // Identity
        firm_name: firm.firm_name,
        firm_country: firm.firm_country,
        firm_country_code: firm.firm_country_code,
        city_state: firm.city_state,
        firm_address: firm.firm_address,
        tax_id: firm.tax_id,
        company_type_code: firm.company_type_code,
        // Contact & Social
        e_mail: firm.e_mail,
        tel: firm.tel,
        fax: firm.fax,
        web: firm.web,
        linkedin: firm.linkedin,
        facebook: firm.facebook,
        twitter: firm.twitter,
        instagram: firm.instagram,
        // Counts
        doc_count: 0,
        // Value (USD)
        total_trade_value_usd: 0,
        total_fob_usd: 0,
        total_cif_usd: 0,
        total_statistical_value_usd: 0,
        total_freight_usd: 0,
        total_insurance_usd: 0,
        unit_price_samples: [],
        // Volume
        total_quantity: 0,
        quantity_unit: unit,
        total_gross_weight: 0,
        total_net_weight: 0,
        gross_weight_unit: grossWeightUnit,
        net_weight_unit: netWeightUnit,
        // Packaging
        total_containers: 0,
        total_packages: 0,
        package_unit: packagesUnit,
        total_teus: 0,
        // Counterpart
        counterpart_countries: [],
        counterpart_country_codes: [],
        counterpart_companies: [],
        // Counterpart firms — to'liq aloqali firmalar (har firma uchun: nomi, davlati, kontakti, hajm va qiymat)
        counterpart_firms: [],
        // Products
        hs_codes: [],
        hs_descriptions: [],
        product_details: [],
        brand_names: [],
        countries_of_origin: [],
        conditions_new_used: [],
        // Logistics
        ports_of_departure: [],
        ports_of_arrival: [],
        vessels: [],
        incoterms: [],
        transport_types: [],
        payment_types: [],
        regimes: [],
        first_arrival_date: '',
        last_arrival_date: '',
        _first_arrival_ordinal: 0,
        _last_arrival_ordinal: 0,
        // Other parties
        manufacturing_companies: [],
        transport_companies: [],
        notify_parties: [],
        // Examples
        shipment_examples: []
      });
    }

    const existing = map.get(key);
    existing.doc_count += 1;
    existing.total_trade_value_usd += tradeValue;
    existing.total_fob_usd += fobUsd;
    existing.total_cif_usd += cifUsd;
    existing.total_statistical_value_usd += statUsd;
    existing.total_freight_usd += freight;
    existing.total_insurance_usd += insurance;
    if(unitPrice > 0) existing.unit_price_samples.push(unitPrice);
    existing.total_quantity += qty;
    existing.total_gross_weight += grossWeight;
    existing.total_net_weight += netWeight;
    existing.total_containers += containerCount;
    existing.total_packages += packageAmount;
    existing.total_teus += totalTeus;

    // Fill-if-empty fields
    if(!existing.e_mail && firm.e_mail) existing.e_mail = firm.e_mail;
    if(!existing.tel && firm.tel) existing.tel = firm.tel;
    if(!existing.fax && firm.fax) existing.fax = firm.fax;
    if(!existing.web && firm.web) existing.web = firm.web;
    if(!existing.linkedin && firm.linkedin) existing.linkedin = firm.linkedin;
    if(!existing.facebook && firm.facebook) existing.facebook = firm.facebook;
    if(!existing.twitter && firm.twitter) existing.twitter = firm.twitter;
    if(!existing.instagram && firm.instagram) existing.instagram = firm.instagram;
    if(!existing.city_state && firm.city_state) existing.city_state = firm.city_state;
    if(!existing.firm_address && firm.firm_address) existing.firm_address = firm.firm_address;
    if(!existing.tax_id && firm.tax_id) existing.tax_id = firm.tax_id;
    if(!existing.company_type_code && firm.company_type_code) existing.company_type_code = firm.company_type_code;
    if(unit && !existing.quantity_unit) existing.quantity_unit = unit;
    if(grossWeightUnit && !existing.gross_weight_unit) existing.gross_weight_unit = grossWeightUnit;
    if(netWeightUnit && !existing.net_weight_unit) existing.net_weight_unit = netWeightUnit;
    if(packagesUnit && !existing.package_unit) existing.package_unit = packagesUnit;

    // Counterpart
    _taPushUnique(existing.counterpart_countries, counterpartCountry);
    _taPushUnique(existing.counterpart_country_codes, counterpartCountryCode);
    _taPushUnique(existing.counterpart_companies, counterpartName);

    // Counterpart firm — har bir hamkor (importyor yoki eksportyor) firma uchun to'liq aggregatsiya
    if(counterpartName){
      const cpKey = String(counterpartName).toLowerCase() + '|' + String(counterpartCountryCode || '').toLowerCase();
      let cpFirm = existing.counterpart_firms.find(function(c){ return c.key === cpKey; });
      if(!cpFirm){
        cpFirm = {
          key: cpKey,
          name: counterpartName,
          country: counterpartCountry,
          countryCode: counterpartCountryCode,
          cityState: String(row && row[counterpartSide + 'CityState'] || '').trim(),
          email: String(row && row[counterpartSide + 'Email'] || '').trim(),
          tel: String(row && row[counterpartSide + 'Tel'] || '').trim(),
          web: String(row && row[counterpartSide + 'Web'] || '').trim(),
          linkedin: String(row && row[counterpartSide + 'Linkedin'] || '').trim(),
          totalValue: 0,
          totalQty: 0,
          docCount: 0,
          lastDate: '',
          _lastOrd: 0
        };
        existing.counterpart_firms.push(cpFirm);
      }
      cpFirm.totalValue += tradeValue;
      cpFirm.totalQty += qty;
      cpFirm.docCount += 1;
      // Bo'sh maydonlarni to'ldirish
      if(!cpFirm.cityState){ cpFirm.cityState = String(row && row[counterpartSide + 'CityState'] || '').trim(); }
      if(!cpFirm.email){ cpFirm.email = String(row && row[counterpartSide + 'Email'] || '').trim(); }
      if(!cpFirm.tel){ cpFirm.tel = String(row && row[counterpartSide + 'Tel'] || '').trim(); }
      if(!cpFirm.web){ cpFirm.web = String(row && row[counterpartSide + 'Web'] || '').trim(); }
      if(!cpFirm.linkedin){ cpFirm.linkedin = String(row && row[counterpartSide + 'Linkedin'] || '').trim(); }
      if(arrivalOrdinal > 0 && arrivalOrdinal > cpFirm._lastOrd){
        cpFirm._lastOrd = arrivalOrdinal;
        cpFirm.lastDate = arrivalDate;
      }
    }

    // Products
    _taPushUnique(existing.hs_codes, row && row.hsCode);
    _taPushUnique(existing.hs_descriptions, row && row.hsCodeDescription);
    _taPushUnique(existing.product_details, row && row.productDetails);
    _taPushUnique(existing.brand_names, row && row.brandName);
    _taPushUnique(existing.countries_of_origin, row && row.countryOfOrigin);
    _taPushUnique(existing.conditions_new_used, row && row.conditionNewUsed);

    // Logistics
    _taPushUnique(existing.ports_of_departure, row && row.portOfDeparture);
    _taPushUnique(existing.ports_of_arrival, row && row.portOfArrival);
    _taPushUnique(existing.vessels, row && row.vesselName);
    _taPushUnique(existing.incoterms, row && row.incoterms);
    _taPushUnique(existing.transport_types, row && row.transportType);
    _taPushUnique(existing.payment_types, row && row.paymentType);
    _taPushUnique(existing.regimes, row && row.regime);

    // Arrival dates (min/max)
    if(arrivalOrdinal > 0){
      if(!existing._first_arrival_ordinal || arrivalOrdinal < existing._first_arrival_ordinal){
        existing._first_arrival_ordinal = arrivalOrdinal;
        existing.first_arrival_date = arrivalDate;
      }
      if(arrivalOrdinal > existing._last_arrival_ordinal){
        existing._last_arrival_ordinal = arrivalOrdinal;
        existing.last_arrival_date = arrivalDate;
      }
    }

    // Other parties
    _taPushUnique(existing.manufacturing_companies, row && row.manufacturingCompany);
    _taPushUnique(existing.transport_companies, row && row.transportCompany);
    _taPushUnique(existing.notify_parties, row && row.notifyParty);

    // Examples (up to 5, richer payload)
    if(existing.shipment_examples.length < 5){
      existing.shipment_examples.push({
        billOfLadingNo: row && row.billOfLadingNo,
        declarationNumber: row && row.declarationNumber,
        arrivalDate: arrivalDate,
        importerCountry: row && row.importerCountry,
        importerName: row && row.importerName,
        exporterCountry: row && row.exporterCountry,
        exporterName: row && row.exporterName,
        productDetails: row && row.productDetails,
        hsCode: row && row.hsCode,
        hsCodeDescription: row && row.hsCodeDescription,
        brandName: row && row.brandName,
        countryOfOrigin: row && row.countryOfOrigin,
        statisticalValueUsd: statUsd || tradeValue,
        usdFob: fobUsd,
        usdCif: cifUsd,
        unitPrice: unitPrice,
        freightAmount: freight,
        insuranceAmount: insurance,
        quantity: qty,
        quantityUnit: unit,
        grossWeight: grossWeight,
        netWeight: netWeight,
        grossWeightUnit: grossWeightUnit,
        netWeightUnit: netWeightUnit,
        containerCount: containerCount,
        packageAmount: packageAmount,
        packagesUnit: packagesUnit,
        totalTeus: totalTeus,
        portOfDeparture: row && row.portOfDeparture,
        portOfArrival: row && row.portOfArrival,
        vesselName: row && row.vesselName,
        incoterms: row && row.incoterms,
        paymentType: row && row.paymentType,
        transportType: row && row.transportType,
        regime: row && row.regime,
        manufacturingCompany: row && row.manufacturingCompany,
        transportCompany: row && row.transportCompany,
        notifyParty: row && row.notifyParty
      });
    }
  });

  // Compute averages and strip internal ordinals
  const out = Array.from(map.values()).map(function(firm){
    const samples = firm.unit_price_samples || [];
    const avgPrice = samples.length ? samples.reduce(function(a, b){ return a + b; }, 0) / samples.length : 0;
    firm.avg_unit_price_usd = avgPrice;
    delete firm.unit_price_samples;
    delete firm._first_arrival_ordinal;
    delete firm._last_arrival_ordinal;
    // Counterpart firmlarini totalValue bo'yicha tartiblab, internal kalitlarni olib tashlaymiz
    if(Array.isArray(firm.counterpart_firms)){
      firm.counterpart_firms = firm.counterpart_firms
        .map(function(cp){ delete cp.key; delete cp._lastOrd; return cp; })
        .sort(function(a, b){ return (b.totalValue || 0) - (a.totalValue || 0); });
    }
    return firm;
  });

  return out.sort(function(a, b){
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
