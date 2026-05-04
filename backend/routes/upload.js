const express = require('express')
const router  = express.Router()
const multer  = require('multer')
const sharp   = require('sharp')
const path    = require('path')
const fs      = require('fs')
const { v4: uuidv4 } = require('uuid')
const db      = require('../config/db')
const { authenticate, requireAdmin } = require('../middleware/auth')

// ─── Uploads directory ───────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads')
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true })

// ─── Multer: store original file to disk (temp) ──────────────
// We keep the original on disk AND store compressed base64 in MySQL
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename:    (_req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase() || '.jpg'
    const name = `${uuidv4()}${ext}`
    cb(null, name)
  },
})

const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only JPEG, PNG, WebP and GIF images are allowed'))
    }
  },
})

// ─────────────────────────────────────────────────────────────
// POST /api/upload
// Admin only. Accepts a single image file (field name: "image").
// 1. Saves original to backend/uploads/<uuid>.ext
// 2. Resizes/compresses with sharp → JPEG ≤ 800px wide, quality 82
// 3. Converts compressed buffer to base64
// 4. Stores filename, base64, mime in DB against the product
// 5. Returns { filename, image_url (serve path), image_base64, image_mime }
//
// Query param: ?product_id=<uuid>  — attach to existing product immediately
// If no product_id, just returns the upload result; caller stores it on save.
// ─────────────────────────────────────────────────────────────
router.post('/', authenticate, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ data: null, error: { message: 'No image file provided' } })
    }

    const originalPath = req.file.path          // full path on disk
    const filename     = req.file.filename       // uuid.ext
    const originalMime = req.file.mimetype

    // ── Compress & resize with sharp ──
    // Output: JPEG, max 800px wide, quality 82 — keeps file small for base64
    let compressedBuffer
    try {
      compressedBuffer = await sharp(originalPath)
        .resize({ width: 800, withoutEnlargement: true })
        .jpeg({ quality: 82, progressive: true })
        .toBuffer()
    } catch (sharpErr) {
      // If sharp fails (e.g. GIF), fall back to raw file buffer
      console.warn('sharp compression failed, using raw buffer:', sharpErr.message)
      compressedBuffer = fs.readFileSync(originalPath)
    }

    const mime        = 'image/jpeg'             // always JPEG after sharp
    const base64      = compressedBuffer.toString('base64')
    const dataUri     = `data:${mime};base64,${base64}`
    // Serve URL — frontend uses this to display image via the GET /api/images/:filename route
    const serveUrl    = `/api/images/file/${filename}`

    // ── Optionally attach to a product immediately ──
    const { product_id } = req.query
    if (product_id) {
      await db.query(
        `UPDATE products
         SET image_url = ?, image_mime = ?, image_base64 = ?
         WHERE id = ?`,
        [serveUrl, mime, base64, product_id]
      )
    }

    return res.status(201).json({
      data: {
        filename,
        image_url:    serveUrl,      // relative URL to display/serve image
        image_base64: base64,        // raw base64 (no data: prefix)
        image_mime:   mime,
        data_uri:     dataUri,       // ready-to-use src="data:..." string
        size_bytes:   compressedBuffer.length,
      },
      error: null
    })
  } catch (err) {
    console.error('POST /upload error:', err)
    // Clean up temp file if it exists
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path)
    }
    return res.status(500).json({ data: null, error: { message: err.message || 'Upload failed' } })
  }
})

// ─────────────────────────────────────────────────────────────
// GET /api/images/file/:filename
// Serves the original uploaded file from disk.
// Used as image_url for products that have a local upload.
// ─────────────────────────────────────────────────────────────
router.get('/file/:filename', (req, res) => {
  // Sanitize filename — no path traversal
  const safeName = path.basename(req.params.filename)
  const filePath = path.join(UPLOADS_DIR, safeName)

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Image not found' })
  }

  // Detect mime from extension
  const ext  = path.extname(safeName).toLowerCase()
  const mime = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
                 '.webp': 'image/webp', '.gif': 'image/gif' }[ext] || 'image/jpeg'

  res.setHeader('Content-Type', mime)
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable') // 1 year cache
  res.sendFile(filePath)
})

// ─────────────────────────────────────────────────────────────
// GET /api/images/base64/:productId
// Returns the stored base64 image for a product as a data URI.
// Useful for displaying images directly without a file server.
// ─────────────────────────────────────────────────────────────
router.get('/base64/:productId', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT image_base64, image_mime FROM products WHERE id = ?',
      [req.params.productId]
    )
    if (!rows.length || !rows[0].image_base64) {
      return res.status(404).json({ error: 'No image stored for this product' })
    }
    const { image_base64, image_mime } = rows[0]
    const mime = image_mime || 'image/jpeg'
    res.setHeader('Content-Type', mime)
    res.setHeader('Cache-Control', 'public, max-age=86400')
    // Send as actual image binary (decode base64 → buffer)
    const buf = Buffer.from(image_base64, 'base64')
    res.send(buf)
  } catch (err) {
    console.error('GET /images/base64/:productId error:', err)
    res.status(500).json({ error: 'Failed to retrieve image' })
  }
})

// ─────────────────────────────────────────────────────────────
// DELETE /api/images/file/:filename  (admin only)
// Removes the file from disk. Called when a product is deleted
// or its image is replaced.
// ─────────────────────────────────────────────────────────────
router.delete('/file/:filename', authenticate, requireAdmin, (req, res) => {
  try {
    const safeName = path.basename(req.params.filename)
    const filePath = path.join(UPLOADS_DIR, safeName)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
    return res.json({ data: null, error: null })
  } catch (err) {
    console.error('DELETE /images/file/:filename error:', err)
    return res.status(500).json({ error: 'Failed to delete image file' })
  }
})

module.exports = router
