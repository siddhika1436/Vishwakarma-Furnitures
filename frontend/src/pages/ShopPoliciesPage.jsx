// pages/ShopPoliciesPage.jsx — Return, Cancellation, Delivery policies
import { RotateCcw, XCircle, Truck, Phone, Mail, MapPin } from 'lucide-react'

function PolicySection({ icon: Icon, title, color, children }) {
  return (
    <div className="bg-white rounded-2xl border border-cream-200 shadow-sm overflow-hidden">
      <div className={`${color} px-6 py-4 flex items-center gap-3`}>
        <Icon size={22} className="text-white" />
        <h2 className="font-serif text-xl text-white">{title}</h2>
      </div>
      <div className="px-6 py-6 space-y-4 text-wood-700 text-sm leading-relaxed">
        {children}
      </div>
    </div>
  )
}

function Point({ children }) {
  return (
    <div className="flex gap-3">
      <span className="text-wood-400 mt-0.5 shrink-0">▪</span>
      <p>{children}</p>
    </div>
  )
}

export default function ShopPoliciesPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-bark-800 text-white py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <p className="text-wood-300 text-sm uppercase tracking-widest mb-2">Vishwakarma Furnitures</p>
          <h1 className="font-serif text-4xl sm:text-5xl text-cream-100 mb-4">Shop Policies</h1>
          <p className="text-cream-300 max-w-xl">
            We believe in complete transparency. Read our policies to understand how we handle returns, cancellations, and deliveries.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">

        {/* Return Policy */}
        <PolicySection icon={RotateCcw} title="Return & Exchange Policy" color="bg-wood-600">
          <p className="font-medium text-bark-800">We stand behind every piece of furniture we craft. Your satisfaction is our priority.</p>

          <div className="space-y-2">
            <h3 className="font-semibold text-bark-700">Eligible for Return:</h3>
            <Point>Items damaged during delivery (report within <strong>48 hours</strong> of delivery with photos).</Point>
            <Point>Manufacturing defects — wrong size, broken joints, or finish issues found within <strong>7 days</strong> of delivery.</Point>
            <Point>Items significantly different from what was ordered.</Point>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-bark-700">Not Eligible for Return:</h3>
            <Point>Custom-made or made-to-order furniture pieces.</Point>
            <Point>Items damaged due to misuse, improper assembly, or self-modification.</Point>
            <Point>Minor variations in wood grain, shade, or finish (natural characteristics of wood).</Point>
            <Point>Items reported after the 7-day window.</Point>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-bark-700">Return Process:</h3>
            <Point>Contact us via WhatsApp or phone with your order ID and photos of the issue.</Point>
            <Point>Our team will inspect and confirm eligibility within 2 business days.</Point>
            <Point>Approved returns: we'll arrange pickup at no charge to you.</Point>
            <Point>Refund or replacement will be processed within <strong>7–10 business days</strong> after return receipt.</Point>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-amber-800 text-xs font-medium">📞 To initiate a return, contact us at <strong>+91 84215 12605</strong> or email us.</p>
          </div>
        </PolicySection>

        {/* Cancellation Policy */}
        <PolicySection icon={XCircle} title="Cancellation Policy" color="bg-bark-700">
          <p className="font-medium text-bark-800">Orders may be cancelled depending on their current status.</p>

          <div className="overflow-hidden rounded-xl border border-cream-200">
            <table className="w-full text-sm">
              <thead className="bg-bark-800 text-white">
                <tr>
                  <th className="px-4 py-3 text-left">Order Status</th>
                  <th className="px-4 py-3 text-left">Cancellation</th>
                  <th className="px-4 py-3 text-left">Refund</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Pending',     'Free cancellation',         'Full refund within 3–5 days'],
                  ['Confirmed',   'Cancellation on request',   'Full refund within 5–7 days'],
                  ['Processing',  'Contact us immediately',    'Partial refund (minus labour cost)'],
                  ['Shipped',     'Not cancellable',           'Follow return process'],
                  ['Delivered',   'Not cancellable',           'Follow return policy'],
                ].map(([status, cancel, refund], i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-cream-50'}>
                    <td className="px-4 py-3 font-medium text-bark-700">{status}</td>
                    <td className="px-4 py-3 text-wood-600">{cancel}</td>
                    <td className="px-4 py-3 text-wood-600">{refund}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-bark-700">Custom Orders:</h3>
            <Point>Custom-made or personalised furniture orders cannot be cancelled once production begins.</Point>
            <Point>A 30% deposit is required for custom orders and is non-refundable upon cancellation.</Point>
          </div>

          <Point>Refunds for online payments (Razorpay) are processed to the original payment source.</Point>
          <Point>COD order cancellations do not require any refund if cancelled before delivery.</Point>
        </PolicySection>

        {/* Delivery Policy */}
        <PolicySection icon={Truck} title="Delivery Policy" color="bg-green-700">
          <p className="font-medium text-bark-800">We deliver across Maharashtra and beyond. Delivery charges are based on your pincode.</p>

          <div className="space-y-2">
            <h3 className="font-semibold text-bark-700">How Delivery Charges Work:</h3>
            <Point>Delivery charges are calculated based on your <strong>delivery pincode</strong>, entered during checkout.</Point>
            <Point>Free delivery is available for pincodes within Faizpur (425503) and immediately surrounding areas.</Point>
            <Point>For other areas, a fixed charge is applied based on your location — shown in the checkout screen.</Point>
            <Point>Contact us for pincodes not listed; we provide custom quotes.</Point>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-bark-700">Sample Delivery Charges:</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                ['Faizpur (425503)', '₹0 FREE'],
                ['Jalgaon (425001)', '₹80'],
                ['Amalner (425201)', '₹120'],
                ['Dhule (424001)',   '₹250'],
                ['Nashik (422001)',  '₹450'],
                ['Pune (411001)',    '₹600'],
                ['Mumbai (400001)', '₹800'],
                ['Nagpur (440001)', '₹500'],
                ['Other areas',     'Custom'],
              ].map(([area, charge]) => (
                <div key={area} className="bg-cream-50 border border-cream-200 rounded-lg px-3 py-2 text-xs">
                  <p className="font-medium text-bark-700">{area}</p>
                  <p className="text-green-700 font-semibold">{charge}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-bark-700">Delivery Timelines:</h3>
            <Point>Ready-stock items: <strong>3–7 business days</strong> depending on location.</Point>
            <Point>Custom / made-to-order items: <strong>15–30 business days</strong> (informed at order confirmation).</Point>
            <Point>Assembly service is available on request for an additional charge.</Point>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-bark-700">Important Notes:</h3>
            <Point>All items are carefully packed. Inspect the package before signing the delivery receipt.</Point>
            <Point>Report visible damage to the delivery agent and take photos immediately.</Point>
            <Point>We are not responsible for damage caused after the delivery confirmation signature.</Point>
          </div>
        </PolicySection>

        {/* Contact */}
        <div className="bg-bark-800 rounded-2xl p-8 text-white text-center">
          <h2 className="font-serif text-2xl text-cream-100 mb-3">Need Help?</h2>
          <p className="text-cream-300 mb-6 text-sm">Our team is happy to assist you with any queries about our policies.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="tel:+918421512605" className="flex items-center gap-2 bg-wood-600 hover:bg-wood-500 transition-colors px-5 py-3 rounded-xl text-sm font-medium">
              <Phone size={16} /> +91 84215 12605
            </a>
            <a href={`mailto:${import.meta.env.VITE_CONTACT_EMAIL || 'vishwakarma@example.com'}`}
              className="flex items-center gap-2 border border-cream-600 hover:border-wood-400 transition-colors px-5 py-3 rounded-xl text-sm font-medium">
              <Mail size={16} /> Email Us
            </a>
          </div>
          <p className="flex items-center justify-center gap-2 text-cream-400 text-xs mt-6">
            <MapPin size={12} /> Faizpur, Jalgaon District, Maharashtra - 425503
          </p>
        </div>
      </div>
    </div>
  )
}
