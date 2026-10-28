const { MongoClient } = require('mongodb');
module.exports = async (req, res) => {
  const out = {
    hasMongoUri: !!process.env.MONGODB_URI,
    hasGoogleId: !!process.env.GOOGLE_CLIENT_ID,
    hasJwt: !!process.env.JWT_SECRET
  };
  try {
    const c = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    await c.connect();
    await c.db('livetodo').command({ ping: 1 });
    await c.close();
    out.mongo = 'connected';
  } catch (e) {
    out.mongo = 'FAILED: ' + e.message;
  }
  res.status(200).json(out);
};
