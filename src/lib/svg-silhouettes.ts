// High-fidelity SVG guides and placeholders for Face-Lift Guided Capture
// UD Clinic Design Standard

export const SILHOUETTE_GUIDES = {
  front: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" fill="none">
    <ellipse cx="200" cy="230" rx="100" ry="140" stroke="%232563EB" stroke-width="2.5" stroke-dasharray="6 6" fill="rgba(37,99,235,0.03)"/>
    <path d="M140 180 Q200 160 260 180" stroke="%233B82F6" stroke-width="1.5" stroke-dasharray="4 4"/>
    <line x1="160" y1="210" x2="240" y2="210" stroke="%233B82F6" stroke-width="1.5" stroke-dasharray="3 3"/>
    <line x1="180" y1="280" x2="220" y2="280" stroke="%233B82F6" stroke-width="1.5" stroke-dasharray="3 3"/>
    <line x1="200" y1="100" x2="200" y2="390" stroke="%232563EB" stroke-width="1" stroke-dasharray="4 4" opacity="0.6"/>
    <text x="200" y="70" text-anchor="middle" fill="%231E3A8A" font-size="14" font-weight="600" font-family="sans-serif">กรอบจัดตำแหน่ง: หน้าตรง</text>
    <text x="200" y="440" text-anchor="middle" fill="%2364748B" font-size="12" font-family="sans-serif">ให้คางอยู่ชิดเส้นประด้านล่าง</text>
  </svg>`,

  left_oblique: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" fill="none">
    <path d="M180 110 C240 120 280 180 270 270 C260 340 210 380 160 370 C120 360 110 300 120 230 C130 160 150 110 180 110 Z" stroke="%232563EB" stroke-width="2.5" stroke-dasharray="6 6" fill="rgba(37,99,235,0.03)"/>
    <path d="M250 200 C270 230 265 270 245 285" stroke="%23EF4444" stroke-width="2" stroke-dasharray="4 4"/>
    <line x1="200" y1="100" x2="200" y2="400" stroke="%232563EB" stroke-width="1" stroke-dasharray="4 4" opacity="0.5"/>
    <text x="200" y="70" text-anchor="middle" fill="%231E3A8A" font-size="14" font-weight="600" font-family="sans-serif">กรอบจัดตำแหน่ง: เฉียงซ้าย 45°</text>
    <text x="200" y="440" text-anchor="middle" fill="%2364748B" font-size="12" font-family="sans-serif">หันหน้าไปทางขวามือเล็กน้อย ให้เห็นกรอบหน้าซ้าย</text>
  </svg>`,

  right_oblique: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" fill="none">
    <path d="M220 110 C160 120 120 180 130 270 C140 340 190 380 240 370 C280 360 290 300 280 230 C270 160 250 110 220 110 Z" stroke="%232563EB" stroke-width="2.5" stroke-dasharray="6 6" fill="rgba(37,99,235,0.03)"/>
    <path d="M150 200 C130 230 135 270 155 285" stroke="%23EF4444" stroke-width="2" stroke-dasharray="4 4"/>
    <line x1="200" y1="100" x2="200" y2="400" stroke="%232563EB" stroke-width="1" stroke-dasharray="4 4" opacity="0.5"/>
    <text x="200" y="70" text-anchor="middle" fill="%231E3A8A" font-size="14" font-weight="600" font-family="sans-serif">กรอบจัดตำแหน่ง: เฉียงขวา 45°</text>
    <text x="200" y="440" text-anchor="middle" fill="%2364748B" font-size="12" font-family="sans-serif">หันหน้าไปทางซ้ายมือเล็กน้อย ให้เห็นกรอบหน้าขวา</text>
  </svg>`,

  left_side: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" fill="none">
    <path d="M220 120 C180 130 160 160 170 200 C160 210 150 220 150 235 C170 240 180 270 175 300 C170 340 210 370 250 360" stroke="%232563EB" stroke-width="2.5" stroke-dasharray="6 6" fill="rgba(37,99,235,0.03)"/>
    <path d="M200 210 C215 210 225 225 220 250 C215 265 205 270 195 270" stroke="%23EF4444" stroke-width="2.5" stroke-dasharray="3 3"/>
    <text x="200" y="70" text-anchor="middle" fill="%231E3A8A" font-size="14" font-weight="600" font-family="sans-serif">กรอบจัดตำแหน่ง: ด้านข้างซ้าย 90°</text>
    <text x="200" y="440" text-anchor="middle" fill="%2364748B" font-size="12" font-family="sans-serif">หันข้างเต็มตัว ให้เห็นแนวขอบหูและรอยแผลชัดเจน</text>
  </svg>`,

  right_side: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" fill="none">
    <path d="M180 120 C220 130 240 160 230 200 C240 210 250 220 250 235 C230 240 220 270 225 300 C230 340 190 370 150 360" stroke="%232563EB" stroke-width="2.5" stroke-dasharray="6 6" fill="rgba(37,99,235,0.03)"/>
    <path d="M200 210 C185 210 175 225 180 250 C185 265 195 270 205 270" stroke="%23EF4444" stroke-width="2.5" stroke-dasharray="3 3"/>
    <text x="200" y="70" text-anchor="middle" fill="%231E3A8A" font-size="14" font-weight="600" font-family="sans-serif">กรอบจัดตำแหน่ง: ด้านข้างขวา 90°</text>
    <text x="200" y="440" text-anchor="middle" fill="%2364748B" font-size="12" font-family="sans-serif">หันข้างเต็มตัว ให้เห็นแนวขอบหูและรอยแผลขวา</text>
  </svg>`
};

export function getSamplePhotoUrl(angleKey: string, postOpDay: number, label: string) {
  const dayText = `D+${postOpDay}`;
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 640" width="100%" height="100%">
    <rect width="100%" height="100%" fill="%23F1F5F9"/>
    <rect x="20" y="20" width="440" height="600" rx="16" fill="%23FFFFFF" stroke="%23CBD5E1" stroke-width="2"/>
    
    <!-- Face Silhouette Simulation -->
    <ellipse cx="240" cy="270" rx="120" ry="160" fill="%23E2E8F0"/>
    <ellipse cx="240" cy="270" rx="110" ry="150" fill="%23F8FAFC"/>
    
    <!-- Eyes and Features -->
    <circle cx="195" cy="240" r="10" fill="%2394A3B8"/>
    <circle cx="285" cy="240" r="10" fill="%2394A3B8"/>
    <path d="M240 255 L240 295 L250 298" stroke="%2394A3B8" stroke-width="3" stroke-linecap="round" fill="none"/>
    <path d="M210 340 Q240 355 270 340" stroke="%2394A3B8" stroke-width="3" stroke-linecap="round" fill="none"/>

    <!-- Surgical Incision Line Simulation depending on angle -->
    <path d="M125 250 C120 280 135 315 150 340" stroke="%23F87171" stroke-width="2.5" stroke-dasharray="3 2" fill="none"/>
    <path d="M355 250 C360 280 345 315 330 340" stroke="%23F87171" stroke-width="2.5" stroke-dasharray="3 2" fill="none"/>
    
    <!-- Medical Watermark & Badges -->
    <rect x="40" y="40" width="100" height="32" rx="8" fill="%231E3A8A"/>
    <text x="90" y="61" text-anchor="middle" fill="%23FFFFFF" font-size="14" font-weight="bold" font-family="sans-serif">${dayText}</text>
    
    <rect x="40" y="80" width="140" height="26" rx="6" fill="%23E0E7FF"/>
    <text x="110" y="98" text-anchor="middle" fill="%231E40AF" font-size="12" font-weight="600" font-family="sans-serif">${label}</text>
    
    <text x="240" y="580" text-anchor="middle" fill="%2364748B" font-size="12" font-family="sans-serif">UD CLINIC — PRIVATE MEDICAL RECORD</text>
    <text x="240" y="600" text-anchor="middle" fill="%2394A3B8" font-size="10" font-family="sans-serif">เข้ารหัสปลอดภัย • เฉพาะบุคลากรทางการแพทย์ที่ได้รับอนุญาต</text>
  </svg>`;
}
