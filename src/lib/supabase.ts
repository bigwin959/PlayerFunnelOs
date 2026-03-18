/**
 * lib/supabase.ts
 *
 * Central re-export so all API routes import from one place.
 * Server-side routes use createClient() from @supabase/ssr.
 * Browser components use createBrowserClient() from @supabase/ssr.
 */

// For API routes (Server Components / Route Handlers)
export { createClient } from '@/utils/supabase/server'

// ────────────────────────────────────────────
// Type definitions (mirror DB schema)
// ────────────────────────────────────────────

export type Campaign = {
  id: string
  name: string
  source: string
  description: string | null
  created_at: string
}

export type Click = {
  id: string
  campaign_id: string
  ref_code: string
  ip: string | null
  user_agent: string | null
  timestamp: string
}

export type User = {
  id: string
  ref_code: string
  telegram_username: string | null
  campaign_id: string | null
  last_activity: string | null
  created_at: string
}

export type Event = {
  id: string
  user_id: string
  type: 'signup' | 'deposit' | 'activity'
  amount: number | null
  timestamp: string
}

// Augmented campaign with live stats
export type CampaignWithStats = Campaign & {
  clicks: number
  signups: number
  deposits: number
  revenue: number
  conv_rate: number   // click → signup %
  deposit_rate: number // signup → deposit %
}
