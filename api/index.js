export default function handler(req, res) {
  res.json({
    status:'ok',
    endpoints:[
      '/api/trade',
      '/api/wto-trade',
      '/api/wits-trade',
      '/api/wits-tariff',
      '/api/tg-send',
      '/api/tg-status',
      '/api/comtrade',
      '/api/apollo-search',
      '/api/ai-country-analysis',
      '/api/analyze-material'
    ]
  });
}
