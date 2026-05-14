import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const userClient = await createClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { bookingId } = await request.json()
  const admin = createAdminClient()

  const { data: op } = await admin
    .from('operators')
    .select('arena_id')
    .eq('email', user.email)
    .maybeSingle()
  if (!op) return NextResponse.json({ error: 'Operator not found' }, { status: 404 })

  const { error } = await admin
    .from('bookings')
    .update({ booking_status: 'checked_in' })
    .eq('id', bookingId)
    .eq('arena_id', op.arena_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
