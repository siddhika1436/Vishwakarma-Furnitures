// services/payment.js — Razorpay payment service
const Razorpay = require('razorpay')
const crypto   = require('crypto')

let razorpay = null
function getRazorpay() {
  if (!razorpay) {
    razorpay = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  }
  return razorpay
}

async function createRazorpayOrder(amountInRupees, receiptId) {
  const rz = getRazorpay()
  return await rz.orders.create({
    amount:   Math.round(amountInRupees * 100), // paise
    currency: 'INR',
    receipt:  receiptId.slice(0, 40),
  })
}

function verifyRazorpayPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  const body     = `${razorpay_order_id}|${razorpay_payment_id}`
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex')
  return expected === razorpay_signature
}

module.exports = { createRazorpayOrder, verifyRazorpayPayment }
