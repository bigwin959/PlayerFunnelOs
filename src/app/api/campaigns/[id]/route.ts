import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const supabase = await createClient()

    const { data: campaign, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single()

    if (error || !campaign) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const { count: clickCount } = await supabase
        .from('clicks')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', id)

    const { data: users } = await supabase
        .from('users')
        .select('id, ref_code, telegram_username, last_activity, created_at')
        .eq('campaign_id', id)
        .order('created_at', { ascending: false })

    const userIds = users?.map((u) => u.id) || []

    let deposits: { user_id: string; amount: number | null; timestamp: string }[] = []
    if (userIds.length > 0) {
        const { data } = await supabase
            .from('events')
            .select('user_id, amount, timestamp')
            .in('user_id', userIds)
            .eq('type', 'deposit')
        deposits = data || []
    }

    const depositByUser: Record<string, number> = {}
    for (const d of deposits) {
        depositByUser[d.user_id] = (depositByUser[d.user_id] || 0) + (d.amount || 0)
    }

    const players = (users || []).map((u) => ({
        ...u,
        total_deposited: depositByUser[u.id] || 0,
        has_deposited: !!depositByUser[u.id],
    }))

    const clicks = clickCount || 0
    const signups = players.length
    const depositCount = players.filter((p) => p.has_deposited).length
    const revenue = deposits.reduce((s, d) => s + (d.amount || 0), 0)

    return NextResponse.json({
        ...campaign,
        clicks,
        signups,
        deposits: depositCount,
        revenue,
        conv_rate: clicks > 0 ? (signups / clicks) * 100 : 0,
        deposit_rate: signups > 0 ? (depositCount / signups) * 100 : 0,
        players,
        tracking_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/r?cid=${id}`,
    })
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const supabase = await createClient()

    const { error } = await supabase.from('campaigns').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
}
