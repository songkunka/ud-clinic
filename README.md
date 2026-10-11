# UD Clinic — Post-Operative Face-Lift Monitoring Web App

ระบบเว็บแอปพลิเคชันสำหรับติดตามอาการและการฟื้นตัวของคนไข้หลังการผ่าตัดดึงหน้า (Face-Lift & Neck Lift) ของ **UD Clinic**  
พัฒนาตามข้อกำหนด **PRD v1.0** ครอบคลุมทั้งประสบการณ์ใช้งานบนมือถือของคนไข้ผ่าน LINE OA และระบบบริหารจัดการคัดกรองเคสของทีมแพทย์และพยาบาล (Staff & Doctor Dashboard)

---

## 1. จุดเด่นและคุณสมบัติหลักของระบบ (Core Features)

### 1.1 ฝั่งคนไข้ (Patient Mobile Web App — LINE OA Experience)
- **Mobile-first Design:** ออกแบบรองรับการใช้งานบนมือถือและ In-app browser ของ LINE โดยเฉพาะ
- **PDPA & Privacy First:** ข้อมูลรูปภาพใบหน้าเข้ารหัสและเข้าถึงตามสิทธิ์เฉพาะบุคคล ไม่เผยแพร่เป็น Public URL
- **Clinical Safety Disclaimer:** มีแถบเตือนและปุ่มติดต่อฉุกเฉิน 24 ชม. ตลอดเวลา ระบุชัดเจนว่าระบบไม่ใช่ช่องทางฉุกเฉิน
- **Guided Photo Capture (5 มุมมาตรฐาน):**
  1. หน้าตรง (Front View)
  2. เฉียงซ้าย 45° (Left Oblique)
  3. เฉียงขวา 45° (Right Oblique)
  4. ด้านข้างซ้าย 90° (Left Profile)
  5. ด้านข้างขวา 90° (Right Profile)
  - มีกรอบจัดตำแหน่งใบหน้า (Silhouette Overlay Guide)
  - คำแนะนำเรื่องแสงสว่าง, การถอดแว่น, และการรวบผมเปิดรอยแผล
  - รองรับกล้องมือถือจริง, ภาพตัวอย่างจำลองทางการแพทย์, และการอัปโหลดไฟล์
- **Symptom Questionnaire:** แบบสอบถามอาการมาตรฐาน (NRS Pain Score 0-10, การบวม, เลือด/น้ำเหลืองซึม, ไข้, ความรู้สึกชา/ตึง) พร้อมระบบแจ้งเตือนอาการผิดปกติเฉียบพลัน
- **Review & Submit:** สรุปภาพ 5 มุมและคำตอบทั้งหมด พร้อมระบบป้องกันการกดส่งซ้ำ และออกเลขอ้างอิงรายงาน (Report Ref ID)
- **Clear Status Distinction:** แยกสถานะ "ส่งรายงานแล้ว — รอทีมดูแลตรวจสอบ" ออกจากสถานะ "ตรวจแล้ว" อย่างเด็ดขาดตามมาตรฐานความปลอดภัย

### 1.2 ฝั่งเจ้าหน้าที่และแพทย์ (Staff & Doctor Clinical Dashboard)
- **Triage & Queue Management:**
  - Metric Cards: รายงานใหม่, ค้างตรวจเกิน SLA (> 120 นาที), ส่งต่อแพทย์, ติดตามเร่งด่วน, ตรวจแล้วเสร็จ
  - ระบบตัวกรองและค้นหาตามชื่อคนไข้, HN, หรือศัลยแพทย์ผู้ผ่าตัด
  - สัญลักษณ์เตือนเร่งด่วน (Urgent Flag) เมื่อคนไข้รายงานอาการปวดสูงหรือแผลซึมมาก
- **Case Review & Clinical Inspection:**
  - ตรวจสอบภาพถ่ายใบหน้าความละเอียดสูงทั้ง 5 มุม
  - **การแยกฟิลด์ข้อความเด็ดขาด (Strict Separation):**
    - *Internal Clinical Note:* บันทึกภายในคลินิก (คนไข้ไม่เห็นเด็ดขาด)
    - *Customer Message:* คำแนะนำที่ส่งให้คนไข้เห็นในแอป
  - การส่งต่อแพทย์ (Refer to Doctor) พร้อมระบุข้อสังเกต
  - การขอภาพหรือข้อมูลเพิ่มเติม (Request More Info)
- **Side-by-Side Photo Timeline Compare:**
  - เครื่องมือเปรียบเทียบภาพใบหน้ามุมเดียวกันระหว่างวัน (เช่น D+1 เทียบกับ D+7 หรือ D+14) เพื่อประเมินการยุบตัวของอาการบวมและรอยเย็บแผลอย่างแม่นยำ

### 1.3 ฝั่งผู้ดูแลระบบ (Admin Governance & Protocols)
- **Protocol Settings:** ปรับแต่งมุมภาพที่ต้องถ่ายตามโปรโตคอล, กำหนดเกณฑ์เวลา SLA คัดกรองเคส
- **PDPA Audit Trail:** บันทึกประวัติการเปิดดูภาพคนไข้, การเปลี่ยนสถานะ, การส่งต่อ, และเวลาที่ทำรายการ

### 1.4 Interactive Demo Bar (โหมดทดสอบสำหรับผู้ประเมิน)
- มีแถบควบคุมด้านบนให้คลิกสลับบทบาทได้ทันทีระหว่าง:
  - `คนไข้ (LINE Mobile)`
  - `Care Staff`
  - `แพทย์ (Doctor)`
  - `Admin`
- สลับดูเคสตัวอย่างจำลองได้ทันที (D+1, D+3, D+7, D+14)
- ปุ่มรีเซ็ตข้อมูลทดสอบกลับเป็นค่าเริ่มต้น (Reset Demo Data)

---

## 2. โครงสร้างเทคโนโลยี (Technology Stack)

- **Framework:** Next.js 16 (App Router, Turbopack, React 19)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4 + UD Clinic Design System Tokens (Royal Navy, Medical Blue, Slate, White)
- **Icons:** `lucide-react` (ไอคอนเวกเตอร์ทางการแพทย์มาตรฐาน — **ไม่มี Emoji ใน UI หลัก** ตามข้อกำหนด PRD)
- **State Management:** Reactive Client Store พร้อม LocalStorage Persistence และ Real-time Sync

---

## 3. วิธีการติดตั้งและรันระบบ (Local Setup)

### ข้อกำหนดเบื้องต้น
- Node.js version 18.0 ขึ้นไป
- npm (บน Windows แนะนำให้ใช้ `npm.cmd`)

### คำสั่งเริ่มต้นใช้งาน
```bash
# 1. เข้าสู่โฟลเดอร์โปรเจกต์
cd ud-clinic

# 2. ติดตั้ง Dependencies (หากยังไม่ได้ติดตั้ง)
npm install

# 3. รัน Development Server
npm run dev
```

เปิดเบราว์เซอร์ไปที่: **`http://localhost:3000`**

### การทดสอบ Build สำหรับ Production
```bash
npm run build
npm run start
```

---

## 4. แฟ้มและโฟลเดอร์ของโปรเจกต์ (Project Structure)

```text
ud-clinic/
├── src/
│   ├── app/
│   │   ├── globals.css              # Design tokens & Sarabun typography
│   │   ├── layout.tsx               # App root layout & SEO metadata
│   │   └── page.tsx                 # Main entry page with Demo switcher
│   ├── components/
│   │   ├── common/
│   │   │   ├── DemoBar.tsx          # Top interactive role & case switcher
│   │   │   ├── EmergencyNotice.tsx  # Safety banner & 24h contact modal
│   │   │   └── StatusBadge.tsx      # Thai clinical status badges
│   │   ├── patient/
│   │   │   ├── CameraGuideCapture.tsx   # 5-angle guided capture + silhouette
│   │   │   ├── SymptomQuestionnaire.tsx # Pain scale, swelling & clinical form
│   │   │   ├── ReportReviewSubmit.tsx   # Final verification & submission
│   │   │   ├── ReportSuccessModal.tsx   # Reference code & triage receipt
│   │   │   └── PatientHomeView.tsx      # Patient mobile home experience
│   │   ├── staff/
│   │   │   ├── StaffDashboardView.tsx   # Metric cards, triage queue table
│   │   │   ├── CaseReviewModal.tsx      # High-res review & strict notes separation
│   │   │   └── PhotoTimelineCompare.tsx # Side-by-side post-op comparison
│   │   └── admin/
│   │       └── AdminManagementView.tsx  # Protocol config & PDPA audit trail
│   └── lib/
│       ├── types.ts                 # Data models matching PRD Section 11 & 12
│       ├── mock-data.ts             # Synthetic Thai face-lift post-op cases
│       ├── store.ts                 # Persistent reactive state store
│       └── svg-silhouettes.ts       # Face contour guides & photo simulators
├── public/                          # Static assets
└── package.json
```

---

## 5. กฎเกณฑ์ทางการแพทย์และความปลอดภัย (Clinical & Legal Compliance)

1. **ห้ามใช้วินิจฉัยอัตโนมัติ:** ไม่มีระบบ AI สรุปผลว่าคนไข้ "ปกติ" ทุกรายงานต้องผ่านการตรวจคัดกรองโดยบุคลากรทางการแพทย์จริง
2. **ไม่ใช่ช่องทางฉุกเฉิน:** แสดงข้อความชี้แจงและเบอร์โทรศัพท์สายด่วนในทุกหน้าจอสำคัญ
3. **การแยกข้อมูลภายใน:** ข้อความ Internal Note จะไม่ถูกส่งต่อไปยังฝั่งคนไข้โดยเด็ดขาด
4. **ความยินยอม (Consent):** มีการบันทึกสถานะการยินยอมและประวัติการตรวจสอบย้อนหลังตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล (PDPA)
