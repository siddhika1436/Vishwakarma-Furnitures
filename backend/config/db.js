const mysql = require('mysql2/promise')
require('dotenv').config()

// Build SSL config for TiDB Cloud
// DB_SSL_CA = full PEM text of the TiDB CA certificate (set in Render env vars)
// If not set (local dev without TiDB), SSL is disabled
let sslConfig = false

if (process.env.DB_SSL_CA) {
  sslConfig = {
    ca: process.env.DB_SSL_CA,
    rejectUnauthorized: true,
  }
} else if (process.env.NODE_ENV === 'production') {
  // Production without CA cert: still enforce SSL but skip cert verification
  // (fallback — ideally always set DB_SSL_CA in production)
  sslConfig = {
    rejectUnauthorized: false,
  }
}

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               parseInt(process.env.DB_PORT) || 4000,
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'vishwakarma_furnitures',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  charset:            'utf8mb4',
  ssl:                sslConfig,
})

// Test the connection on startup
pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL connected successfully')
    conn.release()
  })
  .catch(err => {
    console.error('❌ MySQL connection failed:', err.message)
    process.exit(1)
  })

module.exports = pool