import {
  Patient,
  SurgeryCase,
  DailyReport,
  ReportingProtocol,
  AuditLog,
  PhotoAngleConfig,
} from './types';

export const DEFAULT_ANGLES: PhotoAngleConfig[] = [
  {
    key: 'front',
    labelThai: 'หน้าตรง',
    shortLabel: 'หน้าตรง',
    descriptionThai: 'ถ่ายมองตรงระดับสายตา ไม่เงยหรือก้มหน้า',
    instructionThai: 'เก็บผมไปด้านหลังให้พ้นแนวหูและกรอบหน้า ถอดแว่นตา',
    required: true,
    samplePlaceholderUrl: '',
  },
  {
    key: 'left_oblique',
    labelThai: 'เฉียงซ้าย 45°',
    shortLabel: 'เฉียงซ้าย',
    descriptionThai: 'หันหน้าไปทางขวาเล็กน้อย 45 องศา',
    instructionThai: 'แสดงกรอบหน้าและแนวกรามด้านซ้ายชัดเจน',
    required: true,
    samplePlaceholderUrl: '',
  },
  {
    key: 'right_oblique',
    labelThai: 'เฉียงขวา 45°',
    shortLabel: 'เฉียงขวา',
    descriptionThai: 'หันหน้าไปทางซ้ายเล็กน้อย 45 องศา',
    instructionThai: 'แสดงกรอบหน้าและแนวกรามด้านขวาชัดเจน',
    required: true,
    samplePlaceholderUrl: '',
  },
  {
    key: 'left_side',
    labelThai: 'ด้านข้างซ้าย 90°',
    shortLabel: 'ข้างซ้าย',
    descriptionThai: 'หันข้างเต็มตัว 90 องศา',
    instructionThai: 'เปิดให้เห็นรอยแผลบริเวณด้านหน้าและหลังใบหูซ้าย',
    required: true,
    samplePlaceholderUrl: '',
  },
  {
    key: 'right_side',
    labelThai: 'ด้านข้างขวา 90°',
    shortLabel: 'ข้างขวา',
    descriptionThai: 'หันข้างเต็มตัว 90 องศา',
    instructionThai: 'เปิดให้เห็นรอยแผลบริเวณด้านหน้าและหลังใบหูขวา',
    required: true,
    samplePlaceholderUrl: '',
  },
];

export const INITIAL_PROTOCOL: ReportingProtocol = {
  id: 'proto-facelift-std',
  name: 'UD Face-Lift Standard Protocol v1.0',
  description: 'โปรโตคอลมาตรฐานการติดตามหลังผ่าตัดดึงหน้า (Face-lift & Neck lift)',
  version: '1.0',
  active: true,
  angles: DEFAULT_ANGLES,
  slaReviewMinutes: 120,
};

// Completely CLEAN - No mock patients, cases, or reports!
export const INITIAL_PATIENTS: Patient[] = [];
export const INITIAL_CASES: SurgeryCase[] = [];
export const INITIAL_REPORTS: DailyReport[] = [];
export const INITIAL_AUDIT_LOGS: AuditLog[] = [];
