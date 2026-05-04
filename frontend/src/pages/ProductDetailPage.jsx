import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, ArrowLeft, Plus, Minus, Package } from 'lucide-react'
import { db, getImageSrc } from '../utils/api'
import { useCart } from '../contexts/CartContext'
import { openWhatsAppOrder } from '../utils/whatsapp'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const PLACEHOLDER = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80'

export default function ProductDetailPage() {
  const { id }        = useParams()
  const navigate      = useNavigate()
  const { addItem }   = useCart()
  const [product, setProduct]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [related, setRelated]   = useState([])

  useEffect(() => {
    fetchProduct()
  }, [id])

  async function fetchProduct() {
    setLoading(true)
    // GET /products/:id returns full row including image_base64
    const { data, error } = await db.products.getById(id)
    if (error || !data) {
      toast.error('Product not found')
      navigate('/products')
      return
    }
    setProduct(data)
    fetchRelated(data.category, data.id)
    setLoading(false)
  }

  async function fetchRelated(category, excludeId) {
    const { data } = await db.products.getAll({ category, limit: 5 })
    setRelated((data || []).filter(p => p.id !== excludeId).slice(0, 4))
  }

  const handleAddToCart = () => {
    addItem(product, quantity)
    toast.success(`${product.name} added to cart!`)
  }

  const handleWhatsApp = () => {
    openWhatsAppOrder({ name: product.name, price: product.price, quantity })
  }

  if (loading) return <LoadingSpinner text="Loading product..." />
  if (!product)  return null

  // Resolve best image: base64 embed (no extra request) → serve URL → external → placeholder
  const imgSrc = getImageSrc(product) || PLACEHOLDER

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-wood-500 mb-8">
          <Link to="/" className="hover:text-wood-700">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-wood-700">Products</Link>
          <span>/</span>
          <span className="text-bark-700 truncate max-w-[200px]">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Image */}
          <div>
            <div className="aspect-square rounded-2xl overflow-hidden bg-cream-100 shadow-md">
              <img
                src={imgSrc}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={e => { e.target.src = PLACEHOLDER }}
              />
            </div>
          </div>

          {/* Details */}
          <div>
            {product.category && (
              <span className="badge bg-wood-100 text-wood-700 mb-3 inline-block">
                {product.category}
              </span>
            )}
            <h1 className="font-serif text-3xl md:text-4xl text-bark-900 mb-3">{product.name}</h1>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-4xl font-bold text-wood-600">
                ₹{Number(product.price).toLocaleString('en-IN')}
              </span>
            </div>

            {product.description && (
              <div className="mb-6">
                <h3 className="font-semibold text-bark-800 mb-2">Description</h3>
                <p className="text-wood-700 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Stock */}
            <div className="flex items-center gap-2 mb-6">
              <Package size={16} className={product.stock > 0 ? 'text-green-500' : 'text-red-500'} />
              {product.stock > 0 ? (
                <span className="text-sm text-green-600 font-medium">
                  {product.stock <= 5
                    ? `Only ${product.stock} left in stock!`
                    : `In Stock (${product.stock} available)`}
                </span>
              ) : (
                <span className="text-sm text-red-500 font-medium">Out of Stock</span>
              )}
            </div>

            {product.stock > 0 && (
              <>
                {/* Quantity */}
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-sm font-medium text-bark-700">Quantity:</span>
                  <div className="flex items-center border border-wood-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="px-3 py-2 hover:bg-cream-100 transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="px-5 py-2 font-semibold text-bark-800 border-x border-wood-200">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                      className="px-3 py-2 hover:bg-cream-100 transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleAddToCart}
                    className="btn-primary flex items-center justify-center gap-2 flex-1 py-4"
                  >
                    <ShoppingCart size={18} />
                    Add to Cart
                  </button>
                  <button onClick={handleWhatsApp} className="btn-whatsapp justify-center flex-1 py-4">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    Order via WhatsApp
                  </button>
                </div>
              </>
            )}

            {/* Meta */}
            <div className="mt-8 pt-6 border-t border-cream-200 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-wood-500">Category</span>
                <p className="font-medium text-bark-800">{product.category || '—'}</p>
              </div>
              <div>
                <span className="text-wood-500">Product ID</span>
                <p className="font-medium text-bark-800 truncate">{product.id.slice(0, 8)}…</p>
              </div>
            </div>
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div>
            <h2 className="font-serif text-2xl text-bark-800 mb-6">You Might Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {related.map(p => {
                const rSrc = getImageSrc(p) || PLACEHOLDER
                return (
                  <Link key={p.id} to={`/products/${p.id}`} className="card group">
                    <div className="aspect-square overflow-hidden bg-cream-100">
                      <img
                        src={rSrc}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={e => { e.target.src = PLACEHOLDER }}
                      />
                    </div>
                    <div className="p-3">
                      <p className="font-medium text-bark-800 text-sm line-clamp-1">{p.name}</p>
                      <p className="text-wood-600 font-semibold text-sm">
                        ₹{Number(p.price).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
