const mysql = require('mysql2/promise')
require('dotenv').config()

// TiDB Cloud requires SSL in production.
// Set DB_SSL_CA env var to the full contents of the TiDB CA certificate.
// In local development (without DB_SSL_CA set), SSL is skipped.
const sslConfig = process.env.DB_SSL_CA
  ? { ca: process.env.DB_SSL_CA, rejectUnauthorized: true }
  : undefined

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