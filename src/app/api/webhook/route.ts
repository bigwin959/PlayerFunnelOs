import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * POST /api/webhook
 *
 * Secure inbound webhook called by the BigWin959 backend.
 * Protected by WEBHOOK_SECRET so only your backend can call it.
 *
 * Payload:
 * {
 *   "secret":           "your-webhook-secret",
 *   "event":            "signup" | "deposit",
 *   "ref_code":         "abc1234567",      ← from the ?ref= URL param
 *   "telegram_username": "@username",      ← optional, for signup
 *   "amount":           500                ← required for deposit
 * }
 */
export async function POST(request: NextRequest) {
    const body = await request.json()
    const { secret, event, ref_code, telegram_username, amount } = body

    // ── Auth check ──────────────────────────────────────────────
    const expectedSecret = process.env.WEBHOOK_SECRET
    if (!expectedSecret || secret !== expectedSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!ref_code || !event) {
        return NextResponse.json({ error: 'ref_code and event are required' }, { status: 400 })
    }

    const supabase = await createClient()

    // ── Handle signup ────────────────────────────────────────────
    if (event === 'signup') {
        const { data: click } = await supabase
            .from('clicks')
            .select('campaign_id')
            .eq('ref_code', ref_code)
            .single()

        if (!click) {
            return NextResponse.json({ error: 'ref_code not found' }, { status: 404 })
        }

        const { data: user, error } = await supabase
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

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        await supabase.from('events').insert({ user_id: user.id, type: 'signup' })

        return NextResponse.json({ success: true, event: 'signup', user_id: user.id })
    }

    // ── Handle deposit ───────────────────────────────────────────
    if (event === 'deposit') {
        if (typeof amount !== 'number' || amount <= 0) {
            return NextResponse.json({ error: 'amount must be a positive number' }, { status: 400 })
        }

        const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('ref_code', ref_code)
            .single()

        if (!user) {
            return NextResponse.json({ error: 'Player not found. Fire signup event first.' }, { status: 404 })
        }

        await supabase.from('events').insert({ user_id: user.id, type: 'deposit', amount })
        await supabase.from('users').update({ last_activity: new Date().toISOString() }).eq('id', user.id)

        return NextResponse.json({ success: true, event: 'deposit', user_id: user.id, amount })
    }

    // ── Handle activity ──────────────────────────────────────────
    if (event === 'activity') {
        const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('ref_code', ref_code)
            .single()

        if (!user) return NextResponse.json({ error: 'Player not found' }, { status: 404 })

        const now = new Date().toISOString()
        await supabase.from('users').update({ last_activity: now }).eq('id', user.id)
        await supabase.from('events').insert({ user_id: user.id, type: 'activity' })

        return NextResponse.json({ success: true, event: 'activity', last_activity: now })
    }

    return NextResponse.json({ error: 'Unknown event type' }, { status: 400 })
}
