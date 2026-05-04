// whatsapp.js — unchanged from original
const PHONE = '918421512605'

export function openWhatsAppOrder({ name, price, quantity = 1 }) {
  const total   = Number(price) * quantity
  const message = encodeURIComponent(
    `Hi! I'd like to order:\n\n` +
    `*${name}*\nQty: ${quantity}\nPrice: ₹${Number(price).toLocaleString('en-IN')}\n` +
    `Total: ₹${total.toLocaleString('en-IN')}\n\nPlease confirm availability.`
  )
  window.open(`https://wa.me/${PHONE}?text=${message}`, '_blank')
}
