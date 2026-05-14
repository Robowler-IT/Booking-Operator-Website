export interface Booking {
  id: string
  player_name: string
  slot_time: string
  duration: number
  game_mode: string
  booking_status: string
  payment_status: string
  kit_approved: boolean
  otp_code?: string
  is_walkin?: boolean
}

const MODE_LABELS: Record<string, string> = {
  solo_target: 'Target Chase', solo_speed: 'Speed Challenge',
  solo_accuracy: 'Nets Practice', solo_survival: 'Survival Mode',
  '1v1_over_battle': '1v1 Over Battle', '1v1_powerplay_duel': '1v1 Powerplay',
  '1v1_last_man_standing': '1v1 Last Man', gully_match: 'Gully Match',
  gully_street_league: 'Street League', gully_tournament: 'Tournament',
}

interface Props {
  booking: Booking
  onCheckIn: (id: string) => void
  onConfirmPayment: (id: string) => void
  onLoadSession: (id: string) => void
  onKitToggle: (id: string, current: boolean) => void
}

export default function BookingRow({ booking: b, onCheckIn, onConfirmPayment, onLoadSession, onKitToggle }: Props) {
  const statusBadge =
    b.booking_status === 'checked_in' ? 'badge badge-green' :
    b.booking_status === 'completed'  ? 'badge badge-slate' :
    'badge badge-amber'

  const payBadge =
    b.payment_status === 'paid' ? 'badge badge-green' : 'badge badge-amber'

  const isActive = b.booking_status === 'confirmed' || b.booking_status === 'checked_in'

  return (
    <div className={`card-dark rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3
                     ${b.booking_status === 'checked_in' ? 'border-green-400/30 dark:border-green-500/20' : ''}`}>

      {/* Time pill */}
      <div className="shrink-0 w-16 text-center">
        <div className="text-sm font-black text-slate-900 dark:text-white">{b.slot_time}</div>
        <div className="text-[10px] text-slate-400 dark:text-gray-600">{b.duration} min</div>
      </div>

      {/* Divider */}
      <div className="hidden sm:block w-px h-10 bg-slate-100 dark:bg-[#1f1f1f] shrink-0" />

      {/* Player info */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
          <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">{b.player_name}</span>
          {b.is_walkin && <span className="badge badge-blue">Walk-in</span>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-gray-500">
            {MODE_LABELS[b.game_mode] ?? b.game_mode}
          </span>
          {b.otp_code && (
            <span className="text-[10px] font-mono bg-slate-100 dark:bg-[#1a1a1a] text-slate-600 dark:text-gray-400 px-1.5 py-0.5 rounded">
              OTP: {b.otp_code}
            </span>
          )}
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
        <span className={statusBadge}>{b.booking_status.replace('_', ' ')}</span>
        <span className={payBadge}>{b.payment_status}</span>
      </div>

      {/* Kit toggle — only shown for active bookings */}
      {isActive && (
        <button
          onClick={() => onKitToggle(b.id, b.kit_approved)}
          title={b.kit_approved ? 'Hard/Extreme unlocked — click to lock' : 'Hard/Extreme locked — click to unlock (player wearing kit)'}
          className={`shrink-0 flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-all
            ${b.kit_approved
              ? 'border-orange-500/50 bg-orange-500/10 text-orange-500 dark:text-orange-400 hover:bg-orange-500/20'
              : 'border-slate-200 dark:border-[#2a2a2a] text-slate-400 dark:text-gray-600 hover:border-orange-500/40 hover:text-orange-500'
            }`}
        >
          {b.kit_approved ? (
            <>
              <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Hard / Extreme
            </>
          ) : (
            <>
              <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" />
              </svg>
              Hard / Extreme
            </>
          )}
        </button>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 shrink-0">
        {b.booking_status === 'confirmed' && (
          <button onClick={() => onCheckIn(b.id)}
            className="btn-primary text-xs py-1.5 px-3">
            Check In
          </button>
        )}
        {b.booking_status === 'checked_in' && b.payment_status !== 'paid' && (
          <button onClick={() => onConfirmPayment(b.id)}
            className="btn-primary text-xs py-1.5 px-3 bg-amber-500 hover:bg-amber-400">
            Confirm Pay
          </button>
        )}
        {isActive && (
          <button onClick={() => onLoadSession(b.id)}
            className="btn-primary text-xs py-1.5 px-3">
            Load Session
          </button>
        )}
      </div>
    </div>
  )
}
