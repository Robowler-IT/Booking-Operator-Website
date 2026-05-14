import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const userClient = await createClient()
  const { data: { user }, error: authError } = await userClient.auth.getUser()
  if (authError || !user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data: op, error: opError } = await admin
    .from('operators')
    .select('arena_id, name')
    .eq('email', user.email)
    .maybeSingle()

  if (opError) {
    return NextResponse.json({ error: opError.message }, { status: 500 })
  }
  if (!op) {
    return NextResponse.json({ error: 'Operator not found', email: user.email }, { status: 404 })
  }

  const { data: arena } = await admin
    .from('arenas')
    .select('name')
    .eq('id', op.arena_id)
    .maybeSingle()

  return NextResponse.json({ ...op, arena_name: arena?.name ?? '' })
}
