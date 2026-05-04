import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Package, ShoppingBag, TrendingUp, Clock, Plus, ArrowRight } from 'lucide-react'
import { db } from '../../utils/api'
import LoadingSpinner from '../../components/LoadingSpinner'

const STATUS_COLORS = {
  pending:    'bg-yellow-100 text-yellow-700',
  confirmed:  'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped:    'bg-indigo-100 text-indigo-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-700',
}

export default function AdminDashboard() {
  const [stats, setStats]             = useState({ products: 0, orders: 0, revenue: 0, pending: 0 })
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    // Replaces: Promise.all([
    //   supabase.from('products').select('*', { count: 'exact', head: true }),
    //   supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(10)
    // ])
    const [countResult, ordersResult] = await Promise.all([
      db.products.getCount(),
      db.orders.getAll({ limit: 10 }),
    ])

    const orders  = ordersResult.data || []
    const revenue = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + Number(o.total_amount), 0)
    const pending = orders.filter(o => o.status === 'pending').length

    setStats({
      products: countResult.count || 0,
      orders:   orders.length,
      revenue,
      pending,
    })
    setRecentOrders(orders)
    setLoading(false)
  }

  if (loading) return <LoadingSpinner text="Loading dashboard..." />

  const STAT_CARDS = [
    { label: 'Total Products', value: stats.products, icon: Package, color: 'bg-blue-50 text-blue-600', link: '/admin/products' },
    { label: 'Total Orders', value: stats.orders, icon: ShoppingBag, color: 'bg-green-50 text-green-600', link: '/admin/orders' },
    { label: 'Revenue', value: `₹${stats.revenue.toLocaleString('en-IN')}`, icon: TrendingUp, color: 'bg-wood-50 text-wood-600', link: '/admin/orders' },
    { label: 'Pending Orders', value: stats.pending, icon: Clock, color: 'bg-yellow-50 text-yellow-600', link: '/admin/orders' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-bark-800">Dashboard</h1>
          <p className="text-wood-500 text-sm mt-1">Welcome to your admin panel</p>
        </div>
        <Link to="/admin/products/new" className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Product
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ label, value, icon: Icon, color, link }) => (
          <Link key={label} to={link} className="bg-white rounded-2xl border border-cream-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} mb-3`}>
              <Icon size={20} />
            </div>
            <p className="text-2xl font-bold text-bark-800">{value}</p>
            <p className="text-sm text-wood-500 mt-1">{label}</p>
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-cream-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200">
          <h2 className="font-serif text-xl text-bark-800">Recent Orders</h2>
          <Link to="/admin/orders" className="text-sm text-wood-600 hover:text-wood-800 flex items-center gap-1">
            View All <ArrowRight size={14} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cream-50">
              <tr>
                {['Order ID', 'Date', 'Amount', 'Status'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-wood-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100">
              {recentOrders.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-wood-500 text-sm">No orders yet</td></tr>
              ) : recentOrders.map(order => (
                <tr key={order.id} className="hover:bg-cream-50 transition-colors">
                  <td className="px-6 py-3 font-mono text-sm text-wood-600">#{order.id.slice(0, 8)}</td>
                  <td className="px-6 py-3 text-sm text-bark-700">{new Date(order.created_at).toLocaleDateString('en-IN')}</td>
                  <td className="px-6 py-3 font-semibold text-bark-800">₹{Number(order.total_amount).toLocaleString('en-IN')}</td>
                  <td className="px-6 py-3">
                    <span className={`badge capitalize ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
