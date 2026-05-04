import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { db } from '../utils/api'
import ProductCard from '../components/ProductCard'
import LoadingSpinner from '../components/LoadingSpinner'

const CATEGORIES = ['All', 'Living Room', 'Bedroom', 'Dining', 'Office', 'Storage', 'Outdoor']

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All')
  const [sortBy, setSortBy]             = useState('newest')

  useEffect(() => {
    fetchProducts()
  }, [selectedCategory, sortBy])

  async function fetchProducts() {
    setLoading(true)
    // Replaces: supabase.from('products').select('*')
    //           + .eq('category', ...) + .order(...)
    const { data, error } = await db.products.getAll({
      category: selectedCategory !== 'All' ? selectedCategory : undefined,
      sortBy,
    })
    if (!error) setProducts(data || [])
    setLoading(false)
  }

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat)
    if (cat !== 'All') setSearchParams({ category: cat })
    else setSearchParams({})
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-bark-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-serif text-4xl md:text-5xl text-cream-100 mb-2">Our Collection</h1>
          <p className="text-cream-400">Discover premium furniture for every room</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search + Sort */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-wood-400" />
            <input
              type="text"
              placeholder="Search furniture..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-9 pr-4"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-wood-400 hover:text-wood-600">
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-wood-500" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="input-field py-2 w-auto"
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-wood-600 text-white shadow-md'
                  : 'bg-white text-bark-700 border border-cream-200 hover:border-wood-300 hover:bg-cream-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results */}
        {loading ? (
          <LoadingSpinner text="Loading products..." />
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-serif text-2xl text-bark-700 mb-2">No products found</p>
            <p className="text-wood-500 text-sm">Try adjusting your search or category filter</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-wood-500 mb-4">{filtered.length} product{filtered.length !== 1 ? 's' : ''} found</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
