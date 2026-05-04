// pages/OrdersPage.jsx — User order history with partial payment support
import { useState, useEffect } from 'react'
import { Package, ChevronDown, ChevronUp, FileText, CreditCard } from 'lucide-react'
import { db } from '../utils/api'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID

const STATUS_COLORS = {
  pending:    'bg-yellow-100 text-yellow-700 border-yellow-200',
  confirmed:  'bg-blue-100 text-blue-700 border-blue-200',
  processing: 'bg-purple-100 text-purple-700 border-purple-200',
  shipped:    'bg-indigo-100 text-indigo-700 border-indigo-200',
  delivered:  'bg-green-100 text-green-700 border-green-200',
  cancelled:  'bg-red-100 text-red-700 border-red-200',
}

const PAYMENT_COLORS = {
  pending: 'bg-yellow-50 text-yellow-700',
  partial: 'bg-orange-50 text-orange-700',
  paid:    'bg-green-50 text-green-700',
  failed:  'bg-red-50 text-red-700',
}

function loadRazorpay() {
  return new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return }
    const s   = document.createElement('script')
    s.src     = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload  = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

export default function OrdersPage() {
  const [orders, setOrders]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [downloading, setDownloading]   = useState(null)
  const [payingRemaining, setPayingRemaining] = useState(null)

  useEffect(() => {
    db.orders.getAll().then(({ data, error }) => {
      if (!error) setOrders(data || [])
      setLoading(false)
    })
  }, [])

  async function handleDownloadInvoice(orderId) {
    setDownloading(orderId)
    try {
      await db.orders.downloadInvoice(orderId)
      toast.success('Invoice downloaded!')
    } catch {
      toast.error('Failed to download invoice')
    }
    setDownloading(null)
  }

  // ── Pay Remaining Amount via Razorpay ──────────────────────
  async function handlePayRemaining(order) {
    setPayingRemaining(order.id)

    try {
      const loaded = await loadRazorpay()
      if (!loaded) { toast.error('Razorpay failed to load'); setPayingRemaining(null); return }

      const { data, error } = await db.payment.createRemainingPaymentOrder(order.id)
      if (error || !data) {
        toast.error(error?.message || 'Could not initiate payment')
        setPayingRemaining(null)
        return
      }

      const rzOptions = {
        key:         RAZORPAY_KEY,
        amount:      data.amount,
        currency:    data.currency,
        order_id:    data.razorpay_order_id,
        name:        'Vishwakarma Furnitures',
        description: `Remaining balance for Order #${order.invoice_number || order.id.slice(0,8).toUpperCase()}`,
        prefill:     data.prefill,
        theme:       { color: '#6B4B2A' },
        handler: async (response) => {
          try {
            const { data: vData, error: vErr } = await db.payment.verifyRemainingPayment(order.id, {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
            })
            if (vErr) {
              toast.error('Payment verification failed')
            } else {
              toast.success('Remaining amount paid! Order is fully paid.')
              // Update local state immediately
              setOrders(prev =>
                prev.map(o =>
                  o.id === order.id
                    ? { ...o, payment_status: 'paid', remaining_balance: 0 }
                    : o
                )
              )
            }
          } catch {
            toast.error('Verification error. Please contact support.')
          }
          setPayingRemaining(null)
        },
        modal: {
          ondismiss: () => {
            toast('Payment cancelled.')
            setPayingRemaining(null)
          },
        },
      }

      const rz = new window.Razorpay(rzOptions)
      rz.on('payment.failed', () => {
        toast.error('Payment failed. Please try again.')
        setPayingRemaining(null)
      })
      rz.open()
    } catch (err) {
      console.error('handlePayRemaining:', err)
      toast.error('Something went wrong.')
      setPayingRemaining(null)
    }
  }

  if (loading) return <LoadingSpinner text="Loading your orders…" />

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="bg-bark-800 text-white py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h1 className="font-serif text-4xl text-cream-100">My Orders</h1>
          <p className="text-cream-300 mt-1">
            {orders.length} order{orders.length !== 1 ? 's' : ''} total
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-cream-200">
            <Package size={48} className="text-cream-300 mx-auto mb-4" />
            <p className="text-wood-500 font-medium">No orders yet</p>
            <p className="text-sm text-wood-400 mt-1">Your order history will appear here.</p>
          </div>
        ) : orders.map(order => {
          const isOpen = expanded === order.id
          const items  = order.order_items || []
          const isPartial = order.payment_status === 'partial'
          const isPaid    = order.payment_status === 'paid'

          return (
            <div key={order.id} className="bg-white rounded-2xl border border-cream-200 shadow-sm overflow-hidden">
              {/* Header */}
              <button
                onClick={() => setExpanded(isOpen ? null : order.id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-cream-50 transition-colors"
              >
                <div className="flex items-start gap-4 text-left">
                  <div>
                    <p className="font-mono text-sm font-medium text-bark-700">
                      #{order.invoice_number || order.id.slice(0,8).toUpperCase()}
                    </p>
                    <p className="text-xs text-wood-400 mt-0.5">
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                      {order.status}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${PAYMENT_COLORS[order.payment_status] || ''}`}>
                      {order.payment_method === 'cod' ? 'COD' : 'Online'} ·{' '}
                      {isPartial ? 'Partial' : order.payment_status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-2">
                  <div className="text-right">
                    <p className="font-bold text-bark-800">
                      ₹{parseFloat(order.total_amount).toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-wood-400">
                      {items.length} item{items.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  {isOpen ? <ChevronUp size={18} className="text-wood-400" /> : <ChevronDown size={18} className="text-wood-400" />}
                </div>
              </button>

              {/* Expanded detail */}
              {isOpen && (
                <div className="border-t border-cream-100 px-6 py-5 space-y-4">
                  {/* Items */}
                  <div className="space-y-2">
                    {items.map(item => (
                      <div key={item.id} className="flex justify-between text-sm bg-cream-50 rounded-lg px-4 py-2">
                        <span className="text-bark-700 flex-1 mr-2">
                          {item.product_name || item.products?.name || 'Product'} × {item.quantity}
                        </span>
                        <span className="font-medium text-bark-800 shrink-0">
                          ₹{(Number(item.price) * Number(item.quantity)).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Financial summary */}
                  <div className="bg-cream-50 rounded-xl p-4 text-sm space-y-1.5">
                    <div className="flex justify-between text-wood-600">
                      <span>Subtotal</span>
                      <span>₹{parseFloat(order.subtotal_amount || order.total_amount).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-wood-600">
                      <span>Delivery</span>
                      <span className={parseFloat(order.delivery_charge) === 0 ? 'text-green-600 font-medium' : ''}>
                        {parseFloat(order.delivery_charge) === 0
                          ? 'FREE'
                          : `₹${parseFloat(order.delivery_charge).toLocaleString('en-IN')}`}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-bark-800 pt-1 border-t border-cream-200">
                      <span>Total</span>
                      <span>₹{parseFloat(order.total_amount).toLocaleString('en-IN')}</span>
                    </div>
                    {parseFloat(order.advance_paid) > 0 && (
                      <>
                        <div className="flex justify-between text-green-700 font-medium">
                          <span>Advance Paid</span>
                          <span>₹{parseFloat(order.advance_paid).toLocaleString('en-IN')}</span>
                        </div>
                        <div className={`flex justify-between font-medium ${isPaid ? 'text-green-600' : 'text-amber-700'}`}>
                          <span>Remaining Balance</span>
                          <span>
                            {isPaid
                              ? '₹0 (Fully Paid)'
                              : `₹${parseFloat(order.remaining_balance).toLocaleString('en-IN')}`}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* ── PAY REMAINING BUTTON ── */}
                  {isPartial && parseFloat(order.remaining_balance) > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                      <p className="text-sm font-medium text-orange-800 mb-1">
                        ₹{parseFloat(order.remaining_balance).toLocaleString('en-IN')} remaining
                      </p>
                      <p className="text-xs text-orange-600 mb-3">
                        You paid an advance. Pay the remaining amount to complete your order.
                      </p>
                      <button
                        onClick={() => handlePayRemaining(order)}
                        disabled={payingRemaining === order.id}
                        className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
                      >
                        <CreditCard size={15} />
                        {payingRemaining === order.id ? 'Processing…' : 'Pay Remaining Amount'}
                      </button>
                    </div>
                  )}

                  {/* Fully paid badge */}
                  {isPaid && parseFloat(order.advance_paid) > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2">
                      <span className="text-green-600 text-sm font-medium">✓ Fully Paid</span>
                    </div>
                  )}

                  {/* Shipping */}
                  <div className="text-sm text-wood-600">
                    <p className="font-medium text-bark-700 mb-1">Deliver to:</p>
                    <p>{order.shipping_name}</p>
                    <p>{order.shipping_address} — PIN {order.shipping_pincode}</p>
                    <p>{order.shipping_phone}</p>
                  </div>

                  {/* Invoice download */}
                  <button
                    onClick={() => handleDownloadInvoice(order.id)}
                    disabled={downloading === order.id}
                    className="flex items-center gap-2 text-sm text-wood-600 hover:text-wood-800 border border-cream-300 hover:border-wood-400 rounded-xl px-4 py-2 transition-all"
                  >
                    <FileText size={15} />
                    {downloading === order.id ? 'Downloading…' : 'Download Invoice PDF'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}