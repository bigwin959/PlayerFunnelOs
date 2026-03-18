'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import {
    LayoutDashboard,
    Megaphone,
    TrendingUp,
    LogOut,
} from 'lucide-react'

const NAV = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/campaigns', label: 'Campaigns', icon: Megaphone },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()

    useEffect(() => {
        // Simple client-side auth check
        if (typeof window !== 'undefined' && localStorage.getItem('pf_auth') !== 'true') {
            router.push('/')
        }
    }, [router])

    function handleLogout() {
        localStorage.removeItem('pf_auth')
        router.push('/')
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Sidebar */}
            <aside style={{
                width: 220,
                flexShrink: 0,
                background: 'var(--bg-card)',
                borderRight: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                padding: '20px 12px',
                position: 'fixed',
                top: 0,
                left: 0,
                bottom: 0,
                zIndex: 10,
            }}>
                {/* Brand */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px', marginBottom: 28 }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: 'linear-gradient(135deg, #10b981, #3b82f6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <TrendingUp size={16} color="white" />
                    </div>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>Player Funnel</div>
                        <div style={{ fontSize: 10, color: '#64748b', marginTop: -1 }}>OS</div>
                    </div>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 8px', marginBottom: 6 }}>
                        Navigation
                    </div>
                    {NAV.map(({ href, label, icon: Icon }) => {
                        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
                        return (
                            <Link key={href} href={href} className={`nav-link ${active ? 'active' : ''}`}>
                                <Icon size={16} />
                                {label}
                            </Link>
                        )
                    })}
                </nav>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="btn-ghost"
                    style={{ width: '100%', justifyContent: 'flex-start', marginTop: 8 }}
                >
                    <LogOut size={14} />
                    Sign Out
                </button>
            </aside>

            {/* Main content */}
            <main style={{
                marginLeft: 220,
                flex: 1,
                padding: '32px 32px',
                maxWidth: '100%',
                minHeight: '100vh',
            }}>
                {children}
            </main>
        </div>
    )
}
