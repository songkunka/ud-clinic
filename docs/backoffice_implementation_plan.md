# แผนการพัฒนาระบบหลังบ้านคลินิกอย่างละเอียด (Clinical Back-Office Implementation Plan)
## UD CLINIC TORO — Post-Operative Face-Lift Monitoring System

> **อ้างอิงตามข้อกำหนด:** `postop_followup_requirements.md`  
> **เงื่อนไขเฉพาะ:** ไม่รวมระบบตัวชี้วัด / สถิติ KPI ตามความต้องการของผู้ว่าจ้าง โดยมุ่งเน้นการทำงานจริงทางคลินิก (Clinical Operations, Patient Safety, Protocol Adherence, Triage)

---

## 1. สถาปัตยกรรมและหลักการทำงานใหม่ (Architectural Shift)

### จาก "ระบบรอรับภาพ (Reactive)" สู่ "ระบบกำกับตารางติดตามเชิงรุก (Proactive Protocol)"

```
[เดิม: Reactive]
คนไข้ส่งรูป ──► เข้าคิว daily_reports ──► ตรวจ (ถ้าคนไข้ไม่ส่ง = ข้อมูลหาย ไร้ร่องรอย)

[ใหม่: Proactive Protocol-Driven]
เปิดเคสผ่าตัด ──► สร้าง Follow-up Schedule ล่วงหน้า (D+1 ถึง D+14) ทันที
                      │
                      ├─► ถึงกำหนด (Due) ──► คนไข้ส่งรูป ──► [คิวรอตรวจ (To Review)] ──► ตรวจรับคุณภาพ 5 มุม
                      │                                                                   │
                      │                                                                   ├─► ผ่าน ──► บันทึกผล / ส่งต่อแพทย์
                      │                                                                   └─► ไม่ผ่าน ──► [คิวขอถ่ายซ่อม (Needs Retake)]
                      │
                      └─► ถึงกำหนดแต่ไม่ส่ง ──► เกินเวลา (Overdue) ──► [คิวติดตามด่วน (Overdue Queue)] ──► บันทึกการโทรตาม (Contact Log)
```

---

## 2. การออกแบบฐานข้อมูลใหม่ (Database Schema — Supabase PostgreSQL)

เพื่อรองรับการทำงานที่ไม่สูญหายและแยกสถานะ 4 มิติอย่างอิสระ ระบบต้องเพิ่ม 5 ตารางหลัก และปรับปรุงตารางเดิมดังนี้:

### 2.1 ตาราง `followup_schedules` (ตารางติดตามล่วงหน้า)
ตารางนี้จะถูกสร้างอัตโนมัติทันทีที่สร้างเคสผ่าตัด (D+1 ถึง D+14 ตามโปรโตคอลการดึงหน้า)
```sql
CREATE TABLE IF NOT EXISTS public.followup_schedules (
    id TEXT PRIMARY KEY,                          -- เช่น 'sch_case001_d1'
    case_id TEXT NOT NULL REFERENCES public.surgery_cases(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,                 -- วันที่ต้องส่ง เช่น '2026-10-12'
    due_at TIMESTAMPTZ NOT NULL,                  -- เวลาตัดรอบ เช่น 20:00 น. ของวันนั้น
    post_op_day INTEGER NOT NULL,                 -- 1 ถึง 14
    day_label TEXT NOT NULL,                      -- 'D+1', 'D+2' ...
    schedule_status TEXT NOT NULL DEFAULT 'upcoming', 
    -- ค่าที่เป็นไปได้: 'upcoming', 'due', 'overdue', 'submitted', 'completed', 'cancelled'
    required_photo_angles JSONB DEFAULT '["frontal", "right_45", "left_45", "right_profile", "left_profile"]'::jsonb,
    submission_id TEXT,                           -- ผูกกับ submission เมื่อได้รับข้อมูล
    completed_at TIMESTAMPTZ,
    cancel_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sched_case ON public.followup_schedules(case_id);
CREATE INDEX IF NOT EXISTS idx_sched_status_date ON public.followup_schedules(schedule_status, scheduled_date);
```

### 2.2 ตาราง `clinical_tasks` (งานติดตามและคิวตรวจของเจ้าหน้าที่)
```sql
CREATE TABLE IF NOT EXISTS public.clinical_tasks (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL REFERENCES public.surgery_cases(id) ON DELETE CASCADE,
    schedule_id TEXT REFERENCES public.followup_schedules(id) ON DELETE SET NULL,
    submission_id TEXT,
    task_type TEXT NOT NULL, 
    -- 'review_submission' (ตรวจภาพใหม่)
    -- 'overdue_followup' (คนไข้ค้างส่งรูป)
    -- 'request_retake' (คนไข้ต้องถ่ายซ่อม)
    -- 'doctor_review' (ส่งต่อให้แพทย์ประเมิน)
    priority TEXT NOT NULL DEFAULT 'routine',     -- 'routine', 'priority', 'urgent', 'emergency'
    task_status TEXT NOT NULL DEFAULT 'open',     -- 'open', 'in_progress', 'waiting_for_patient', 'waiting_for_doctor', 'closed'
    assigned_to TEXT,                             -- ชื่อ/รหัสพยาบาลหรือแพทย์ผู้รับผิดชอบ
    assigned_by TEXT,
    assigned_at TIMESTAMPTZ,
    escalation_reason TEXT,                       -- เหตุผลที่ส่งต่อแพทย์ หรือเหตุผลที่ตั้งเป็นเคสด่วน
    resolution_summary TEXT,                      -- สรุปผลการปิดงาน
    closed_at TIMESTAMPTZ,
    closed_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.clinical_tasks(task_status, priority);
CREATE INDEX IF NOT EXISTS idx_tasks_case ON public.clinical_tasks(case_id);
```

### 2.3 ตาราง `contact_logs` (ประวัติการโทรและการติดต่อคนไข้)
ป้องกันปัญหาพยาบาลโทรซ้ำซ้อน และติดตามผลการโทรจนจบกระบวนการ
```sql
CREATE TABLE IF NOT EXISTS public.contact_logs (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    case_id TEXT NOT NULL REFERENCES public.surgery_cases(id) ON DELETE CASCADE,
    task_id TEXT REFERENCES public.clinical_tasks(id) ON DELETE SET NULL,
    contacted_at TIMESTAMPTZ DEFAULT now(),
    contacted_by TEXT NOT NULL,                   -- ชื่อเจ้าหน้าที่ผู้โทร
    channel TEXT NOT NULL DEFAULT 'phone',        -- 'phone', 'line', 'sms'
    contact_outcome TEXT NOT NULL, 
    -- 'reached' (ติดต่อได้/รับสาย)
    -- 'no_answer' (ไม่รับสาย)
    -- 'unreachable' (ติดต่อไม่ได้/ปิดเครื่อง)
    -- 'callback_requested' (ขอให้โทรกลับ)
    summary TEXT NOT NULL,                        -- สาระสำคัญ เช่น คนไข้แจ้งว่าติดธุระ จะส่งรูปก่อน 20.00 น.
    next_action TEXT,                             -- ขั้นตอนถัดไป เช่น 'โทรตามอีกครั้งหากยังไม่ส่งรูป'
    next_action_due_at TIMESTAMPTZ,               -- เวลาที่ต้องทำขั้นถัดไป เช่น วันนี้ 19:30 น.
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_case ON public.contact_logs(case_id, contacted_at DESC);
```

### 2.4 ตาราง `photo_quality_evaluations` (การตรวจรับคุณภาพรูป 5 มุม)
```sql
CREATE TABLE IF NOT EXISTS public.photo_quality_evaluations (
    id TEXT PRIMARY KEY,
    submission_id TEXT NOT NULL,
    angle_code TEXT NOT NULL,                     -- 'frontal', 'right_45', etc.
    quality_status TEXT NOT NULL DEFAULT 'acceptable', -- 'acceptable', 'retake_required'
    retake_reason TEXT,                           -- 'ผมบังบริเวณแผลหน้าหู', 'แสงมืดเกินไป', 'มุมเงยไม่ถูกต้อง'
    reviewed_by TEXT NOT NULL,
    reviewed_at TIMESTAMPTZ DEFAULT now()
);
```

### 2.5 ตาราง `clinical_audit_logs` (ประวัติการทำงานและการแก้ไขทางการแพทย์)
```sql
CREATE TABLE IF NOT EXISTS public.clinical_audit_logs (
    id TEXT PRIMARY KEY,
    actor_name TEXT NOT NULL,
    actor_role TEXT NOT NULL,                     -- 'nurse', 'doctor', 'admin'
    action TEXT NOT NULL,                         -- 'view_photos', 'save_assessment', 'refer_to_doctor', 'call_logged', 'schedule_cancelled'
    resource_type TEXT NOT NULL,                  -- 'daily_report', 'surgery_case', 'followup_schedule'
    resource_id TEXT NOT NULL,
    changes JSONB DEFAULT '{}'::jsonb,            -- บันทึกค่าก่อนแก้และหลังแก้ (Diff)
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 3. รายละเอียดการพัฒนาแต่ละโมดูล (Detailed Module Breakdown)

### โมดูลที่ 1: ตารางติดตามอัตโนมัติ & คิวคนไข้ค้างส่งรูป (Proactive Follow-up & Overdue Queue)
* **การทำงาน:**
  1. เมื่อเจ้าหน้าที่กด **"ลงทะเบียนคนไข้ใหม่"** ที่หน้า `/staff`:
     - ระบบจะนำวันที่ผ่าตัด (`surgery_date`) มาคำนวณวันล่วงหน้า D+1 ถึง D+14 อัตโนมัติ (โดยใช้ Timezone `Asia/Bangkok`)
     - สร้างแถวในตาราง `followup_schedules` จำนวน 14 รายการทันที
  2. ระบบเปรียบเทียบเวลาปัจจุบันกับ `scheduled_date` และ `due_at` (เช่น 18:00 น. ของวัน):
     - วันที่ยังมาไม่ถึง = `upcoming`
     - ถึงกำหนดวันนี้และยังไม่ได้รับภาพ = `due`
     - พ้นเวลาตัดรอบแล้วยังไม่ได้รับภาพ = `overdue` (สร้าง Task เร่งด่วนอัตโนมัติ)
* **หน้าจอ UI หลังบ้าน (`/staff`):**
  - เพิ่มแถบ **"ค้างส่งรูป / ถึงกำหนด (Due & Overdue)"**
  - แสดงรายชื่อคนไข้ที่ถึงเวลาส่งวันนี้ พร้อมปุ่มลัด:
    - `[ 📞 โทรติดตาม ]` — คลิกแล้วเปิดแบบฟอร์มบันทึกการโทร
    - `[ 📋 คัดลอก Magic Link ]` — ก๊อปปี้ลิงก์สำหรับส่งทาง LINE เพื่อให้คนไข้กดเข้ากล้องได้ทันที

---

### โมดูลที่ 2: ระบบตรวจรับคุณภาพภาพถ่าย 5 มุม (Per-Angle Photo Quality & Retake)
* **การทำงาน:**
  1. ในหน้า Modal ตรวจเคส เมื่อเจ้าหน้าที่คลิกดูภาพ 5 มุม แต่ละมุมจะมีสวิตช์ตรวจรับ:
     - `[ ✓ ภาพผ่าน ]` (ค่าเริ่มต้น)
     - `[ ✕ ขอถ่ายใหม่ ]`
  2. หากเลือก "ขอถ่ายใหม่":
     - จะมีเมนู Quick Reason ให้เลือก: *เส้นผมบดบังแผล*, *ภาพเบลอ/ไม่โฟกัส*, *แสงมืดเกินไป*, *มุมไม่ตรงตามกำหนด (หน้าตรง/เงย/เอียง)*
     - ระบบเปลี่ยนสถานะ submission เป็น `needs_retake`
     - ฝั่งคนไข้ เมื่อเปิดเว็บเข้ามา จะไม่ให้ถ่ายใหม่ทั้งหมด 5 รูป แต่จะ**เปิดกล้องให้ถ่ายซ่อมเฉพาะมุมที่แพทย์/พยาบาลขอถ่ายใหม่เท่านั้น** พร้อมแสดงข้อความแนะนำว่าให้ปรับปรุงอย่างไร

---

### โมดูลที่ 3: ระบบส่งต่อแพทย์เฉพาะทาง (Doctor Escalation & Clinical Disposition)
* **การทำงาน:**
  1. พยาบาล Care Coordinator ตรวจภาพและอาการเบื้องต้น:
     - หากพบอาการผิดปกติ (เช่น ปวดระดับ >=7, แผลมีเลือดสดซึม, อาการบวมไม่เท่ากันรุนแรง):
     - กดปุ่ม **`[ 🩺 ส่งต่อแพทย์ประเมิน ]`**
     - เลือกระดับความเร่งด่วน: `เร่งด่วน (Urgent)` หรือ `ฉุกเฉิน (Emergency)`
     - กรอกข้อความส่งต่อ: เช่น *"คนไข้ D+2 แจ้งว่ามีเลือดสดซึมผ้าพันแผลด้านขวา อาการปวดเพิ่มขึ้น ขอให้อาจารย์หมอช่วยประเมินการเปิดแผลค่ะ"*
  2. เคสจะถูกย้ายเข้าสู่แท็บ **"รอแพทย์ตรวจ (Awaiting Doctor)"** ทันที
  3. เมื่อแพทย์ศัลยกรรมเข้าสู่ระบบ:
     - กรองดูเฉพาะเคสในแท็บ "รอแพทย์ตรวจ"
     - แพทย์สามารถบันทึก:
       - คำสั่งการรักษาทางคลินิก (Doctor's Clinical Orders)
       - ข้อความส่งถึงคนไข้ (Customer Message)
       - ปุ่มกดสั่งนัดคนไข้เข้ามาตรวจที่คลินิกทันที
     - ลงนามแพทย์ผู้ตรวจ (Doctor Signed) พร้อมปิดงานส่งต่อ

---

### โมดูลที่ 4: บันทึกการติดต่อคนไข้ & ป้องกันโทรซ้ำ (Contact Logger)
* **การทำงาน:**
  1. บนการ์ดคนไข้และใน Modal ตรวจ จะมีปุ่ม **"บันทึกการติดต่อ"**
  2. เมื่อพยาบาลโทรหาคนไข้ กดบันทึกผลได้ใน 3 วินาที:
     - สถานะ: `รับสาย / พูดคุยแล้ว` | `ไม่รับสาย` | `ติดต่อไม่ได้ / ปิดเครื่อง`
     - บันทึกย่อ: เช่น *"โทรแจ้งเตือนให้ประคบเย็น คนไข้แจ้งว่าเริ่มยุบบวมแล้ว อาการปกติ"*
     - การติดตามถัดไป: เช่น *"นัดโทรติดตามพรุ่งนี้ 10:00 น."*
  3. การ์ดคนไข้จะแสดงแถบป้าย:
     - `โทรล่าสุด: วันนี้ 11:30 น. (โดย พว.สุดาพร - รับสายเรียบร้อย)`
     - ป้องกันไม่ให้พยาบาลท่านอื่นกดโทรซ้ำซ้อนในเรื่องเดิม

---

### โมดูลที่ 5: คลังเทมเพลตข้อความตอบกลับทางการแพทย์ (Quick Response Templates)
* **การทำงาน:**
  1. ในช่องพิมพ์ข้อความหาคนไข้ มีปุ่ม **`[ ⚡ ข้อความสำเร็จรูป ]`**
  2. แยกตามหมวดหมู่การรักษาของศัลยกรรมดึงหน้า:
     - **หมวดแผลปกติ:**
       - *"แผลผ่าตัดแห้งสนิทดี อาการบวมช้ำอยู่ในเกณฑ์ปกติของ D+{postOpDay} แนะนำประคบเย็นต่อบริเวณแก้ม และนอนยกศีรษะสูงนะคะ"*
     - **หมวดขอถ่ายรูปใหม่:**
       - *"รบกวนคุณคนไข้ถ่ายภาพมุม {angleName} ใหม่อีกครั้งนะคะ โดยรบกวนเก็บผมเปิดให้เห็นรอยเย็บหน้าหูและบริเวณขมับให้ชัดเจนค่ะ"*
     - **หมวดเตรียมตัวตัดไหม:**
       - *"วันพรุ่งนี้เป็นวันครบกำหนดตัดไหม (D+7) รบกวนคนไข้เข้ามาที่คลินิกเวลาตามที่นัดหมายได้เลยนะคะ หากมีข้อสงสัยติดต่อ 02-xxx-xxxx ค่ะ"*
     - **หมวดอาการเตือนให้พบแพทย์:**
       - *"จากภาพและอาการที่แจ้งเข้ามา คุณหมอขอให้คนไข้เข้ามาตรวจดูแผลที่คลินิกวันนี้ รบกวนติดต่อกลับเจ้าหน้าที่ทันทีที่เบอร์โทรคลินิกนะคะ"*

---

### โมดูลที่ 6: ประวัติการตรวจสอบย้อนหลังทางการแพทย์ (Clinical Audit Trail)
* **การทำงาน:**
  - ทุกการกดบันทึกผลตรวจ, การแก้ข้อความ, การเปลี่ยนสถานะความเร่งด่วน, หรือการกดยกเลิกกำหนดการ
  - บันทึกลงตาราง `clinical_audit_logs` อัตโนมัติ:
    - ใครเป็นผู้ทำรายการ (Actor Name & Role)
    - เวลาที่ทำรายการ (Timestamp Asia/Bangkok)
    - ค่าก่อนแก้ไข (Old Value) vs ค่าหลังแก้ไข (New Value)
    - เหตุผลในการแก้ไข (Amendment Reason)
  - มีแท็บ **"ประวัติการแก้ไข (Audit History)"** ใน Modal เพื่อให้แพทย์และหัวหน้าพยาบาลเรียกดูได้ตลอดเวลา

---

## 4. ลำดับการลงมือพัฒนาจริง (Phased Roadmap)

| เฟส (Phase) | รายละเอียดงานที่จะสร้าง | ไฟล์ที่เกี่ยวข้อง |
|---|---|---|
| **Phase 1: Database & Overdue Schedules** | 1. อัปเดต SQL Schema สร้างตาราง `followup_schedules`, `clinical_tasks`, `contact_logs`<br>2. อัปเดตฟังก์ชัน `createCase` ให้สร้างกำหนดการ D+1 ถึง D+14 อัตโนมัติ<br>3. สร้างแท็บ **"ค้างส่งรูป (Due/Overdue)"** ในหน้า `/staff` | `docs/supabase_schema.sql`<br>`src/lib/db-service.ts`<br>`src/components/staff/StaffDashboardView.tsx` |
| **Phase 2: Per-Angle Quality & Doctor Escalation** | 1. สร้าง Checklist ตรวจรับภาพ 5 มุมแยกเป็นรายรูป (`Accept` / `Request Retake`)<br>2. สร้าง Workflow ส่งต่อแพทย์ พร้อมแท็บ **"รอแพทย์ประเมิน"**<br>3. ปรับฝั่งกล้องคนไข้ (`/client`) ให้เปิดเฉพาะมุมที่ต้องถ่ายซ่อม | `src/components/staff/CaseReviewModal.tsx`<br>`src/components/patient/ClientCameraPortal.tsx`<br>`src/lib/types.ts` |
| **Phase 3: Contact Logger & Clinical Templates** | 1. สร้าง Form บันทึกการโทรติดตามคนไข้ และแสดงป้ายการโทรล่าสุด<br>2. สร้างปุ่มเลือก Quick Response Templates สำหรับการดูแลหลังผ่าตัดดึงหน้า<br>3. ติดตั้งระบบบันทึก Audit Trail สำหรับการแก้ไขผลตรวจ | `src/components/staff/ContactLogModal.tsx`<br>`src/components/staff/QuickTemplatePicker.tsx`<br>`src/lib/audit.ts` |
