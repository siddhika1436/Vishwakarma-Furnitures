// routes/auth.js — Complete auth with OTP verify + forgot password
const express  = require('express')
const router   = express.Router()
const bcrypt   = require('bcryptjs')
const jwt      = require('jsonwebtoken')
const { v4: uuidv4 } = require('uuid')
const db       = require('../config/db')
const { authenticate } = require('../middleware/auth')
const { sendOTPEmail, sendPasswordResetOTPEmail } = require('../services/email')

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function buildSessionUser(user) {
  return {
    id:            user.id,
    email:         user.email,
    full_name:     user.full_name || '',
    is_verified:   Boolean(user.is_verified),
    user_metadata: { full_name: user.full_name || '' },
  }
}

// ── POST /api/auth/signup ────────────────────────────────────
router.post('/signup', async (req, res) => {
  try {
    const { email, password, full_name } = req.body

    if (!email || !password)
      return res.status(400).json({ data: null, error: { message: 'Email and password are required' } })
    if (!EMAIL_REGEX.test(email))
      return res.status(400).json({ data: null, error: { message: 'Invalid email format' } })
    if (password.length < 6)
      return res.status(400).json({ data: null, error: { message: 'Password must be at least 6 characters' } })

    const normalEmail = email.toLowerCase().trim()
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [normalEmail])
    if (existing.length > 0)
      return res.status(400).json({ data: null, error: { message: 'Email already registered' } })

    const id            = uuidv4()
    const password_hash = await bcrypt.hash(password, 12)
    const otp           = generateOTP()
    const otp_expires   = new Date(Date.now() + 10 * 60 * 1000)

    await db.query(
      `INSERT INTO users (id, email, password_hash, full_name, is_verified, otp_code, otp_expires, otp_purpose)
       VALUES (?, ?, ?, ?, 0, ?, ?, 'verify')`,
      [id, normalEmail, password_hash, full_name || null, otp, otp_expires]
    )

    try { await sendOTPEmail(normalEmail, otp) }
    catch (e) { console.error('OTP email failed (non-fatal):', e.message) }

    return res.status(201).json({
      data: {
        user: { id, email: normalEmail, user_metadata: { full_name: full_name || '' } },
        session: null,
        message: 'Account created. Please verify your email with the OTP sent.',
      },
      error: null,
    })
  } catch (err) {
    console.error('Signup error:', err)
    return res.status(500).json({ data: null, error: { message: 'Internal server error' } })
  }
})

// ── POST /api/auth/verify-otp ────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body
    if (!email || !otp)
      return res.status(400).json({ data: null, error: { message: 'Email and OTP are required' } })

    const normalEmail = email.toLowerCase().trim()
    const [rows] = await db.query(
      'SELECT id, otp_code, otp_expires, is_verified, otp_purpose FROM users WHERE email = ?',
      [normalEmail]
    )

    if (!rows.length) return res.status(404).json({ data: null, error: { message: 'User not found' } })
    const user = rows[0]

    if (user.is_verified && user.otp_purpose !== 'reset')
      return res.status(400).json({ data: null, error: { message: 'Email already verified' } })
    if (!user.otp_code || user.otp_code !== String(otp).trim())
      return res.status(400).json({ data: null, error: { message: 'Invalid OTP' } })
    if (new Date() > new Date(user.otp_expires))
      return res.status(400).json({ data: null, error: { message: 'OTP expired. Please request a new one.' } })

    await db.query(
      'UPDATE users SET is_verified = 1, otp_code = NULL, otp_expires = NULL, otp_purpose = NULL WHERE id = ?',
      [user.id]
    )

    return res.json({ data: { message: 'Email verified successfully. You can now log in.' }, error: null })
  } catch (err) {
    console.error('Verify OTP error:', err)
    return res.status(500).json({ data: null, error: { message: 'Internal server error' } })
  }
})

// ── POST /api/auth/resend-otp ────────────────────────────────
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ data: null, error: { message: 'Email is required' } })

    const normalEmail = email.toLowerCase().trim()
    const [rows] = await db.query('SELECT id, is_verified FROM users WHERE email = ?', [normalEmail])

    if (!rows.length) return res.status(404).json({ data: null, error: { message: 'User not found' } })
    if (rows[0].is_verified)
      return res.status(400).json({ data: null, error: { message: 'Email already verified' } })

    const otp         = generateOTP()
    const otp_expires = new Date(Date.now() + 10 * 60 * 1000)

    await db.query(
      "UPDATE users SET otp_code = ?, otp_expires = ?, otp_purpose = 'verify' WHERE id = ?",
      [otp, otp_expires, rows[0].id]
    )

    await sendOTPEmail(normalEmail, otp)
    return res.json({ data: { message: 'OTP resent. Check your email.' }, error: null })
  } catch (err) {
    console.error('Resend OTP error:', err)
    return res.status(500).json({ data: null, error: { message: 'Internal server error' } })
  }
})

// ── POST /api/auth/signin ────────────────────────────────────
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password)
      return res.status(400).json({ data: null, error: { message: 'Email and password are required' } })
    if (!EMAIL_REGEX.test(email))
      return res.status(400).json({ data: null, error: { message: 'Invalid email format' } })

    const [rows] = await db.query(
      'SELECT id, email, password_hash, full_name, is_verified FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    )
    if (!rows.length)
      return res.status(400).json({ data: null, error: { message: 'Invalid login credentials' } })

    const user  = rows[0]
    const match = await bcrypt.compare(password, user.password_hash)
    if (!match)
      return res.status(400).json({ data: null, error: { message: 'Invalid login credentials' } })

    if (!user.is_verified) {
      return res.status(403).json({
        data: null,
        error: {
          message: 'Email not verified. Please check your inbox for the OTP.',
          code:    'EMAIL_NOT_VERIFIED',
          email:   user.email,
        },
      })
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, full_name: user.full_name || '' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    const sessionUser = buildSessionUser(user)
    return res.json({
      data: { user: sessionUser, session: { access_token: token, user: sessionUser } },
      error: null,
    })
  } catch (err) {
    console.error('Signin error:', err)
    return res.status(500).json({ data: null, error: { message: 'Internal server error' } })
  }
})

// ── POST /api/auth/signout ───────────────────────────────────
router.post('/signout', (req, res) => res.json({ error: null }))

// ── GET /api/auth/session ────────────────────────────────────
router.get('/session', authenticate, (req, res) => {
  const sessionUser = buildSessionUser(req.user)
  return res.json({
    data: { session: { access_token: req.headers.authorization?.slice(7), user: sessionUser } },
    error: null,
  })
})

// ── POST /api/auth/forgot-password ──────────────────────────
// Step 1: User enters email → OTP is sent
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ data: null, error: { message: 'Email is required' } })
    if (!EMAIL_REGEX.test(email))
      return res.status(400).json({ data: null, error: { message: 'Invalid email format' } })

    const normalEmail = email.toLowerCase().trim()
    const [rows] = await db.query('SELECT id FROM users WHERE email = ?', [normalEmail])

    // Always respond success to prevent email enumeration
    if (!rows.length) {
      return res.json({ data: { message: 'If this email is registered, an OTP has been sent.' }, error: null })
    }

    const otp         = generateOTP()
    const otp_expires = new Date(Date.now() + 10 * 60 * 1000)

    await db.query(
      "UPDATE users SET otp_code = ?, otp_expires = ?, otp_purpose = 'reset' WHERE id = ?",
      [otp, otp_expires, rows[0].id]
    )

    try { await sendPasswordResetOTPEmail(normalEmail, otp) }
    catch (e) { console.error('Reset OTP email failed:', e.message) }

    return res.json({ data: { message: 'If this email is registered, an OTP has been sent.' }, error: null })
  } catch (err) {
    console.error('Forgot password error:', err)
    return res.status(500).json({ data: null, error: { message: 'Internal server error' } })
  }
})

// ── POST /api/auth/verify-reset-otp ─────────────────────────
// Step 2: Verify the OTP (returns a reset token to use in step 3)
router.post('/verify-reset-otp', async (req, res) => {
  try {
    const { email, otp } = req.body
    if (!email || !otp)
      return res.status(400).json({ data: null, error: { message: 'Email and OTP are required' } })

    const normalEmail = email.toLowerCase().trim()
    const [rows] = await db.query(
      "SELECT id, otp_code, otp_expires, otp_purpose FROM users WHERE email = ?",
      [normalEmail]
    )

    if (!rows.length) return res.status(404).json({ data: null, error: { message: 'User not found' } })
    const user = rows[0]

    if (user.otp_purpose !== 'reset')
      return res.status(400).json({ data: null, error: { message: 'No password reset request found. Please request again.' } })
    if (!user.otp_code || user.otp_code !== String(otp).trim())
      return res.status(400).json({ data: null, error: { message: 'Invalid OTP' } })
    if (new Date() > new Date(user.otp_expires))
      return res.status(400).json({ data: null, error: { message: 'OTP expired. Please request a new one.' } })

    // Generate a short-lived reset token (5 min)
    const resetToken = jwt.sign(
      { id: user.id, purpose: 'reset' },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    )

    // Clear OTP
    await db.query('UPDATE users SET otp_code = NULL, otp_expires = NULL, otp_purpose = NULL WHERE id = ?', [user.id])

    return res.json({ data: { reset_token: resetToken, message: 'OTP verified. Set your new password.' }, error: null })
  } catch (err) {
    console.error('Verify reset OTP error:', err)
    return res.status(500).json({ data: null, error: { message: 'Internal server error' } })
  }
})

// ── POST /api/auth/reset-password ───────────────────────────
// Step 3: Set new password using reset token
router.post('/reset-password', async (req, res) => {
  try {
    const { reset_token, new_password } = req.body
    if (!reset_token || !new_password)
      return res.status(400).json({ data: null, error: { message: 'Reset token and new password are required' } })
    if (new_password.length < 6)
      return res.status(400).json({ data: null, error: { message: 'Password must be at least 6 characters' } })

    let payload
    try {
      payload = jwt.verify(reset_token, process.env.JWT_SECRET)
    } catch {
      return res.status(400).json({ data: null, error: { message: 'Invalid or expired reset token. Please restart.' } })
    }

    if (payload.purpose !== 'reset')
      return res.status(400).json({ data: null, error: { message: 'Invalid reset token' } })

    const password_hash = await bcrypt.hash(new_password, 12)
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash, payload.id])

    return res.json({ data: { message: 'Password reset successfully. Please log in.' }, error: null })
  } catch (err) {
    console.error('Reset password error:', err)
    return res.status(500).json({ data: null, error: { message: 'Internal server error' } })
  }
})

module.exports = router
