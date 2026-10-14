---
name: UD CLINIC TORO
description: High-precision post-operative facial surgery clinical monitoring system
colors:
  primary: "#b85042"
  primary-deep: "#9c3d32"
  primary-soft: "#fdf6f0"
  neutral-bg: "#ffffff"
  surface-muted: "#f8fafc"
  surface-dark: "#0f172a"
  border-subtle: "#e2e8f0"
  text-primary: "#0f172a"
  text-muted: "#64748b"
  status-urgent: "#dc2626"
  status-reviewed: "#16a34a"
typography:
  display:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.2
  headline:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  sm: "6px"
  md: "12px"
  lg: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-bg}"
    rounded: "{rounded.lg}"
    padding: "14px 24px"
  button-primary-hover:
    backgroundColor: "{colors.primary-deep}"
---

# Design System: UD CLINIC TORO

## Overview

- **Creative North Star: "The Precision Surgical Suite" (ความแม่นยำทางศัลยกรรมระดับพรีเมียม)**
  A modern, surgical-grade aesthetic tailored for clinical accuracy and senior-friendly usability. It blends warm medical terracotta (#B85042) with crisp, sterile architectural whites and slate backgrounds, conveying prestige, technical authority, and calm reassurance for patients recovering from major facial surgery.
- **Component & Interaction Feel: "Tactile & High-Affordance"**
  Oversized touch targets, haptic-feeling feedback, and zero guesswork. Patients with post-op swelling or diminished visual acuity can effortlessly tap choices and capture calibrated medical angles.

## Colors

- **Primary:** `#B85042` (UD Terracotta Red) — Used for core interactive elements, branding badges, and primary action triggers.
- **Primary Deep:** `#9C3D32` — State for hover, active presses, and high-emphasis focal points.
- **Primary Soft:** `#FDF6F0` — Warm tinted backdrop for active selection states, alerts, and pill containers.
- **Surface Dark:** `#0F172A` (Slate 900) — Deep clinical dark backdrop for the camera viewfinder, silhouette alignment overlays, and contrast lightboxes.
- **Surface Light:** `#FFFFFF` (Pure White) & `#F8FAFC` (Slate 50) — High-cleanliness background for patient cards, staff data tables, and bottom-sheets.
- **Borders & Dividers:** `#E2E8F0` (Slate 200) — Subtle structural separation without harsh contrast.
- **Status Accents:**
  - Emergency / Urgent: `#DC2626` (Crimson)
  - Reviewed / Normal: `#16A34A` (Medical Green)
  - In Progress / Pending: `#D97706` (Amber)

## Typography

- **Font Family:** `Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Scale:**
  - **Display (28px / 1.75rem, Bold 700):** Screen headers, key patient milestone titles.
  - **Headline (20px / 1.25rem, SemiBold 600):** Section titles, modal headers, angle step instructions.
  - **Body (16px / 1rem, Regular 400):** Standard reading text, patient notes, medical feedback. **Enforced minimum 16px to prevent iOS Safari auto-zoom.**
  - **Label / Micro (14px / 0.875rem, Medium 500):** Badge labels, timestamps, metadata captions.
- **Legibility Rules:** High text-to-background contrast ratio (>= 4.5:1), polite Thai copy, zero tiny footnote fonts.

## Layout

- **Client Camera Portal (`/` & `/client`):**
  - Rigid mobile viewport locked to `100dvh` (`max-width: 28rem` / `max-w-md` centered).
  - Absolutely zero vertical bouncing or rubber-band scrolling (`overscroll-behavior: none`).
  - Viewfinder occupies >75% of the mobile viewport with edge-to-edge camera feed.
- **Staff Dashboard Portal (`/staff`):**
  - Responsive desktop/tablet layout (`max-w-7xl` container).
  - Triage table view with quick filter badges, expandable clinical review modals, and split-screen before/after comparison grids.

## Elevation & Depth

- **Tonal Layering:** The design relies primarily on clean surface separation (`#ffffff` against `#f8fafc`) rather than heavy drop shadows.
- **Shadow Scale:**
  - Subtly raised cards: `box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)`
  - Elevated modals & bottom sheets: `box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)`
  - Camera shutter button: Crisp tactile white ring with high-contrast shadow over the dark camera canvas.

## Shapes

- **Radius Hierarchy:**
  - Small (`6px`): Status tags, tooltips, small chips.
  - Medium (`12px`): Input fields, clinical action buttons, data cards.
  - Large (`16px`): Modal containers, bottom sheets, camera viewfinder frame.
  - Full (`9999px`): Camera shutter trigger, angle checkmark indicators, pill toggles.
- **Borders:** 1px hairline borders (`#e2e8f0` or `rgba(255, 255, 255, 0.1)` on dark canvases) maintain precision and structure.

## Components

- **Camera Shutter:** 72px circular button with outer white ring and central trigger. Smooth tactile shrink on press (`scale-95`).
- **Tactile Symptom Quick-Selects:** 3-state pill groups (`ยุบลง`, `เท่าเดิม`, `บวมขึ้น`) with clear active highlights in terracotta tints.
- **Angle Progress Tracker:** 5 circular status nodes at the bottom of the viewfinder showing real-time completed angles with animated green checkmarks.
- **Staff Case Cards & Modals:** Multi-tab layout (ภาพถ่าย 5 มุม, ประวัติอาการ, ผลตรวจแพทย์, เปรียบเทียบย้อนหลัง) with rapid triage actions.

## Do's and Don'ts

### Do:
- Keep the camera screen locked, full-height (100dvh), and free of scrollbars.
- Always maintain input font size >= 16px to prevent iOS auto-zoom.
- Preserve the official UD CLINIC TORO logo at `public/logo.jpg`.
- Prioritize large tap targets (minimum 48x48px) for all primary actions.
- Use warm, polite, and reassuring Thai clinical terminology.

### Don't:
- Do not reintroduce placeholder text in input fields.
- Do not add fake or mock patient profiles.
- Do not let the camera screen scroll or zoom on pinch.
- Do not use generic cold hospital blues; stick to the curated Terracotta Red palette.
