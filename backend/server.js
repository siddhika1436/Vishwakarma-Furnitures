// server.js — Vishwakarma Furnitures Backend
require('dotenv').config()
const express = require('express')
const cors    = require('cors')
const path    = require('path')

const authRoutes    = require('./routes/auth')
const productsRoutes = require('./routes/products')
const ordersRoutes  = require('./routes/orders')
const uploadRoutes  = require('./routes/upload')
const paymentRoutes = require('./routes/payment')

const app  = express()
const PORT = process.env.PORT || 4000

// ─── CORS ──────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
].filter(Boolean)

app.use(cors({ origin: allowedOrigins, credentials: true }))

// ─── Razorpay webhook: raw body BEFORE express.json() ──────
app.use('/api/payment/razorpay/webhook',
  express.raw({ type: 'application/json' })
)

// ─── Body parsing ───────────────────────────────────────────
app.use(express.json({ limit: '15mb' }))
app.use(express.urlencoded({ extended: true, limit: '15mb' }))

// ─── Static uploads ─────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1y', immutable: true,
}))

// ─── Routes ─────────────────────────────────────────────────
app.use('/api/auth',     authRoutes)
app.use('/api/products', productsRoutes)
app.use('/api/orders',   ordersRoutes)
app.use('/api/upload',   uploadRoutes)
app.use('/api/images',   uploadRoutes)
app.use('/api/payment',  paymentRoutes)

// ─── Health ─────────────────────────────────────────────────
app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', ts: new Date().toISOString() })
)

// ─── 404 ────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Route not found' }))

// ─── Error handler ──────────────────────────────────────────
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE')
    return res.status(413).json({ data: null, error: { message: 'Image too large. Max 10 MB.' } })
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => console.log(`🚀 Backend running on http://localhost:${PORT}`))
