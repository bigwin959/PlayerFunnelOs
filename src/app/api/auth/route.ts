import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    const { password } = await request.json()
    const correct = process.env.DASHBOARD_PASSWORD || 'admin123'

    if (password === correct) {
        const res = NextResponse.json({ ok: true })
        res.cookies.set('pf_session', 'authenticated', {
            maxAge: 60 * 60 * 24 * 7, // 7 days
            httpOnly: true,
            path: '/',
            sameSite: 'lax',
        })
        return res
    }

    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
}
