module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
  return res.status(200).json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    hasDatabase: Boolean(process.env.MONGODB_URI)
  });
};
