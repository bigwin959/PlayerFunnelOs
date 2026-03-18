'use client'

import { useEffect, useState, useCallback } from 'react'
import {
    MousePointerClick, Users, CreditCard, DollarSign,
    TrendingUp, TrendingDown, RefreshCw, ArrowRight,
} from 'lucide-react'
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    Cell, PieChart, Pie,
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

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

    const load = useCallback(async () => {
        setLoading(true)
        const res = await fetch('/api/dashboard')
        if (res.ok) {
            const d = await res.json()
            setData(d)
            setLastRefresh(new Date())
        }
        setLoading(false)
    }, [])

    useEffect(() => { load() }, [load])

    const funnelData = data ? [
        { name: 'Clicks', value: data.total_clicks, color: '#3b82f6' },
        { name: 'Signups', value: data.total_signups, color: '#8b5cf6' },
        { name: 'Deposits', value: data.total_deposits, color: '#10b981' },
    ] : []

    const barData = (data?.campaigns || [])
        .slice(0, 8)
        .map((c) => ({ name: c.name.slice(0, 14), clicks: c.clicks, signups: c.signups, deposits: c.deposits }))

    return (
        <div style={{ maxWidth: 1200 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e2e8f0' }}>
                        Overview
                    </h1>
                    <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>
                        Your player acquisition funnel at a glance
                    </p>
                </div>
                <button
                    onClick={load}
                    className="btn-ghost"
                    style={{ gap: 8, fontSize: 13 }}
                >
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
                {/* Funnel Visual */}
                <div className="glass-card" style={{ padding: 24 }}>
                    <h2 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 20 }}>
                        Conversion Funnel
                    </h2>
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
                                        <div style={{
                                            height: '100%',
                                            width: `${pct}%`,
                                            background: step.color,
                                            borderRadius: 5,
                                            transition: 'width 0.8s ease',
                                        }} />
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
                    <h2 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 20 }}>
                        Campaign Performance
                    </h2>
                    {barData.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#334155', padding: '40px 0', fontSize: 14 }}>
                            No campaigns yet — create one to see data here
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={barData} barSize={6} barGap={2}>
                                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 8, fontSize: 12 }}
                                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                />
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
                    <Link href="/campaigns" className="btn-ghost" style={{ textDecoration: 'none', padding: '6px 12px' }}>
                        Manage →
                    </Link>
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
                                    No campaigns yet.{' '}
                                    <Link href="/campaigns" style={{ color: '#10b981', textDecoration: 'none' }}>Create one →</Link>
                                </td>
                            </tr>
                        ) : (
                            (data?.campaigns || []).map((c, i) => (
                                <tr key={c.id} style={{ cursor: 'pointer' }}>
                                    <td>
                                        <Link href={`/campaigns/${c.id}`} style={{ color: '#e2e8f0', textDecoration: 'none', fontWeight: 600 }}>
                                            <span style={{
                                                display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                                                background: COLORS[i % COLORS.length], marginRight: 8,
                                            }} />
                                            {c.name}
                                        </Link>
                                    </td>
                                    <td><span className="badge" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>{c.source}</span></td>
                                    <td style={{ fontWeight: 600 }}>{formatNumber(c.clicks)}</td>
                                    <td>{formatNumber(c.signups)}</td>
                                    <td>
                                        <span style={{ color: c.conv_rate > 10 ? '#10b981' : c.conv_rate > 5 ? '#f59e0b' : '#ef4444', fontWeight: 600 }}>
                                            {formatPercent(c.conv_rate)}
                                        </span>
                                    </td>
                                    <td>{formatNumber(c.deposits)}</td>
                                    <td>
                                        <span style={{ color: c.deposit_rate > 30 ? '#10b981' : '#94a3b8', fontWeight: 600 }}>
                                            {formatPercent(c.deposit_rate)}
                                        </span>
                                    </td>
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
