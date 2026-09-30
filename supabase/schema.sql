-- PRIZM SALON - Supabase PostgreSQL Database Schema
-- Run this script in your Supabase project: SQL Editor -> New Query -> Run

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. STYLISTS TABLE
create table if not exists public.stylists (
    id text primary key,
    name text not null,
    role text not null,
    phone text not null,
    rating text default '5.0',
    is_featured boolean default false,
    created_at timestamptz default now()
);

-- 2. STAFF ACCOUNTS TABLE (Studio Manager + Stylists)
create table if not exists public.staff_accounts (
    id text primary key,
    user_id text unique not null,
    name text not null,
    role text not null check (role in ('manager', 'stylist')),
    stylist_id text references public.stylists(id) on delete set null,
    phone text not null,
    password text not null,
    created_at timestamptz default now()
);

-- 3. STYLIST SCHEDULES TABLE (Weekly Rosters & Date Overrides)
create table if not exists public.schedules (
    stylist_id text primary key references public.stylists(id) on delete cascade,
    stylist_name text not null,
    weekly_schedule jsonb not null default '{}'::jsonb,
    date_overrides jsonb not null default '{}'::jsonb,
    updated_at timestamptz default now()
);

-- 4. APPOINTMENTS TABLE (Online Bookings + Reserved Slots)
create table if not exists public.appointments (
    id text primary key,
    booking_ref text unique not null,
    customer_name text not null,
    customer_phone text not null,
    customer_email text default '',
    service_id text not null,
    service_name text not null,
    stylist_name text not null,
    date text not null, -- Format: YYYY-MM-DD
    time_slot text not null, -- e.g. '10:30 AM'
    price numeric not null default 0,
    status text not null default 'confirmed',
    payment_status text not null default 'pay_at_studio',
    whatsapp_sent boolean default false,
    is_walk_in boolean default false,
    notes text default '',
    created_at timestamptz default now()
);

-- DOUBLE-BOOKING SHIELD: Guarantee no two confirmed bookings can take the same stylist slot on the same date!
create unique index if not exists idx_unique_stylist_slot 
on public.appointments (lower(trim(stylist_name)), date, upper(trim(time_slot))) 
where status = 'confirmed';

-- 5. WALK-IN SESSIONS TABLE (Offline Walk-ins Logged by Staff)
create table if not exists public.walk_ins (
    id text primary key,
    booking_ref text unique not null,
    stylist_id text references public.stylists(id) on delete set null,
    stylist_name text not null,
    client_identifier text not null,
    service_name text not null,
    date text not null, -- Format: YYYY-MM-DD
    start_time text not null,
    duration_minutes integer not null,
    end_time text not null,
    blocked_slots text[] not null default array[]::text[],
    amount numeric not null default 0,
    payment_status text not null default 'paid',
    whatsapp_sent boolean default false,
    notes text default '',
    created_at timestamptz default now()
);

-- INDEXES for lightning-fast queries
create index if not exists idx_appointments_date on public.appointments(date);
create index if not exists idx_appointments_stylist on public.appointments(lower(trim(stylist_name)));
create index if not exists idx_walkins_date on public.walk_ins(date);

-- Enable Row Level Security (RLS) and allow public API access via Anon Key
alter table public.stylists enable row level security;
alter table public.staff_accounts enable row level security;
alter table public.schedules enable row level security;
alter table public.appointments enable row level security;
alter table public.walk_ins enable row level security;

-- Permissive policies for PRIZM service operations
create policy "Allow all operations for stylists" on public.stylists for all using (true) with check (true);
create policy "Allow all operations for staff_accounts" on public.staff_accounts for all using (true) with check (true);
create policy "Allow all operations for schedules" on public.schedules for all using (true) with check (true);
create policy "Allow all operations for appointments" on public.appointments for all using (true) with check (true);
create policy "Allow all operations for walk_ins" on public.walk_ins for all using (true) with check (true);

-- SEED DATA: Insert 3 Master Stylists
insert into public.stylists (id, name, role, phone, rating, is_featured) values
('swagat', 'Swagat', 'Creative Director & Master Stylist', '7981262237', '5.0', true),
('dev-k', 'Dev K.', 'Senior Art Director', '7894376562', '4.9', false),
('sofia-v', 'Sofia V.', 'Master Colourist', '7894376562', '5.0', false)
on conflict (id) do update set 
    name = excluded.name, 
    phone = excluded.phone, 
    role = excluded.role;

-- SEED DATA: Insert Staff Accounts
insert into public.staff_accounts (id, user_id, name, role, stylist_id, phone, password) values
('acc_manager', 'manager_prizm', 'Studio Manager', 'manager', null, '7894376562', 'admin@2026'),
('acc_swagat', 'swagat_prizm', 'Swagat', 'stylist', 'swagat', '7981262237', 'swagat@2026'),
('acc_dev', 'dev_prizm', 'Dev K.', 'stylist', 'dev-k', '7894376562', 'dev@2026'),
('acc_sofia', 'sofia_prizm', 'Sofia V.', 'stylist', 'sofia-v', '7894376562', 'sofia@2026')
on conflict (user_id) do update set 
    password = excluded.password, 
    phone = excluded.phone;

-- SEED DATA: Default Weekly Schedules
insert into public.schedules (stylist_id, stylist_name, weekly_schedule, date_overrides) values
(
    'swagat',
    'Swagat',
    '{
        "0": {"isWorking": false, "notes": "Studio Closed (Sun by appt)"},
        "1": {"isWorking": true},
        "2": {"isWorking": true, "customSlots": ["10:30 AM", "11:45 AM", "01:15 PM"], "notes": "Morning Shift (10:30 AM – 2:00 PM)"},
        "3": {"isWorking": true},
        "4": {"isWorking": false, "notes": "Weekly Off / Colour Lab Day"},
        "5": {"isWorking": true},
        "6": {"isWorking": true}
    }'::jsonb,
    '{}'::jsonb
),
(
    'dev-k',
    'Dev K.',
    '{
        "0": {"isWorking": false},
        "1": {"isWorking": false, "notes": "Weekly Off (Monday)"},
        "2": {"isWorking": true},
        "3": {"isWorking": true},
        "4": {"isWorking": true},
        "5": {"isWorking": true},
        "6": {"isWorking": true}
    }'::jsonb,
    '{}'::jsonb
),
(
    'sofia-v',
    'Sofia V.',
    '{
        "0": {"isWorking": false},
        "1": {"isWorking": true},
        "2": {"isWorking": false, "notes": "Weekly Off (Tuesday)"},
        "3": {"isWorking": true},
        "4": {"isWorking": true},
        "5": {"isWorking": true},
        "6": {"isWorking": true}
    }'::jsonb,
    '{}'::jsonb
)
on conflict (stylist_id) do nothing;
