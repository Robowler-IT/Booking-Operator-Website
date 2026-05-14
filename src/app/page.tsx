'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ThemeToggle from '@/components/ThemeToggle'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const hasEnv = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabase = hasEnv ? createClient() : null

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { setError('Email and password required'); return }
    if (!supabase) { setError('Configuration error. Contact admin.'); return }
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) {
      setError('Invalid credentials. Please try again.')
      setLoading(false)
      return
    }
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── Left branding panel (lg+) ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12
                      bg-gradient-to-br from-green-600 to-green-800
                      dark:from-green-900/60 dark:to-black">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🏏</span>
          <span className="text-white font-black text-xl tracking-tight">Cricket Arena</span>
        </div>

        <div>
          <h1 className="text-4xl font-black text-white leading-tight mb-4">
            Operator<br />Command Centre
          </h1>
          <p className="text-green-100/80 text-base leading-relaxed max-w-sm">
            Manage bookings, check in players, load arena sessions and
            track today&apos;s revenue — all from one screen.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {['Real-time booking updates', 'Session loading & difficulty control', 'Walk-in booking in seconds'].map(f => (
            <div key={f} className="flex items-center gap-2 text-green-100/80 text-sm">
              <span className="w-4 h-4 rounded-full bg-green-400/30 flex items-center justify-center text-green-300 text-[10px]">✓</span>
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* ── Right login panel ── */}
      <div className="flex-1 flex flex-col min-h-screen bg-slate-50 dark:bg-[#0a0a0a]">

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-[#1f1f1f]">
          <div className="flex items-center gap-2 lg:hidden">
            <span className="text-xl">🏏</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">Cricket Arena</span>
          </div>
          <div className="lg:ml-auto">
            <ThemeToggle />
          </div>
        </div>

            {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">

            {!hasEnv && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/40 rounded-xl p-4 mb-6">
                <p className="text-yellow-700 dark:text-yellow-400 text-sm font-semibold">Configuration Required</p>
                <p className="text-yellow-600 dark:text-yellow-500 text-xs mt-1">Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel environment variables.</p>
              </div>
            )}

            {/* Heading */}
            <div className="mb-8">
              <div className="w-12 h-12 rounded-2xl bg-green-500/10 dark:bg-green-500/15 flex items-center justify-center text-2xl mb-4">
                🏟️
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">Sign In</h2>
              <p className="text-slate-500 dark:text-gray-500 text-sm">Operator Portal — Cricket Arena</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-widest mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@arena.com"
                  className="input-dark"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-widest mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-dark"
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl p-3">
                  <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-3 mt-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in...
                  </>
                ) : 'Sign In to Dashboard'}
              </button>
            </form>

            <p className="text-center text-slate-400 dark:text-gray-600 text-xs mt-8">
              Authorised operators only. Contact your franchise manager for access.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
