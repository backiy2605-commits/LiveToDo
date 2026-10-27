const { connectToDatabase } = require('./lib/db');
const { verifyToken } = require('./lib/auth');

module.exports = async function handler(req, res) {
  // Check user authentication
  const sessionUser = verifyToken(req);
  if (!sessionUser || !sessionUser.email) {
    return res.status(401).json({ error: 'Unauthorized. Please sign in.' });
  }

  const userEmail = sessionUser.email.toLowerCase();

  try {
    const { db } = await connectToDatabase();

    // If MongoDB is not yet connected by the user in Vercel env
    if (!db) {
      if (req.method === 'GET') {
        return res.status(200).json({
          status: 'no_database',
          message: 'MongoDB URI is not set in environment variables. Local data mode active.',
          data: null
        });
      }
      if (req.method === 'POST') {
        return res.status(200).json({
          status: 'no_database',
          message: 'Data saved locally. Set MONGODB_URI in Vercel to sync across all devices permanently.'
        });
      }
    }

    const userDataCol = db.collection('user_data');

    // GET: Retrieve user data
    if (req.method === 'GET') {
      const record = await userDataCol.findOne({ email: userEmail });
      return res.status(200).json({
        success: true,
        data: record ? record.data : null
      });
    }

    // POST: Save / Sync user data
    if (req.method === 'POST') {
      const { data } = req.body || {};
      if (!data) {
        return res.status(400).json({ error: 'Missing data to save' });
      }

      await userDataCol.updateOne(
        { email: userEmail },
        {
          $set: {
            email: userEmail,
            data,
            updatedAt: new Date().toISOString()
          },
          $setOnInsert: {
            createdAt: new Date().toISOString()
          }
        },
        { upsert: true }
      );

      return res.status(200).json({
        success: true,
        syncedAt: new Date().toISOString()
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Data API Error:', error);
    return res.status(500).json({ error: 'Database operation failed', details: error.message });
  }
};
