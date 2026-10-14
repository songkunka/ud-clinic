# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary User 1: Post-Operative Face-Lift Patients (คนไข้หลังผ่าตัดดึงหน้า)**
  - Demographics: Predominantly middle-aged and elderly individuals (อายุ 45–70+ ปี), often with low tech-savviness or presbyopia (สายตายาวตามวัย).
  - Situation: Recovering at home during Day 1 to Day 14 post-surgery (D+1 to D+14) with facial bandages, swelling, and surgical incisions.
  - Job: Open the application effortlessly from LINE OA, take 5 standardized facial photos without typing or friction, submit daily pain/swelling status, and view surgical follow-up feedback from their surgeon.

- **Primary User 2: Clinic Care Staff & Plastic Surgeons (ทีมพยาบาลและแพทย์ศัลยกรรม)**
  - Situation: Managing daily post-op triage queue, reviewing high-resolution 5-angle photos, comparing healing progression against previous days, logging clinical notes, and escalating urgent complications (hematoma, infection, flap necrosis).
  - Job: Rapid visual inspection, multi-angle zoom/pan, historical day-by-day photo comparison, and direct messaging to the patient.

## Product Purpose

UD CLINIC Face-Lift Post-Operative Monitoring WebApp is a specialized, camera-first clinical tele-monitoring tool designed to eliminate friction for post-op facial surgery patients, ensuring zero-drop-off daily compliance during the critical 14-day healing window, and providing the surgical team with early-warning detection of surgical complications.

## Positioning

Unlike generic telemedicine apps or bloated hospital portals that require app store downloads, passwords, and multi-step menus, this system is a dedicated **Camera-First PWA/Web Surface** accessible directly via a single tap on LINE OA. The viewfinder is the homepage; patients are greeted immediately with an active camera and guided silhouette.

## Operating Context

- **Client Environment:** Smartphone browsers (iOS Safari, Android Chrome, LINE In-App Browser) via LINE Official Account Rich Menu. Handheld selfie orientation, portrait mode locked to 100dvh without vertical scrolling or zoom quirks.
- **Staff Environment:** Desktop and tablet browsers (`/staff`) in clinical workstations and surgeon consult rooms. Wide-screen triage table, image inspection lightboxes, and chronological facial comparison grids.
- **Data Backend:** Supabase Cloud PostgreSQL with persistent storage and Netlify hosting.

## Capabilities and Constraints

- **Capabilities:**
  - Full-screen 100dvh selfie camera with front/rear toggle and live shutter.
  - 5-angle guided capture sequence (Frontal, 45° Right, 45° Left, 90° Profile Right, 90° Profile Left).
  - Tactile quick-select symptom questionnaire (Pain 0-10, Swelling, Bleeding/Discharge, Fever).
  - Staff triage queue with status tracking (รอตรวจ, ปกติ, นัดตรวจเพิ่ม, ส่งต่อแพทย์).
  - Historical photo side-by-side comparison for surgeon evaluation.
  - Persistent device login & Magic Link token bypass for instant access without daily passwords.
- **Constraints:**
  - Zero placeholder text in user-facing inputs.
  - No dummy/mock patient data; strictly real clinic cases.
  - Mobile viewport strictly locked: no pinch zoom (`maximum-scale=1`, `user-scalable=no`), no rubber-band overscroll.
  - Dedicated routes: `/` and `/client` for patients, `/staff` for clinic personnel.

## Brand Commitments

- **Brand Name:** UD CLINIC TORO
- **Visual Palette:** Terracotta Red brand tone (#B85042) paired with clean clinical slate and crisp white backgrounds.
- **Identity Assets:** Official `public/logo.jpg` featured on login, camera top bar, staff header, and favicon.
- **Tone & Voice:** Reassuring, warm, ultra-clear medical Thai with minimal text and oversized, high-contrast touch targets.

## Evidence on Hand

- Official clinic logo asset: `public/logo.jpg`.
- Production Supabase schema: `docs/supabase_schema.sql`.
- Active cloud database: connected at `https://adhodkngteqwdcurmfsx.supabase.co`.
- Complete responsive codebase deployed on Next.js 16 (App Router) in `src/`.

## Product Principles

1. **Camera as the Front Door:** The camera viewfinder *is* the interface. Do not put navigation bars, marketing banners, or walls of text between an elderly post-op patient and their daily photo check-in.
2. **Zero Cognitive Friction for Seniors:** Large tactile buttons, high-contrast typography (>=16px), single-tap choices, and persistent login without passwords.
3. **Clinical Vigilance (Triage First):** The staff interface prioritizes urgent warning signs (high pain, active bleeding, abnormal swelling) with instantaneous photo comparison across post-op days.
4. **Authenticity over Simulation:** Real clinical data, actual camera feeds, and zero mock placebos.

## Accessibility & Inclusion

- Optimized for older adults with presbyopia: minimum body text 16px to prevent iOS auto-zoom, high visual contrast ratios, touch targets >= 48px.
- Voice & copy in polite, accessible Thai (`ส่งรายงานเรียบร้อย`, `คำแนะนำจากแพทย์`).
- Fallback image upload for devices without direct webcam access.
