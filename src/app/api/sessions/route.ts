import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const userClient = await createClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { otp, tabletSlot } = await request.json()
  if (!otp) return NextResponse.json({ error: 'OTP is required' }, { status: 400 })

  const admin = createAdminClient()

  const { data: op } = await admin
    .from('operators')
    .select('arena_id')
    .eq('email', user.email)
    .maybeSingle()
  if (!op) return NextResponse.json({ error: 'Operator not found' }, { status: 404 })

  const today = new Date().toISOString().split('T')[0]

  const { data: booking } = await admin
    .from('bookings')
    .select('id, player_name, game_mode, payment_status, booking_status')
    .eq('otp_code', otp)
    .eq('arena_id', op.arena_id)
    .eq('date', today)
    .neq('booking_status', 'cancelled')
    .maybeSingle()

  if (!booking) {
    return NextResponse.json({ error: 'Invalid OTP. No matching booking found for today.' }, { status: 404 })
  }

  if (booking.payment_status !== 'paid') {
    return NextResponse.json({ error: 'Payment not confirmed. Confirm payment before loading the session.' }, { status: 403 })
  }

  const { error } = await admin.from('sessions').insert({
    booking_id: booking.id,
    player_name: booking.player_name,
    game_mode: booking.game_mode,
    difficulty: 'medium',
    bowler_profile: 'default',
    tablet_slot: tabletSlot ?? 1,
    status: 'active',
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await admin
    .from('bookings')
    .update({ booking_status: 'active' })
    .eq('id', booking.id)

  return NextResponse.json({ success: true, playerName: booking.player_name })
}
