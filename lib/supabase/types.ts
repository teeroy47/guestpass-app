export interface SupabaseEventGuestRow {
  id: string
  checked_in: boolean
}

export interface SupabaseEventOwnerRow {
  id: string
  full_name: string
  email: string
  role: string
}

export interface SupabaseGuestRow {
  id: string
  event_id: string
  name: string
  email: string | null
  unique_code: string
  checked_in: boolean
  checked_in_at: string | null
  checked_in_by: string | null
  created_at: string
  updated_at: string
}

export interface SupabaseEventRow {
  id: string
  title: string
  description: string | null
  starts_at: string
  venue: string | null
  owner_id: string
  created_at: string
  total_guests: number
  checked_in_guests: number
  status: string
  guests: SupabaseEventGuestRow[] | null
  owner: SupabaseEventOwnerRow | null
}