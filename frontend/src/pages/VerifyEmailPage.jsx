// pages/VerifyEmailPage.jsx — NEW FILE
import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { ShieldCheck, RefreshCw } from 'lucide-react'
import { auth } from '../utils/api'
import toast from 'react-hot-toast'

export default function VerifyEmailPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const email    = location.state?.email || ''

  const [otp, setOtp]           = useState(['', '', '', '', '', ''])
  const [loading, setLoading]   = useState(false)
  const [resending, setResending] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const inputRefs = useRef([])

  // Countdown for resend
  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  // Redirect if no email passed
  useEffect(() => {
    if (!email) navigate('/signup')
  }, [email])

  const handleInput = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const next = [...otp]
    next[index] = value.slice(-1)
    setOtp(next)
    if (value && index < 5) inputRefs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const next   = [...otp]
    for (let i = 0; i < 6; i++) next[i] = pasted[i] || ''
    setOtp(next)
    inputRefs.current[Math.min(pasted.length, 5)]?.focus()
  }

  const handleVerify = async () => {
    const code = otp.join('')
    if (code.length !== 6) { toast.error('Enter the 6-digit OTP'); return }

    setLoading(true)
    const { data, error } = await auth.verifyOTP({ email, otp: code })
    if (error) {
      toast.error(error.message)
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } else {
      toast.success('Email verified! You can now log in.')
      navigate('/login', { replace: true })
    }
    setLoading(false)
  }

  const handleResend = async () => {
    setResending(true)
    const { error } = await auth.resendOTP({ email })
    if (error) toast.error(error.message)
    else { toast.success('New OTP sent!'); setCountdown(60) }
    setResending(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-gradient-to-br from-cream-50 to-wood-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl border border-cream-200 overflow-hidden">
          <div className="bg-bark-800 px-8 py-10 text-center">
            <div className="w-16 h-16 bg-wood-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShieldCheck size={28} className="text-white" />
            </div>
            <h1 className="font-serif text-3xl text-cream-100">Verify Your Email</h1>
            <p className="text-cream-400 text-sm mt-2">
              We sent a 6-digit OTP to<br />
              <span className="text-wood-300 font-medium">{email}</span>
            </p>
          </div>

          <div className="px-8 py-8 space-y-6">
            {/* OTP Boxes */}
            <div className="flex justify-center gap-3" onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => inputRefs.current[i] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleInput(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl
                    border-cream-300 focus:border-wood-500 focus:outline-none focus:ring-2
                    focus:ring-wood-200 text-bark-800 bg-cream-50 transition-all"
                />
              ))}
            </div>

            <button
              onClick={handleVerify}
              disabled={loading || otp.join('').length !== 6}
              className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading
                ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                : 'Verify Email'}
            </button>

            {/* Resend */}
            <div className="text-center text-sm text-wood-600">
              {countdown > 0 ? (
                <span>Resend OTP in <strong>{countdown}s</strong></span>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="flex items-center gap-1.5 mx-auto text-wood-700 font-semibold hover:text-wood-900 transition-colors"
                >
                  <RefreshCw size={14} className={resending ? 'animate-spin' : ''} />
                  {resending ? 'Sending…' : 'Resend OTP'}
                </button>
              )}
            </div>

            <p className="text-center text-xs text-wood-400">
              Wrong email?{' '}
              <Link to="/signup" className="text-wood-600 hover:text-wood-800 font-medium">
                Go back to Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
