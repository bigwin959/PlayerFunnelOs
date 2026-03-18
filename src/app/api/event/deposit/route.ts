import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * POST /api/event/deposit
 * Body: { ref_code: string, amount: number }
 */
export async function POST(request: NextRequest) {
    const body = await request.json()
    const { ref_code, amount } = body

    if (!ref_code) {
        return NextResponse.json({ error: 'ref_code is required' }, { status: 400 })
    }
    if (typeof amount !== 'number' || amount <= 0) {
        return NextResponse.json({ error: 'amount must be a positive number' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('ref_code', ref_code)
        .single()

    if (userError || !user) {
        return NextResponse.json(
            { error: 'User not found — run /api/event/signup first' },
            { status: 404 }
        )
    }

    const { error } = await supabase.from('events').insert({
        user_id: user.id,
        type: 'deposit',
        amount,
    })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await supabase
        .from('users')
        .update({ last_activity: new Date().toISOString() })
        .eq('id', user.id)

    return NextResponse.json({ success: true, user_id: user.id, amount })
}
