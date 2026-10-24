-- ==============================================================================
-- UD CLINIC TORO: Phase 1 & 2 Clinical Back-Office Migration
-- ==============================================================================

-- 1. ตารางตารางติดตามล่วงหน้า (Follow-up Schedules D+1 ถึง D+14)
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

-- 2. ตารางงานคลินิก (Clinical Tasks: รอตรวจ, รอแพทย์, ค้างส่งรูป)
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

-- 3. ตารางประวัติการโทร/ติดต่อคนไข้ (Contact Logs)
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

-- 4. ตารางตรวจคุณภาพภาพถ่ายรายมุม (Photo Quality Evaluations)
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

-- 5. ตารางบันทึกประวัติการแก้ไขทางการแพทย์ (Clinical Audit Logs)
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

-- 6. ปรับสิทธิ์ RLS ให้ทำงานได้อย่างราบรื่น
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

-- 7. เพิ่มฟิลด์ข้อมูลเวชระเบียนคลินิกในตารางเดิม (Patients & Surgery Cases)
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS medical_conditions TEXT;

ALTER TABLE public.surgery_cases ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.surgery_cases ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE public.surgery_cases ADD COLUMN IF NOT EXISTS medical_conditions TEXT;
ALTER TABLE public.surgery_cases ADD COLUMN IF NOT EXISTS special_instructions TEXT;
