'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Link as LinkIcon, Copy, Check, Trash2, ExternalLink, Megaphone } from 'lucide-react'
import { formatNumber, formatCurrency, formatPercent, formatDate } from '@/lib/utils'
import Link from 'next/link'

type Campaign = {
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
    tracking_url?: string
}

const SOURCES = ['telegram', 'facebook', 'instagram', 'tiktok', 'sms', 'email', 'other']
const SOURCE_COLORS: Record<string, string> = {
    telegram: '#0088cc', facebook: '#1877f2', instagram: '#e1306c',
    tiktok: '#ff0050', sms: '#10b981', email: '#f59e0b', other: '#8b5cf6',
}

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [copied, setCopied] = useState<string | null>(null)
    const [form, setForm] = useState({ name: '', source: 'telegram', description: '' })
    const [creating, setCreating] = useState(false)
    const [newUrl, setNewUrl] = useState<string | null>(null)

    const load = useCallback(async () => {
        setLoading(true)
        const res = await fetch('/api/campaigns')
        if (res.ok) setCampaigns(await res.json())
        setLoading(false)
    }, [])

    useEffect(() => { load() }, [load])

    async function createCampaign(e: React.FormEvent) {
        e.preventDefault()
        setCreating(true)
        const res = await fetch('/api/campaigns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        })
        if (res.ok) {
            const data = await res.json()
            setNewUrl(data.tracking_url)
            setForm({ name: '', source: 'telegram', description: '' })
            await load()
        }
        setCreating(false)
    }

    async function deleteCampaign(id: string) {
        if (!confirm('Delete this campaign? This cannot be undone.')) return
        await fetch(`/api/campaigns/${id}`, { method: 'DELETE' })
        await load()
    }

    function copyUrl(url: string, id: string) {
        navigator.clipboard.writeText(url)
        setCopied(id)
        setTimeout(() => setCopied(null), 2000)
    }

    const trackingUrl = (id: string) => `${window.location.origin}/api/r?cid=${id}`

    return (
        <div style={{ maxWidth: 1100 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e2e8f0' }}>Campaigns</h1>
                    <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>Create tracking links for each Telegram group or source</p>
                </div>
                <button className="btn-primary" onClick={() => { setShowForm(!showForm); setNewUrl(null) }}>
                    <Plus size={16} />
                    New Campaign
                </button>
            </div>

            {/* Create form */}
            {showForm && (
                <div className="glass-card" style={{ padding: 28, marginBottom: 28 }}>
                    <h2 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 20 }}>
                        Create New Campaign
                    </h2>

                    {newUrl ? (
                        <div>
                            <div style={{ marginBottom: 16, padding: 16, borderRadius: 10, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)' }}>
                                <div style={{ fontSize: 13, color: '#10b981', fontWeight: 600, marginBottom: 8 }}>✓ Campaign created! Your tracking link:</div>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <input
                                        readOnly
                                        value={newUrl}
                                        className="input-field"
                                        style={{ flex: 1, fontSize: 13, color: '#94a3b8' }}
                                    />
                                    <button
                                        className="btn-primary"
                                        style={{ flexShrink: 0 }}
                                        onClick={() => copyUrl(newUrl, 'new')}
                                    >
                                        {copied === 'new' ? <Check size={14} /> : <Copy size={14} />}
                                        {copied === 'new' ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                                <p style={{ fontSize: 12, color: '#64748b', marginTop: 10 }}>
                                    Post this link in your Telegram group. Every click will be tracked.
                                </p>
                            </div>
                            <button className="btn-ghost" onClick={() => setNewUrl(null)}>Create another</button>
                        </div>
                    ) : (
                        <form onSubmit={createCampaign} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    Campaign Name *
                                </label>
                                <input
                                    className="input-field"
                                    placeholder="e.g. Telegram VIP Group A"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    Source *
                                </label>
                                <select
                                    className="select-field"
                                    value={form.source}
                                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                                    style={{ width: '100%' }}
                                >
                                    {SOURCES.map((s) => (
                                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    Description (optional)
                                </label>
                                <input
                                    className="input-field"
                                    placeholder="e.g. Posted Monday 8pm, 500 members"
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                />
                            </div>
                            <div style={{ gridColumn: 'span 2', display: 'flex', gap: 12 }}>
                                <button type="submit" className="btn-primary" disabled={creating || !form.name}>
                                    {creating ? 'Creating…' : 'Create & Get Link'}
                                </button>
                                <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                            </div>
                        </form>
                    )}
                </div>
            )}

            {/* Campaign cards */}
            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="skeleton" style={{ height: 160, borderRadius: 12 }} />
                    ))}
                </div>
            ) : campaigns.length === 0 ? (
                <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
                    <Megaphone size={40} color="#334155" style={{ margin: '0 auto 16px' }} />
                    <p style={{ color: '#64748b', fontSize: 15 }}>No campaigns yet.</p>
                    <p style={{ color: '#334155', fontSize: 13, marginTop: 6 }}>Create one to start generating tracking links.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                    {campaigns.map((c) => {
                        const url = typeof window !== 'undefined' ? trackingUrl(c.id) : ''
                        const sourceColor = SOURCE_COLORS[c.source] || '#8b5cf6'
                        return (
                            <div key={c.id} className="glass-card" style={{ padding: 22, position: 'relative' }}>
                                {/* Top row */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                    <div style={{ flex: 1 }}>
                                        <Link href={`/campaigns/${c.id}`} style={{ textDecoration: 'none' }}>
                                            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                {c.name}
                                                <ExternalLink size={12} color="#64748b" />
                                            </h3>
                                        </Link>
                                        <span className="badge" style={{ background: `${sourceColor}18`, color: sourceColor }}>
                                            {c.source}
                                        </span>
                                        {c.description && (
                                            <p style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>{c.description}</p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => deleteCampaign(c.id)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#334155', padding: 4, flexShrink: 0 }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                {/* Stats */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
                                    {[
                                        { label: 'Clicks', val: formatNumber(c.clicks), color: '#3b82f6' },
                                        { label: 'Signups', val: formatNumber(c.signups), color: '#8b5cf6' },
                                        { label: 'Deposits', val: formatNumber(c.deposits), color: '#10b981' },
                                        { label: 'Revenue', val: formatCurrency(c.revenue), color: '#f59e0b' },
                                    ].map(({ label, val, color }) => (
                                        <div key={label} style={{ textAlign: 'center', padding: '8px 4px', background: '#0d0d14', borderRadius: 8 }}>
                                            <div style={{ fontSize: 15, fontWeight: 700, color }}>{val}</div>
                                            <div style={{ fontSize: 10, color: '#334155', marginTop: 2 }}>{label}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Conversion rates */}
                                <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                                    <span style={{ fontSize: 12, color: '#64748b' }}>
                                        Conv: <strong style={{ color: c.conv_rate > 10 ? '#10b981' : '#f59e0b' }}>{formatPercent(c.conv_rate)}</strong>
                                    </span>
                                    <span style={{ fontSize: 12, color: '#64748b' }}>
                                        Deposit rate: <strong style={{ color: c.deposit_rate > 30 ? '#10b981' : '#94a3b8' }}>{formatPercent(c.deposit_rate)}</strong>
                                    </span>
                                    <span style={{ fontSize: 12, color: '#64748b', marginLeft: 'auto' }}>
                                        {formatDate(c.created_at)}
                                    </span>
                                </div>

                                {/* Copy link */}
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <div style={{
                                        flex: 1, padding: '7px 10px', background: '#0d0d14',
                                        border: '1px solid var(--border)', borderRadius: 6,
                                        fontSize: 11, color: '#334155', overflow: 'hidden',
                                        whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                                        display: 'flex', alignItems: 'center', gap: 6,
                                    }}>
                                        <LinkIcon size={10} color="#64748b" />
                                        {url}
                                    </div>
                                    <button
                                        className="btn-ghost"
                                        style={{ flexShrink: 0, padding: '7px 12px', fontSize: 12 }}
                                        onClick={() => copyUrl(url, c.id)}
                                    >
                                        {copied === c.id ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                                        {copied === c.id ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
