// UD Clinic Post-Operative Monitoring Types
// Based on PRD v1.0 Section 11 & 12

export type PortalMode = 'client' | 'staff';
export type UserRole = 'patient' | 'care_staff' | 'doctor' | 'admin';

export type ReportStatus =
  | 'draft'
  | 'submitted'
  | 'pending_review'
  | 'in_review'
  | 'more_info_requested'
  | 'referred_to_doctor'
  | 'follow_up_required'
  | 'urgent_contact_required'
  | 'reviewed'
  | 'closed'
  | 'cancelled';

export type PhotoAngleKey =
  | 'front'
  | 'left_oblique'
  | 'right_oblique'
  | 'left_side'
  | 'right_side';

export interface PhotoAngleConfig {
  key: PhotoAngleKey;
  labelThai: string;
  shortLabel: string;
  descriptionThai: string;
  instructionThai: string;
  required: boolean;
  samplePlaceholderUrl: string;
}

export interface Patient {
  id: string;
  hn: string;
  displayName: string;
  phoneNumber: string;
  lineUserId?: string;
  consentAccepted: boolean;
  consentDate?: string;
}

export interface SurgeryCase {
  id: string;
  patientId: string;
  patientName: string;
  hn: string;
  phoneNumber: string;
  token: string;
  serviceType: string; // e.g. "SMAS Face-Lift & Neck Lift"
  surgeonName: string;
  surgeryDate: string; // YYYY-MM-DD
  followUpStartDate: string;
  followUpEndDate?: string;
  assignedStaffId?: string;
  assignedStaffName?: string;
  assignedDoctorId?: string;
  assignedDoctorName?: string;
  caseStatus: 'active' | 'completed' | 'paused' | 'cancelled';
  notes?: string;
}

export interface ReportPhoto {
  id: string;
  dailyReportId: string;
  angleKey: PhotoAngleKey;
  angleNameThai: string;
  photoUrl: string;
  uploadedAt: string;
  sequenceNumber: number;
  isRetaken?: boolean;
}

export interface SymptomAnswers {
  painScore: number; // 0-10
  swellingLevel: 'decreasing' | 'same' | 'increasing';
  bleedingOrDischarge: 'none' | 'mild_serous' | 'heavy_fresh';
  feverStatus: 'none' | 'mild' | 'high';
  numbnessOrTightness: 'normal_tight' | 'mild_numbness' | 'severe_abnormal';
  patientNote?: string;
  hasConcerningSymptoms: boolean;
}

export interface ReviewAction {
  id: string;
  dailyReportId: string;
  actorUserId: string;
  actorName: string;
  actorRole: string;
  actionType:
    | 'reviewed'
    | 'request_more_info'
    | 'refer'
    | 'follow_up'
    | 'urgent_contact'
    | 'close';
  internalNote?: string;
  customerMessage?: string;
  assignedTo?: string;
  followUpDueAt?: string;
  createdAt: string;
}

export interface DailyReport {
  id: string;
  caseId: string;
  patientId: string;
  patientName: string;
  hn: string;
  surgeryDate: string;
  reportDate: string;
  postOpDay: number;
  status: ReportStatus;
  statusLabelThai: string;
  submittedAt?: string;
  reviewStartedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  assignedStaffName?: string;
  assignedDoctorName?: string;
  photos: ReportPhoto[];
  symptomAnswers: SymptomAnswers;
  patientNote?: string;
  latestCustomerMessage?: string;
  internalNotes?: string[];
  reviewHistory: ReviewAction[];
  isUrgent: boolean;
  photoEvaluations?: PhotoQualityEvaluation[];
  escalationPriority?: 'routine' | 'urgent' | 'emergency';
  escalationReason?: string;
  doctorClinicalOrders?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  actorUserId: string;
  actorName: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details: string;
  createdAt: string;
}

export interface ReportingProtocol {
  id: string;
  name: string;
  description: string;
  version: string;
  active: boolean;
  angles: PhotoAngleConfig[];
  slaReviewMinutes: number;
}

export type ScheduleStatus =
  | 'upcoming'
  | 'due'
  | 'overdue'
  | 'submitted'
  | 'completed'
  | 'cancelled';

export interface FollowupSchedule {
  id: string;
  caseId: string;
  patientId: string;
  patientName?: string;
  hn?: string;
  phoneNumber?: string;
  token?: string;
  procedureName?: string;
  surgeonName?: string;
  scheduledDate: string; // YYYY-MM-DD
  dueAt: string; // ISO string
  postOpDay: number;
  dayLabel: string; // e.g. 'D+1', 'D+2'
  scheduleStatus: ScheduleStatus;
  requiredPhotoAngles: string[];
  submissionId?: string;
  completedAt?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type ClinicalTaskType =
  | 'review_submission'
  | 'overdue_followup'
  | 'request_retake'
  | 'doctor_review';

export type ClinicalTaskPriority = 'routine' | 'priority' | 'urgent' | 'emergency';

export type ClinicalTaskStatus =
  | 'open'
  | 'in_progress'
  | 'waiting_for_patient'
  | 'waiting_for_doctor'
  | 'closed';

export interface ClinicalTask {
  id: string;
  caseId: string;
  scheduleId?: string;
  submissionId?: string;
  patientName?: string;
  hn?: string;
  phoneNumber?: string;
  taskType: ClinicalTaskType;
  priority: ClinicalTaskPriority;
  taskStatus: ClinicalTaskStatus;
  assignedTo?: string;
  assignedBy?: string;
  assignedAt?: string;
  escalationReason?: string;
  resolutionSummary?: string;
  closedAt?: string;
  closedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type ContactChannel = 'phone' | 'line' | 'sms';
export type ContactOutcome =
  | 'reached'
  | 'no_answer'
  | 'unreachable'
  | 'callback_requested';

export interface ContactLog {
  id: string;
  patientId: string;
  caseId: string;
  taskId?: string;
  contactedAt: string;
  contactedBy: string;
  channel: ContactChannel;
  contactOutcome: ContactOutcome;
  summary: string;
  nextAction?: string;
  nextActionDueAt?: string;
  createdAt: string;
}

export interface PhotoQualityEvaluation {
  id: string;
  submissionId: string;
  angleCode: string;
  qualityStatus: 'acceptable' | 'retake_required';
  retakeReason?: string;
  reviewedBy: string;
  reviewedAt: string;
}

export interface ClinicalAuditLog {
  id: string;
  actorName: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}
