import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// Generate every 30-min slot from 09:00 to 22:30
function allSlots(): string[] {
  const slots: string[] = []
  for (let t = 9 * 60; t < 23 * 60; t += 30) {
    const h = Math.floor(t / 60)
    const m = t % 60
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
  }
  return slots
}

export async function GET() {
  const userClient = await createClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  const { data: op } = await admin
    .from('operators')
    .select('arena_id')
    .eq('email', user.email)
    .maybeSingle()
  if (!op) return NextResponse.json({ error: 'Operator not found' }, { status: 404 })

  const today = new Date().toISOString().split('T')[0]

  const { data: booked } = await admin
    .from('bookings')
    .select('slot_time')
    .eq('arena_id', op.arena_id)
    .eq('date', today)
    .neq('booking_status', 'cancelled')

  const bookedSet = new Set((booked ?? []).map(b => {
    const t = String(b.slot_time)
    return t.length > 5 ? t.slice(0, 5) : t
  }))

  // Current time in minutes (server-side, PKT = UTC+5)
  const now = new Date()
  const pktOffsetMs = 5 * 60 * 60 * 1000
  const pkt = new Date(now.getTime() + pktOffsetMs)
  const currentMinutes = pkt.getUTCHours() * 60 + pkt.getUTCMinutes()

  const slots = allSlots().map(s => {
    const [h, m] = s.split(':').map(Number)
    const slotMinutes = h * 60 + m
    const isPast = slotMinutes <= currentMinutes
    const isBooked = bookedSet.has(s)
    return { time: s, available: !isPast && !isBooked, past: isPast, booked: isBooked }
  })

  return NextResponse.json({ slots })
}
