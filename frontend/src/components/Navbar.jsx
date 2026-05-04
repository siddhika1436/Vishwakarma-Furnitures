import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ShoppingCart, Menu, X, User, LogOut, Settings, Package } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { user, isAdmin, signOut } = useAuth()
  const { totalItems }             = useCart()
  const navigate                   = useNavigate()
  const location                   = useLocation()
  const [mobileOpen, setMobileOpen]   = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out successfully')
    navigate('/')
    setUserMenuOpen(false)
  }

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/products', label: 'Products' },
    { to: '/shop-policies', label: 'Policies' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <nav className="bg-bark-800 text-cream-100 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-wood-500 rounded-lg flex items-center justify-center shadow-md group-hover:bg-wood-400 transition-colors">
              <span className="text-white font-serif font-bold text-lg">V</span>
            </div>
            <div className="hidden sm:block">
              <p className="font-serif font-semibold text-lg leading-tight text-cream-100">Vishwakarma</p>
              <p className="text-xs text-wood-400 leading-tight tracking-widest uppercase">Furnitures</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.to)
                    ? 'bg-wood-600 text-white'
                    : 'text-cream-300 hover:text-white hover:bg-bark-700'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                className="px-4 py-2 rounded-lg text-sm font-medium bg-wood-500 text-white hover:bg-wood-400 transition-colors flex items-center gap-1.5 ml-1"
              >
                <Settings size={14} />
                Admin Panel
              </Link>
            )}
          </div>

          {/* Right Icons */}
          <div className="flex items-center gap-2">
            {/* Cart */}
            <Link to="/cart" className="relative p-2 rounded-lg hover:bg-bark-700 transition-colors">
              <ShoppingCart size={20} className="text-cream-200" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-wood-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-bark-700 transition-colors"
                >
                  <div className="w-8 h-8 bg-wood-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {user.email[0].toUpperCase()}
                    </span>
                  </div>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-cream-200 py-1.5 z-50">
                    <div className="px-4 py-2 border-b border-cream-200">
                      <p className="text-xs text-wood-600 truncate">{user.email}</p>
                      {isAdmin && <span className="badge bg-wood-100 text-wood-700">Admin</span>}
                    </div>
                    <Link
                      to="/orders"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-bark-700 hover:bg-cream-50 transition-colors"
                    >
                      <Package size={14} />
                      My Orders
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-bark-700 hover:bg-cream-50 transition-colors"
                      >
                        <Settings size={14} />
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={14} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-wood-600 text-white hover:bg-wood-500 transition-colors"
              >
                <User size={14} />
                Login
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-bark-700 transition-colors"
            >
              {mobileOpen ? <X size={20} className="text-cream-200" /> : <Menu size={20} className="text-cream-200" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-bark-700 py-3 space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.to)
                    ? 'bg-wood-600 text-white'
                    : 'text-cream-300 hover:text-white hover:bg-bark-700'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-wood-600 text-white"
              >
                <Settings size={14} />
                Admin Panel
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
