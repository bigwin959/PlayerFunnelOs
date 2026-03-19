'use client'

import { useEffect, useState, useCallback } from 'react'
import {
    MousePointerClick, Users, CreditCard, DollarSign,
    TrendingUp, TrendingDown, RefreshCw, ArrowRight,
} from 'lucide-react'
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    AreaChart, Area, CartesianGrid, Legend,
} from 'recharts'
import { formatNumber, formatCurrency, formatPercent } from '@/lib/utils'
import Link from 'next/link'

type DashboardData = {
    total_clicks: number
    total_signups: number
    total_deposits: number
    total_revenue: number
    conv_rate: number
    deposit_rate: number
    campaigns: {
        id: string
        name: string
        source: string
        clicks: number
        signups: number
        deposits: number
        revenue: number
        conv_rate: number
        deposit_rate: number
    }[]
}

type TimeSeriesRow = {
    date: string
    clicks: number
    signups: number
    deposits: number
    revenue: number
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4']

function StatCard({
    label, value, icon: Icon, color, sub, trend,
}: {
    label: string
    value: string
    icon: React.ElementType
    color: string
    sub?: string
    trend?: 'up' | 'down' | null
}) {
    return (
        <div className="glass-card stat-card" style={{ padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{
                position: 'absolute', top: 0, right: 0, width: 80, height: 80,
                borderRadius: '50%', background: color, opacity: 0.08, transform: 'translate(20px,-20px)',
            }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                        {label}
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: '#e2e8f0', lineHeight: 1 }}>
                        {value}
                    </div>
                    {sub && (
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                            {trend === 'up' && <TrendingUp size={12} color="#10b981" />}
                            {trend === 'down' && <TrendingDown size={12} color="#ef4444" />}
                            {sub}
                        </div>
                    )}
                </div>
                <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: `${color}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Icon size={20} color={color} />
                </div>
            </div>
        </div>
    )
}

// Custom tooltip for the area chart
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string }) {
    if (!active || !payload?.length) return null
    return (
        <div style={{
            background: '#111118', border: '1px solid #1e1e2e', borderRadius: 10,
            padding: '12px 16px', fontSize: 12,
        }}>
            <div style={{ color: '#64748b', marginBottom: 8, fontWeight: 600 }}>{label}</div>
            {payload.map((p) => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color }} />
                    <span style={{ color: '#94a3b8' }}>{p.name}:</span>
                    <span style={{ color: '#e2e8f0', fontWeight: 700 }}>
                        {p.name === 'Revenue' ? formatCurrency(p.value) : formatNumber(p.value)}
                    </span>
                </div>
            ))}
        </div>
    )
}

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null)
    const [tsData, setTsData] = useState<TimeSeriesRow[]>([])
    const [loading, setLoading] = useState(true)
    const [tsLoading, setTsLoading] = useState(true)
    const [range, setRange] = useState<'7d' | '30d'>('7d')
    const [metric, setMetric] = useState<'clicks' | 'signups' | 'deposits' | 'revenue'>('clicks')
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

    const loadDashboard = useCallback(async () => {
        setLoading(true)
        const res = await fetch('/api/dashboard')
        if (res.ok) { setData(await res.json()); setLastRefresh(new Date()) }
        setLoading(false)
    }, [])

    const loadTimeSeries = useCallback(async (r: string) => {
        setTsLoading(true)
        const res = await fetch(`/api/analytics?range=${r}`)
        if (res.ok) setTsData(await res.json())
        setTsLoading(false)
    }, [])

    useEffect(() => { loadDashboard() }, [loadDashboard])
    useEffect(() => { loadTimeSeries(range) }, [loadTimeSeries, range])

    const funnelData = data ? [
        { name: 'Clicks', value: data.total_clicks, color: '#3b82f6' },
        { name: 'Signups', value: data.total_signups, color: '#8b5cf6' },
        { name: 'Deposits', value: data.total_deposits, color: '#10b981' },
    ] : []

    const barData = (data?.campaigns || [])
        .slice(0, 8)
        .map((c) => ({ name: c.name.slice(0, 14), clicks: c.clicks, signups: c.signups, deposits: c.deposits }))

    // Format X-axis dates nicely
    const formatDate = (d: string) => {
        const dt = new Date(d)
        return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    const METRIC_CONFIG = {
        clicks: { color: '#3b82f6', label: 'Clicks' },
        signups: { color: '#8b5cf6', label: 'Signups' },
        deposits: { color: '#10b981', label: 'Deposits' },
        revenue: { color: '#f59e0b', label: 'Revenue' },
    }

    const activeColor = METRIC_CONFIG[metric].color

    return (
        <div style={{ maxWidth: 1200 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e2e8f0' }}>Overview</h1>
                    <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>Your player acquisition funnel at a glance</p>
                </div>
                <button onClick={() => { loadDashboard(); loadTimeSeries(range) }} className="btn-ghost" style={{ gap: 8, fontSize: 13 }}>
                    <RefreshCw size={14} className={loading ? 'pulse' : ''} />
                    Refresh
                </button>
            </div>

            {/* Metric cards */}
            {loading && !data ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="skeleton" style={{ height: 100, borderRadius: 12 }} />
                    ))}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
                    <StatCard label="Total Clicks" value={formatNumber(data?.total_clicks || 0)} icon={MousePointerClick} color="#3b82f6" sub="All campaigns" />
                    <StatCard label="Signups" value={formatNumber(data?.total_signups || 0)} icon={Users} color="#8b5cf6" sub={`${formatPercent(data?.conv_rate || 0)} conversion`} trend="up" />
                    <StatCard label="Depositors" value={formatNumber(data?.total_deposits || 0)} icon={CreditCard} color="#10b981" sub={`${formatPercent(data?.deposit_rate || 0)} deposit rate`} trend="up" />
                    <StatCard label="Total Revenue" value={formatCurrency(data?.total_revenue || 0)} icon={DollarSign} color="#f59e0b" sub="From tracked deposits" />
                    <StatCard label="Click → Signup" value={formatPercent(data?.conv_rate || 0)} icon={TrendingUp} color="#06b6d4" sub="Conversion rate" />
                    <StatCard label="Signup → Deposit" value={formatPercent(data?.deposit_rate || 0)} icon={TrendingUp} color="#10b981" sub="Deposit rate" />
                </div>
            )}

            {/* ── TIME-SERIES CHART ── */}
            <div className="glass-card" style={{ padding: 24, marginBottom: 28 }}>
                {/* Chart header with controls */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h2 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>Trends Over Time</h2>

                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {/* Metric toggle */}
                        <div style={{ display: 'flex', background: '#0d0d14', borderRadius: 8, padding: 3, gap: 2, border: '1px solid var(--border)' }}>
                            {(Object.keys(METRIC_CONFIG) as (keyof typeof METRIC_CONFIG)[]).map((m) => (
                                <button
                                    key={m}
                                    onClick={() => setMetric(m)}
                                    style={{
                                        padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                                        background: metric === m ? METRIC_CONFIG[m].color : 'transparent',
                                        color: metric === m ? 'white' : '#64748b',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    {METRIC_CONFIG[m].label}
                                </button>
                            ))}
                        </div>

                        {/* Range toggle */}
                        <div style={{ display: 'flex', background: '#0d0d14', borderRadius: 8, padding: 3, gap: 2, border: '1px solid var(--border)' }}>
                            {(['7d', '30d'] as const).map((r) => (
                                <button
                                    key={r}
                                    onClick={() => setRange(r)}
                                    style={{
                                        padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                                        background: range === r ? '#1e1e2e' : 'transparent',
                                        color: range === r ? '#e2e8f0' : '#64748b',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    {r === '7d' ? '7 Days' : '30 Days'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {tsLoading ? (
                    <div className="skeleton" style={{ height: 220, borderRadius: 8 }} />
                ) : tsData.length === 0 ? (
                    <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155', fontSize: 14 }}>
                        No data yet — start tracking to see trends
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={tsData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                            <defs>
                                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={activeColor} stopOpacity={0.25} />
                                    <stop offset="95%" stopColor={activeColor} stopOpacity={0.01} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false} />
                            <XAxis
                                dataKey="date"
                                tickFormatter={formatDate}
                                tick={{ fill: '#64748b', fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                                interval={range === '7d' ? 0 : 4}
                            />
                            <YAxis
                                tick={{ fill: '#64748b', fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                                width={36}
                                tickFormatter={(v) => metric === 'revenue' ? `$${v}` : String(v)}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey={metric}
                                name={METRIC_CONFIG[metric].label}
                                stroke={activeColor}
                                strokeWidth={2.5}
                                fill="url(#areaGrad)"
                                dot={{ fill: activeColor, strokeWidth: 0, r: 3 }}
                                activeDot={{ r: 5, fill: activeColor, strokeWidth: 2, stroke: '#111118' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}

                {/* Summary row below chart */}
                {!tsLoading && tsData.length > 0 && (() => {
                    const total = tsData.reduce((s, d) => s + (d[metric] || 0), 0)
                    const firstHalf = tsData.slice(0, Math.floor(tsData.length / 2)).reduce((s, d) => s + (d[metric] || 0), 0)
                    const secondHalf = tsData.slice(Math.floor(tsData.length / 2)).reduce((s, d) => s + (d[metric] || 0), 0)
                    const trend = firstHalf === 0 ? 0 : ((secondHalf - firstHalf) / firstHalf) * 100

                    return (
                        <div style={{ display: 'flex', gap: 24, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                            <div>
                                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                                    {range === '7d' ? '7-Day' : '30-Day'} Total
                                </div>
                                <div style={{ fontSize: 20, fontWeight: 700, color: activeColor }}>
                                    {metric === 'revenue' ? formatCurrency(total) : formatNumber(total)}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                                    Trend
                                </div>
                                <div style={{ fontSize: 20, fontWeight: 700, color: trend >= 0 ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    {trend >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                    {trend >= 0 ? '+' : ''}{trend.toFixed(0)}%
                                    <span style={{ fontSize: 12, fontWeight: 400, color: '#64748b' }}>vs first half</span>
                                </div>
                            </div>
                        </div>
                    )
                })()}
            </div>

            {/* Funnel + Bar chart row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
                {/* Funnel Visual */}
                <div className="glass-card" style={{ padding: 24 }}>
                    <h2 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 20 }}>Conversion Funnel</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {funnelData.map((step, i) => {
                            const maxVal = funnelData[0]?.value || 1
                            const pct = (step.value / maxVal) * 100
                            return (
                                <div key={step.name}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>{step.name}</span>
                                        <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 700 }}>{formatNumber(step.value)}</span>
                                    </div>
                                    <div style={{ height: 10, background: '#1e1e2e', borderRadius: 5, overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${pct}%`, background: step.color, borderRadius: 5, transition: 'width 0.8s ease' }} />
                                    </div>
                                    {i < funnelData.length - 1 && (
                                        <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }}>
                                            <ArrowRight size={12} color="#334155" style={{ transform: 'rotate(90deg)' }} />
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Bar chart */}
                <div className="glass-card" style={{ padding: 24 }}>
                    <h2 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 20 }}>Campaign Performance</h2>
                    {barData.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#334155', padding: '40px 0', fontSize: 14 }}>
                            No campaigns yet — create one to see data here
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={barData} barSize={6} barGap={2}>
                                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 8, fontSize: 12 }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                <Bar dataKey="clicks" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                                <Bar dataKey="signups" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
                                <Bar dataKey="deposits" fill="#10b981" radius={[3, 3, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                    <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                        {[['#3b82f6', 'Clicks'], ['#8b5cf6', 'Signups'], ['#10b981', 'Deposits']].map(([c, l]) => (
                            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748b' }}>
                                <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
                                {l}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Campaign table */}
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>All Campaigns</h2>
                    <Link href="/campaigns" className="btn-ghost" style={{ textDecoration: 'none', padding: '6px 12px' }}>Manage →</Link>
                </div>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Campaign</th>
                            <th>Source</th>
                            <th>Clicks</th>
                            <th>Signups</th>
                            <th>Conv %</th>
                            <th>Deposits</th>
                            <th>Dep Rate %</th>
                            <th>Revenue</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && !data ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <tr key={i}>
                                    {Array.from({ length: 8 }).map((_, j) => (
                                        <td key={j}><div className="skeleton" style={{ height: 16, width: '80%' }} /></td>
                                    ))}
                                </tr>
                            ))
                        ) : data?.campaigns.length === 0 ? (
                            <tr>
                                <td colSpan={8} style={{ textAlign: 'center', color: '#64748b', padding: '40px 0' }}>
                                    No campaigns yet. <Link href="/campaigns" style={{ color: '#10b981', textDecoration: 'none' }}>Create one →</Link>
                                </td>
                            </tr>
                        ) : (
                            (data?.campaigns || []).map((c, i) => (
                                <tr key={c.id} style={{ cursor: 'pointer' }}>
                                    <td>
                                        <Link href={`/campaigns/${c.id}`} style={{ color: '#e2e8f0', textDecoration: 'none', fontWeight: 600 }}>
                                            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length], marginRight: 8 }} />
                                            {c.name}
                                        </Link>
                                    </td>
                                    <td><span className="badge" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>{c.source}</span></td>
                                    <td style={{ fontWeight: 600 }}>{formatNumber(c.clicks)}</td>
                                    <td>{formatNumber(c.signups)}</td>
                                    <td><span style={{ color: c.conv_rate > 10 ? '#10b981' : c.conv_rate > 5 ? '#f59e0b' : '#ef4444', fontWeight: 600 }}>{formatPercent(c.conv_rate)}</span></td>
                                    <td>{formatNumber(c.deposits)}</td>
                                    <td><span style={{ color: c.deposit_rate > 30 ? '#10b981' : '#94a3b8', fontWeight: 600 }}>{formatPercent(c.deposit_rate)}</span></td>
                                    <td style={{ color: '#f59e0b', fontWeight: 700 }}>{formatCurrency(c.revenue)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: 16, textAlign: 'right', color: '#334155', fontSize: 11 }}>
                Last refreshed: {lastRefresh.toLocaleTimeString()}
            </div>
        </div>
    )
}
