'use client'

import { useState, useEffect } from 'react'

const FORMATS = [
  {
    key: 'solo', label: 'Solo', icon: '🧍',
    modes: [
      { id: 'solo_target',   name: 'Target Chase',   desc: 'Score a set target in fixed balls.' },
      { id: 'solo_speed',    name: 'Speed Challenge', desc: 'Speed & swing increase every over.' },
      { id: 'solo_accuracy', name: 'Nets Practice',   desc: 'Free practice. No scoring.' },
      { id: 'solo_survival', name: 'Survival Mode',   desc: 'Survive as many balls as possible.' },
    ],
  },
  {
    key: '1v1', label: '1v1', icon: '⚔️',
    modes: [
      { id: '1v1_over_battle',       name: 'Full Innings',  desc: 'Both bat full innings. Highest wins.' },
      { id: '1v1_powerplay_duel',    name: 'Target Chase',  desc: 'P1 sets target; P2 chases.' },
      { id: '1v1_last_man_standing', name: 'Sudden Death',  desc: 'Alternate balls — first out loses.' },
    ],
  },
  {
    key: 'gully', label: 'Gully Cricket', icon: '🏘️',
    modes: [
      { id: 'gully_match',         name: 'Batting Carnival', desc: 'Rotation batting — team total wins.' },
      { id: 'gully_street_league', name: 'Elimination',      desc: 'Get out = eliminated. Last wins.' },
      { id: 'gully_tournament',    name: 'Powerplay Slog',   desc: 'Max sixes in 6 balls each.' },
    ],
  },
]


interface Props {
  onClose: () => void
  onSubmit: (playerName: string, mode: string, slot: string) => Promise<void>
}

export default function WalkInModal({ onClose, onSubmit }: Props) {
  const [slot, setSlot] = useState('')
  const [slots, setSlots] = useState<{ time: string; available: boolean; past: boolean; booked: boolean }[]>([])
  const [slotsLoading, setSlotsLoading] = useState(true)
  const [formatKey, setFormatKey] = useState('solo')
  const [mode, setMode]           = useState('solo_target')

  useEffect(() => {
    fetch('/api/slots')
      .then(r => r.json())
      .then(d => setSlots(d.slots ?? []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false))
  }, [])

  // Solo
  const [soloName, setSoloName] = useState('')

  // 1v1
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')

  // Gully
  const [teamA, setTeamA] = useState([''])
  const [teamB, setTeamB] = useState([''])

  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const currentFormat = FORMATS.find(f => f.key === formatKey)!

  const handleFormatChange = (key: string) => {
    setFormatKey(key)
    setMode(FORMATS.find(f => f.key === key)!.modes[0].id)
    setError('')
  }

  /* ── Validation ── */
  let canSubmit = !!slot
  if (canSubmit && formatKey === 'solo')  canSubmit = soloName.trim().length >= 2
  if (canSubmit && formatKey === '1v1')   canSubmit = p1.trim().length >= 2 && p2.trim().length >= 2
  if (canSubmit && formatKey === 'gully') canSubmit = teamA.some(n => n.trim().length >= 2) && teamB.some(n => n.trim().length >= 2)

  /* ── Build display name string ── */
  const buildPlayerName = (): string => {
    if (formatKey === 'solo')  return soloName.trim()
    if (formatKey === '1v1')   return [p1, p2].filter(Boolean).map(n => n.trim()).join(' vs ')
    const a = teamA.filter(n => n.trim()).map(n => n.trim()).join(', ')
    const b = teamB.filter(n => n.trim()).map(n => n.trim()).join(', ')
    return `Team A: ${a} | Team B: ${b}`
  }

  const handleSubmit = async () => {
    if (!slot) { setError('Select a slot time'); return }
    if (!canSubmit) { setError('Fill in all required player names (min 2 chars each)'); return }
    setLoading(true)
    setError('')
    try { await onSubmit(buildPlayerName(), mode, slot) }
    catch { setError('Failed to create booking. Try again.') }
    finally { setLoading(false) }
  }

  /* ── Gully helpers ── */
  const updateTeamA = (i: number, v: string) => { const a = [...teamA]; a[i] = v; setTeamA(a) }
  const updateTeamB = (i: number, v: string) => { const b = [...teamB]; b[i] = v; setTeamB(b) }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="card-dark rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Walk-in Booking</h3>
            <p className="text-slate-500 dark:text-gray-500 text-sm">Add a same-day walk-in player</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1a1a1a] transition-colors">✕</button>
        </div>

        <div className="space-y-4">

          {/* Slot time grid */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-widest">Slot Time</label>
              <div className="flex items-center gap-3 text-[10px] text-slate-400 dark:text-gray-600">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-500/20 border border-green-500/50 inline-block" />Free</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-slate-200 dark:bg-[#2a2a2a] inline-block" />Booked</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-slate-100 dark:bg-[#111] inline-block opacity-50" />Past</span>
              </div>
            </div>
            {slotsLoading ? (
              <div className="text-xs text-slate-400 dark:text-gray-600 py-3 text-center">Loading slots...</div>
            ) : (
              <div className="grid grid-cols-5 gap-1.5">
                {slots.map(({ time, available, past, booked }) => (
                  <button
                    key={time}
                    disabled={!available}
                    onClick={() => setSlot(time)}
                    title={
                      past   ? `${time} — Past` :
                      booked ? `${time} — Already booked` :
                               time
                    }
                    className={`rounded-lg border py-1.5 text-[11px] font-mono font-semibold transition-all
                      ${past
                        ? 'border-slate-100 dark:border-[#1a1a1a] text-slate-200 dark:text-[#333] cursor-not-allowed opacity-40'
                        : booked
                        ? 'border-slate-200 dark:border-[#222] bg-slate-100 dark:bg-[#1a1a1a] text-slate-300 dark:text-gray-700 cursor-not-allowed line-through'
                        : slot === time
                        ? 'border-green-500 bg-green-500 text-black'
                        : 'border-slate-200 dark:border-[#2a2a2a] text-slate-600 dark:text-gray-400 hover:border-green-500 hover:text-green-600 dark:hover:text-green-400'
                      }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Format tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-widest mb-2">Format</label>
            <div className="flex gap-1.5">
              {FORMATS.map(f => (
                <button key={f.key} onClick={() => handleFormatChange(f.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all flex-1 justify-center
                    ${formatKey === f.key
                      ? 'border-green-500 bg-green-500/10 text-green-600 dark:text-green-400'
                      : 'border-slate-200 dark:border-[#2a2a2a] text-slate-500 dark:text-gray-500 hover:border-slate-300 dark:hover:border-[#444]'}`}>
                  <span>{f.icon}</span>{f.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Player Name Inputs (format-aware) ── */}

          {/* Solo */}
          {formatKey === 'solo' && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-widest mb-1.5">Player Name</label>
              <input value={soloName} onChange={e => setSoloName(e.target.value)} placeholder="e.g. Ahmed Raza" maxLength={30} className="input-dark" />
            </div>
          )}

          {/* 1v1 */}
          {formatKey === '1v1' && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-widest mb-2">Player Names</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="card-dark rounded-xl p-3 border-blue-500/20">
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-5 h-5 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-[10px] font-black text-blue-500">1</div>
                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Batter</span>
                  </div>
                  <input value={p1} onChange={e => setP1(e.target.value)} placeholder="Player 1…" maxLength={30} className="input-dark text-sm" />
                </div>
                <div className="card-dark rounded-xl p-3 border-orange-500/20">
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-5 h-5 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-[10px] font-black text-orange-500">2</div>
                    <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Challenger</span>
                  </div>
                  <input value={p2} onChange={e => setP2(e.target.value)} placeholder="Player 2…" maxLength={30} className="input-dark text-sm" />
                </div>
              </div>
              <div className="flex items-center gap-3 mt-3">
                <div className="flex-1 border-t border-slate-100 dark:border-[#1f1f1f]" />
                <span className="text-[10px] font-bold text-slate-400 dark:text-gray-600 tracking-widest">VS</span>
                <div className="flex-1 border-t border-slate-100 dark:border-[#1f1f1f]" />
              </div>
            </div>
          )}

          {/* Gully */}
          {formatKey === 'gully' && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-widest mb-2">Team Players</label>
              <div className="grid grid-cols-2 gap-3">
                {/* Team A */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-5 h-5 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-[10px] font-black text-green-500">A</div>
                    <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Team A</span>
                    <span className="ml-auto text-[9px] text-slate-400">{teamA.filter(Boolean).length}p</span>
                  </div>
                  <div className="space-y-1.5">
                    {teamA.map((n, i) => (
                      <div key={i} className="flex gap-1.5 items-center">
                        <input value={n} onChange={e => updateTeamA(i, e.target.value)} placeholder={`Player ${i + 1}`} maxLength={25} className="input-dark text-sm flex-1" />
                        {teamA.length > 1 && (
                          <button onClick={() => setTeamA(teamA.filter((_, j) => j !== i))}
                            className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-[#2a2a2a] text-slate-400 hover:border-red-400/50 hover:text-red-400 transition-colors shrink-0">
                            <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" /></svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setTeamA([...teamA, ''])}
                    className="mt-1.5 w-full flex items-center justify-center gap-1 text-[10px] font-medium text-slate-400 hover:text-green-500 border border-dashed border-slate-200 dark:border-[#2a2a2a] rounded-lg py-1.5 hover:border-green-500/40 transition-colors">
                    <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
                    Add player
                  </button>
                </div>

                {/* Team B */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-5 h-5 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-[10px] font-black text-orange-500">B</div>
                    <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Team B</span>
                    <span className="ml-auto text-[9px] text-slate-400">{teamB.filter(Boolean).length}p</span>
                  </div>
                  <div className="space-y-1.5">
                    {teamB.map((n, i) => (
                      <div key={i} className="flex gap-1.5 items-center">
                        <input value={n} onChange={e => updateTeamB(i, e.target.value)} placeholder={`Player ${i + 1}`} maxLength={25} className="input-dark text-sm flex-1" />
                        {teamB.length > 1 && (
                          <button onClick={() => setTeamB(teamB.filter((_, j) => j !== i))}
                            className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-[#2a2a2a] text-slate-400 hover:border-red-400/50 hover:text-red-400 transition-colors shrink-0">
                            <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" /></svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setTeamB([...teamB, ''])}
                    className="mt-1.5 w-full flex items-center justify-center gap-1 text-[10px] font-medium text-slate-400 hover:text-orange-500 border border-dashed border-slate-200 dark:border-[#2a2a2a] rounded-lg py-1.5 hover:border-orange-500/40 transition-colors">
                    <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
                    Add player
                  </button>
                </div>
              </div>

              {/* Team totals */}
              <div className="mt-3 card-dark rounded-xl px-3 py-2 flex items-center justify-between text-xs">
                <span><span className="font-bold text-green-500">Team A:</span> <span className="text-slate-600 dark:text-gray-400">{teamA.filter(Boolean).length} players</span></span>
                <span className="text-slate-300 dark:text-gray-700 text-[10px]">vs</span>
                <span><span className="text-slate-600 dark:text-gray-400">{teamB.filter(Boolean).length} players</span> <span className="font-bold text-orange-500">Team B</span></span>
              </div>
            </div>
          )}

          {/* Mode cards */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-widest mb-2">Game Mode</label>
            <div className="grid grid-cols-1 gap-1.5">
              {currentFormat.modes.map(m => (
                <button key={m.id} onClick={() => setMode(m.id)}
                  className={`text-left rounded-xl border px-3 py-2.5 transition-all flex items-center gap-3
                    ${mode === m.id
                      ? 'border-green-500 bg-green-500/5 ring-1 ring-green-500/20'
                      : 'border-slate-200 dark:border-[#2a2a2a] hover:border-green-500/30'}`}>
                  <div className="flex-1">
                    <div className={`text-sm font-semibold ${mode === m.id ? 'text-green-600 dark:text-green-400' : 'text-slate-900 dark:text-white'}`}>{m.name}</div>
                    <div className="text-xs text-slate-500 dark:text-gray-500 mt-0.5">{m.desc}</div>
                  </div>
                  {mode === m.id && (
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="text-green-500 shrink-0">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="btn-secondary flex-1 justify-center py-2.5">Cancel</button>
            <button onClick={handleSubmit} disabled={loading || !canSubmit}
              className="btn-primary flex-1 justify-center py-2.5 disabled:opacity-50">
              {loading ? 'Creating...' : 'Create Booking'}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
