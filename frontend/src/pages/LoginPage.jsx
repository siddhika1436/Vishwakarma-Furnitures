// pages/LoginPage.jsx — REPLACE EXISTING FILE
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { signIn }  = useAuth()
  const navigate    = useNavigate()
  const [form, setForm]         = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.email || !form.password) { toast.error('Please fill all fields'); return }
    setLoading(true)
    const { data, error } = await signIn(form.email, form.password)

    if (error) {
      // If email not verified, redirect to OTP page
      if (error.code === 'EMAIL_NOT_VERIFIED') {
        toast.error('Please verify your email first.')
        navigate('/verify-email', { state: { email: error.email || form.email } })
      } else {
        toast.error(error.message || 'Login failed')
      }
    } else {
      toast.success('Welcome back!')
      navigate('/')
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
            <h1 className="font-serif text-3xl text-cream-100">Welcome Back</h1>
            <p className="text-cream-400 text-sm mt-1">Sign in to Vishwakarma Furnitures</p>
          </div>
          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
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
                  className="input-field pr-10" placeholder="Your password" required />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-wood-400 hover:text-wood-600">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3.5">
              {loading
                ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                : <><LogIn size={16} /> Sign In</>}
            </button>
            <div className="text-center space-y-2">
              <Link to="/forgot-password" className="block text-sm text-wood-500 hover:text-wood-700 transition-colors">
                Forgot your password?
              </Link>
              <p className="text-sm text-wood-600">
                Don't have an account?{' '}
                <Link to="/signup" className="font-semibold text-wood-700 hover:text-wood-900">Sign Up</Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
