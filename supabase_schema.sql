-- Supabase Table Creation Queries (Copy-paste this inside Supabase SQL Editor)
-- Go to: https://supabase.com -> Project Dashboard -> SQL Editor -> New Query

-- 1. BUILDINGS
CREATE TABLE IF NOT EXISTS buildings (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    description TEXT
);

-- 2. FLOORS
CREATE TABLE IF NOT EXISTS floors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    building_id TEXT REFERENCES buildings(id) ON DELETE CASCADE
);

-- 3. APARTMENTS
CREATE TABLE IF NOT EXISTS apartments (
    id TEXT PRIMARY KEY,
    number TEXT NOT NULL,
    floor_id TEXT REFERENCES floors(id) ON DELETE CASCADE,
    building_id TEXT REFERENCES buildings(id) ON DELETE CASCADE,
    monthly_rent NUMERIC DEFAULT 0,
    status TEXT CHECK (status IN ('Occupied', 'Vacant', 'Maintenance')) DEFAULT 'Vacant',
    description TEXT
);

-- 4. TENANTS
CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    father_name TEXT,
    cnic TEXT,
    mobile_number TEXT,
    whatsapp_number TEXT,
    email TEXT,
    emergency_contact TEXT,
    permanent_address TEXT,
    current_address TEXT,
    occupation TEXT,
    monthly_income NUMERIC DEFAULT 0,
    family_members INT DEFAULT 1,
    photo_url TEXT,
    cnic_front_url TEXT,
    cnic_back_url TEXT,
    agreement_scan_url TEXT,
    security_deposit NUMERIC DEFAULT 0,
    advance_rent NUMERIC DEFAULT 0,
    start_date DATE,
    end_date DATE,
    apartment_id TEXT REFERENCES apartments(id) ON DELETE SET NULL,
    notes TEXT,
    active BOOLEAN DEFAULT TRUE
);

-- 5. PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
    building_id TEXT,
    floor_id TEXT,
    apartment_id TEXT,
    payment_date DATE,
    rent_month INT,
    rent_year INT,
    amount NUMERIC DEFAULT 0,
    late_charges NUMERIC DEFAULT 0,
    discount NUMERIC DEFAULT 0,
    utility_charges NUMERIC DEFAULT 0,
    other_charges NUMERIC DEFAULT 0,
    payment_method TEXT CHECK (payment_method IN ('Cash', 'Bank', 'JazzCash', 'EasyPaisa')),
    reference_number TEXT,
    remarks TEXT
);

-- 6. SYSTEM LOGS
CREATE TABLE IF NOT EXISTS logs (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    username TEXT,
    role TEXT,
    action TEXT,
    details TEXT
);

-- =========================================================================
-- IMPORTANT: DISABLE ROW LEVEL SECURITY (RLS) FOR DIRECT ANON API USAGE
-- Modern Supabase projects enable RLS by default. Run these to allow direct
-- read/write from your React Frontend Applet using the Anon Key.
-- =========================================================================
ALTER TABLE buildings DISABLE ROW LEVEL SECURITY;
ALTER TABLE floors DISABLE ROW LEVEL SECURITY;
ALTER TABLE apartments DISABLE ROW LEVEL SECURITY;
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE logs DISABLE ROW LEVEL SECURITY;

