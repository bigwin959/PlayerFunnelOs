import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { createClient } from '@/utils/supabase/server'

/**
 * GET /api/r?cid=<campaign_id>
 *
 * Core redirect tracker. When a user clicks a tracking link:
 * 1. Generate unique ref_code
 * 2. Store click in DB
 * 3. Set ref_code cookie (7 days)
 * 4. 302 redirect to target gambling site
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('cid')

    if (!campaignId) {
        return NextResponse.json({ error: 'Missing cid parameter' }, { status: 400 })
    }

    const supabase = await createClient()

    // Validate campaign exists
    const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('id')
        .eq('id', campaignId)
        .single()

    if (campaignError || !campaign) {
        return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 404 })
    }

    // Generate unique ref code (short, URL-safe)
    const refCode = nanoid(10)

    // Capture metadata
    const ip =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        null
    const userAgent = request.headers.get('user-agent') || null

    // Store click
    await supabase.from('clicks').insert({
        campaign_id: campaignId,
        ref_code: refCode,
        ip,
        user_agent: userAgent,
    })

    // Build redirect URL with ref_code appended
    const targetUrl = process.env.REDIRECT_TARGET_URL || 'https://example.com'
    const redirectUrl = new URL(targetUrl)
    redirectUrl.searchParams.set('ref', refCode)

    // Redirect with cookie
    const response = NextResponse.redirect(redirectUrl.toString(), { status: 302 })
    response.cookies.set('ref_code', refCode, {
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
    })

    return response
}
