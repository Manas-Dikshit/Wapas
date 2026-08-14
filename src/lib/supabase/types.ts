// Hand-written types mirroring supabase/migrations/0001_init_schema.sql.
// Regenerate with `supabase gen types typescript --linked` once the project
// is linked, and this file can be replaced by the generated output.

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          company_name: string | null;
          role: 'shipper' | 'transporter' | 'admin';
          city: string | null;
          avatar_url: string | null;
          rating: number;
          verified: boolean;
          gst_number: string | null;
          kyc_status: 'pending' | 'verified' | 'rejected';
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string; full_name: string; role: 'shipper' | 'transporter' | 'admin' };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
      trucks: {
        Row: {
          id: string;
          transporter_id: string;
          reg_number: string;
          type: string;
          capacity_tons: number;
          current_city: string;
          destination_city: string | null;
          available_from: string | null;
          price_per_ton: number;
          empty_leg: boolean;
          status: 'available' | 'booked' | 'in-transit' | 'maintenance';
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['trucks']['Row']> & { transporter_id: string; reg_number: string; type: string; capacity_tons: number; current_city: string; price_per_ton: number };
        Update: Partial<Database['public']['Tables']['trucks']['Row']>;
      };
      loads: {
        Row: {
          id: string;
          shipper_id: string;
          title: string;
          category: string | null;
          weight_tons: number;
          origin_city: string;
          destination_city: string;
          pickup_date: string;
          budget: number;
          truck_type_needed: string | null;
          status: 'open' | 'matched' | 'booked' | 'delivered';
          distance_km: number | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['loads']['Row']> & { shipper_id: string; title: string; weight_tons: number; origin_city: string; destination_city: string; pickup_date: string; budget: number };
        Update: Partial<Database['public']['Tables']['loads']['Row']>;
      };
      bookings: {
        Row: {
          id: string;
          load_id: string;
          truck_id: string;
          shipper_id: string;
          transporter_id: string;
          amount: number;
          status: 'confirmed' | 'in-transit' | 'delivered' | 'cancelled';
          progress_pct: number;
          driver_name: string | null;
          driver_phone: string | null;
          eta: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['bookings']['Row']> & { load_id: string; truck_id: string; shipper_id: string; transporter_id: string; amount: number };
        Update: Partial<Database['public']['Tables']['bookings']['Row']>;
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          booking_id: string | null;
          type: 'credit' | 'debit';
          label: string;
          amount: number;
          method: 'UPI' | 'Card' | 'Wallet' | 'Escrow';
          status: 'success' | 'pending' | 'failed';
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['transactions']['Row']> & { user_id: string; type: 'credit' | 'debit'; label: string; amount: number };
        Update: Partial<Database['public']['Tables']['transactions']['Row']>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          type: 'booking' | 'payment' | 'system' | 'ai';
          read: boolean;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['notifications']['Row']> & { user_id: string; title: string };
        Update: Partial<Database['public']['Tables']['notifications']['Row']>;
      };
      tracking_events: {
        Row: {
          id: string;
          booking_id: string;
          status_label: string;
          lat: number | null;
          lng: number | null;
          note: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['tracking_events']['Row']> & { booking_id: string; status_label: string };
        Update: Partial<Database['public']['Tables']['tracking_events']['Row']>;
      };
      route_waypoints: {
        Row: {
          id: string;
          truck_id: string | null;
          load_id: string | null;
          seq: number;
          city: string;
          state: string | null;
          km_from_origin: number | null;
          is_highway_junction: boolean;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['route_waypoints']['Row']> & { seq: number; city: string };
        Update: Partial<Database['public']['Tables']['route_waypoints']['Row']>;
      };
    };
  };
};