'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ThemeToggle from '@/components/ThemeToggle'
import StatsRow from '@/components/dashboard/StatsRow'
import BookingRow, { Booking } from '@/components/dashboard/BookingRow'
import WalkInModal from '@/components/dashboard/WalkInModal'
import LoadSessionModal from '@/components/dashboard/LoadSessionModal'

export default function DashboardPage() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [operator, setOperator] = useState<{ arena_id: string; arena_name: string; name: string } | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [paySummary, setPaySummary] = useState({ paid: 0, pending: 0, cash: 0, total: 0 })
  const [sessionBookingId, setSessionBookingId] = useState<string | null>(null)
  const [walkinOpen, setWalkinOpen] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [clock, setClock] = useState('')

  /* ── Live clock ── */
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  /* ── Toast helper ── */
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  /* ── Bootstrap ── */
  useEffect(() => { loadOperator() }, [])

  async function loadOperator() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }

    const res = await fetch('/api/operator')
    if (!res.ok) { setLoading(false); return }
    const op = await res.json()
    if (op.error) { setLoading(false); return }
    setOperator(op)
    fetchBookings()

    supabase
      .channel('op-bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `arena_id=eq.${op.arena_id}` },
        () => fetchBookings())
      .subscribe()
  }

  async function fetchBookings() {
    const res = await fetch('/api/bookings')
    if (!res.ok) { setLoading(false); return }
    const data = await res.json()
    setBookings((data.bookings ?? []) as Booking[])
    setPaySummary(data.paySummary ?? { paid: 0, pending: 0, cash: 0, total: 0 })
    setLoading(false)
  }

  /* ── Actions ── */
  async function handleKitToggle(bookingId: string, current: boolean) {
    // Optimistic update
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, kit_approved: !current } : b))
    const res = await fetch('/api/bookings/kit', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, kitApproved: !current }),
    })
    if (!res.ok) {
      const e = await res.json().catch(() => ({}))
      // Revert on failure
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, kit_approved: current } : b))
      showToast(e.error ?? 'Failed to update kit status', 'error')
      return
    }
    showToast(!current ? 'Hard & Extreme unlocked for this player' : 'Hard & Extreme locked')
  }

  async function handleCheckIn(bookingId: string) {
    const res = await fetch('/api/bookings/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId }),
    })
    if (!res.ok) { showToast('Failed to check in', 'error'); return }
    fetchBookings()
    showToast('Player checked in successfully')
  }

  async function handleConfirmPayment(bookingId: string) {
    const res = await fetch('/api/bookings/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId }),
    })
    if (!res.ok) { showToast('Failed to confirm payment', 'error'); return }
    fetchBookings()
    showToast('Payment confirmed')
  }

  async function handleLoadSession(otp: string, tabletSlot: number) {
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otp, tabletSlot }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Failed to load session')
    setSessionBookingId(null)
    fetchBookings()
    showToast(`Session loaded for ${data.playerName} on Tablet ${tabletSlot}`)
  }

  async function handleWalkIn(name: string, mode: string, slot: string) {
    const res = await fetch('/api/bookings/walkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, mode, slot }),
    })
    if (!res.ok) { const e = await res.json(); showToast(e.error ?? 'Failed to create walk-in', 'error'); return }
    setWalkinOpen(false)
    fetchBookings()
    showToast('Walk-in booking created')
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  /* ── States ── */
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0a0a0a]">
      <div className="text-center">
        <div className="text-4xl mb-3">🏟️</div>
        <p className="text-slate-500 dark:text-gray-500 text-sm">Loading dashboard...</p>
      </div>
    </div>
  )

  if (!operator) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0a0a0a]">
      <div className="card-dark rounded-2xl p-8 text-center max-w-sm">
        <div className="text-4xl mb-3">⚠️</div>
        <h2 className="font-bold text-slate-900 dark:text-white mb-2">Operator Not Found</h2>
        <p className="text-slate-500 dark:text-gray-500 text-sm mb-4">Your account is not linked to an arena. Contact the franchise admin.</p>
        <button onClick={handleSignOut} className="btn-secondary w-full justify-center">Sign Out</button>
      </div>
    </div>
  )

  const sessionBooking = bookings.find(b => b.id === sessionBookingId) ?? null

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a]">

      {/* ── Sticky Topbar ── */}
      <header className="sticky top-0 z-40 bg-white dark:bg-[#111] border-b border-slate-200 dark:border-[#1f1f1f]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">

          {/* Branding */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xl">🏏</span>
            <div className="hidden sm:block">
              <div className="text-sm font-black text-slate-900 dark:text-white leading-none">{operator.arena_name}</div>
              <div className="text-[10px] text-slate-400 dark:text-gray-600 mt-0.5">Operator: {operator.name}</div>
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Live clock */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 dark:text-gray-500 font-mono">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            {clock}
          </div>

          {/* Actions */}
          <ThemeToggle />
          <button
            onClick={() => setWalkinOpen(true)}
            className="btn-primary text-xs py-2 px-3"
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Walk-in
          </button>
          <button
            onClick={handleSignOut}
            className="btn-secondary text-xs py-2 px-3 text-red-500 dark:text-red-400 border-red-200 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">

        {/* Stats */}
        <StatsRow summary={paySummary} />

        {/* Today's bookings */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Today&apos;s Bookings</h2>
            <p className="text-xs text-slate-500 dark:text-gray-500 mt-0.5">
              {bookings.length} booking{bookings.length !== 1 ? 's' : ''} · {new Date().toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-gray-600">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500/40 border border-green-500" />Checked In</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500/40 border border-amber-500" />Pending</span>
          </div>
        </div>

        {bookings.length === 0 ? (
          <div className="card-dark rounded-2xl p-12 text-center">
            <div className="text-4xl mb-3">📅</div>
            <p className="text-slate-500 dark:text-gray-500">No bookings for today yet.</p>
            <button onClick={() => setWalkinOpen(true)} className="btn-primary mt-4 justify-center">
              Add Walk-in Booking
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {bookings.map(b => (
              <BookingRow
                key={b.id}
                booking={b}
                onCheckIn={handleCheckIn}
                onConfirmPayment={handleConfirmPayment}
                onLoadSession={(id) => setSessionBookingId(id)}
                onKitToggle={handleKitToggle}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold
          ${toast.type === 'success' ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}>
          {toast.msg}
        </div>
      )}

      {/* ── Walk-in Modal ── */}
      {walkinOpen && (
        <WalkInModal onClose={() => setWalkinOpen(false)} onSubmit={handleWalkIn} />
      )}

      {/* ── Load Session Modal ── */}
      {sessionBookingId && sessionBooking && (
        <LoadSessionModal
          booking={sessionBooking}
          onClose={() => setSessionBookingId(null)}
          onSubmit={handleLoadSession}
        />
      )}
    </div>
  )
}
