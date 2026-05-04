// pages/admin/AdminOrders.jsx — Full admin order management
import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, FileText, Search, Filter, RefreshCw } from 'lucide-react'
import { db } from '../../utils/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = ['pending','confirmed','processing','shipped','delivered','cancelled']

const STATUS_COLORS = {
  pending:    'bg-yellow-100 text-yellow-700',
  confirmed:  'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped:    'bg-indigo-100 text-indigo-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-700',
}

const PAYMENT_COLORS = {
   pending: 'text-yellow-600 bg-yellow-50',
  partial: 'text-orange-600 bg-orange-50',
  paid:    'text-green-600 bg-green-50',
  failed:  'text-red-600 bg-red-50',
}

export default function AdminOrders() {
  const [orders, setOrders]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [expanded, setExpanded]   = useState(null)
  const [updatingId, setUpdatingId] = useState(null)
  const [downloading, setDownloading] = useState(null)

  // Filters
  const [filterStatus, setFilterStatus]   = useState('all')
  const [filterPayment, setFilterPayment] = useState('all')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo]   = useState('')
  const [filterCustomer, setFilterCustomer] = useState('')

  useEffect(() => { fetchOrders() }, [])

  async function fetchOrders() {
    setLoading(true)
    const params = {}
    if (filterStatus  !== 'all') params.status         = filterStatus
    if (filterPayment !== 'all') params.payment_status = filterPayment
    if (filterDateFrom) params.date_from = filterDateFrom
    if (filterDateTo)   params.date_to   = filterDateTo
    if (filterCustomer) params.customer  = filterCustomer

    const { data, error } = await db.orders.getAll(params)
    if (!error) setOrders(data || [])
    setLoading(false)
  }

  async function updateStatus(orderId, newStatus) {
    setUpdatingId(orderId)
    const { error } = await db.orders.updateStatus(orderId, newStatus)
    if (error) toast.error('Failed to update status')
    else {
      toast.success(`Order marked as ${newStatus}`)
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
    }
    setUpdatingId(null)
  }

  async function handleDownloadInvoice(orderId) {
    setDownloading(orderId)
    try {
      await db.orders.downloadInvoice(orderId)
      toast.success('Invoice downloaded!')
    } catch {
      toast.error('Invoice download failed')
    }
    setDownloading(null)
  }

  // Stats summary
  const stats = {
    total:     orders.length,
    pending:   orders.filter(o => o.status === 'pending').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    paid:      orders.filter(o => o.payment_status === 'paid').length,
    revenue:   orders.filter(o => o.payment_status === 'paid').reduce((s, o) => s + parseFloat(o.total_amount || 0), 0),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-bark-800">Order Records</h1>
          <p className="text-wood-500 text-sm">{stats.total} orders total</p>
        </div>
        <button onClick={fetchOrders} className="btn-secondary flex items-center gap-2 text-sm py-2">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: stats.total,                    color: 'text-bark-800' },
          { label: 'Pending',      value: stats.pending,                   color: 'text-yellow-600' },
          { label: 'Delivered',    value: stats.delivered,                 color: 'text-green-600' },
          { label: 'Revenue',      value: `₹${stats.revenue.toLocaleString('en-IN')}`, color: 'text-wood-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-cream-200 p-4 shadow-sm">
            <p className="text-xs text-wood-500 uppercase tracking-wide">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-cream-200 p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-bark-700">
          <Filter size={14} /> Filters
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Status filter */}
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="input-field text-sm py-2">
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
          </select>

          {/* Payment filter */}
          <select value={filterPayment} onChange={e => setFilterPayment(e.target.value)}
            className="input-field text-sm py-2">
            <option value="all">All Payments</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial (Advance)</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
          </select>

          {/* Date from */}
          <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
            className="input-field text-sm py-2" placeholder="From date" />

          {/* Date to */}
          <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
            className="input-field text-sm py-2" placeholder="To date" />

          {/* Customer search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-wood-400" />
            <input type="text" value={filterCustomer} onChange={e => setFilterCustomer(e.target.value)}
              className="input-field pl-8 text-sm py-2" placeholder="Customer name/email" />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchOrders} className="btn-primary text-sm py-2 px-4">Apply Filters</button>
          <button onClick={() => {
            setFilterStatus('all'); setFilterPayment('all')
            setFilterDateFrom(''); setFilterDateTo(''); setFilterCustomer('')
            setTimeout(fetchOrders, 50)
          }} className="btn-secondary text-sm py-2 px-4">Clear</button>
        </div>
      </div>

      {/* Status tab bar */}
      <div className="flex gap-2 flex-wrap">
        {['all', ...STATUS_OPTIONS].map(s => (
          <button key={s} onClick={() => { setFilterStatus(s); setTimeout(fetchOrders, 50) }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${
              filterStatus === s ? 'bg-wood-600 text-white' : 'bg-white border border-cream-200 text-bark-600 hover:border-wood-300'
            }`}>
            {s === 'all' ? 'All' : s}
            <span className="ml-1.5 text-xs opacity-70">
              ({s === 'all' ? orders.length : orders.filter(o => o.status === s).length})
            </span>
          </button>
        ))}
      </div>

      {/* Order list */}
      {loading ? <LoadingSpinner text="Loading orders…" /> : (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-cream-200">
              <p className="text-wood-500">No orders match your filters</p>
            </div>
          ) : orders.map(order => {
            const isOpen = expanded === order.id
            const items  = order.order_items || []

            return (
              <div key={order.id} className="bg-white rounded-2xl border border-cream-200 shadow-sm overflow-hidden">
                {/* Row */}
                <button onClick={() => setExpanded(isOpen ? null : order.id)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-cream-50 transition-colors text-left">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-medium text-bark-700">
                        #{order.invoice_number || order.id.slice(0,8).toUpperCase()}
                      </p>
                      <p className="text-xs text-wood-400">
                        {new Date(order.created_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                        {order.status}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${PAYMENT_COLORS[order.payment_status] || ''}`}>
                        {order.payment_status}
                      </span>
                    </div>
                    <div className="hidden sm:block text-sm text-wood-600 truncate">
                      {order.user_full_name || order.shipping_name || '—'}
                      {order.user_email && <span className="text-wood-400 text-xs ml-1">({order.user_email})</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    <div className="text-right">
                      <p className="font-bold text-bark-800">₹{parseFloat(order.total_amount).toLocaleString('en-IN')}</p>
                      <p className="text-xs text-wood-400">{items.length} item{items.length !== 1 ? 's' : ''}</p>
                    </div>
                    {isOpen ? <ChevronUp size={16} className="text-wood-400" /> : <ChevronDown size={16} className="text-wood-400" />}
                  </div>
                </button>

                {/* Expanded */}
                {isOpen && (
                  <div className="border-t border-cream-100 px-5 py-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Order items */}
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-wood-500 uppercase tracking-wide">Items</p>
                        {items.map(item => (
                          <div key={item.id} className="flex justify-between text-sm bg-cream-50 rounded-lg px-3 py-2">
                            <span className="text-bark-700 flex-1 mr-2 truncate">
                              {item.product_name || item.products?.name || 'Product'} × {item.quantity}
                            </span>
                            <span className="font-medium text-bark-800 shrink-0">
                              ₹{(Number(item.price) * Number(item.quantity)).toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                        {/* Financial */}
                        <div className="pt-2 space-y-1 text-sm border-t border-cream-200">
                          <div className="flex justify-between text-wood-500">
                            <span>Subtotal</span><span>₹{parseFloat(order.subtotal_amount || order.total_amount).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-wood-500">
                            <span>Delivery</span>
                            <span className={parseFloat(order.delivery_charge) === 0 ? 'text-green-600' : ''}>
                              {parseFloat(order.delivery_charge) === 0 ? 'FREE' : `₹${parseFloat(order.delivery_charge).toLocaleString('en-IN')}`}
                            </span>
                          </div>
                          <div className="flex justify-between font-bold text-bark-800 border-t border-cream-200 pt-1">
                            <span>Total</span><span>₹{parseFloat(order.total_amount).toLocaleString('en-IN')}</span>
                          </div>
                          {parseFloat(order.advance_paid) > 0 && (
                            <>
                              <div className="flex justify-between text-green-700 font-medium">
                                <span>Advance Paid</span>
                                <span>₹{parseFloat(order.advance_paid).toLocaleString('en-IN')}</span>
                              </div>
                              <div className={`flex justify-between font-medium ${
                                order.payment_status === 'paid' ? 'text-green-600' : 'text-amber-700'
                              }`}>
                                <span>Remaining Balance</span>
                                <span>
                                  {order.payment_status === 'paid'
                                    ? '₹0 (Fully Paid)'
                                    : `₹${parseFloat(order.remaining_balance).toLocaleString('en-IN')}`}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Customer info */}
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-semibold text-wood-500 uppercase tracking-wide mb-1">Customer</p>
                          <p className="text-sm font-medium text-bark-700">{order.user_full_name || order.shipping_name}</p>
                          <p className="text-xs text-wood-400">{order.user_email}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-wood-500 uppercase tracking-wide mb-1">Delivery Address</p>
                          <p className="text-sm text-bark-700">{order.shipping_name}</p>
                          <p className="text-sm text-wood-600">{order.shipping_address}</p>
                          <p className="text-sm text-wood-600">PIN: {order.shipping_pincode}</p>
                          <p className="text-sm text-wood-600">{order.shipping_phone}</p>
                        </div>
                       <div>
                          <p className="text-xs font-semibold text-wood-500 uppercase tracking-wide mb-1">Payment</p>
                          <p className="text-sm text-bark-700 capitalize">
                            {order.payment_method} ·{' '}
                            <span className={`font-semibold ${
                              order.payment_status === 'paid'    ? 'text-green-600' :
                              order.payment_status === 'partial' ? 'text-orange-600' :
                              order.payment_status === 'pending' ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {order.payment_status === 'partial' ? 'Partial (Advance Paid)' : order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                            </span>
                          </p>
                          {order.payment_id && (
                            <p className="text-xs text-wood-400 font-mono">{order.payment_id}</p>
                          )}
                        </div>
                        {order.notes && (
                          <div>
                            <p className="text-xs font-semibold text-wood-500 uppercase tracking-wide mb-1">Notes</p>
                            <p className="text-sm text-wood-600">{order.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-cream-100">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-medium text-wood-600">Update Status:</label>
                        <select
                          value={order.status}
                          onChange={e => updateStatus(order.id, e.target.value)}
                          disabled={updatingId === order.id}
                          className="input-field text-sm py-1.5 pr-8 capitalize"
                        >
                          {STATUS_OPTIONS.map(s => (
                            <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase()+s.slice(1)}</option>
                          ))}
                        </select>
                        {updatingId === order.id && (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-wood-500 border-t-transparent" />
                        )}
                      </div>
                      <button
                        onClick={() => handleDownloadInvoice(order.id)}
                        disabled={downloading === order.id}
                        className="flex items-center gap-1.5 text-sm text-wood-600 hover:text-wood-800 border border-cream-300 hover:border-wood-400 rounded-lg px-3 py-1.5 transition-all"
                      >
                        <FileText size={14} />
                        {downloading === order.id ? 'Downloading…' : 'Invoice PDF'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
