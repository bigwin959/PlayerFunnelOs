import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
    const supabase = await createClient()

    const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id, name, source, created_at')
        .order('created_at', { ascending: false })

    if (!campaigns) {
        return NextResponse.json({ error: 'Failed to load campaigns' }, { status: 500 })
    }

    const { count: totalClicks } = await supabase
        .from('clicks')
        .select('*', { count: 'exact', head: true })

    const { count: totalSignups } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

    const { data: allDeposits } = await supabase
        .from('events')
        .select('user_id, amount')
        .eq('type', 'deposit')

    const uniqueDepositors = new Set((allDeposits || []).map((d) => d.user_id))
    const totalDeposits = uniqueDepositors.size
    const totalRevenue = (allDeposits || []).reduce((s, d) => s + (d.amount || 0), 0)

    const clicks = totalClicks || 0
    const signups = totalSignups || 0

    const campaignsWithStats = await Promise.all(
        campaigns.map(async (campaign) => {
            const { count: cClicks } = await supabase
                .from('clicks')
                .select('*', { count: 'exact', head: true })
                .eq('campaign_id', campaign.id)

            const { data: cUsers } = await supabase
                .from('users')
                .select('id')
                .eq('campaign_id', campaign.id)

            const cUserIds = cUsers?.map((u) => u.id) || []
            let cDepositCount = 0
            let cRevenue = 0

            if (cUserIds.length > 0) {
                const { data: cDeposits } = await supabase
                    .from('events')
                    .select('user_id, amount')
                    .in('user_id', cUserIds)
                    .eq('type', 'deposit')

                const unique = new Set((cDeposits || []).map((d) => d.user_id))
                cDepositCount = unique.size
                cRevenue = (cDeposits || []).reduce((s, d) => s + (d.amount || 0), 0)
            }

            const cc = cClicks || 0
            const cs = cUserIds.length
            return {
                ...campaign,
                clicks: cc,
                signups: cs,
                deposits: cDepositCount,
                revenue: cRevenue,
                conv_rate: cc > 0 ? (cs / cc) * 100 : 0,
                deposit_rate: cs > 0 ? (cDepositCount / cs) * 100 : 0,
            }
        })
    )

    return NextResponse.json({
        total_clicks: clicks,
        total_signups: signups,
        total_deposits: totalDeposits,
        total_revenue: totalRevenue,
        conv_rate: clicks > 0 ? (signups / clicks) * 100 : 0,
        deposit_rate: signups > 0 ? (totalDeposits / signups) * 100 : 0,
        campaigns: campaignsWithStats,
    })
}
