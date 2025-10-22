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
  phone: string | null
  seating_area: 'Reserved' | 'Free Seating'
  cuisine_choice: 'Traditional' | 'Western'
  unique_code: string
  checked_in: boolean
  checked_in_at: string | null
  checked_in_by: string | null
  usher_name: string | null
  usher_email: string | null
  attended: boolean
  invitation_sent: boolean
  invitation_sent_at: string | null
  photo_url: string | null
  first_checkin_at: string | null
  custom_data: Record<string, any> | null
  created_at: string
  updated_at: string
}

export interface EventCustomField {
  id: number
  event_id: string
  field_name: string
  field_label: string
  field_type: 'text' | 'number' | 'select' | 'date'
  is_required: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface UsherStatistics {
  usher_name: string | null
  usher_email: string | null
  total_scans: number
  unique_guests_scanned: number
  first_scan_at: string | null
  last_scan_at: string | null
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