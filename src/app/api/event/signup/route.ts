import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * POST /api/event/signup
 * Body: { ref_code: string, telegram_username?: string }
 */
export async function POST(request: NextRequest) {
    const body = await request.json()
    const { ref_code, telegram_username } = body

    if (!ref_code) {
        return NextResponse.json({ error: 'ref_code is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Find the originating click → get campaign
    const { data: click, error: clickError } = await supabase
        .from('clicks')
        .select('campaign_id, ref_code')
        .eq('ref_code', ref_code)
        .single()

    if (clickError || !click) {
        return NextResponse.json({ error: 'ref_code not found — invalid tracking link' }, { status: 404 })
    }

    // Upsert user (idempotent)
    const { data: user, error: userError } = await supabase
        .from('users')
        .upsert(
            {
                ref_code,
                telegram_username: telegram_username || null,
                campaign_id: click.campaign_id,
            },
            { onConflict: 'ref_code' }
        )
        .select()
        .single()

    if (userError) {
        return NextResponse.json({ error: userError.message }, { status: 500 })
    }

    // Record signup event
    await supabase.from('events').insert({ user_id: user.id, type: 'signup' })

    return NextResponse.json({ success: true, user_id: user.id })
}
