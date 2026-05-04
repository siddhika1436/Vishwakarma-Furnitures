// routes/payment.js — Razorpay with full partial payment support
const express = require('express')
const router  = express.Router()
const db      = require('../config/db')
const { authenticate } = require('../middleware/auth')
const { createRazorpayOrder, verifyRazorpayPayment } = require('../services/payment')
const { sendOrderConfirmationEmail } = require('../services/email')

// ── POST /api/payment/razorpay/create-order ──────────────────
// Creates Razorpay order for the advance amount (first payment)
router.post('/razorpay/create-order', authenticate, async (req, res) => {
  try {
    const { order_id } = req.body
    if (!order_id)
      return res.status(400).json({ error: { message: 'order_id is required' } })

    const [rows] = await db.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [order_id, req.user.id]
    )
    if (!rows.length)
      return res.status(404).json({ error: { message: 'Order not found' } })

    const order = rows[0]

    // Safety: prevent re-payment on already paid orders
    if (order.payment_status === 'paid')
      return res.status(400).json({ error: { message: 'Order already fully paid' } })

    // Charge advance_paid amount (or full total if no advance set)
    const chargeAmount =
      parseFloat(order.advance_paid) > 0
        ? parseFloat(order.advance_paid)
        : parseFloat(order.total_amount)

    const rzOrder = await createRazorpayOrder(chargeAmount, order.id)

    await db.query(
      "UPDATE orders SET razorpay_order_id = ?, payment_method = 'razorpay' WHERE id = ?",
      [rzOrder.id, order.id]
    )

    return res.json({
      data: {
        razorpay_order_id: rzOrder.id,
        amount:            rzOrder.amount,
        currency:          rzOrder.currency,
        key_id:            process.env.RAZORPAY_KEY_ID,
        order_id:          order.id,
        charge_amount:     chargeAmount,
        is_advance:        parseFloat(order.advance_paid) > 0,
        remaining_balance: parseFloat(order.remaining_balance),
        prefill: {
          name:    order.shipping_name  || '',
          contact: order.shipping_phone || '',
          email:   req.user.email,
        },
      },
      error: null,
    })
  } catch (err) {
    console.error('Razorpay create-order error:', err)
    return res.status(500).json({ error: { message: 'Failed to create Razorpay order' } })
  }
})

// ── POST /api/payment/razorpay/verify ───────────────────────
// Verifies advance payment → sets payment_status = 'partial' (or 'paid' if full)
router.post('/razorpay/verify', authenticate, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_id,
    } = req.body

    // ── Signature check
    const isValid = verifyRazorpayPayment({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    })
    if (!isValid)
      return res.status(400).json({
        error: { message: 'Payment verification failed. Signature mismatch.' },
      })

    // ── Fetch order
    const [orderRows] = await db.query('SELECT * FROM orders WHERE id = ?', [order_id])
    if (!orderRows.length)
      return res.status(404).json({ error: { message: 'Order not found' } })

    const order = orderRows[0]

    // ── Safety: prevent duplicate success calls
    if (order.payment_status === 'paid') {
      return res.json({
        data: { message: 'Order already fully paid', payment_status: 'paid' },
        error: null,
      })
    }

    // ── Determine new payment_status
    const advancePaid   = parseFloat(order.advance_paid)   || 0
    const totalAmount   = parseFloat(order.total_amount)   || 0
    const remaining     = parseFloat(order.remaining_balance) || 0

    // If advance_paid < total_amount → partial; otherwise paid
    const newPaymentStatus = (advancePaid > 0 && remaining > 0.01)
      ? 'partial'
      : 'paid'

    await db.query(
      `UPDATE orders
         SET payment_status = ?,
             payment_id     = ?,
             status         = 'confirmed'
       WHERE id = ?`,
      [newPaymentStatus, razorpay_payment_id, order_id]
    )

    // ── Send confirmation email
    try {
      const [itemRows] = await db.query(
        `SELECT oi.*, COALESCE(oi.product_name, p.name, 'Product') AS product_name
           FROM order_items oi
           LEFT JOIN products p ON p.id = oi.product_id
          WHERE oi.order_id = ?`,
        [order_id]
      )
      const [updatedOrder] = await db.query('SELECT * FROM orders WHERE id = ?', [order_id])
      if (updatedOrder[0]) {
        await sendOrderConfirmationEmail(req.user.email, updatedOrder[0], itemRows)
      }
    } catch (e) {
      console.error('Confirm email failed:', e.message)
    }

    return res.json({
      data: {
        message:
          newPaymentStatus === 'partial'
            ? `Advance of ₹${advancePaid} received. Remaining ₹${remaining} due on delivery.`
            : 'Payment complete. Order confirmed!',
        payment_status:    newPaymentStatus,
        advance_paid:      advancePaid,
        remaining_balance: remaining,
      },
      error: null,
    })
  } catch (err) {
    console.error('Razorpay verify error:', err)
    return res.status(500).json({ error: { message: 'Payment verification error' } })
  }
})

// ── POST /api/payment/pay-remaining/:orderId ─────────────────
// NEW: Creates Razorpay order for the remaining balance
router.post('/pay-remaining/:orderId', authenticate, async (req, res) => {
  try {
    const { orderId } = req.params

    const [rows] = await db.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [orderId, req.user.id]
    )
    if (!rows.length)
      return res.status(404).json({ error: { message: 'Order not found' } })

    const order = rows[0]

    // Safety checks
    if (order.payment_status === 'paid')
      return res.status(400).json({ error: { message: 'Order is already fully paid' } })

    if (order.payment_status !== 'partial')
      return res.status(400).json({
        error: { message: 'No advance payment found. Use the standard payment flow.' },
      })

    const remainingAmount = parseFloat(order.remaining_balance)
    if (remainingAmount <= 0)
      return res.status(400).json({ error: { message: 'No remaining balance to pay' } })

    // Create Razorpay order for remaining amount
    const rzOrder = await createRazorpayOrder(remainingAmount, `${orderId}-rem`)

    // Store this new Razorpay order id temporarily
    await db.query(
      "UPDATE orders SET razorpay_order_id = ? WHERE id = ?",
      [rzOrder.id, orderId]
    )

    return res.json({
      data: {
        razorpay_order_id: rzOrder.id,
        amount:            rzOrder.amount,
        currency:          rzOrder.currency,
        key_id:            process.env.RAZORPAY_KEY_ID,
        order_id:          orderId,
        charge_amount:     remainingAmount,
        prefill: {
          name:    order.shipping_name  || '',
          contact: order.shipping_phone || '',
          email:   req.user.email,
        },
      },
      error: null,
    })
  } catch (err) {
    console.error('pay-remaining error:', err)
    return res.status(500).json({ error: { message: 'Failed to create remaining payment order' } })
  }
})

// ── POST /api/payment/pay-remaining/:orderId/verify ──────────
// NEW: Verifies remaining payment → sets payment_status = 'paid'
router.post('/pay-remaining/:orderId/verify', authenticate, async (req, res) => {
  try {
    const { orderId } = req.params
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

    const isValid = verifyRazorpayPayment({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    })
    if (!isValid)
      return res.status(400).json({
        error: { message: 'Remaining payment verification failed. Signature mismatch.' },
      })

    const [rows] = await db.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [orderId, req.user.id]
    )
    if (!rows.length)
      return res.status(404).json({ error: { message: 'Order not found' } })

    const order = rows[0]

    // Safety: prevent double payment
    if (order.payment_status === 'paid') {
      return res.json({
        data: { message: 'Order already fully paid', payment_status: 'paid' },
        error: null,
      })
    }

    const totalAmount   = parseFloat(order.total_amount)
    const advancePaid   = parseFloat(order.advance_paid)

    // Mark as fully paid, zero out remaining balance
    await db.query(
      `UPDATE orders
         SET payment_status    = 'paid',
             payment_id        = ?,
             remaining_balance = 0,
             advance_paid      = ?
       WHERE id = ?`,
      [razorpay_payment_id, totalAmount, orderId]
    )

    return res.json({
      data: {
        message:        'Remaining payment received. Order fully paid!',
        payment_status: 'paid',
      },
      error: null,
    })
  } catch (err) {
    console.error('pay-remaining verify error:', err)
    return res.status(500).json({ error: { message: 'Remaining payment verification error' } })
  }
})

// ── POST /api/payment/razorpay/webhook ──────────────────────
router.post(
  '/razorpay/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    try {
      const crypto    = require('crypto')
      const body      = req.body
      const signature = req.headers['x-razorpay-signature']
      const secret    = process.env.RAZORPAY_WEBHOOK_SECRET

      if (secret && signature) {
        const expected = crypto
          .createHmac('sha256', secret)
          .update(body)
          .digest('hex')
        if (expected !== signature)
          return res.status(400).json({ error: 'Invalid webhook signature' })
      }

      const event = JSON.parse(body.toString())

      if (event.event === 'payment.captured') {
        const payment = event.payload?.payment?.entity
        const receipt = payment?.receipt // "orderId" or "orderId-rem"
        if (receipt) {
          const orderId = receipt.replace(/-rem$/, '')
          const [rows]  = await db.query('SELECT * FROM orders WHERE id = ?', [orderId])
          if (rows.length) {
            const order   = rows[0]
            const isRem   = receipt.endsWith('-rem')
            const newStatus = isRem ? 'paid' : (
              parseFloat(order.remaining_balance) > 0.01 ? 'partial' : 'paid'
            )
            await db.query(
              `UPDATE orders
                 SET payment_status    = ?,
                     status            = 'confirmed',
                     payment_id        = ?,
                     remaining_balance = ?
               WHERE id = ?`,
              [
                newStatus,
                payment.id,
                isRem ? 0 : order.remaining_balance,
                orderId,
              ]
            )
          }
        }
      }

      if (event.event === 'payment.failed') {
        const payment = event.payload?.payment?.entity
        const receipt = payment?.receipt
        if (receipt) {
          const orderId = receipt.replace(/-rem$/, '')
          await db.query(
            "UPDATE orders SET payment_status = 'failed' WHERE id = ? AND payment_status = 'pending'",
            [orderId]
          )
        }
      }

      return res.json({ received: true })
    } catch (err) {
      console.error('Razorpay webhook error:', err.message)
      return res.status(400).json({ error: err.message })
    }
  }
)

module.exports = router