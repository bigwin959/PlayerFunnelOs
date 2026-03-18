import { type NextRequest, NextResponse } from 'next/server'

// Simple pass-through middleware — no session management needed.
// Our auth is passphrase-based via cookies, handled directly in API routes.
export function middleware(request: NextRequest) {
    return NextResponse.next()
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
