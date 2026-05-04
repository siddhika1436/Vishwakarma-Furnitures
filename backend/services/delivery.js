// services/delivery.js — Pincode-based delivery charge calculation
// Uses pincode_delivery_charges table in MySQL.
// Falls back to a default charge if pincode is not found.

const db = require('../config/db')

const DEFAULT_CHARGE = 500  // ₹ charged if pincode not in table

/**
 * getDeliveryCharge(pincode)
 * Returns { pincode, area_city, delivery_charge, found }
 */
async function getDeliveryCharge(pincode) {
  if (!pincode || String(pincode).trim().length < 5) {
    return {
      pincode:         pincode || '',
      area_city:       'Unknown',
      delivery_charge: DEFAULT_CHARGE,
      found:           false,
      message:         'Invalid pincode. Default delivery charge applied.',
    }
  }

  const clean = String(pincode).trim().replace(/\s+/g, '')

  try {
    const [rows] = await db.query(
      'SELECT pincode, area_city, delivery_charge FROM pincode_delivery_charges WHERE pincode = ?',
      [clean]
    )

    if (rows.length > 0) {
      const row = rows[0]
      return {
        pincode:         row.pincode,
        area_city:       row.area_city,
        delivery_charge: parseFloat(row.delivery_charge),
        found:           true,
        message:         row.delivery_charge === 0
          ? `Free delivery to ${row.area_city}!`
          : `Delivery to ${row.area_city}: ₹${row.delivery_charge}`,
      }
    }

    // Pincode not found — apply default
    return {
      pincode:         clean,
      area_city:       'Your area',
      delivery_charge: DEFAULT_CHARGE,
      found:           false,
      message:         `Pincode not found in our delivery zones. Default charge of ₹${DEFAULT_CHARGE} applied. Contact us for custom quote.`,
    }
  } catch (err) {
    console.error('Delivery charge lookup error:', err)
    return {
      pincode:         clean,
      area_city:       'Unknown',
      delivery_charge: DEFAULT_CHARGE,
      found:           false,
      message:         'Could not check delivery charge. Default applied.',
    }
  }
}

/**
 * getAllPincodes()
 * Returns all pincode entries (for admin management)
 */
async function getAllPincodes() {
  const [rows] = await db.query(
    'SELECT * FROM pincode_delivery_charges ORDER BY delivery_charge ASC, area_city ASC'
  )
  return rows
}

module.exports = { getDeliveryCharge, getAllPincodes, DEFAULT_CHARGE }
