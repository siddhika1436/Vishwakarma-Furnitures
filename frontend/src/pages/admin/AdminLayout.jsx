import { Outlet, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Package, ShoppingBag, Plus, ChevronRight, MapPin } from 'lucide-react'

const NAV_LINKS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/pincodes', label: 'Delivery Pincodes', icon: MapPin },
]

export default function AdminLayout() {
  const location = useLocation()

  const isActive = (to, exact) => exact ? location.pathname === to : location.pathname.startsWith(to)

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Top admin bar */}
      <div className="bg-bark-900 text-cream-200 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span className="badge bg-wood-600 text-white">Admin</span>
          <span className="text-cream-400">Vishwakarma Furnitures — Admin Panel</span>
        </div>
        <Link to="/" className="text-xs text-cream-400 hover:text-cream-200 transition-colors">
          ← Back to Store
        </Link>
      </div>

      <div className="flex min-h-[calc(100vh-6rem)]">
        {/* Sidebar */}
        <aside className="w-56 bg-white border-r border-cream-200 hidden md:flex flex-col py-6 shadow-sm">
          <div className="px-4 mb-6">
            <p className="text-xs font-semibold text-wood-500 uppercase tracking-widest">Navigation</p>
          </div>
          <nav className="flex-1 space-y-1 px-3">
            {NAV_LINKS.map(({ to, label, icon: Icon, exact }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive(to, exact)
                    ? 'bg-wood-100 text-wood-700'
                    : 'text-bark-600 hover:bg-cream-50 hover:text-bark-800'
                }`}
              >
                <Icon size={17} />
                {label}
              </Link>
            ))}
          </nav>
          <div className="px-3 mt-4">
            <Link
              to="/admin/products/new"
              className="flex items-center gap-2 px-3 py-2.5 bg-wood-600 text-white rounded-xl text-sm font-medium hover:bg-wood-700 transition-colors"
            >
              <Plus size={16} /> Add Product
            </Link>
          </div>
        </aside>

        {/* Mobile nav */}
        <div className="md:hidden w-full bg-white border-b border-cream-200 flex gap-1 px-4 py-2 overflow-x-auto">
          {NAV_LINKS.map(({ to, label, icon: Icon, exact }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0 ${
                isActive(to, exact) ? 'bg-wood-100 text-wood-700' : 'text-bark-600 hover:bg-cream-50'
              }`}
            >
              <Icon size={14} /> {label}
            </Link>
          ))}
          <Link to="/admin/products/new" className="flex items-center gap-1.5 px-3 py-1.5 bg-wood-600 text-white rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0 ml-auto">
            <Plus size={14} /> Add
          </Link>
        </div>

        {/* Main */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
