import { Link } from 'react-router-dom'
import { ShoppingCart, Eye } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { getImageSrc } from '../utils/api'
import toast from 'react-hot-toast'

const PLACEHOLDER = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80'

export default function ProductCard({ product }) {
  const { addItem } = useCart()

  const handleAddToCart = (e) => {
    e.preventDefault()
    addItem(product)
    toast.success(`${product.name} added to cart!`)
  }

  // Resolve the best image source: uploaded base64, local serve URL, or external URL
  const imgSrc = getImageSrc(product) || PLACEHOLDER

  return (
    <div className="card group cursor-pointer">
      <Link to={`/products/${product.id}`}>
        <div className="relative overflow-hidden aspect-[4/3] bg-cream-100">
          <img
            src={imgSrc}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { e.target.src = PLACEHOLDER }}
          />
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="bg-red-500 text-white text-sm font-medium px-3 py-1 rounded-full">Out of Stock</span>
            </div>
          )}
          {product.category && (
            <span className="absolute top-3 left-3 badge bg-bark-800/80 text-cream-100 backdrop-blur-sm">
              {product.category}
            </span>
          )}
          <div className="absolute inset-0 bg-bark-900/0 group-hover:bg-bark-900/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <span className="flex items-center gap-1.5 bg-white text-bark-800 text-sm font-medium px-4 py-2 rounded-full shadow-lg">
              <Eye size={14} />
              View Details
            </span>
          </div>
        </div>
      </Link>

      <div className="p-4">
        <Link to={`/products/${product.id}`}>
          <h3 className="font-serif text-bark-800 text-lg leading-tight mb-1 hover:text-wood-600 transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>
        {product.description && (
          <p className="text-sm text-wood-700 mb-3 line-clamp-2">{product.description}</p>
        )}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-semibold text-wood-600">
              ₹{Number(product.price).toLocaleString('en-IN')}
            </span>
            {product.stock > 0 && product.stock <= 5 && (
              <p className="text-xs text-orange-500 mt-0.5">Only {product.stock} left!</p>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="flex items-center gap-1.5 bg-wood-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-wood-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            <ShoppingCart size={14} />
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
