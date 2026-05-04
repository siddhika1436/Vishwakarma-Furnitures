const express  = require('express')
const router   = express.Router()
const path     = require('path')
const fs       = require('fs')
const { v4: uuidv4 } = require('uuid')
const db       = require('../config/db')
const { authenticate, requireAdmin } = require('../middleware/auth')

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads')

// Helper: extract filename from a serve URL like /api/images/file/<name>
function filenameFromUrl(url) {
  if (!url) return null
  const match = url.match(/\/api\/images\/file\/([^/?#]+)/)
  return match ? match[1] : null
}

// Helper: delete the disk file for a product's current image (if local upload)
function deleteLocalFile(imageUrl) {
  const fname = filenameFromUrl(imageUrl)
  if (!fname) return
  const fpath = path.join(UPLOADS_DIR, path.basename(fname))
  if (fs.existsSync(fpath)) {
    try { fs.unlinkSync(fpath) } catch (e) { /* ignore */ }
  }
}

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { category, sortBy, limit, in_stock } = req.query
    // Exclude image_base64 from list responses — too large per row
    let sql = `SELECT id, name, description, price, category,
                      image_url, image_mime, stock, created_at, updated_at
               FROM products WHERE 1=1`
    const params = []
    if (category && category !== 'All') { sql += ' AND category = ?'; params.push(category) }
    if (in_stock === 'true') { sql += ' AND stock > 0' }
    const ORDER_MAP = { newest: 'created_at DESC', price_asc: 'price ASC', price_desc: 'price DESC' }
    sql += ` ORDER BY ${ORDER_MAP[sortBy] || 'created_at DESC'}`
    if (limit) { sql += ' LIMIT ?'; params.push(parseInt(limit)) }
    const [rows] = await db.query(sql, params)
    return res.json({ data: rows, error: null })
  } catch (err) {
    console.error('GET /products error:', err)
    return res.status(500).json({ data: null, error: { message: 'Failed to fetch products' } })
  }
})

// GET /api/products/count
router.get('/count', async (req, res) => {
  try {
    const [[row]] = await db.query('SELECT COUNT(*) AS count FROM products')
    return res.json({ count: row.count, error: null })
  } catch (err) {
    return res.status(500).json({ count: 0, error: { message: 'Failed to count products' } })
  }
})

// GET /api/products/:id  — includes image_base64 for single product view
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id])
    if (rows.length === 0) {
      return res.status(404).json({ data: null, error: { message: 'Product not found' } })
    }
    const row = rows[0]
    // MySQL may return LONGTEXT as Buffer in some drivers
    if (row.image_base64 && Buffer.isBuffer(row.image_base64)) {
      row.image_base64 = row.image_base64.toString('utf8')
    }
    return res.json({ data: row, error: null })
  } catch (err) {
    console.error('GET /products/:id error:', err)
    return res.status(500).json({ data: null, error: { message: 'Failed to fetch product' } })
  }
})

// POST /api/products  (admin only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, description, price, category,
            image_url, image_base64, image_mime, stock } = req.body
    if (!name || price === undefined || stock === undefined) {
      return res.status(400).json({ data: null, error: { message: 'Name, price and stock are required' } })
    }
    const id = uuidv4()
    await db.query(
      `INSERT INTO products
         (id, name, description, price, category, image_url, image_mime, image_base64, stock)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, description || null, Number(price), category || null,
       image_url || null, image_mime || null, image_base64 || null, Number(stock)]
    )
    const [rows] = await db.query(
      `SELECT id, name, description, price, category, image_url, image_mime, stock, created_at, updated_at
       FROM products WHERE id = ?`, [id])
    return res.status(201).json({ data: rows[0], error: null })
  } catch (err) {
    console.error('POST /products error:', err)
    return res.status(500).json({ data: null, error: { message: 'Failed to create product' } })
  }
})

// PATCH /api/products/:id  (admin only)
router.patch('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, description, price, category,
            image_url, image_base64, image_mime, stock } = req.body
    const [existing] = await db.query('SELECT id, image_url FROM products WHERE id = ?', [req.params.id])
    if (existing.length === 0) {
      return res.status(404).json({ data: null, error: { message: 'Product not found' } })
    }
    // Delete old local file if image is being replaced
    const oldUrl = existing[0].image_url
    const isReplacingImage = image_url !== undefined || image_base64 !== undefined
    if (isReplacingImage && oldUrl && oldUrl !== image_url) {
      deleteLocalFile(oldUrl)
    }
    // Build dynamic SET clause
    const setClauses = ['name = ?', 'description = ?', 'price = ?', 'category = ?', 'stock = ?']
    const vals = [name, description || null, Number(price), category || null, Number(stock)]
    if (image_url !== undefined)    { setClauses.push('image_url = ?');    vals.push(image_url    || null) }
    if (image_mime !== undefined)   { setClauses.push('image_mime = ?');   vals.push(image_mime   || null) }
    if (image_base64 !== undefined) { setClauses.push('image_base64 = ?'); vals.push(image_base64 || null) }
    vals.push(req.params.id)
    await db.query(`UPDATE products SET ${setClauses.join(', ')} WHERE id = ?`, vals)
    const [rows] = await db.query(
      `SELECT id, name, description, price, category, image_url, image_mime, stock, created_at, updated_at
       FROM products WHERE id = ?`, [req.params.id])
    return res.json({ data: rows[0], error: null })
  } catch (err) {
    console.error('PATCH /products/:id error:', err)
    return res.status(500).json({ data: null, error: { message: 'Failed to update product' } })
  }
})

// DELETE /api/products/:id  (admin only) — also removes local image file
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const [existing] = await db.query('SELECT id, image_url FROM products WHERE id = ?', [req.params.id])
    if (existing.length === 0) {
      return res.status(404).json({ data: null, error: { message: 'Product not found' } })
    }
    deleteLocalFile(existing[0].image_url)
    await db.query('DELETE FROM products WHERE id = ?', [req.params.id])
    return res.json({ data: null, error: null })
  } catch (err) {
    console.error('DELETE /products/:id error:', err)
    return res.status(500).json({ data: null, error: { message: 'Failed to delete product' } })
  }
})

module.exports = router
