import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database Types
export type Database = {
  public: {
    Tables: {
      orders: {
        Row: {
          id: string
          created_at: string
          customer_name: string
          phone_number: string
          plan: string
          meal_type: string
          juice_pack: boolean
          selected_juices: string | null
          start_date: string | null
          preferred_shift: string | null
          address: string | null
          price: string
          payment_status: string
          payment_method: string | null
          transaction_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          customer_name: string
          phone_number: string
          plan: string
          meal_type: string
          juice_pack: boolean
          selected_juices?: string | null
          start_date?: string | null
          preferred_shift?: string | null
          address?: string | null
          price: string
          payment_status?: string
          payment_method?: string | null
          transaction_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          customer_name?: string
          phone_number?: string
          plan?: string
          meal_type?: string
          juice_pack?: boolean
          selected_juices?: string | null
          start_date?: string | null
          preferred_shift?: string | null
          address?: string | null
          price?: string
          payment_status?: string
          payment_method?: string | null
          transaction_id?: string | null
        }
      }
    }
  }
}

export type Order = Database['public']['Tables']['orders']['Row']
export type OrderInsert = Database['public']['Tables']['orders']['Insert']
export type OrderUpdate = Database['public']['Tables']['orders']['Update']