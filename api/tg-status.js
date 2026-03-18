export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.json({
    ready:!!(process.env.TG_SESSION&&process.env.TG_API_ID&&process.env.TG_API_HASH),
    hasSession:!!process.env.TG_SESSION,
    hasApiId:!!process.env.TG_API_ID
  });
}
