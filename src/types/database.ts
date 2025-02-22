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
      profiles: {
        Row: {
          id: string
          updated_at: string
          full_name: string
          avatar_url: string | null
          email: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          updated_at?: string
          full_name: string
          avatar_url?: string | null
          email: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          updated_at?: string
          full_name?: string
          avatar_url?: string | null
          email?: string
          user_id?: string
          created_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          created_at: string
          name: string
          emoji: string
          created_by: string
          currency: string
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          emoji: string
          created_by: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          emoji?: string
          created_by?: string
          currency?: string
        }
      }
      members: {
        Row: {
          id: string
          created_at: string
          full_name: string
          email: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          full_name: string
          email?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          full_name?: string
          email?: string | null
          user_id?: string | null
        }
      }
      group_members: {
        Row: {
          id: string
          created_at: string
          group_id: string
          member_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          group_id: string
          member_id: string
        }
        Update: {
          id?: string
          created_at?: string
          group_id?: string
          member_id?: string
        }
      }
      expenses: {
        Row: {
          id: string
          created_at: string
          description: string
          amount: number
          group_id: string
          paid_by: string
          split_type: 'equal' | 'custom'
        }
        Insert: {
          id?: string
          created_at?: string
          description: string
          amount: number
          group_id: string
          paid_by: string
          split_type?: 'equal' | 'custom'
        }
        Update: {
          id?: string
          created_at?: string
          description?: string
          amount?: number
          group_id?: string
          paid_by?: string
          split_type?: 'equal' | 'custom'
        }
      }
      splits: {
        Row: {
          id: string
          created_at: string
          expense_id: string
          member_id: string
          amount: number
          split_type: 'equal' | 'custom' | 'shares'
        }
        Insert: {
          id?: string
          created_at?: string
          expense_id: string
          member_id: string
          amount: number
          split_type?: 'equal' | 'custom' | 'shares'
        }
        Update: {
          id?: string
          created_at?: string
          expense_id?: string
          member_id?: string
          amount?: number
          split_type?: 'equal' | 'custom' | 'shares'
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
