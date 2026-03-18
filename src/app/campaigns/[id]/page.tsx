'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Copy, Check, Users, CreditCard, MousePointerClick, DollarSign, TrendingUp, Circle } from 'lucide-react'
import Link from 'next/link'
import { formatNumber, formatCurrency, formatPercent, formatDate, timeAgo } from '@/lib/utils'

type Player = {
    id: string
    ref_code: string
    telegram_username: string | null
    last_activity: string | null
    created_at: string
    total_deposited: number
    has_deposited: boolean
}

type CampaignDetail = {
    id: string
    name: string
    source: string
    description: string | null
    created_at: string
    clicks: number
    signups: number
    deposits: number
    revenue: number
    conv_rate: number
    deposit_rate: number
    players: Player[]
    tracking_url: string
}

export default function CampaignDetailPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const [data, setData] = useState<CampaignDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [copied, setCopied] = useState(false)

    const load = useCallback(async () => {
        setLoading(true)
        const res = await fetch(`/api/campaigns/${id}`)
        if (!res.ok) { router.push('/campaigns'); return }
        setData(await res.json())
        setLoading(false)
    }, [id, router])

    useEffect(() => { load() }, [load])

    function copyUrl() {
        if (!data) return
        navigator.clipboard.writeText(data.tracking_url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const funnelSteps = data ? [
        { label: 'Clicks', val: data.clicks, color: '#3b82f6' },
        { label: 'Signups', val: data.signups, color: '#8b5cf6' },
        { label: 'Deposits', val: data.deposits, color: '#10b981' },
    ] : []

    if (loading) {
        return (
            <div style={{ maxWidth: 900 }}>
                <div className="skeleton" style={{ height: 32, width: 200, marginBottom: 32, borderRadius: 6 }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 32 }}>
                    {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 88, borderRadius: 12 }} />)}
                </div>
                <div className="skeleton" style={{ height: 220, borderRadius: 12 }} />
            </div>
        )
    }

    if (!data) return null

    return (
        <div style={{ maxWidth: 980 }}>
            {/* Back + title */}
            <div style={{ marginBottom: 28 }}>
                <Link href="/campaigns" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 13, textDecoration: 'none', marginBottom: 14 }}>
                    <ArrowLeft size={14} /> Back to Campaigns
                </Link>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0' }}>{data.name}</h1>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 6 }}>
                            <span className="badge" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>{data.source}</span>
                            <span style={{ fontSize: 12, color: '#64748b' }}>Created {formatDate(data.created_at)}</span>
                            {data.description && <span style={{ fontSize: 12, color: '#64748b' }}>· {data.description}</span>}
                        </div>
                    </div>
                    {/* Copy tracking URL */}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div style={{
                            padding: '9px 14px', background: '#0d0d14', border: '1px solid var(--border)',
                            borderRadius: 8, fontSize: 12, color: '#334155', maxWidth: 280,
                            overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                        }}>
                            {data.tracking_url}
                        </div>
                        <button className="btn-primary" onClick={copyUrl} style={{ padding: '9px 16px', flexShrink: 0 }}>
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                            {copied ? 'Copied!' : 'Copy Link'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 28 }}>
                {[
                    { label: 'Total Clicks', val: formatNumber(data.clicks), icon: MousePointerClick, color: '#3b82f6' },
                    { label: 'Signups', val: formatNumber(data.signups), icon: Users, color: '#8b5cf6' },
                    { label: 'Depositors', val: formatNumber(data.deposits), icon: CreditCard, color: '#10b981' },
                    { label: 'Revenue', val: formatCurrency(data.revenue), icon: DollarSign, color: '#f59e0b' },
                ].map(({ label, val, icon: Icon, color }) => (
                    <div key={label} className="glass-card" style={{ padding: '18px 20px' }}>
                        <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{label}</div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 24, fontWeight: 700, color: '#e2e8f0' }}>{val}</span>
                            <Icon size={18} color={color} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Funnel + rates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
                <div className="glass-card" style={{ padding: 22 }}>
                    <h2 style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 18 }}>Conversion Funnel</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {funnelSteps.map((step) => {
                            const maxVal = funnelSteps[0]?.val || 1
                            const pct = (step.val / maxVal) * 100
                            return (
                                <div key={step.label}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                        <span style={{ fontSize: 13, color: '#94a3b8' }}>{step.label}</span>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{formatNumber(step.val)}</span>
                                    </div>
                                    <div style={{ height: 8, background: '#1e1e2e', borderRadius: 4, overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${pct}%`, background: step.color, borderRadius: 4, transition: 'width 0.7s' }} />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="glass-card" style={{ padding: 22 }}>
                    <h2 style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 18 }}>Rate Analysis</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {[
                            { label: 'Click → Signup', val: data.conv_rate, color: '#8b5cf6', icon: TrendingUp, suffix: 'of clickers sign up' },
                            { label: 'Signup → Deposit', val: data.deposit_rate, color: '#10b981', icon: TrendingUp, suffix: 'of signups deposit' },
                        ].map(({ label, val, color, icon: Icon, suffix }) => (
                            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Icon size={20} color={color} />
                                </div>
                                <div>
                                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>{label}</div>
                                    <div style={{ fontSize: 22, fontWeight: 700, color }}>
                                        {formatPercent(val)}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#334155' }}>{suffix}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Players table */}
            <div className="glass-card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>
                        Players ({data.players.length})
                    </h2>
                    <span style={{ fontSize: 12, color: '#64748b' }}>
                        Matched via ref_code tracking
                    </span>
                </div>
                {data.players.length === 0 ? (
                    <div style={{ padding: '48px 22px', textAlign: 'center', color: '#64748b', fontSize: 14 }}>
                        <Users size={32} color="#1e1e2e" style={{ margin: '0 auto 12px' }} />
                        <p>No players matched yet.</p>
                        <p style={{ fontSize: 12, color: '#334155', marginTop: 6 }}>
                            Post your tracking link and call <code style={{ background: '#1e1e2e', padding: '1px 6px', borderRadius: 4 }}>/api/event/signup</code> when someone signs up.
                        </p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Status</th>
                                <th>Telegram</th>
                                <th>Ref Code</th>
                                <th>Signed Up</th>
                                <th>Last Active</th>
                                <th>Deposited</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.players.map((p) => (
                                <tr key={p.id}>
                                    <td>
                                        <Circle
                                            size={8}
                                            fill={p.has_deposited ? '#10b981' : p.last_activity ? '#f59e0b' : '#334155'}
                                            color={p.has_deposited ? '#10b981' : p.last_activity ? '#f59e0b' : '#334155'}
                                        />
                                    </td>
                                    <td style={{ fontWeight: 500, color: '#e2e8f0' }}>
                                        {p.telegram_username || <span style={{ color: '#334155' }}>—</span>}
                                    </td>
                                    <td><code style={{ fontSize: 11, color: '#64748b', background: '#0d0d14', padding: '2px 6px', borderRadius: 4 }}>{p.ref_code}</code></td>
                                    <td style={{ color: '#94a3b8', fontSize: 13 }}>{formatDate(p.created_at)}</td>
                                    <td style={{ color: '#64748b', fontSize: 13 }}>{p.last_activity ? timeAgo(p.last_activity) : '—'}</td>
                                    <td style={{ fontWeight: 700, color: p.has_deposited ? '#10b981' : '#334155' }}>
                                        {p.has_deposited ? formatCurrency(p.total_deposited) : 'No deposit'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
