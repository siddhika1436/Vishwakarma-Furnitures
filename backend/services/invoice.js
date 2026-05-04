// services/invoice.js — PDF Invoice Generation
// Uses pdfkit to generate professional invoices.

const PDFDocument = require('pdfkit')

const COMPANY = {
  name:    'Vishwakarma Furnitures',
  address: 'Faizpur, Jalgaon District, Maharashtra - 425503',
  phone:   '+91 84215 12605',
  email:   process.env.SMTP_USER || 'vishwakarma@example.com',
  gst:     'GST: 27XXXXX0000X1ZX',  // update with real GST
}

const BRAND_COLOR  = '#c8852a'
const DARK_COLOR   = '#3a2a1e'
const LIGHT_BG     = '#fdf8f0'

/**
 * generateInvoicePDF(order, items, userEmail)
 * Returns a Buffer containing the PDF bytes.
 *
 * @param {object} order   - Order row from DB
 * @param {array}  items   - Array of order_items with product name
 * @param {string} userEmail
 */
function generateInvoicePDF(order, items, userEmail) {
  return new Promise((resolve, reject) => {
    try {
      const doc    = new PDFDocument({ margin: 50, size: 'A4' })
      const chunks = []

      doc.on('data',  chunk => chunks.push(chunk))
      doc.on('end',   ()    => resolve(Buffer.concat(chunks)))
      doc.on('error', err   => reject(err))

      const pageWidth  = doc.page.width
      const contentW   = pageWidth - 100   // left+right margin = 100
      const col1       = 50
      const col2       = 310

      // ── Header band ──────────────────────────────────────────
      doc.rect(0, 0, pageWidth, 110).fill(DARK_COLOR)

      doc.fillColor('#ffffff')
         .font('Helvetica-Bold')
         .fontSize(26)
         .text(COMPANY.name, 50, 28)

      doc.fillColor(BRAND_COLOR)
         .font('Helvetica')
         .fontSize(10)
         .text(COMPANY.address, 50, 60)
         .text(`${COMPANY.phone}  •  ${COMPANY.email}`, 50, 75)
         .text(COMPANY.gst, 50, 90)

      // Invoice label — right side of header
      doc.fillColor('#ffffff')
         .font('Helvetica-Bold')
         .fontSize(14)
         .text('TAX INVOICE', pageWidth - 180, 28, { width: 130, align: 'right' })

      doc.fillColor(BRAND_COLOR)
         .font('Helvetica')
         .fontSize(9)
         .text(`Invoice #: ${order.invoice_number || order.id.slice(0,8).toUpperCase()}`, pageWidth - 180, 50, { width: 130, align: 'right' })
         .text(`Date: ${new Date(order.created_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}`, pageWidth - 180, 64, { width: 130, align: 'right' })

      // ── Customer & Order Info ─────────────────────────────────
      doc.moveDown(3)
      const infoY = 130

      // Bill To box
      doc.roundedRect(col1, infoY, 230, 110, 6).fillAndStroke(LIGHT_BG, '#e8dcc8')
      doc.fillColor(BRAND_COLOR).font('Helvetica-Bold').fontSize(9)
         .text('BILL TO', col1 + 12, infoY + 12)
      doc.fillColor(DARK_COLOR).font('Helvetica-Bold').fontSize(11)
         .text(order.shipping_name || 'Customer', col1 + 12, infoY + 27)
      doc.fillColor('#555').font('Helvetica').fontSize(9)
         .text(order.shipping_address || '', col1 + 12, infoY + 43, { width: 206 })
         .text(`PIN: ${order.shipping_pincode || ''}`, col1 + 12, infoY + 75)
         .text(`Ph: ${order.shipping_phone || ''}`, col1 + 12, infoY + 88)

      // Order details box
      doc.roundedRect(col2, infoY, 225, 110, 6).fillAndStroke(LIGHT_BG, '#e8dcc8')
      doc.fillColor(BRAND_COLOR).font('Helvetica-Bold').fontSize(9)
         .text('ORDER DETAILS', col2 + 12, infoY + 12)

      const detRow = (label, val, y) => {
        doc.fillColor('#777').font('Helvetica').fontSize(9).text(label, col2 + 12, y)
        doc.fillColor(DARK_COLOR).font('Helvetica-Bold').fontSize(9).text(val, col2 + 110, y, { width: 115, align: 'right' })
      }
      detRow('Order ID:',  `#${order.id.slice(0,8).toUpperCase()}`, infoY + 27)
      detRow('Date:',      new Date(order.created_at).toLocaleDateString('en-IN'), infoY + 42)
      detRow('Payment:',   order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online (Razorpay)', infoY + 57)
      detRow('Status:',    String(order.status).toUpperCase(), infoY + 72)
      detRow('Email:',     userEmail || '', infoY + 87)

      // ── Items Table Header ────────────────────────────────────
      const tableY = infoY + 128
      doc.rect(col1, tableY, contentW, 24).fill(DARK_COLOR)
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9)
         .text('ITEM',     col1 + 10, tableY + 8)
         .text('QTY',      col1 + 310, tableY + 8, { width: 40,  align: 'center' })
         .text('UNIT',     col1 + 360, tableY + 8, { width: 60,  align: 'right' })
         .text('TOTAL',    col1 + 425, tableY + 8, { width: 70,  align: 'right' })

      // ── Items Rows ────────────────────────────────────────────
      let rowY      = tableY + 24
      let rowEven   = true

      for (const item of items) {
        const rowH    = 28
        const bgColor = rowEven ? '#ffffff' : LIGHT_BG
        doc.rect(col1, rowY, contentW, rowH).fill(bgColor)

        const itemName  = item.product_name || item.name || 'Product'
        const unitPrice = parseFloat(item.price)
        const qty       = parseInt(item.quantity)
        const lineTotal = unitPrice * qty

        doc.fillColor(DARK_COLOR).font('Helvetica').fontSize(9)
           .text(itemName, col1 + 10, rowY + 9, { width: 295, ellipsis: true })

        doc.fillColor('#444').font('Helvetica').fontSize(9)
           .text(String(qty), col1 + 310, rowY + 9, { width: 40, align: 'center' })
           .text(`₹${unitPrice.toLocaleString('en-IN')}`, col1 + 360, rowY + 9, { width: 60, align: 'right' })

        doc.fillColor(DARK_COLOR).font('Helvetica-Bold').fontSize(9)
           .text(`₹${lineTotal.toLocaleString('en-IN')}`, col1 + 425, rowY + 9, { width: 70, align: 'right' })

        rowY  += rowH
        rowEven = !rowEven
      }

      // divider
      doc.moveTo(col1, rowY).lineTo(col1 + contentW, rowY).strokeColor('#e8dcc8').stroke()
      rowY += 10

      // ── Totals ────────────────────────────────────────────────
      const totalX     = col1 + 310
      const totalWidth = contentW - 310

      const totRow = (label, value, bold = false, color = DARK_COLOR) => {
        doc.fillColor('#777').font('Helvetica').fontSize(9).text(label, totalX, rowY, { width: 110 })
        doc.fillColor(color).font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 10 : 9)
           .text(value, totalX + 115, rowY, { width: totalWidth - 115, align: 'right' })
        rowY += 18
      }

      totRow('Subtotal:',           `₹${parseFloat(order.subtotal_amount || order.total_amount).toLocaleString('en-IN')}`)
      totRow('Delivery Charge:',    parseFloat(order.delivery_charge) === 0 ? 'FREE' : `₹${parseFloat(order.delivery_charge).toLocaleString('en-IN')}`)

      rowY += 4
      doc.moveTo(totalX, rowY).lineTo(col1 + contentW, rowY).strokeColor('#c8852a').lineWidth(1).stroke()
      rowY += 8

      totRow('GRAND TOTAL:',         `₹${parseFloat(order.total_amount).toLocaleString('en-IN')}`,        true, BRAND_COLOR)

      if (parseFloat(order.advance_paid) > 0) {
        rowY += 4
        doc.moveTo(totalX, rowY).lineTo(col1 + contentW, rowY).strokeColor('#e8dcc8').lineWidth(0.5).stroke()
        rowY += 6
        totRow('Advance Paid:',       `₹${parseFloat(order.advance_paid).toLocaleString('en-IN')}`,       false, '#2d7a4f')
        totRow('Remaining Balance:',  `₹${parseFloat(order.remaining_balance).toLocaleString('en-IN')}`,  true,  '#c0392b')
      }

      // ── Payment Status Badge ──────────────────────────────────
      rowY += 20
      const badgeColor = order.payment_status === 'paid'
        ? '#2d7a4f' : order.payment_status === 'failed' ? '#c0392b' : '#b8860b'
      doc.roundedRect(col1, rowY, 160, 28, 5).fill(badgeColor)
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(11)
         .text(`Payment: ${String(order.payment_status).toUpperCase()}`, col1 + 10, rowY + 8, { width: 140, align: 'center' })

      if (order.payment_method === 'razorpay' && order.payment_id) {
        doc.fillColor('#777').font('Helvetica').fontSize(8)
           .text(`Txn ID: ${order.payment_id}`, col1, rowY + 35, { width: 300 })
        rowY += 15
      }

      // ── Notes ─────────────────────────────────────────────────
      if (order.notes) {
        rowY += 40
        doc.fillColor(BRAND_COLOR).font('Helvetica-Bold').fontSize(9).text('Notes:', col1, rowY)
        doc.fillColor('#555').font('Helvetica').fontSize(9).text(order.notes, col1, rowY + 13, { width: contentW })
      }

      // ── Footer ────────────────────────────────────────────────
      const footerY = doc.page.height - 80
      doc.rect(0, footerY, pageWidth, 80).fill(DARK_COLOR)
      doc.fillColor(BRAND_COLOR).font('Helvetica-Bold').fontSize(10)
         .text('Thank you for choosing Vishwakarma Furnitures!', 50, footerY + 16, { align: 'center', width: contentW })
      doc.fillColor('#aaa').font('Helvetica').fontSize(8)
         .text('For queries: ' + COMPANY.phone + '  |  ' + COMPANY.email, 50, footerY + 36, { align: 'center', width: contentW })
         .text(COMPANY.address, 50, footerY + 50, { align: 'center', width: contentW })
         .text('This is a computer-generated invoice.', 50, footerY + 62, { align: 'center', width: contentW })

      doc.end()
    } catch (err) {
      reject(err)
    }
  })
}

module.exports = { generateInvoicePDF }
