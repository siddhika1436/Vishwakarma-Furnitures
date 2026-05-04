import { Link, useNavigate } from 'react-router-dom'
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { openWhatsAppOrder } from '../utils/whatsapp'
import toast from 'react-hot-toast'

const PLACEHOLDER = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&q=60'

export default function CartPage() {
  const { cart, removeItem, updateQuantity, totalAmount, totalItems, clearCart } = useCart()
  const { user }   = useAuth()
  const navigate   = useNavigate()

  const handleWhatsAppAll = () => {
    if (cart.length === 0) return
    openWhatsAppOrder(cart.map(item => ({
      name:     item.name,
      price:    item.price,
      quantity: item.quantity,
    })))
  }

  const handleCheckout = () => {
    if (!user) {
      toast.error('Please login to checkout')
      navigate('/login')
      return
    }
    navigate('/checkout')
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-20 px-4">
        <div className="text-center">
          <ShoppingBag size={64} className="text-wood-300 mx-auto mb-6" />
          <h2 className="font-serif text-3xl text-bark-800 mb-3">Your cart is empty</h2>
          <p className="text-wood-600 mb-8">Start adding beautiful furniture to your cart!</p>
          <Link to="/products" className="btn-primary inline-flex items-center gap-2">
            Browse Products <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="bg-bark-800 text-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-serif text-4xl text-cream-100">Shopping Cart</h1>
          <p className="text-cream-400 mt-1">{totalItems} item{totalItems !== 1 ? 's' : ''} in your cart</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map(item => (
              <div key={item.id} className="bg-white rounded-2xl border border-cream-200 p-4 flex gap-4 shadow-sm">
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-cream-100 flex-shrink-0">
                  <img
                    src={item.image_url || PLACEHOLDER}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={e => { e.target.src = PLACEHOLDER }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2">
                    <h3 className="font-serif text-bark-800 font-semibold line-clamp-1">{item.name}</h3>
                    <button
                      onClick={() => { removeItem(item.id); toast.success('Item removed') }}
                      className="text-red-400 hover:text-red-600 flex-shrink-0 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  {item.category && <p className="text-xs text-wood-500 mt-0.5">{item.category}</p>}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-wood-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="px-2 py-1 hover:bg-cream-100 transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="px-3 py-1 text-sm font-semibold border-x border-wood-200">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="px-2 py-1 hover:bg-cream-100 transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <span className="font-bold text-wood-600 text-lg">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => { clearCart(); toast.success('Cart cleared') }}
                className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
              >
                Clear Cart
              </button>
              <Link to="/products" className="text-sm text-wood-600 hover:text-wood-800 font-medium transition-colors">
                ← Continue Shopping
              </Link>
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-cream-200 p-6 shadow-sm sticky top-24">
              <h2 className="font-serif text-xl text-bark-800 mb-6">Order Summary</h2>

              <div className="space-y-3 mb-6">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-wood-600 line-clamp-1 flex-1 mr-2">{item.name} × {item.quantity}</span>
                    <span className="font-medium text-bark-800 flex-shrink-0">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-cream-200 pt-4 mb-6">
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-bark-800">Total</span>
                  <span className="text-2xl font-bold text-wood-600">₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
                {totalAmount >= 10000 && (
                  <p className="text-green-600 text-xs mt-1">🎉Order about to place!</p>
                )}
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleCheckout}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-4"
                >
                  Proceed to Checkout <ArrowRight size={16} />
                </button>
                <button
                  onClick={handleWhatsAppAll}
                  className="btn-whatsapp w-full justify-center py-4"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Order via WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
