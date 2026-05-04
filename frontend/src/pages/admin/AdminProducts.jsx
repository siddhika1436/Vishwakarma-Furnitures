import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, Search, Package } from 'lucide-react'
import { db, getImageSrc } from '../../utils/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'

const PLACEHOLDER = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=100&q=60'

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [deleting, setDeleting] = useState(null)

  useEffect(() => { fetchProducts() }, [])

  async function fetchProducts() {
    setLoading(true)
    const { data, error } = await db.products.getAll({ sortBy: 'newest' })
    if (!error) setProducts(data || [])
    setLoading(false)
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return
    setDeleting(id)
    const { error } = await db.products.delete(id)
    if (error) {
      toast.error('Failed to delete product')
    } else {
      toast.success('Product deleted')
      setProducts(p => p.filter(x => x.id !== id))
    }
    setDeleting(null)
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-bark-800">Products</h1>
          <p className="text-wood-500 text-sm">{products.length} total products</p>
        </div>
        <Link to="/admin/products/new" className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Product
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-wood-400" />
        <input
          type="text"
          placeholder="Search products…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field pl-9"
        />
      </div>

      {loading ? (
        <LoadingSpinner text="Loading products…" />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-cream-200">
          <Package size={48} className="text-wood-300 mx-auto mb-4" />
          <p className="font-serif text-xl text-bark-700 mb-2">No products found</p>
          <Link to="/admin/products/new" className="btn-primary inline-flex items-center gap-2 mt-2">
            <Plus size={16} /> Add First Product
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-cream-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cream-50 border-b border-cream-200">
                <tr>
                  {['Product', 'Category', 'Price', 'Stock', 'Actions'].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-wood-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {filtered.map(product => {
                  // getImageSrc works on list rows too — falls back to image_url if no base64
                  const imgSrc = getImageSrc(product) || PLACEHOLDER
                  return (
                    <tr key={product.id} className="hover:bg-cream-50 transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-cream-100 flex-shrink-0">
                            <img
                              src={imgSrc}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={e => { e.target.src = PLACEHOLDER }}
                            />
                          </div>
                          <div>
                            <p className="font-medium text-bark-800 line-clamp-1">{product.name}</p>
                            <p className="text-xs text-wood-500 font-mono">{product.id.slice(0, 8)}…</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <span className="badge bg-wood-100 text-wood-700">{product.category || '—'}</span>
                      </td>
                      <td className="px-6 py-3 font-semibold text-bark-800">
                        ₹{Number(product.price).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`badge ${
                          product.stock > 5
                            ? 'bg-green-100 text-green-700'
                            : product.stock > 0
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                        }`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/admin/products/edit/${product.id}`}
                            className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
                            title="Edit"
                          >
                            <Pencil size={15} />
                          </Link>
                          <button
                            onClick={() => handleDelete(product.id, product.name)}
                            disabled={deleting === product.id}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
