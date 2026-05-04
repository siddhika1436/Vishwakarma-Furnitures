// pages/SignupPage.jsx — REPLACE EXISTING FILE
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, UserPlus } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function SignupPage() {
  const { signUp }  = useAuth()
  const navigate    = useNavigate()
  const [form, setForm]         = useState({ full_name: '', email: '', password: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.full_name || !form.email || !form.password) { toast.error('Please fill all fields'); return }
    if (!EMAIL_RE.test(form.email)) { toast.error('Invalid email format'); return }
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return }

    setLoading(true)
    const { error } = await signUp(form.email, form.password, form.full_name)
    if (error) {
      toast.error(error.message || 'Signup failed')
    } else {
      toast.success('Account created! Check your email for the OTP.')
      // Pass email to verify page via router state
      navigate('/verify-email', { state: { email: form.email.toLowerCase().trim() } })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-gradient-to-br from-cream-50 to-wood-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl border border-cream-200 overflow-hidden">
          <div className="bg-bark-800 px-8 py-10 text-center">
            <div className="w-14 h-14 bg-wood-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-serif font-bold text-2xl">V</span>
            </div>
            <h1 className="font-serif text-3xl text-cream-100">Create Account</h1>
            <p className="text-cream-400 text-sm mt-1">Join Vishwakarma Furnitures</p>
          </div>
          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-bark-700 mb-1.5">Full Name</label>
              <input name="full_name" value={form.full_name} onChange={handleChange}
                className="input-field" placeholder="Enter your name" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-bark-700 mb-1.5">Email Address</label>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                className="input-field" placeholder="you@example.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-bark-700 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} name="password"
                  value={form.password} onChange={handleChange}
                  className="input-field pr-10" placeholder="Min. 6 characters" required />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-wood-400 hover:text-wood-600">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-bark-700 mb-1.5">Confirm Password</label>
              <input type="password" name="confirm" value={form.confirm} onChange={handleChange}
                className="input-field" placeholder="Repeat your password" required />
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3.5">
              {loading
                ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                : <><UserPlus size={16} /> Create Account</>}
            </button>
            <p className="text-center text-sm text-wood-600">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-wood-700 hover:text-wood-900">Sign In</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
