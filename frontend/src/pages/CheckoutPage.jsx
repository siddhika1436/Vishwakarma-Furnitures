// pages/CheckoutPage.jsx — Pincode-based delivery, advance payment, Razorpay
import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { CheckCircle, MapPin, Phone, User, Truck, CreditCard, Wallet, FileText } from 'lucide-react'
import { db } from '../utils/api'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID

function loadRazorpay() {
  return new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return }
    const s  = document.createElement('script')
    s.src    = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

export default function CheckoutPage() {
  const { cart, totalAmount, clearCart } = useCart()
  const { user }   = useAuth()
  const navigate   = useNavigate()

  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState(false)
  const [orderId, setOrderId]   = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('cod')

  const [pincode, setPincode]         = useState('')
  const [pincodeChecked, setPincodeChecked] = useState(false)
  const [deliveryInfo, setDeliveryInfo] = useState(null)
  const [checkingPin, setCheckingPin] = useState(false)

  // Advance payment (% of total)
  const [advancePct, setAdvancePct] = useState(30)
  const advanceAmount = Math.round(totalAmount * (advancePct / 100) * 100) / 100

  const [form, setForm] = useState({
    full_name: user?.user_metadata?.full_name || '',
    phone: '', address: '', city: '', notes: '',
  })

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const checkPincode = useCallback(async (pin) => {
    if (!pin || pin.length < 5) return
    setCheckingPin(true)
    const { data } = await db.orders.getDeliveryCharge(pin)
    setCheckingPin(false)
    if (data) { setDeliveryInfo(data); setPincodeChecked(true) }
    else { toast.error('Could not check delivery charge'); setPincodeChecked(false) }
  }, [])

  const handlePincodeBlur = () => {
    if (pincode.length >= 5) checkPincode(pincode)
  }

  const deliveryCharge = pincodeChecked && deliveryInfo ? deliveryInfo.delivery_charge : 0
  const grandTotal     = totalAmount + deliveryCharge
  const finalAdvance   = paymentMethod === 'razorpay' ? advanceAmount : 0
  const remaining      = grandTotal - finalAdvance

  const placeOrder = async (pmMethod) => {
    if (!form.full_name || !form.phone || !form.address || !form.city || !pincode) {
      toast.error('Please fill all required fields including pincode'); return null
    }
    if (!pincodeChecked) {
      toast.error('Please verify your pincode first'); return null
    }
    if (cart.length === 0) { toast.error('Your cart is empty'); return null }

    const { data: order, error } = await db.orders.create({
      shipping_name:    form.full_name,
      shipping_phone:   form.phone,
      shipping_address: `${form.address}, ${form.city}`,
      shipping_pincode: pincode,
      notes:            form.notes,
      payment_method:   pmMethod,
      advance_amount:   pmMethod === 'razorpay' ? finalAdvance : 0,
      items: cart.map(item => ({
        product_id: item.id, quantity: item.quantity,
        price: item.price, name: item.name,
      })),
    })

    if (error) { toast.error('Order failed: ' + error.message); return null }
    return order
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    if (paymentMethod === 'cod') {
      const order = await placeOrder('cod')
      setLoading(false)
      if (!order) return
      setOrderId(order.id); setSuccess(true); clearCart()
      return
    }

    // Razorpay flow
    const loaded = await loadRazorpay()
    if (!loaded) { toast.error('Razorpay failed to load'); setLoading(false); return }

    const order = await placeOrder('razorpay')
    if (!order) { setLoading(false); return }

    const { data: rzData, error: rzErr } = await db.payment.createRazorpayOrder(order.id)
    if (rzErr) { toast.error('Payment init failed'); setLoading(false); return }

    const options = {
      key:         RAZORPAY_KEY || rzData.key_id,
      amount:      rzData.amount,
      currency:    rzData.currency,
      name:        'Vishwakarma Furnitures',
      description: `Order #${order.id.slice(0,8)} ${rzData.is_advance ? '(Advance Payment)' : ''}`,
      order_id:    rzData.razorpay_order_id,
      prefill:     rzData.prefill,
      theme:       { color: '#c8852a' },
      notes:       { order_id: order.id },
      handler: async (response) => {
        const { data, error } = await db.payment.verifyRazorpayPayment({
          razorpay_order_id:   response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature:  response.razorpay_signature,
          order_id:            order.id,
        })
        if (error) toast.error('Payment verification failed')
        else { setOrderId(order.id); setSuccess(true); clearCart() }
        setLoading(false)
      },
      modal: { ondismiss: () => { toast.error('Payment cancelled'); setLoading(false) } },
    }
    new window.Razorpay(options).open()
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-cream-50">
        <div className="text-center max-w-md bg-white rounded-2xl shadow-lg p-10">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-500" />
          </div>
          <h2 className="font-serif text-3xl text-bark-800 mb-3">Order Placed!</h2>
          <p className="text-wood-600 mb-2">
            Order <span className="font-mono text-sm bg-cream-100 px-2 py-0.5 rounded">#{orderId?.slice(0,8).toUpperCase()}</span> confirmed.
          </p>
          <p className="text-wood-600 mb-2">Confirmation email sent to you.</p>
          {paymentMethod === 'cod'
            ? <p className="text-wood-500 text-sm mb-4">Payment on delivery.</p>
            : <p className="text-green-600 font-medium mb-4">✓ Advance payment received. Remaining balance due on delivery.</p>
          }
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
            <button onClick={() => db.orders.downloadInvoice(orderId).catch(() => toast.error('Invoice download failed'))}
              className="btn-secondary flex items-center justify-center gap-2 text-sm py-2.5">
              <FileText size={15} /> Download Invoice
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-3">
            <Link to="/orders"   className="btn-primary text-sm py-2.5">View My Orders</Link>
            <Link to="/products" className="btn-secondary text-sm py-2.5">Continue Shopping</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="bg-bark-800 text-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-serif text-4xl text-cream-100">Checkout</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Form ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Shipping Info */}
            <div className="bg-white rounded-2xl border border-cream-200 p-6 shadow-sm space-y-5">
              <h2 className="font-serif text-xl text-bark-800 flex items-center gap-2">
                <User size={18} className="text-wood-500" /> Shipping Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-bark-700 mb-1">Full Name *</label>
                  <input name="full_name" value={form.full_name} onChange={handleChange} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-bark-700 mb-1">Phone *</label>
                  <input name="phone" value={form.phone} onChange={handleChange} className="input-field" placeholder="+91 XXXXX XXXXX" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-bark-700 mb-1">Street Address *</label>
                <textarea name="address" value={form.address} onChange={handleChange} className="input-field resize-none" rows={2} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-bark-700 mb-1">City *</label>
                  <input name="city" value={form.city} onChange={handleChange} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-bark-700 mb-1">PIN Code *</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={pincode}
                      onChange={e => { setPincode(e.target.value.replace(/\D/g,'').slice(0,6)); setPincodeChecked(false); setDeliveryInfo(null) }}
                      onBlur={handlePincodeBlur}
                      className="input-field pr-24"
                      placeholder="e.g. 425503"
                      maxLength={6}
                      required
                    />
                    <button type="button" onClick={() => checkPincode(pincode)} disabled={checkingPin || pincode.length < 5}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-wood-500 text-white px-3 py-1.5 rounded-lg disabled:opacity-50">
                      {checkingPin ? '…' : 'Check'}
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-bark-700 mb-1">Notes</label>
                <textarea name="notes" value={form.notes} onChange={handleChange} className="input-field resize-none" rows={2} />
              </div>
            </div>

            {/* Delivery Charge */}
            <div className="bg-white rounded-2xl border border-cream-200 p-6 shadow-sm">
              <h2 className="font-serif text-xl text-bark-800 flex items-center gap-2 mb-3">
                <Truck size={18} className="text-wood-500" /> Delivery Charge
              </h2>
              {!pincodeChecked ? (
                <p className="text-sm text-wood-500 bg-cream-50 rounded-xl p-3">
                  Enter your PIN code above and click "Check" to see the delivery charge for your area.
                </p>
              ) : deliveryInfo ? (
                <div className={`rounded-xl p-4 text-sm ${deliveryInfo.delivery_charge === 0 ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-amber-50 border border-amber-200 text-amber-800'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium flex items-center gap-2">
                      <MapPin size={14} />
                      {deliveryInfo.area_city}
                    </span>
                    <span className="font-bold text-base">
                      {deliveryInfo.delivery_charge === 0 ? '🎉 FREE' : `₹${deliveryInfo.delivery_charge.toLocaleString('en-IN')}`}
                    </span>
                  </div>
                  {!deliveryInfo.found && (
                    <p className="text-xs mt-2 opacity-80">{deliveryInfo.message}</p>
                  )}
                </div>
              ) : null}
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-2xl border border-cream-200 p-6 shadow-sm">
              <h2 className="font-serif text-xl text-bark-800 flex items-center gap-2 mb-4">
                <CreditCard size={18} className="text-wood-500" /> Payment Method
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { value: 'cod',      label: 'Cash on Delivery', icon: <Wallet size={18} />,     desc: 'Pay when delivered' },
                  { value: 'razorpay', label: 'Pay Online (Advance)', icon: <CreditCard size={18} />, desc: 'UPI · Cards · Net Banking' },
                ].map(opt => (
                  <button key={opt.value} type="button" onClick={() => setPaymentMethod(opt.value)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                      paymentMethod === opt.value
                        ? 'border-wood-500 bg-wood-50'
                        : 'border-cream-200 hover:border-wood-300'
                    }`}>
                    <div className={`p-2 rounded-lg ${paymentMethod === opt.value ? 'bg-wood-500 text-white' : 'bg-cream-100 text-wood-600'}`}>
                      {opt.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-bark-800 text-sm">{opt.label}</p>
                      <p className="text-xs text-wood-500">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Advance % slider */}
              {paymentMethod === 'razorpay' && (
                <div className="mt-5 bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-sm font-medium text-bark-700 mb-3">
                    Advance Payment: <strong className="text-wood-600">{advancePct}%</strong> = ₹{advanceAmount.toLocaleString('en-IN')}
                  </p>
                  <input
                    type="range" min="20" max="100" step="5" value={advancePct}
                    onChange={e => setAdvancePct(Number(e.target.value))}
                    className="w-full accent-wood-600"
                  />
                  <div className="flex justify-between text-xs text-wood-400 mt-1">
                    <span>20%</span><span>50%</span><span>100%</span>
                  </div>
                  <p className="text-xs text-amber-700 mt-2">
                    Remaining ₹{remaining.toLocaleString('en-IN')} to be paid on delivery.
                  </p>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              <button type="submit" disabled={loading || !pincodeChecked}
                className="btn-primary w-full py-4 flex items-center justify-center gap-2 disabled:opacity-60">
                {loading
                  ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  : paymentMethod === 'razorpay'
                    ? `Pay Advance ₹${advanceAmount.toLocaleString('en-IN')}`
                    : `Place Order (Cash on Delivery)`
                }
              </button>
              {!pincodeChecked && <p className="text-center text-xs text-red-500 mt-2">Please check your pincode first</p>}
            </form>
          </div>

          {/* ── Summary ── */}
          <div>
            <div className="bg-white rounded-2xl border border-cream-200 p-6 shadow-sm sticky top-24">
              <h2 className="font-serif text-xl text-bark-800 mb-4">Order Summary</h2>
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-wood-600 flex-1 mr-2 line-clamp-1">{item.name} × {item.quantity}</span>
                    <span className="font-medium text-bark-800">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-cream-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-wood-600">
                  <span>Subtotal</span>
                  <span>₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm text-wood-600">
                  <span>Delivery</span>
                  <span className={deliveryCharge === 0 && pincodeChecked ? 'text-green-600 font-medium' : ''}>
                    {!pincodeChecked ? '—' : deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge.toLocaleString('en-IN')}`}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-bark-800 pt-2 border-t border-cream-100">
                  <span>Grand Total</span>
                  <span className="text-xl text-wood-600">₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
                {paymentMethod === 'razorpay' && (
                  <>
                    <div className="flex justify-between text-sm text-green-700 font-medium">
                      <span>Pay Now (Advance)</span>
                      <span>₹{advanceAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-sm text-amber-700 font-medium">
                      <span>Pay on Delivery</span>
                      <span>₹{remaining.toLocaleString('en-IN')}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
