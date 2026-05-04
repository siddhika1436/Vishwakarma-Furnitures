import { Link } from 'react-router-dom'
import { Phone, Mail, MapPin, MessageCircle } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-bark-900 text-cream-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-wood-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-serif font-bold text-lg">V</span>
              </div>
              <div>
                <p className="font-serif font-semibold text-lg text-cream-100">Vishwakarma Furnitures</p>
                <p className="text-xs text-wood-400 tracking-widest uppercase">Premium Quality</p>
              </div>
            </div>
            <p className="text-sm text-cream-400 leading-relaxed">
              Crafting beautiful, durable furniture for your home and office since years. Quality you can trust, designs you'll love.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif text-cream-100 text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { to: '/', label: 'Home' },
                { to: '/products', label: 'All Products' },
                { to: '/cart', label: 'Shopping Cart' },
                { to: '/orders', label: 'My Orders' },
                { to: '/shop-policies', label: 'Shop Policies' },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-cream-400 hover:text-wood-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-serif text-cream-100 text-lg mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-cream-400">
                <MapPin size={16} className="text-wood-400 mt-0.5 flex-shrink-0" />
                Faizpur, Maharashtra, India
              </li>
              <li>
                <a href="tel:+918421512605" className="flex items-center gap-2 text-sm text-cream-400 hover:text-wood-400 transition-colors">
                  <Phone size={16} className="text-wood-400" />
                  +91 84215 12605
                </a>
              </li>
              <li>
                <a href="mailto:deepakschaudhari07@gmail.com" className="flex items-center gap-2 text-sm text-cream-400 hover:text-wood-400 transition-colors">
                  <Mail size={16} className="text-wood-400" />
                  deepakschaudhari07@gmail.com
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/918421512605"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-green-400 hover:text-green-300 transition-colors"
                >
                  <MessageCircle size={16} />
                  Chat on WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-bark-700 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-cream-500">
            © {currentYear} Vishwakarma Furnitures. All rights reserved.
          </p>
          <p className="text-xs text-cream-600">Faizpur, Maharashtra, India</p>
        </div>
      </div>
    </footer>
  )
}
