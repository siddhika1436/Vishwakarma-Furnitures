// pages/ForgotPasswordPage.jsx — 3-step forgot password flow
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Key, Lock, ArrowLeft, CheckCircle } from 'lucide-react'
import { auth } from '../utils/api'
import toast from 'react-hot-toast'

const STEPS = { EMAIL: 'email', OTP: 'otp', PASSWORD: 'password', DONE: 'done' }

export default function ForgotPasswordPage() {
  const navigate    = useNavigate()
  const [step, setStep] = useState(STEPS.EMAIL)
  const [email, setEmail]       = useState('')
  const [otp, setOtp]           = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [loading, setLoading]   = useState(false)

  // Step 1 — Send OTP
  async function handleSendOTP(e) {
    e.preventDefault()
    if (!email) { toast.error('Enter your email'); return }
    setLoading(true)
    const { error } = await auth.forgotPassword({ email })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('OTP sent to your email!')
    setStep(STEPS.OTP)
  }

  // Step 2 — Verify OTP
  async function handleVerifyOTP(e) {
    e.preventDefault()
    if (!otp || otp.length < 6) { toast.error('Enter the 6-digit OTP'); return }
    setLoading(true)
    const { data, error } = await auth.verifyResetOTP({ email, otp })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    setResetToken(data.reset_token)
    toast.success('OTP verified!')
    setStep(STEPS.PASSWORD)
  }

  // Step 3 — Set new password
  async function handleResetPassword(e) {
    e.preventDefault()
    if (!newPassword || newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return }
    if (newPassword !== confirm) { toast.error('Passwords do not match'); return }
    setLoading(true)
    const { error } = await auth.resetPassword({ reset_token: resetToken, new_password: newPassword })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    setStep(STEPS.DONE)
  }

  if (step === STEPS.DONE) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-cream-50">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-500" />
          </div>
          <h2 className="font-serif text-3xl text-bark-800 mb-3">Password Reset!</h2>
          <p className="text-wood-600 mb-8">Your password has been updated successfully. Please log in with your new password.</p>
          <Link to="/login" className="btn-primary w-full block text-center">Go to Login</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-cream-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        <Link to="/login" className="flex items-center gap-1.5 text-wood-500 hover:text-wood-700 text-sm mb-6 transition-colors">
          <ArrowLeft size={14} /> Back to Login
        </Link>

        <h1 className="font-serif text-3xl text-bark-800 mb-2">Forgot Password</h1>

        {/* Progress dots */}
        <div className="flex gap-2 mb-8">
          {[STEPS.EMAIL, STEPS.OTP, STEPS.PASSWORD].map((s, i) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${
              step === s ? 'bg-wood-500' :
              Object.keys(STEPS).indexOf(step) > i ? 'bg-wood-300' : 'bg-cream-200'
            }`} />
          ))}
        </div>

        {/* Step 1: Email */}
        {step === STEPS.EMAIL && (
          <form onSubmit={handleSendOTP} className="space-y-5">
            <p className="text-wood-600 text-sm">Enter your registered email address and we'll send you an OTP to reset your password.</p>
            <div>
              <label className="block text-sm font-medium text-bark-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-wood-400" />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="input-field pl-9" placeholder="you@example.com" required
                />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Sending OTP…' : 'Send OTP'}
            </button>
          </form>
        )}

        {/* Step 2: OTP */}
        {step === STEPS.OTP && (
          <form onSubmit={handleVerifyOTP} className="space-y-5">
            <p className="text-wood-600 text-sm">
              We sent a 6-digit OTP to <strong>{email}</strong>. Enter it below. It expires in 10 minutes.
            </p>
            <div>
              <label className="block text-sm font-medium text-bark-700 mb-1">OTP Code</label>
              <div className="relative">
                <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-wood-400" />
                <input
                  type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,'').slice(0,6))}
                  className="input-field pl-9 text-center text-xl tracking-widest font-bold"
                  placeholder="123456" maxLength={6} required
                />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Verifying…' : 'Verify OTP'}
            </button>
            <button type="button" onClick={() => { setStep(STEPS.EMAIL); setOtp('') }}
              className="w-full text-sm text-wood-500 hover:text-wood-700 transition-colors">
              ← Resend OTP
            </button>
          </form>
        )}

        {/* Step 3: New password */}
        {step === STEPS.PASSWORD && (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <p className="text-wood-600 text-sm">Choose a strong new password for your account.</p>
            <div>
              <label className="block text-sm font-medium text-bark-700 mb-1">New Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-wood-400" />
                <input
                  type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  className="input-field pl-9" placeholder="Min. 6 characters" required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-bark-700 mb-1">Confirm Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-wood-400" />
                <input
                  type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  className="input-field pl-9" placeholder="Repeat password" required
                />
              </div>
              {confirm && newPassword !== confirm && (
                <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
              )}
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Resetting…' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
