let jwt;
try {
  jwt = require('jsonwebtoken');
} catch (e) {
  jwt = null;
}

const JWT_SECRET = process.env.JWT_SECRET || 'livetodo-fallback-secret-2026';

function signToken(payload) {
  if (jwt) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
  }
  // Lightweight fallback token if jwt module is not installed locally
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

function verifyToken(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  if (jwt) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return null;
    }
  }
  try {
    return JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
  } catch (e) {
    return null;
  }
}

module.exports = { signToken, verifyToken };
