import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

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

  const { data: bookings } = await admin
    .from('bookings')
    .select('*')
    .eq('arena_id', op.arena_id)
    .eq('date', today)
    .neq('booking_status', 'cancelled')
    .order('slot_time')

  const { data: allBookings } = await admin
    .from('bookings')
    .select('payment_status, id')
    .eq('arena_id', op.arena_id)
    .eq('date', today)

  const ids = (allBookings ?? []).map((b: { id: string }) => b.id)
  const { data: payments } = ids.length
    ? await admin.from('payments').select('amount, status').in('booking_id', ids)
    : { data: [] }

  const paid = (payments ?? [])
    .filter((p: { status: string }) => p.status === 'paid')
    .reduce((s: number, p: { amount: number }) => s + (p.amount ?? 0), 0)
  const pending = (payments ?? [])
    .filter((p: { status: string }) => p.status === 'pending')
    .reduce((s: number, p: { amount: number }) => s + (p.amount ?? 0), 0)
  const cash = (allBookings ?? [])
    .filter((b: { payment_status: string }) => b.payment_status === 'pending').length * 1500

  return NextResponse.json({
    bookings: bookings ?? [],
    paySummary: { paid, pending, cash, total: paid + pending + cash },
  })
}
