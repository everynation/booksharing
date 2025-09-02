export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      books: {
        Row: {
          address: string | null
          author: string
          cover_image_url: string | null
          created_at: string
          daily_rate: number | null
          description: string | null
          for_rental: boolean | null
          for_sale: boolean | null
          id: string
          isbn: string | null
          late_daily: number | null
          late_fee_per_day: number | null
          latitude: number | null
          longitude: number | null
          new_book_price: number | null
          price: number
          rental_daily: number | null
          rental_terms: string | null
          rental_weekly: number | null
          status: string
          title: string
          transaction_type: string
          updated_at: string
          user_id: string
          weekly_rate: number | null
        }
        Insert: {
          address?: string | null
          author: string
          cover_image_url?: string | null
          created_at?: string
          daily_rate?: number | null
          description?: string | null
          for_rental?: boolean | null
          for_sale?: boolean | null
          id?: string
          isbn?: string | null
          late_daily?: number | null
          late_fee_per_day?: number | null
          latitude?: number | null
          longitude?: number | null
          new_book_price?: number | null
          price: number
          rental_daily?: number | null
          rental_terms?: string | null
          rental_weekly?: number | null
          status?: string
          title: string
          transaction_type: string
          updated_at?: string
          user_id: string
          weekly_rate?: number | null
        }
        Update: {
          address?: string | null
          author?: string
          cover_image_url?: string | null
          created_at?: string
          daily_rate?: number | null
          description?: string | null
          for_rental?: boolean | null
          for_sale?: boolean | null
          id?: string
          isbn?: string | null
          late_daily?: number | null
          late_fee_per_day?: number | null
          latitude?: number | null
          longitude?: number | null
          new_book_price?: number | null
          price?: number
          rental_daily?: number | null
          rental_terms?: string | null
          rental_weekly?: number | null
          status?: string
          title?: string
          transaction_type?: string
          updated_at?: string
          user_id?: string
          weekly_rate?: number | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          created_at: string
          id: string
          message: string
          receiver_id: string
          sender_id: string
          transaction_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          receiver_id: string
          sender_id: string
          transaction_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          receiver_id?: string
          sender_id?: string
          transaction_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          latitude: number | null
          longitude: number | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rental_contracts: {
        Row: {
          book_id: string
          borrower_confirmed: boolean
          borrower_id: string
          borrower_return_ok: boolean
          created_at: string
          daily_price: number
          end_date: string | null
          id: string
          late_daily_price: number | null
          new_book_price_cap: number
          next_charge_at: string | null
          owner_confirmed: boolean
          owner_id: string
          owner_return_ok: boolean
          start_date: string | null
          status: string
          total_charged: number
          updated_at: string
        }
        Insert: {
          book_id: string
          borrower_confirmed?: boolean
          borrower_id: string
          borrower_return_ok?: boolean
          created_at?: string
          daily_price: number
          end_date?: string | null
          id?: string
          late_daily_price?: number | null
          new_book_price_cap: number
          next_charge_at?: string | null
          owner_confirmed?: boolean
          owner_id: string
          owner_return_ok?: boolean
          start_date?: string | null
          status?: string
          total_charged?: number
          updated_at?: string
        }
        Update: {
          book_id?: string
          borrower_confirmed?: boolean
          borrower_id?: string
          borrower_return_ok?: boolean
          created_at?: string
          daily_price?: number
          end_date?: string | null
          id?: string
          late_daily_price?: number | null
          new_book_price_cap?: number
          next_charge_at?: string | null
          owner_confirmed?: boolean
          owner_id?: string
          owner_return_ok?: boolean
          start_date?: string | null
          status?: string
          total_charged?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_contracts_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_handshakes: {
        Row: {
          borrower_confirmed: boolean | null
          created_at: string
          expires_at: string
          id: string
          owner_confirmed: boolean | null
          transaction_id: string
          updated_at: string
        }
        Insert: {
          borrower_confirmed?: boolean | null
          created_at?: string
          expires_at: string
          id?: string
          owner_confirmed?: boolean | null
          transaction_id: string
          updated_at?: string
        }
        Update: {
          borrower_confirmed?: boolean | null
          created_at?: string
          expires_at?: string
          id?: string
          owner_confirmed?: boolean | null
          transaction_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_handshakes_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          book_id: string
          content: string
          created_at: string
          id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          book_id: string
          content: string
          created_at?: string
          id?: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          book_id?: string
          content?: string
          created_at?: string
          id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          book_id: string
          borrower_confirmed: boolean | null
          borrower_id: string
          created_at: string
          id: string
          owner_confirmed: boolean | null
          owner_id: string
          rental_end_date: string | null
          rental_start_date: string | null
          return_deadline: string | null
          return_proof_image_url: string | null
          return_requested_at: string | null
          status: string
          total_amount: number | null
          type: string | null
          updated_at: string
        }
        Insert: {
          book_id: string
          borrower_confirmed?: boolean | null
          borrower_id: string
          created_at?: string
          id?: string
          owner_confirmed?: boolean | null
          owner_id: string
          rental_end_date?: string | null
          rental_start_date?: string | null
          return_deadline?: string | null
          return_proof_image_url?: string | null
          return_requested_at?: string | null
          status?: string
          total_amount?: number | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          book_id?: string
          borrower_confirmed?: boolean | null
          borrower_id?: string
          created_at?: string
          id?: string
          owner_confirmed?: boolean | null
          owner_id?: string
          rental_end_date?: string | null
          rental_start_date?: string | null
          return_deadline?: string | null
          return_proof_image_url?: string | null
          return_requested_at?: string | null
          status?: string
          total_amount?: number | null
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          transaction_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          transaction_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          transaction_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_user_review_book: {
        Args: { book_id_param: string; user_id_param: string }
        Returns: boolean
      }
      get_book_owner_info: {
        Args: { owner_user_id: string }
        Returns: {
          address: string
          display_name: string
        }[]
      }
      get_user_display_name_secure: {
        Args: { user_id_param: string }
        Returns: string
      }
      update_book_coordinates: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
