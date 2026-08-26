// src/components/PhoneAuth.jsx
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function PhoneAuth({ onSignedIn }) {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState('phone')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function sendOtp(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ phone })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setStep('otp')
    }
  }

  async function verifyOtp(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { data, error } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      onSignedIn?.(data.session)
    }
  }

  if (step === 'phone') {
    return (
      <form onSubmit={sendOtp}>
        <label htmlFor="phone">Phone number</label>
        <input id="phone" type="tel" placeholder="+27821234567" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={loading}>{loading ? 'Sending…' : 'Send code'}</button>
      </form>
    )
  }

  return (
    <form onSubmit={verifyOtp}>
      <label htmlFor="otp">Enter the code we sent you</label>
      <input id="otp" type="text" inputMode="numeric" value={otp} onChange={(e) => setOtp(e.target.value)} required />
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={loading}>{loading ? 'Verifying…' : 'Verify'}</button>
    </form>
  )
}
