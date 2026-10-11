-- ==============================================================================
-- UD CLINIC POST-OPERATIVE MONITORING DATABASE SCHEMA FOR SUPABASE (POSTGRESQL)
-- ==============================================================================
-- Copy and paste this script directly into the Supabase SQL Editor and click "Run"

-- 1. Patients Table
CREATE TABLE IF NOT EXISTS public.patients (
    id TEXT PRIMARY KEY,
    hn TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    line_user_id TEXT,
    consent_accepted BOOLEAN DEFAULT true,
    consent_date TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for instant phone lookup during elderly patient login
CREATE INDEX IF NOT EXISTS idx_patients_phone ON public.patients(phone_number);

-- 2. Surgery Cases Table
CREATE TABLE IF NOT EXISTS public.surgery_cases (
    id TEXT PRIMARY KEY,
    patient_id TEXT REFERENCES public.patients(id) ON DELETE CASCADE,
    patient_name TEXT NOT NULL,
    hn TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    service_type TEXT NOT NULL,
    surgeon_name TEXT NOT NULL,
    surgery_date TEXT NOT NULL,
    follow_up_start_date TEXT,
    case_status TEXT DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for phone login and magic link token
CREATE INDEX IF NOT EXISTS idx_cases_phone ON public.surgery_cases(phone_number);
CREATE INDEX IF NOT EXISTS idx_cases_token ON public.surgery_cases(token);

-- 3. Daily Reports Table
CREATE TABLE IF NOT EXISTS public.daily_reports (
    id TEXT PRIMARY KEY,
    case_id TEXT REFERENCES public.surgery_cases(id) ON DELETE CASCADE,
    patient_id TEXT,
    patient_name TEXT NOT NULL,
    hn TEXT NOT NULL,
    surgery_date TEXT NOT NULL,
    report_date TEXT NOT NULL,
    post_op_day INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'submitted',
    status_label_thai TEXT NOT NULL,
    submitted_at TEXT,
    photos JSONB DEFAULT '[]'::jsonb,
    symptoms JSONB DEFAULT '{}'::jsonb,
    review_notes JSONB DEFAULT '[]'::jsonb,
    internal_clinical_notes TEXT DEFAULT '',
    customer_message TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for dashboard triage queue
CREATE INDEX IF NOT EXISTS idx_reports_case_id ON public.daily_reports(case_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.daily_reports(status);

-- 4. Enable Row Level Security (RLS) with permissive clinical policies
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surgery_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;

-- Allow anon read/insert/update for clinic operations
DROP POLICY IF EXISTS "Public access for patients" ON public.patients;
CREATE POLICY "Public access for patients" ON public.patients FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for surgery_cases" ON public.surgery_cases;
CREATE POLICY "Public access for surgery_cases" ON public.surgery_cases FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for daily_reports" ON public.daily_reports;
CREATE POLICY "Public access for daily_reports" ON public.daily_reports FOR ALL USING (true) WITH CHECK (true);
