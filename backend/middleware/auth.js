const jwt = require('jsonwebtoken')

/**
 * Middleware: verifies JWT and attaches user to req.user
 * Replaces Supabase RLS "auth.uid()" / "auth.role() = 'authenticated'"
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' })
  }

  const token = authHeader.slice(7)
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded   // { id, email, full_name, iat, exp }
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Token invalid or expired' })
  }
}

/**
 * Middleware: requires authenticate() first, then checks admin email
 * Replaces Supabase RLS admin checks done in the frontend via isAdmin
 */
function requireAdmin(req, res, next) {
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'deepakschaudhari07@gmail.com'
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' })
  }
  if (req.user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}

module.exports = { authenticate, requireAdmin }
