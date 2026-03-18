import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * POST /api/event/activity
 * Body: { ref_code: string }
 */
export async function POST(request: NextRequest) {
    const body = await request.json()
    const { ref_code } = body

    if (!ref_code) {
        return NextResponse.json({ error: 'ref_code is required' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('ref_code', ref_code)
        .single()

    if (userError || !user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const now = new Date().toISOString()

    await supabase.from('users').update({ last_activity: now }).eq('id', user.id)
    await supabase.from('events').insert({ user_id: user.id, type: 'activity' })

    return NextResponse.json({ success: true, last_activity: now })
}
