-- ============================================================================
-- Wapas — seed.sql
-- Optional demo data mirroring src/lib/mock-data.ts, using fixed UUIDs so
-- re-running this script is idempotent (upserts on primary key conflict).
-- Run after 0001-0003. Safe to run against a fresh Supabase project:
--   supabase db execute --file supabase/seed.sql
-- or paste into the SQL Editor.
--
-- These profiles are NOT linked to auth.users (auth_user_id stays null),
-- so they only work while RLS is disabled or you're using the service role
-- key — exactly what local development / a demo environment needs. Once you
-- wire up real signups, real users get their own profile row via
-- handle_new_user() instead of this seed file.
-- ============================================================================

insert into public.profiles (id, full_name, company_name, role, city, rating, verified, gst_number, kyc_status)
values
  ('11111111-1111-1111-1111-111111111001', 'Arjun Mehta', 'Mehta Logistics Pvt Ltd', 'transporter', 'Pune, Maharashtra', 4.7, true, '27ABCDE1234F1Z5', 'verified'),
  ('11111111-1111-1111-1111-111111111002', 'Bharat Patel', 'Patel Roadways', 'transporter', 'Ahmedabad, Gujarat', 4.4, true, '24ABCDE5678F1Z2', 'verified'),
  ('11111111-1111-1111-1111-111111111003', 'Kavya Iyer', 'ColdChain Movers', 'transporter', 'Bengaluru, Karnataka', 4.9, true, '29ABCDE9012F1Z8', 'verified'),
  ('11111111-1111-1111-1111-111111111004', 'Priya Raghavan', 'Shreeji Textiles', 'shipper', 'Mumbai, Maharashtra', 4.6, true, '27PQRXY1234F1Z1', 'verified'),
  ('11111111-1111-1111-1111-111111111005', 'Rohit Shah', 'DailyNeeds Distributors', 'shipper', 'Surat, Gujarat', 4.3, true, '24PQRXY5678F1Z9', 'verified'),
  ('11111111-1111-1111-1111-111111111006', 'Admin User', 'Wapas Technologies', 'admin', 'Bengaluru, Karnataka', 5.0, true, null, 'verified')
on conflict (id) do update set
  full_name = excluded.full_name,
  company_name = excluded.company_name,
  role = excluded.role,
  city = excluded.city,
  rating = excluded.rating,
  verified = excluded.verified,
  gst_number = excluded.gst_number,
  kyc_status = excluded.kyc_status;

insert into public.trucks (id, transporter_id, reg_number, type, capacity_tons, current_city, destination_city, available_from, price_per_ton, empty_leg, status)
values
  ('22222222-2222-2222-2222-222222222101', '11111111-1111-1111-1111-111111111001', 'MH12 GT 4521', 'Container', 18, 'Pune', 'Mumbai', '2026-08-06', 1450, true, 'available'),
  ('22222222-2222-2222-2222-222222222102', '11111111-1111-1111-1111-111111111002', 'GJ01 AX 8890', 'Open Body', 12, 'Ahmedabad', 'Surat', '2026-08-05', 980, true, 'available'),
  ('22222222-2222-2222-2222-222222222103', '11111111-1111-1111-1111-111111111003', 'KA05 MZ 2201', 'Refrigerated', 9, 'Bengaluru', 'Chennai', '2026-08-07', 2100, false, 'available'),
  ('22222222-2222-2222-2222-222222222104', '11111111-1111-1111-1111-111111111001', 'MH14 FZ 3302', 'Mini Truck', 3, 'Pune', 'Nashik', '2026-08-05', 1680, true, 'available')
on conflict (id) do update set status = excluded.status;

insert into public.loads (id, shipper_id, title, category, weight_tons, origin_city, destination_city, pickup_date, budget, truck_type_needed, status, distance_km)
values
  ('33333333-3333-3333-3333-333333333201', '11111111-1111-1111-1111-111111111004', 'Textile Rolls — 400 Bales', 'Textiles', 14, 'Mumbai', 'Pune', '2026-08-06', 21500, 'Container', 'open', 148),
  ('33333333-3333-3333-3333-333333333202', '11111111-1111-1111-1111-111111111005', 'FMCG Cartons — Retail Distribution', 'FMCG', 10, 'Surat', 'Ahmedabad', '2026-08-05', 9800, 'Open Body', 'open', 265)
on conflict (id) do update set status = excluded.status;

insert into public.bookings (id, load_id, truck_id, shipper_id, transporter_id, amount, status, progress_pct, driver_name, driver_phone, eta)
values
  ('44444444-4444-4444-4444-444444444301', '33333333-3333-3333-3333-333333333201', '22222222-2222-2222-2222-222222222101', '11111111-1111-1111-1111-111111111004', '11111111-1111-1111-1111-111111111001', 21500, 'in-transit', 62, 'Suresh Yadav', '+91 98200 11234', 'Today, 6:40 PM')
on conflict (id) do update set status = excluded.status, progress_pct = excluded.progress_pct;

insert into public.transactions (user_id, booking_id, type, label, amount, method, status)
values
  ('11111111-1111-1111-1111-111111111001', '44444444-4444-4444-4444-444444444301', 'debit', 'Platform fee — Booking #4444', 645, 'Wallet', 'success'),
  ('11111111-1111-1111-1111-111111111001', '44444444-4444-4444-4444-444444444301', 'debit', 'Fuel advance — Trip #4444', 3200, 'Card', 'success');

insert into public.notifications (user_id, title, description, type, read)
values
  ('11111111-1111-1111-1111-111111111001', 'AI found a high-match backhaul', '94% match: Mumbai → Pune, Textile Rolls, ₹21,500.', 'ai', false),
  ('11111111-1111-1111-1111-111111111004', 'Booking confirmed', 'Mehta Logistics accepted your load for Mumbai → Pune.', 'booking', false);

insert into public.tracking_events (booking_id, status_label, note)
values
  ('44444444-4444-4444-4444-444444444301', 'Booking confirmed', 'Escrow funded'),
  ('44444444-4444-4444-4444-444444444301', 'Truck loaded', 'Loaded at Mumbai warehouse'),
  ('44444444-4444-4444-4444-444444444301', 'In transit', 'En route via NH48');
