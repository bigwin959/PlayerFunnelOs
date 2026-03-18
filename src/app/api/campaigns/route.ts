import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
    const supabase = await createClient()

    const { data: campaigns, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const withStats = await Promise.all(
        campaigns.map(async (campaign) => {
            const { count: clickCount } = await supabase
                .from('clicks')
                .select('*', { count: 'exact', head: true })
                .eq('campaign_id', campaign.id)

            const { data: users } = await supabase
                .from('users')
                .select('id')
                .eq('campaign_id', campaign.id)

            const userIds = users?.map((u) => u.id) || []
            const signupCount = userIds.length

            let depositCount = 0
            let revenue = 0
            if (userIds.length > 0) {
                const { data: deposits } = await supabase
                    .from('events')
                    .select('amount')
                    .in('user_id', userIds)
                    .eq('type', 'deposit')

                depositCount = deposits?.length || 0
                revenue = deposits?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0
            }

            const clicks = clickCount || 0
            const convRate = clicks > 0 ? (signupCount / clicks) * 100 : 0
            const depositRate = signupCount > 0 ? (depositCount / signupCount) * 100 : 0

            return {
                ...campaign,
                clicks,
                signups: signupCount,
                deposits: depositCount,
                revenue,
                conv_rate: convRate,
                deposit_rate: depositRate,
            }
        })
    )

    return NextResponse.json(withStats)
}

export async function POST(request: NextRequest) {
    const body = await request.json()
    const { name, source, description } = body

    if (!name || !source) {
        return NextResponse.json({ error: 'name and source are required' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
        .from('campaigns')
        .insert({ name, source, description: description || null })
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const trackingUrl = `${appUrl}/api/r?cid=${data.id}`

    return NextResponse.json({ ...data, tracking_url: trackingUrl }, { status: 201 })
}
