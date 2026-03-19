import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * GET /api/analytics?range=7d|30d
 *
 * Returns daily time-series data for:
 * - clicks   (from clicks table)
 * - signups  (from events where type='signup')
 * - deposits (from events where type='deposit')
 * - revenue  (sum of deposit amounts per day)
 *
 * Response: Array of { date, clicks, signups, deposits, revenue }[]
 * sorted oldest → newest, covering every day in the range (0-filled)
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '7d'
    const days = range === '30d' ? 30 : 7

    const since = new Date()
    since.setDate(since.getDate() - days)
    since.setHours(0, 0, 0, 0)
    const sinceISO = since.toISOString()

    const supabase = await createClient()

    // Fetch raw data in parallel
    const [clicksRes, signupsRes, depositsRes] = await Promise.all([
        supabase
            .from('clicks')
            .select('timestamp')
            .gte('timestamp', sinceISO),
        supabase
            .from('events')
            .select('timestamp')
            .eq('type', 'signup')
            .gte('timestamp', sinceISO),
        supabase
            .from('events')
            .select('amount, timestamp')
            .eq('type', 'deposit')
            .gte('timestamp', sinceISO),
    ])

    // Build a map for every day in range, pre-filled with zeros
    const dayMap: Record<string, { date: string; clicks: number; signups: number; deposits: number; revenue: number }> = {}
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const key = d.toISOString().slice(0, 10) // YYYY-MM-DD
        dayMap[key] = { date: key, clicks: 0, signups: 0, deposits: 0, revenue: 0 }
    }

    // Aggregate clicks
    for (const row of clicksRes.data || []) {
        const key = row.timestamp.slice(0, 10)
        if (dayMap[key]) dayMap[key].clicks++
    }

    // Aggregate signups
    for (const row of signupsRes.data || []) {
        const key = row.timestamp.slice(0, 10)
        if (dayMap[key]) dayMap[key].signups++
    }

    // Aggregate deposits + revenue
    for (const row of depositsRes.data || []) {
        const key = row.timestamp.slice(0, 10)
        if (dayMap[key]) {
            dayMap[key].deposits++
            dayMap[key].revenue += row.amount || 0
        }
    }

    return NextResponse.json(Object.values(dayMap))
}
