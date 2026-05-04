import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Star, Truck, Shield, HeartHandshake } from 'lucide-react'
import { db } from '../utils/api'
import ProductCard from '../components/ProductCard'
import LoadingSpinner from '../components/LoadingSpinner'

const CATEGORIES = ['Living Room', 'Bedroom', 'Dining', 'Office', 'Storage', 'Outdoor']

const HERO_BG = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1400&q=85'

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeatured()
  }, [])

  async function fetchFeatured() {
    setLoading(true)
    // Replaces: supabase.from('products').select('*').gt('stock', 0)
    //           .order('created_at', { ascending: false }).limit(8)
    const { data, error } = await db.products.getAll({ sortBy: 'newest', limit: 8, in_stock: true })
    if (!error) setFeaturedProducts(data || [])
    setLoading(false)
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_BG})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-bark-900/90 via-bark-900/60 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-xl">
            <p className="text-wood-400 text-sm font-medium tracking-widest uppercase mb-4">
              ✦ Faizpur, Maharashtra
            </p>
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl text-white leading-[1.1] mb-6">
              Furniture That
              <span className="block text-wood-400">Tells Your</span>
              <span className="block italic">Story</span>
            </h1>
            <p className="text-cream-300 text-lg leading-relaxed mb-8 max-w-md">
              Handcrafted with premium wood and exceptional attention to detail. Transform your living spaces with timeless furniture.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/products" className="btn-primary text-base px-8 py-4 inline-flex items-center gap-2">
                Explore Collection
                <ArrowRight size={18} />
              </Link>
              <a
                href="https://wa.me/918421512605"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-whatsapp text-base px-8 py-4"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp Order
              </a>
            </div>
          </div>
        </div>
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-cream-400 animate-bounce">
          <span className="text-xs tracking-widest">SCROLL</span>
          <div className="w-0.5 h-8 bg-wood-400/50 rounded-full" />
        </div>
      </section>

      {/* Features Bar */}
      <section className="bg-wood-600 text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {[
              { icon: <Truck size={20}/>, title: 'Free Delivery', desc: 'On orders above ₹10,000' },
              { icon: <Shield size={20}/>, title: '2 Year Warranty', desc: 'On all furniture products' },
              { icon: <HeartHandshake size={20}/>, title: 'Expert Support', desc: 'Call us anytime' },
            ].map((f) => (
              <div key={f.title} className="flex items-center justify-center gap-3">
                <div className="text-wood-200">{f.icon}</div>
                <div className="text-left">
                  <p className="font-semibold text-sm">{f.title}</p>
                  <p className="text-wood-200 text-xs">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="text-wood-500 text-sm font-medium tracking-widest uppercase mb-2">Browse By</p>
          <h2 className="section-title">Categories</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              to={`/products?category=${encodeURIComponent(cat)}`}
              className="group bg-white border border-cream-200 rounded-xl p-4 text-center hover:bg-wood-50 hover:border-wood-300 hover:shadow-md transition-all duration-200"
            >
              <div className="w-10 h-10 bg-cream-100 rounded-full mx-auto mb-2 flex items-center justify-center group-hover:bg-wood-100 transition-colors">
                <span className="text-wood-600 font-serif font-bold text-sm">{cat[0]}</span>
              </div>
              <p className="text-sm font-medium text-bark-700 group-hover:text-wood-700">{cat}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-cream-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-wood-500 text-sm font-medium tracking-widest uppercase mb-2">Our Collection</p>
              <h2 className="section-title mb-0">Featured Products</h2>
            </div>
            <Link to="/products" className="hidden sm:flex items-center gap-1.5 text-wood-600 font-medium hover:text-wood-700 text-sm">
              View All <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <LoadingSpinner text="Loading products..." />
          ) : featuredProducts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-wood-600 text-lg font-serif">No products yet.</p>
              <p className="text-wood-500 text-sm mt-1">Check back soon — beautiful furniture is coming!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <div className="text-center mt-10 sm:hidden">
            <Link to="/products" className="btn-secondary inline-flex items-center gap-2">
              View All Products <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="section-title">What Our Customers Say</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: 'Rahul Patil', loc: 'Faizpur', text: 'Excellent quality furniture! The sofa set I ordered is sturdy and looks exactly as shown. Very happy with my purchase.', stars: 5 },
            { name: 'Sunita Deshmukh', loc: 'Jalgaon', text: 'Great experience. The dining table is beautifully crafted and delivery was on time. Highly recommend!', stars: 5 },
            { name: 'Amit Chaudhari', loc: 'Yawal', text: 'Vishwakarma Furnitures has the best quality wooden furniture at very reasonable prices. Will buy again!', stars: 5 },
          ].map((t) => (
            <div key={t.name} className="bg-white border border-cream-200 rounded-2xl p-6 shadow-sm">
              <div className="flex gap-1 mb-3">
                {Array(t.stars).fill(0).map((_, i) => (
                  <Star key={i} size={14} className="fill-wood-500 text-wood-500" />
                ))}
              </div>
              <p className="text-bark-700 text-sm leading-relaxed mb-4">"{t.text}"</p>
              <div>
                <p className="font-semibold text-bark-800 text-sm">{t.name}</p>
                <p className="text-wood-500 text-xs">{t.loc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-bark-800 text-white py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl md:text-4xl text-cream-100 mb-4">
            Ready to Transform Your Space?
          </h2>
          <p className="text-cream-400 mb-8">
            Contact us on WhatsApp or visit our store in Faizpur, Maharashtra. We are happy to help!
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/products" className="btn-primary px-8 py-4">
              Shop Now
            </Link>
            <a
              href="https://wa.me/918421512605"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp px-8 py-4"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp Us
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
