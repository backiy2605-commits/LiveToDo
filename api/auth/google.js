const { connectToDatabase } = require('../lib/db');
const { signToken } = require('../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { credential } = req.body || {};
  if (!credential) {
    return res.status(400).json({ error: 'Missing credential' });
  }

  try {
    // Verify credential with Google OAuth tokeninfo endpoint
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    if (!response.ok) {
      return res.status(401).json({ error: 'Invalid Google credential' });
    }

    const payload = await response.json();
    const { sub: googleId, email, name, picture, given_name } = payload;

    if (!email) {
      return res.status(400).json({ error: 'Google account has no email' });
    }

    const userProfile = {
      googleId,
      email: email.toLowerCase(),
      name: name || 'Freelancer',
      picture: picture || '',
      given_name: given_name || name || 'Freelancer',
      lastLogin: new Date().toISOString()
    };

    // Save or update user record in database if configured
    const { db } = await connectToDatabase();
    if (db) {
      const usersCol = db.collection('users');
      await usersCol.updateOne(
        { email: userProfile.email },
        { 
          $set: userProfile,
          $setOnInsert: { createdAt: new Date().toISOString() }
        },
        { upsert: true }
      );
    }

    // Generate JWT session token
    const token = signToken({
      googleId,
      email: userProfile.email,
      name: userProfile.name
    });

    return res.status(200).json({
      success: true,
      token,
      user: userProfile
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    return res.status(500).json({ error: 'Authentication failed', details: error.message });
  }
};
