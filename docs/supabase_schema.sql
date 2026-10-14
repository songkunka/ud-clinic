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

-- 5. Follow-up Schedules (D+1 to D+14 proactive tracking)
CREATE TABLE IF NOT EXISTS public.followup_schedules (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL REFERENCES public.surgery_cases(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    due_at TIMESTAMPTZ NOT NULL,
    post_op_day INTEGER NOT NULL,
    day_label TEXT NOT NULL,
    schedule_status TEXT NOT NULL DEFAULT 'upcoming',
    required_photo_angles JSONB DEFAULT '["frontal", "right_45", "left_45", "right_profile", "left_profile"]'::jsonb,
    submission_id TEXT,
    completed_at TIMESTAMPTZ,
    cancel_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sched_case ON public.followup_schedules(case_id);
CREATE INDEX IF NOT EXISTS idx_sched_status_date ON public.followup_schedules(schedule_status, scheduled_date);

-- 6. Clinical Tasks (Triage, Doctor Review, Overdue follow-up)
CREATE TABLE IF NOT EXISTS public.clinical_tasks (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL REFERENCES public.surgery_cases(id) ON DELETE CASCADE,
    schedule_id TEXT REFERENCES public.followup_schedules(id) ON DELETE SET NULL,
    submission_id TEXT,
    task_type TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'routine',
    task_status TEXT NOT NULL DEFAULT 'open',
    assigned_to TEXT,
    assigned_by TEXT,
    assigned_at TIMESTAMPTZ,
    escalation_reason TEXT,
    resolution_summary TEXT,
    closed_at TIMESTAMPTZ,
    closed_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.clinical_tasks(task_status, priority);
CREATE INDEX IF NOT EXISTS idx_tasks_case ON public.clinical_tasks(case_id);

-- 7. Contact Logs (Patient call tracking)
CREATE TABLE IF NOT EXISTS public.contact_logs (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    case_id TEXT NOT NULL REFERENCES public.surgery_cases(id) ON DELETE CASCADE,
    task_id TEXT REFERENCES public.clinical_tasks(id) ON DELETE SET NULL,
    contacted_at TIMESTAMPTZ DEFAULT now(),
    contacted_by TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'phone',
    contact_outcome TEXT NOT NULL,
    summary TEXT NOT NULL,
    next_action TEXT,
    next_action_due_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_case ON public.contact_logs(case_id, contacted_at DESC);

-- 8. Photo Quality Evaluations (Per-angle quality review)
CREATE TABLE IF NOT EXISTS public.photo_quality_evaluations (
    id TEXT PRIMARY KEY,
    submission_id TEXT NOT NULL,
    angle_code TEXT NOT NULL,
    quality_status TEXT NOT NULL DEFAULT 'acceptable',
    retake_reason TEXT,
    reviewed_by TEXT NOT NULL,
    reviewed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_photo_quality_sub ON public.photo_quality_evaluations(submission_id);

-- 9. Clinical Audit Logs
CREATE TABLE IF NOT EXISTS public.clinical_audit_logs (
    id TEXT PRIMARY KEY,
    actor_name TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    changes JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_resource ON public.clinical_audit_logs(resource_type, resource_id);

-- Enable RLS for all new tables
ALTER TABLE public.followup_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_quality_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access for followup_schedules" ON public.followup_schedules;
CREATE POLICY "Public access for followup_schedules" ON public.followup_schedules FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for clinical_tasks" ON public.clinical_tasks;
CREATE POLICY "Public access for clinical_tasks" ON public.clinical_tasks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for contact_logs" ON public.contact_logs;
CREATE POLICY "Public access for contact_logs" ON public.contact_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for photo_quality_evaluations" ON public.photo_quality_evaluations;
CREATE POLICY "Public access for photo_quality_evaluations" ON public.photo_quality_evaluations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for clinical_audit_logs" ON public.clinical_audit_logs;
CREATE POLICY "Public access for clinical_audit_logs" ON public.clinical_audit_logs FOR ALL USING (true) WITH CHECK (true);
