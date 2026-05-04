// utils/api.js — All API helpers
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export function getToken()      { return localStorage.getItem('vf_token') || null }
export function setToken(t)     { localStorage.setItem('vf_token', t) }
export function clearToken()    { localStorage.removeItem('vf_token') }

async function request(path, options = {}) {
  const token   = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  }
  const res  = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  const json = await res.json()
  return json
}

export const auth = {
  async getSession() {
    if (!getToken()) return { data: { session: null }, error: null }
    return await request('/auth/session')
  },
  async signUp({ email, password, options }) {
    const full_name = options?.data?.full_name || ''
    return await request('/auth/signup', { method: 'POST', body: JSON.stringify({ email, password, full_name }) })
  },
  async signInWithPassword({ email, password }) {
    const result = await request('/auth/signin', { method: 'POST', body: JSON.stringify({ email, password }) })
    if (result.data?.session?.access_token) setToken(result.data.session.access_token)
    return result
  },
  async signOut() {
    const result = await request('/auth/signout', { method: 'POST' })
    clearToken()
    return result
  },
  async verifyOTP({ email, otp }) {
    return await request('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp }) })
  },
  async resendOTP({ email }) {
    return await request('/auth/resend-otp', { method: 'POST', body: JSON.stringify({ email }) })
  },
  async forgotPassword({ email }) {
    return await request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) })
  },
  async verifyResetOTP({ email, otp }) {
    return await request('/auth/verify-reset-otp', { method: 'POST', body: JSON.stringify({ email, otp }) })
  },
  async resetPassword({ reset_token, new_password }) {
    return await request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ reset_token, new_password }) })
  },
  onAuthStateChange() {
    return { data: { subscription: { unsubscribe: () => {} } } }
  },
}

export const db = {
  products: {
    async getAll({ category, sortBy, limit, in_stock } = {}) {
      const p = new URLSearchParams()
      if (category)         p.set('category', category)
      if (sortBy)           p.set('sortBy',   sortBy)
      if (limit)            p.set('limit',    limit)
      if (in_stock != null) p.set('in_stock', in_stock)
      const qs = p.toString()
      return await request(`/products${qs ? '?' + qs : ''}`)
    },
    async getCount()     { return await request('/products/count') },
    async getById(id)    { return await request(`/products/${id}`) },
    async insert(payload) { return await request('/products', { method: 'POST', body: JSON.stringify(payload) }) },
    async update(id, payload) { return await request(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }) },
    async delete(id) { return await request(`/products/${id}`, { method: 'DELETE' }) },
  },
  orders: {
    async getAll({ status, payment_status, date_from, date_to, customer, limit } = {}) {
      const p = new URLSearchParams()
      if (status)         p.set('status', status)
      if (payment_status) p.set('payment_status', payment_status)
      if (date_from)      p.set('date_from', date_from)
      if (date_to)        p.set('date_to',   date_to)
      if (customer)       p.set('customer',  customer)
      if (limit)          p.set('limit',     limit)
      const qs = p.toString()
      return await request(`/orders${qs ? '?' + qs : ''}`)
    },
    async create(payload) {
      return await request('/orders', { method: 'POST', body: JSON.stringify(payload) })
    },
    async updateStatus(id, status) {
      return await request(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
    },
    async getDeliveryCharge(pincode) {
      return await request(`/orders/delivery-charge?pincode=${encodeURIComponent(pincode)}`)
    },
    getInvoiceUrl(orderId) {
      const token = getToken()
      return `${BASE_URL}/orders/${orderId}/invoice?token=${token}`
    },
    async downloadInvoice(orderId) {
      const token = getToken()
      const res = await fetch(`${BASE_URL}/orders/${orderId}/invoice`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to download invoice')
      const blob     = await res.blob()
      const url      = URL.createObjectURL(blob)
      const cd       = res.headers.get('content-disposition') || ''
      const match    = cd.match(/filename="([^"]+)"/)
      const filename = match ? match[1] : `Invoice-${orderId.slice(0,8)}.pdf`
      const a        = document.createElement('a')
      a.href         = url
      a.download     = filename
      a.click()
      URL.revokeObjectURL(url)
    },
    // Pincode admin
    async getPincodes() { return await request('/orders/pincodes') },
    async savePincode(payload) {
      return await request('/orders/pincodes', { method: 'POST', body: JSON.stringify(payload) })
    },
    async deletePincode(pincode) {
      return await request(`/orders/pincodes/${pincode}`, { method: 'DELETE' })
    },
  },
  payment: {
    async createRazorpayOrder(order_id) {
      return await request('/payment/razorpay/create-order', { method: 'POST', body: JSON.stringify({ order_id }) })
    },
    async verifyRazorpayPayment(payload) {
      return await request('/payment/razorpay/verify', { method: 'POST', body: JSON.stringify(payload) })
    },
    // NEW: create Razorpay order for remaining balance
    async createRemainingPaymentOrder(order_id) {
      return await request(`/payment/pay-remaining/${order_id}`, { method: 'POST' })
    },
    // NEW: verify remaining payment
    async verifyRemainingPayment(order_id, payload) {
      return await request(`/payment/pay-remaining/${order_id}/verify`, { method: 'POST', body: JSON.stringify(payload) })
    },
  },
}

export async function uploadImage(file, productId = null) {
  const token    = getToken()
  const formData = new FormData()
  formData.append('image', file)
  const qs  = productId ? `?product_id=${productId}` : ''
  try {
    const res  = await fetch(`${BASE_URL}/upload${qs}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })
    return await res.json()
  } catch (err) {
    return { data: null, error: { message: err.message || 'Upload failed' } }
  }
}

export function getImageSrc(product) {
  if (!product) return null
  if (product.image_base64 && product.image_mime)
    return `data:${product.image_mime};base64,${product.image_base64}`
  if (product.image_url) {
    if (product.image_url.startsWith('/api/')) {
      const baseHost = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace('/api', '')
      return `${baseHost}${product.image_url}`
    }
    return product.image_url
  }
  return null
}
