import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const userClient = await createClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, mode, slot } = await request.json()
  if (!slot) return NextResponse.json({ error: 'Slot time is required' }, { status: 400 })
  const admin = createAdminClient()

  const { data: op } = await admin
    .from('operators')
    .select('arena_id')
    .eq('email', user.email)
    .maybeSingle()
  if (!op) return NextResponse.json({ error: 'Operator not found' }, { status: 404 })

  const today = new Date().toISOString().split('T')[0]

  const { error } = await admin.from('bookings').insert({
    arena_id: op.arena_id,
    date: today,
    slot_time: slot,
    duration: 30,
    game_mode: mode,
    player_name: name,
    payment_status: 'pending',
    booking_status: 'confirmed',
    is_walkin: true,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
