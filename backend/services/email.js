// services/email.js — Nodemailer wrapper
// Handles: OTP verification, OTP password reset, order confirmation

const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE === 'true',  // true when port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  }
})

const FROM = `"Vishwakarma Furnitures" <${process.env.SMTP_USER}>`

// ── Shared branded wrapper ───────────────────────────────────
function brandedEmail(innerHtml) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#fdf8f0;border-radius:14px;overflow:hidden;border:1px solid #e8dcc8;">
    <div style="background:#3a2a1e;padding:24px 32px;">
      <h1 style="color:#c8852a;margin:0;font-size:22px;font-family:Georgia,serif;">Vishwakarma Furnitures</h1>
      <p style="color:#b89a7a;margin:4px 0 0;font-size:12px;">Faizpur, Maharashtra</p>
    </div>
    <div style="padding:32px;">${innerHtml}</div>
    <div style="background:#3a2a1e;padding:16px 32px;text-align:center;">
      <p style="color:#888;font-size:11px;margin:0;">© Vishwakarma Furnitures · +91 84215 12605</p>
    </div>
  </div>`
}

// ── OTP for email verification ───────────────────────────────
async function sendOTPEmail(toEmail, otp) {
  await transporter.sendMail({
    from: FROM,
    to:      toEmail,
    subject: 'Your Verification Code — Vishwakarma Furnitures',
    html: brandedEmail(`
      <h2 style="color:#3a2a1e;font-family:Georgia,serif;margin-top:0;">Verify Your Email</h2>
      <p style="color:#7a5c3a;">Use the OTP below to verify your email address. It expires in <strong>10 minutes</strong>.</p>
      <div style="background:#fff;border:2px solid #c8852a;border-radius:12px;padding:28px;text-align:center;margin:24px 0;">
        <span style="font-size:46px;font-weight:700;letter-spacing:14px;color:#c8852a;font-family:monospace;">${otp}</span>
      </div>
      <p style="color:#9a7a5a;font-size:13px;">If you did not create an account, please ignore this email.</p>
    `),
  })
}

// ── OTP for password reset ───────────────────────────────────
async function sendPasswordResetOTPEmail(toEmail, otp) {
  await transporter.sendMail({
    from: FROM,
    to:      toEmail,
    subject: 'Password Reset OTP — Vishwakarma Furnitures',
    html: brandedEmail(`
      <h2 style="color:#3a2a1e;font-family:Georgia,serif;margin-top:0;">Reset Your Password</h2>
      <p style="color:#7a5c3a;">We received a request to reset your password. Use the OTP below. It expires in <strong>10 minutes</strong>.</p>
      <div style="background:#fff;border:2px solid #c8852a;border-radius:12px;padding:28px;text-align:center;margin:24px 0;">
        <span style="font-size:46px;font-weight:700;letter-spacing:14px;color:#c8852a;font-family:monospace;">${otp}</span>
      </div>
      <p style="color:#7a5c3a;font-size:13px;background:#fff8f0;padding:12px;border-radius:8px;border-left:4px solid #c8852a;">
        ⚠️ If you did not request a password reset, please ignore this email. Your account is safe.
      </p>
    `),
  })
}

// ── Order confirmation ───────────────────────────────────────
async function sendOrderConfirmationEmail(toEmail, order, items = []) {
  const itemRows = items.map(i => `
    <tr>
      <td style="padding:10px 8px;border-bottom:1px solid #f0e8d8;color:#3a2a1e;">${i.product_name || i.name || 'Product'}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f0e8d8;text-align:center;color:#7a5c3a;">${i.quantity}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f0e8d8;text-align:right;font-weight:600;color:#3a2a1e;">
        ₹${(Number(i.price) * Number(i.quantity)).toLocaleString('en-IN')}
      </td>
    </tr>`).join('')

  const deliveryRow = parseFloat(order.delivery_charge) > 0
    ? `<tr><td style="color:#777;padding:6px 8px;">Delivery Charge</td><td></td><td style="text-align:right;padding:6px 8px;">₹${parseFloat(order.delivery_charge).toLocaleString('en-IN')}</td></tr>`
    : `<tr><td style="color:#2d7a4f;padding:6px 8px;">Delivery</td><td></td><td style="text-align:right;padding:6px 8px;color:#2d7a4f;font-weight:600;">FREE 🎉</td></tr>`

  const advanceRow = parseFloat(order.advance_paid) > 0 ? `
    <tr><td colspan="3" style="padding:4px 8px;"></td></tr>
    <tr><td style="color:#2d7a4f;padding:6px 8px;font-weight:600;">Advance Paid</td><td></td><td style="text-align:right;padding:6px 8px;color:#2d7a4f;font-weight:600;">₹${parseFloat(order.advance_paid).toLocaleString('en-IN')}</td></tr>
    <tr><td style="color:#c0392b;padding:6px 8px;font-weight:600;">Remaining Balance</td><td></td><td style="text-align:right;padding:6px 8px;color:#c0392b;font-weight:700;">₹${parseFloat(order.remaining_balance).toLocaleString('en-IN')}</td></tr>
  ` : ''

  await transporter.sendMail({
    from: FROM,
    to:      toEmail,
    subject: `Order Confirmed #${order.id.slice(0,8).toUpperCase()} — Vishwakarma Furnitures`,
    html: brandedEmail(`
      <h2 style="color:#3a2a1e;font-family:Georgia,serif;margin-top:0;">Order Confirmed! 🎉</h2>
      <p style="color:#7a5c3a;">Thank you <strong>${order.shipping_name || ''}</strong>. Your order has been placed successfully.</p>
      <p style="color:#7a5c3a;font-size:13px;">Order ID: <span style="font-family:monospace;background:#f0e8d8;padding:2px 8px;border-radius:4px;">#${order.id.slice(0,8).toUpperCase()}</span></p>

      <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;margin:16px 0;">
        <thead>
          <tr style="background:#3a2a1e;color:#fff;">
            <th style="padding:10px 8px;text-align:left;font-size:12px;">Item</th>
            <th style="padding:10px 8px;text-align:center;font-size:12px;">Qty</th>
            <th style="padding:10px 8px;text-align:right;font-size:12px;">Amount</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
        <tfoot>
          ${deliveryRow}
          <tr>
            <td colspan="3" style="height:1px;background:#e8dcc8;padding:0;"></td>
          </tr>
          <tr>
            <td style="padding:10px 8px;font-weight:700;font-size:15px;color:#3a2a1e;">TOTAL</td>
            <td></td>
            <td style="text-align:right;padding:10px 8px;font-weight:700;font-size:15px;color:#c8852a;">₹${parseFloat(order.total_amount).toLocaleString('en-IN')}</td>
          </tr>
          ${advanceRow}
        </tfoot>
      </table>

      <div style="background:#fff;border-radius:8px;padding:14px;margin-top:8px;border:1px solid #e8dcc8;">
        <p style="margin:0 0 6px;color:#7a5c3a;font-size:13px;"><strong>Shipping to:</strong> ${order.shipping_name || ''}</p>
        <p style="margin:0 0 6px;color:#7a5c3a;font-size:13px;">${order.shipping_address || ''}</p>
        <p style="margin:0;color:#7a5c3a;font-size:13px;"><strong>Payment:</strong> ${order.payment_method === 'cod' ? 'Cash on Delivery' : '✅ Paid Online'}</p>
      </div>
    `),
  })
}

module.exports = {
  sendOTPEmail,
  sendPasswordResetOTPEmail,
  sendOrderConfirmationEmail,
}
