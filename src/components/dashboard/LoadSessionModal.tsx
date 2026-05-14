'use client'

import { useState } from 'react'
import { Booking } from './BookingRow'

const MODE_LABELS: Record<string, string> = {
  solo_target: 'Target Chase', solo_speed: 'Speed Challenge',
  solo_accuracy: 'Nets Practice', solo_survival: 'Survival Mode',
  '1v1_over_battle': 'Full Innings', '1v1_powerplay_duel': 'Target Chase',
  '1v1_last_man_standing': 'Sudden Death', gully_match: 'Batting Carnival',
  gully_street_league: 'Elimination', gully_tournament: 'Powerplay Slog',
}

interface Props {
  booking: Booking
  onClose: () => void
  onSubmit: (otp: string, tabletSlot: number) => Promise<void>
}

export default function LoadSessionModal({ booking, onClose, onSubmit }: Props) {
  const [otp, setOtp] = useState('')
  const [tabletSlot, setTabletSlot] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const paymentBlocked = booking.payment_status !== 'paid'

  const handleSubmit = async () => {
    if (paymentBlocked) return
    if (!otp.trim()) { setError('Enter the OTP code from the player\'s booking'); return }
    setLoading(true)
    setError('')
    try { await onSubmit(otp.trim(), tabletSlot) }
    catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load session.'
      setError(msg)
    }
    finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card-dark rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Load Session</h3>
            <p className="text-slate-500 dark:text-gray-500 text-sm truncate max-w-[280px]">
              {booking.player_name} · {MODE_LABELS[booking.game_mode] ?? booking.game_mode}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1a1a1a] transition-colors">✕</button>
        </div>

        <div className="space-y-5">

          {/* Payment gate warning */}
          {paymentBlocked && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40">
              <span className="text-xl shrink-0">⚠️</span>
              <div>
                <div className="text-sm font-semibold text-amber-700 dark:text-amber-400">Payment not confirmed</div>
                <div className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
                  Confirm the player&apos;s payment before loading the session. Use the <strong>Confirm Pay</strong> button on the booking.
                </div>
              </div>
            </div>
          )}

          {/* OTP entry */}
          <div className={paymentBlocked ? 'opacity-40 pointer-events-none select-none' : ''}>
            <label className="block text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-widest mb-1.5">
              Player OTP / QR Code
            </label>
            <input
              value={otp}
              onChange={e => setOtp(e.target.value.toUpperCase())}
              placeholder="e.g. CR-4829"
              maxLength={10}
              className="input-dark font-mono text-lg tracking-widest text-center"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
            <p className="text-xs text-slate-400 dark:text-gray-600 mt-1.5 text-center">
              Ask the player to show their booking OTP or scan the QR code
            </p>
          </div>

          {/* Tablet slot */}
          <div className={paymentBlocked ? 'opacity-40 pointer-events-none select-none' : ''}>
            <label className="block text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-widest mb-2">
              Assign Tablet
            </label>
            <div className="flex gap-2">
              {[1, 2, 3].map(s => (
                <button key={s} onClick={() => setTabletSlot(s)}
                  className={`flex-1 rounded-xl border py-2.5 text-sm font-bold transition-all
                    ${tabletSlot === s
                      ? 'border-green-500 bg-green-500 text-black'
                      : 'border-slate-200 dark:border-[#2a2a2a] text-slate-500 dark:text-gray-500 hover:border-green-400'}`}>
                  Tablet {s}
                </button>
              ))}
            </div>
          </div>

          {/* Info note — difficulty set on tablet by player */}
          {!paymentBlocked && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-[#151515] border border-slate-100 dark:border-[#222]">
              <span className="text-base shrink-0">ℹ️</span>
              <p className="text-xs text-slate-500 dark:text-gray-500 leading-relaxed">
                The player will choose their <strong className="text-slate-700 dark:text-gray-300">difficulty</strong> and <strong className="text-slate-700 dark:text-gray-300">bowler profile</strong> on the tablet after entering the OTP.
              </p>
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="btn-secondary flex-1 justify-center py-3">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={loading || paymentBlocked}
              className="btn-primary flex-1 justify-center py-3 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Loading...
                </>
              ) : 'Load Session'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
