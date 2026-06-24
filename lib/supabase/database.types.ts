export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          display_name: string | null
          role: string
          permissions: Json
          is_active: boolean
          can_view_archive: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          display_name?: string | null
          role?: string
          permissions?: Json
          is_active?: boolean
          can_view_archive?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          display_name?: string | null
          role?: string
          permissions?: Json
          is_active?: boolean
          can_view_archive?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      guests: {
        Row: {
          id: string
          event_id: string
          name: string
          email: string | null
          phone: string | null
          seating_area: string | null
          cuisine_choice: string | null
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
          custom_data: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          name: string
          email?: string | null
          phone?: string | null
          seating_area?: string | null
          cuisine_choice?: string | null
          unique_code: string
          checked_in?: boolean
          checked_in_at?: string | null
          checked_in_by?: string | null
          usher_name?: string | null
          usher_email?: string | null
          attended?: boolean
          invitation_sent?: boolean
          invitation_sent_at?: string | null
          photo_url?: string | null
          first_checkin_at?: string | null
          custom_data?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          name?: string
          email?: string | null
          phone?: string | null
          seating_area?: string | null
          cuisine_choice?: string | null
          unique_code?: string
          checked_in?: boolean
          checked_in_at?: string | null
          checked_in_by?: string | null
          usher_name?: string | null
          usher_email?: string | null
          attended?: boolean
          invitation_sent?: boolean
          invitation_sent_at?: string | null
          photo_url?: string | null
          first_checkin_at?: string | null
          custom_data?: Json
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
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
          is_archived: boolean
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          starts_at: string
          venue?: string | null
          owner_id: string
          created_at?: string
          total_guests?: number
          checked_in_guests?: number
          status?: string
          is_archived?: boolean
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          starts_at?: string
          venue?: string | null
          owner_id?: string
          created_at?: string
          total_guests?: number
          checked_in_guests?: number
          status?: string
          is_archived?: boolean
        }
      }
      event_custom_fields: {
        Row: {
          id: number
          event_id: string
          field_name: string
          field_label: string
          field_type: string
          is_required: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          event_id: string
          field_name: string
          field_label: string
          field_type: string
          is_required?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          event_id?: string
          field_name?: string
          field_label?: string
          field_type?: string
          is_required?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
