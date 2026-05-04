// routes/orders.js — Complete orders with pincode delivery, advance payment, invoice
const express  = require('express')
const router   = express.Router()
const { v4: uuidv4 } = require('uuid')
const db       = require('../config/db')
const { authenticate, requireAdmin } = require('../middleware/auth')
const { getDeliveryCharge, getAllPincodes } = require('../services/delivery')
const { sendOrderConfirmationEmail } = require('../services/email')
const { generateInvoicePDF } = require('../services/invoice')

// ── Invoice number generator ─────────────────────────────────
function generateInvoiceNumber() {
  const now  = new Date()
  const year = now.getFullYear().toString().slice(2)
  const mon  = String(now.getMonth() + 1).padStart(2, '0')
  const rand = String(Math.floor(1000 + Math.random() * 9000))
  return `VKF-${year}${mon}-${rand}`
}

// ── GET /api/orders/delivery-charge?pincode=425503 ───────────
router.get('/delivery-charge', async (req, res) => {
  const { pincode } = req.query
  const result = await getDeliveryCharge(pincode)
  return res.json({ data: result, error: null })
})

// ── GET /api/orders/pincodes — Admin: list all pincodes ──────
router.get('/pincodes', authenticate, requireAdmin, async (req, res) => {
  try {
    const pincodes = await getAllPincodes()
    return res.json({ data: pincodes, error: null })
  } catch (err) {
    return res.status(500).json({ data: null, error: { message: 'Failed to fetch pincodes' } })
  }
})

// ── POST /api/orders/pincodes — Admin: add/update pincode ────
router.post('/pincodes', authenticate, requireAdmin, async (req, res) => {
  try {
    const { pincode, area_city, delivery_charge } = req.body
    if (!pincode || !area_city || delivery_charge === undefined)
      return res.status(400).json({ data: null, error: { message: 'pincode, area_city, and delivery_charge are required' } })

    await db.query(
      `INSERT INTO pincode_delivery_charges (pincode, area_city, delivery_charge)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE area_city = VALUES(area_city), delivery_charge = VALUES(delivery_charge)`,
      [String(pincode).trim(), area_city.trim(), parseFloat(delivery_charge)]
    )
    return res.json({ data: { message: 'Pincode saved.' }, error: null })
  } catch (err) {
    console.error('Pincode upsert error:', err)
    return res.status(500).json({ data: null, error: { message: 'Failed to save pincode' } })
  }
})

// ── DELETE /api/orders/pincodes/:pincode — Admin ─────────────
router.delete('/pincodes/:pincode', authenticate, requireAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM pincode_delivery_charges WHERE pincode = ?', [req.params.pincode])
    return res.json({ data: { message: 'Pincode deleted.' }, error: null })
  } catch (err) {
    return res.status(500).json({ data: null, error: { message: 'Failed to delete pincode' } })
  }
})

// ── GET /api/orders ──────────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''
    const isAdmin     = req.user.email === ADMIN_EMAIL
    const { status, date_from, date_to, customer, payment_status, limit } = req.query

    let sql    = 'SELECT o.*, u.email AS user_email, u.full_name AS user_full_name FROM orders o LEFT JOIN users u ON u.id = o.user_id WHERE 1=1'
    const params = []

    if (!isAdmin)        { sql += ' AND o.user_id = ?';         params.push(req.user.id) }
    if (status)          { sql += ' AND o.status = ?';          params.push(status) }
    if (payment_status)  { sql += ' AND o.payment_status = ?';  params.push(payment_status) }
    if (date_from)       { sql += ' AND DATE(o.created_at) >= ?'; params.push(date_from) }
    if (date_to)         { sql += ' AND DATE(o.created_at) <= ?'; params.push(date_to) }
    if (customer && isAdmin) {
      sql += ' AND (u.full_name LIKE ? OR u.email LIKE ?)'
      params.push(`%${customer}%`, `%${customer}%`)
    }
    sql += ' ORDER BY o.created_at DESC'
    if (limit) { sql += ' LIMIT ?'; params.push(parseInt(limit)) }

    const [orders] = await db.query(sql, params)
    if (!orders.length) return res.json({ data: [], error: null })

    const orderIds    = orders.map(o => o.id)
    const ph          = orderIds.map(() => '?').join(',')
    const [items]     = await db.query(
      `SELECT oi.id, oi.order_id, oi.product_id, oi.product_name, oi.quantity, oi.price,
              p.name AS p_name, p.image_url AS product_image_url
       FROM order_items oi LEFT JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id IN (${ph})`,
      orderIds
    )

    const itemsByOrder = {}
    for (const item of items) {
      if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = []
      itemsByOrder[item.order_id].push({
        ...item,
        product_name: item.product_name || item.p_name || 'Product',
        products: { name: item.product_name || item.p_name || 'Product', image_url: item.product_image_url }
      })
    }

    const result = orders.map(o => ({ ...o, order_items: itemsByOrder[o.id] || [] }))
    return res.json({ data: result, error: null })
  } catch (err) {
    console.error('GET /orders:', err)
    return res.status(500).json({ data: null, error: { message: 'Failed to fetch orders' } })
  }
})

// ── POST /api/orders ─────────────────────────────────────────
router.post('/', authenticate, async (req, res) => {
  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()

    const {
      shipping_name, shipping_phone, shipping_address, shipping_pincode,
      notes, items, payment_method = 'cod', advance_amount = 0,
    } = req.body

    if (!items || !items.length) {
      await conn.rollback(); conn.release()
      return res.status(400).json({ data: null, error: { message: 'Order must have at least one item' } })
    }
    if (!shipping_pincode) {
      await conn.rollback(); conn.release()
      return res.status(400).json({ data: null, error: { message: 'Pincode is required for delivery charge calculation' } })
    }

    // Delivery charge from pincode
    const delivery       = await getDeliveryCharge(shipping_pincode)
    const delivery_charge = delivery.delivery_charge

    // Calculate subtotal
    const subtotal_amount = items.reduce((sum, i) => sum + (Number(i.price) * Number(i.quantity)), 0)
    const total_amount    = subtotal_amount + delivery_charge

    // Advance paid — only for razorpay, else 0
    const advance_paid      = payment_method === 'razorpay' ? Math.min(Number(advance_amount) || 0, total_amount) : 0
    const remaining_balance = total_amount - advance_paid

    const orderId        = uuidv4()
    const invoice_number = generateInvoiceNumber()
    const payment_status = 'pending'

    await conn.query(
      `INSERT INTO orders
         (id, user_id, subtotal_amount, delivery_charge, total_amount,
          advance_paid, remaining_balance,
          status, shipping_name, shipping_phone, shipping_address, shipping_pincode,
          notes, payment_method, payment_status, invoice_number)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderId, req.user.id, subtotal_amount, delivery_charge, total_amount,
       advance_paid, remaining_balance,
       shipping_name || null, shipping_phone || null,
       shipping_address || null, shipping_pincode,
       notes || null, payment_method, payment_status, invoice_number]
    )

    for (const item of items) {
      await conn.query(
        'INSERT INTO order_items (id, order_id, product_id, product_name, quantity, price) VALUES (?, ?, ?, ?, ?, ?)',
        [uuidv4(), orderId, item.product_id || null,
         item.name || item.product_name || null,
         Number(item.quantity), Number(item.price)]
      )
    }

    await conn.commit()
    conn.release()

    const [rows] = await db.query('SELECT * FROM orders WHERE id = ?', [orderId])
    const order  = rows[0]

    // Send confirmation email for COD immediately
    if (payment_method === 'cod') {
      try {
        await sendOrderConfirmationEmail(req.user.email, order, items)
      } catch (e) { console.error('COD confirm email failed:', e.message) }
    }

    return res.status(201).json({
      data: { ...order, delivery_info: delivery },
      error: null,
    })
  } catch (err) {
    await conn.rollback(); conn.release()
    console.error('POST /orders:', err)
    return res.status(500).json({ data: null, error: { message: 'Failed to create order' } })
  }
})

// ── PATCH /api/orders/:id/status (admin) ─────────────────────
router.patch('/:id/status', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body
    const VALID = ['pending','confirmed','processing','shipped','delivered','cancelled']
    if (!VALID.includes(status))
      return res.status(400).json({ data: null, error: { message: 'Invalid status value' } })

    const [existing] = await db.query('SELECT id FROM orders WHERE id = ?', [req.params.id])
    if (!existing.length)
      return res.status(404).json({ data: null, error: { message: 'Order not found' } })

    await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id])
    const [rows] = await db.query('SELECT * FROM orders WHERE id = ?', [req.params.id])
    return res.json({ data: rows[0], error: null })
  } catch (err) {
    console.error('PATCH /orders/:id/status:', err)
    return res.status(500).json({ data: null, error: { message: 'Failed to update status' } })
  }
})

// ── GET /api/orders/:id/invoice — Download PDF invoice ───────
router.get('/:id/invoice', authenticate, async (req, res) => {
  try {
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''
    const isAdmin     = req.user.email === ADMIN_EMAIL

    const [rows] = await db.query('SELECT * FROM orders WHERE id = ?', [req.params.id])
    if (!rows.length)
      return res.status(404).json({ error: 'Order not found' })

    const order = rows[0]
    if (!isAdmin && order.user_id !== req.user.id)
      return res.status(403).json({ error: 'Access denied' })

    const [items] = await db.query(
      `SELECT oi.*, COALESCE(oi.product_name, p.name, 'Product') AS product_name
       FROM order_items oi LEFT JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = ?`,
      [order.id]
    )

    const pdfBuffer = await generateInvoicePDF(order, items, req.user.email)
    const filename  = `Invoice-${order.invoice_number || order.id.slice(0,8)}.pdf`

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Length', pdfBuffer.length)
    return res.send(pdfBuffer)
  } catch (err) {
    console.error('Invoice generation error:', err)
    return res.status(500).json({ error: 'Failed to generate invoice' })
  }
})

module.exports = router
