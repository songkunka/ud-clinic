'use client';

import { useState, useEffect } from 'react';
import {
  PortalMode,
  UserRole,
  DailyReport,
  SurgeryCase,
  Patient,
  AuditLog,
  ReportingProtocol,
  ReportStatus,
  ReviewAction,
  ReportPhoto,
  SymptomAnswers,
} from './types';
import {
  INITIAL_CASES,
  INITIAL_PATIENTS,
  INITIAL_REPORTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_PROTOCOL,
} from './mock-data';
import { dbService } from './db-service';

// Storage keys versioned to v2 (Clean slate without dummy data)
const STORAGE_KEY_REPORTS = 'ud_clinic_clean_reports_v2';
const STORAGE_KEY_CASES = 'ud_clinic_clean_cases_v2';
const STORAGE_KEY_PATIENTS = 'ud_clinic_clean_patients_v2';
const STORAGE_KEY_AUDITS = 'ud_clinic_clean_audits_v2';
const STORAGE_KEY_PROTOCOL = 'ud_clinic_clean_protocol_v2';
const STORAGE_KEY_ACTIVE_PORTAL = 'ud_clinic_active_portal_v2';
const STORAGE_KEY_CLIENT_TOKEN = 'ud_clinic_client_token_v2';

const EVENT_STATE_CHANGE = 'ud_clinic_clean_state_change';

function emitChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(EVENT_STATE_CHANGE));
  }
}

export function useAppStore() {
  const [portal, setPortalState] = useState<PortalMode>('client');
  const [role, setRoleState] = useState<UserRole>('patient');
  const [clientToken, setClientTokenState] = useState<string | null>(null);

  const [reports, setReports] = useState<DailyReport[]>([]);
  const [cases, setCases] = useState<SurgeryCase[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [protocol, setProtocol] = useState<ReportingProtocol>(INITIAL_PROTOCOL);
  const [isLoaded, setIsLoaded] = useState(false);

  const isMockName = (name: string) => {
    const lower = (name || '').toLowerCase();
    return (
      lower.includes('siriporn') ||
      lower.includes('ศิริพร') ||
      lower.includes('porntip') ||
      lower.includes('พรทิพย์') ||
      lower.includes('wanna') ||
      lower.includes('วรรณา') ||
      lower.includes('kamonporn') ||
      lower.includes('กมลพร') ||
      lower.includes('วิมลมัส') ||
      lower.includes('vimonmas')
    );
  };

  const loadFromStorage = () => {
    if (typeof window === 'undefined') return;

    // Purge any legacy keys
    try {
      [
        'ud_clinic_reports',
        'ud_clinic_cases',
        'ud_clinic_patients',
        'ud_clinic_audits',
        'ud_clinic_reports_v1',
        'ud_clinic_cases_v1',
        'ud_clinic_patients_v1',
      ].forEach((k) => localStorage.removeItem(k));
    } catch {}

    try {
      const storedPortal = localStorage.getItem(STORAGE_KEY_ACTIVE_PORTAL);
      if (storedPortal) setPortalState(storedPortal as PortalMode);

      const storedToken = localStorage.getItem(STORAGE_KEY_CLIENT_TOKEN);
      if (storedToken) setClientTokenState(storedToken);

      const storedReports = localStorage.getItem(STORAGE_KEY_REPORTS);
      const parsedReports: DailyReport[] = storedReports ? JSON.parse(storedReports) : INITIAL_REPORTS;
      const cleanReports = parsedReports.filter((r) => !isMockName(r.patientName));
      setReports(cleanReports);

      const storedCases = localStorage.getItem(STORAGE_KEY_CASES);
      const parsedCases: SurgeryCase[] = storedCases ? JSON.parse(storedCases) : INITIAL_CASES;
      const cleanCases = parsedCases.filter((c) => !isMockName(c.patientName));
      setCases(cleanCases);

      const storedPatients = localStorage.getItem(STORAGE_KEY_PATIENTS);
      const parsedPatients: Patient[] = storedPatients ? JSON.parse(storedPatients) : INITIAL_PATIENTS;
      const cleanPatients = parsedPatients.filter((p) => !isMockName(p.displayName));
      setPatients(cleanPatients);

      const storedAudits = localStorage.getItem(STORAGE_KEY_AUDITS);
      setAuditLogs(storedAudits ? JSON.parse(storedAudits) : INITIAL_AUDIT_LOGS);

      const storedProto = localStorage.getItem(STORAGE_KEY_PROTOCOL);
      setProtocol(storedProto ? JSON.parse(storedProto) : INITIAL_PROTOCOL);
    } catch {
      setReports([]);
      setCases([]);
      setPatients([]);
      setAuditLogs([]);
      setProtocol(INITIAL_PROTOCOL);
    }
    setIsLoaded(true);
  };

  useEffect(() => {
    loadFromStorage();

    // Check URL parameters for magic link (?token=... or ?caseId=...)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token');
      if (urlToken) {
        localStorage.setItem(STORAGE_KEY_CLIENT_TOKEN, urlToken);
        setClientTokenState(urlToken);
        setPortalState('client');
      }
    }

    const handleStorageChange = () => {
      loadFromStorage();
    };

    window.addEventListener(EVENT_STATE_CHANGE, handleStorageChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener(EVENT_STATE_CHANGE, handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Cloud Sync
  useEffect(() => {
    if (isLoaded && dbService.isAvailable()) {
      Promise.all([dbService.getAllCases(), dbService.getAllReports()]).then(
        ([cloudCases, cloudReports]) => {
          if (cloudCases.length > 0) {
            setCases((prev) => {
              const map = new Map<string, SurgeryCase>();
              prev.forEach((c) => map.set(c.id, c));
              cloudCases.forEach((c) => map.set(c.id, c));
              const merged = Array.from(map.values());
              if (typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_KEY_CASES, JSON.stringify(merged));
              }
              return merged;
            });
          }
          if (cloudReports.length > 0) {
            setReports((prev) => {
              const map = new Map<string, DailyReport>();
              prev.forEach((r) => map.set(r.id, r));
              cloudReports.forEach((r) => map.set(r.id, r));
              const merged = Array.from(map.values());
              if (typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(merged));
              }
              return merged;
            });
          }
        }
      ).catch((err) => console.warn('Supabase initial sync error:', err));
    }
  }, [isLoaded]);

  const setPortal = (newPortal: PortalMode) => {
    setPortalState(newPortal);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_ACTIVE_PORTAL, newPortal);
      emitChange();
    }
  };

  // CLIENT LOGIN: By Magic Token
  const clientLoginWithToken = async (token: string): Promise<SurgeryCase | null> => {
    let matched = cases.find((c) => c.token === token || c.id === token);
    if (!matched && dbService.isAvailable()) {
      const cloudCase = await dbService.findCaseByToken(token);
      if (cloudCase) {
        matched = cloudCase;
        setCases((prev) => [cloudCase, ...prev.filter((c) => c.id !== cloudCase.id)]);
      }
    }

    if (matched) {
      setClientTokenState(matched.token);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_CLIENT_TOKEN, matched.token);
      }
      emitChange();
      return matched;
    }
    return null;
  };

  // CLIENT LOGIN: By 10-digit Phone Number (Elderly Friendly with Cloud Support)
  const clientLoginWithPhone = async (phone: string): Promise<SurgeryCase | null> => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    let matched = cases.find(
      (c) => c.phoneNumber.replace(/[^0-9]/g, '') === cleanPhone
    );

    if (!matched && dbService.isAvailable()) {
      const cloudCase = await dbService.findCaseByPhone(cleanPhone);
      if (cloudCase) {
        matched = cloudCase;
        setCases((prev) => {
          const updated = [cloudCase, ...prev.filter((c) => c.id !== cloudCase.id)];
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY_CASES, JSON.stringify(updated));
          }
          return updated;
        });
      }
    }

    if (matched) {
      setClientTokenState(matched.token);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_CLIENT_TOKEN, matched.token);
      }
      emitChange();
      return matched;
    }
    return null;
  };

  const clientLogout = () => {
    setClientTokenState(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_CLIENT_TOKEN);
      emitChange();
    }
  };

  // STAFF ACTION: Register New Real Case
  const createNewCase = (data: {
    patientName: string;
    hn: string;
    phoneNumber: string;
    serviceType: string;
    surgeonName: string;
    surgeryDate: string;
    gender?: 'female' | 'male' | 'other';
    age?: number;
    medicalConditions?: string;
    specialInstructions?: string;
  }): SurgeryCase => {
    const caseId = `case-${Date.now()}`;
    const token = `ud_${Math.random().toString(36).substring(2, 10)}`;
    const patientId = `pat-${Date.now()}`;

    const newPatient: Patient = {
      id: patientId,
      hn: data.hn.trim(),
      displayName: data.patientName.trim(),
      phoneNumber: data.phoneNumber.trim(),
      gender: data.gender,
      age: data.age,
      medicalConditions: data.medicalConditions?.trim(),
      consentAccepted: true,
      consentDate: new Date().toISOString(),
    };

    const newCase: SurgeryCase = {
      id: caseId,
      patientId,
      patientName: data.patientName.trim(),
      hn: data.hn.trim(),
      phoneNumber: data.phoneNumber.trim(),
      gender: data.gender,
      age: data.age,
      medicalConditions: data.medicalConditions?.trim(),
      specialInstructions: data.specialInstructions?.trim(),
      token,
      serviceType: data.serviceType.trim() || 'SMAS Full Face-Lift & Neck Lift',
      surgeonName: data.surgeonName.trim() || 'นพ.สมชาย เกียรติเวชช์',
      surgeryDate: data.surgeryDate,
      followUpStartDate: data.surgeryDate,
      caseStatus: 'active',
    };

    const updatedCases = [newCase, ...cases];
    const updatedPatients = [newPatient, ...patients];

    setCases(updatedCases);
    setPatients(updatedPatients);

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_CASES, JSON.stringify(updatedCases));
      localStorage.setItem(STORAGE_KEY_PATIENTS, JSON.stringify(updatedPatients));
    }

    if (dbService.isAvailable()) {
      dbService.createCase(newCase, newPatient).catch((err) => {
        console.error('Failed to sync case to Supabase:', err);
      });
    }

    addAuditLog(
      'staff',
      'Care Staff',
      'staff',
      'create_case',
      'surgery_case',
      caseId,
      `ลงทะเบียนเคสผ่าตัดใหม่: ${newCase.patientName} (${newCase.hn})`
    );

    emitChange();
    return newCase;
  };

  // CLIENT ACTION: Submit Real Daily Report
  const submitDailyReport = (
    caseId: string,
    photos: ReportPhoto[],
    answers: SymptomAnswers
  ): DailyReport | null => {
    const curCase = cases.find((c) => c.id === caseId || c.token === caseId);
    if (!curCase) return null;

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = `${dateStr} ${now.toLocaleTimeString('th-TH')}`;

    const surgeryDate = new Date(curCase.surgeryDate);
    const diffDays = Math.max(
      1,
      Math.floor((now.getTime() - surgeryDate.getTime()) / (1000 * 60 * 60 * 24))
    );

    const isUrgent =
      answers.painScore >= 7 ||
      answers.bleedingOrDischarge === 'heavy_fresh' ||
      answers.feverStatus === 'high' ||
      answers.hasConcerningSymptoms;

    const newReport: DailyReport = {
      id: `rep-${Date.now()}`,
      caseId: curCase.id,
      patientId: curCase.patientId,
      patientName: curCase.patientName,
      hn: curCase.hn,
      surgeryDate: curCase.surgeryDate,
      reportDate: dateStr,
      postOpDay: diffDays,
      status: 'pending_review',
      statusLabelThai: 'รอทีมดูแลตรวจสอบ',
      submittedAt: timeStr,
      photos,
      symptomAnswers: answers,
      patientNote: answers.patientNote,
      isUrgent,
      internalNotes: [],
      reviewHistory: [],
      createdAt: timeStr,
      updatedAt: timeStr,
    };

    const updatedReports = [newReport, ...reports];
    setReports(updatedReports);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(updatedReports));
    }

    if (dbService.isAvailable()) {
      dbService.submitReport(newReport).catch((err) => {
        console.error('Failed to sync report to Supabase:', err);
      });
    }

    addAuditLog(
      'patient',
      curCase.patientName,
      'patient',
      'submit_report',
      'daily_report',
      newReport.id,
      `คนไข้ส่งรายงานประจำวันจริง D+${diffDays} (ภาพ ${photos.length} รูป)`
    );

    emitChange();
    return newReport;
  };

  // STAFF ACTION: Review & Feedback
  const performReviewAction = (
    reportId: string,
    action: {
      actionType: ReviewAction['actionType'];
      internalNote?: string;
      customerMessage?: string;
      assignedTo?: string;
      followUpDueAt?: string;
    }
  ) => {
    const reportIndex = reports.findIndex((r) => r.id === reportId);
    if (reportIndex === -1) return;

    const report = reports[reportIndex];
    const now = new Date();
    const timeStr = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString('th-TH')}`;

    let newStatus: ReportStatus = report.status;
    let newStatusLabel = report.statusLabelThai;

    if (action.actionType === 'reviewed') {
      newStatus = 'reviewed';
      newStatusLabel = 'ตรวจสอบแล้ว';
    } else if (action.actionType === 'request_more_info') {
      newStatus = 'more_info_requested';
      newStatusLabel = 'ขอภาพ/ข้อมูลเพิ่มเติม';
    } else if (action.actionType === 'refer') {
      newStatus = 'referred_to_doctor';
      newStatusLabel = 'ส่งต่อแพทย์ตรวจสอบ';
    } else if (action.actionType === 'urgent_contact') {
      newStatus = 'urgent_contact_required';
      newStatusLabel = 'ต้องติดต่อเร่งด่วน';
    } else if (action.actionType === 'follow_up') {
      newStatus = 'follow_up_required';
      newStatusLabel = 'รอติดตามผลต่อเนื่อง';
    } else if (action.actionType === 'close') {
      newStatus = 'closed';
      newStatusLabel = 'ปิดรอบติดตาม';
    }

    const reviewEntry: ReviewAction = {
      id: `rev-${Date.now()}`,
      dailyReportId: reportId,
      actorUserId: 'staff-1',
      actorName: 'พว. กัลยา / นพ.สมชาย',
      actorRole: 'staff_doctor',
      actionType: action.actionType,
      internalNote: action.internalNote,
      customerMessage: action.customerMessage,
      assignedTo: action.assignedTo,
      followUpDueAt: action.followUpDueAt,
      createdAt: timeStr,
    };

    const updatedInternalNotes = [...(report.internalNotes || [])];
    if (action.internalNote?.trim()) {
      updatedInternalNotes.push(action.internalNote.trim());
    }

    const updatedReport: DailyReport = {
      ...report,
      status: newStatus,
      statusLabelThai: newStatusLabel,
      latestCustomerMessage: action.customerMessage?.trim() || report.latestCustomerMessage,
      internalNotes: updatedInternalNotes,
      reviewHistory: [...(report.reviewHistory || []), reviewEntry],
      reviewedAt: action.actionType === 'reviewed' ? timeStr : report.reviewedAt,
      reviewedBy: 'ทีมแพทย์และพยาบาล UD Clinic',
      updatedAt: timeStr,
    };

    const newReports = [...reports];
    newReports[reportIndex] = updatedReport;
    setReports(newReports);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(newReports));
    }

    if (dbService.isAvailable()) {
      dbService.updateReport(reportId, updatedReport).catch((err) => {
        console.error('Failed to update report in Supabase:', err);
      });
    }

    addAuditLog(
      'staff',
      'ทีมดูแล UD Clinic',
      'staff_doctor',
      `review_${action.actionType}`,
      'daily_report',
      reportId,
      `ดำเนินการ: ${newStatusLabel} สำหรับเคส ${report.patientName} (${report.hn})`
    );

    emitChange();
  };

  const addAuditLog = (
    actorUserId: string,
    actorName: string,
    actorRole: string,
    action: string,
    resourceType: string,
    resourceId: string,
    details: string
  ) => {
    const now = new Date();
    const timeStr = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString('th-TH')}`;
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      actorUserId,
      actorName,
      actorRole,
      action,
      resourceType,
      resourceId,
      details,
      createdAt: timeStr,
    };

    const updated = [newLog, ...auditLogs];
    setAuditLogs(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_AUDITS, JSON.stringify(updated));
    }
  };

  const resetAllData = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_REPORTS);
      localStorage.removeItem(STORAGE_KEY_CASES);
      localStorage.removeItem(STORAGE_KEY_PATIENTS);
      localStorage.removeItem(STORAGE_KEY_AUDITS);
      localStorage.removeItem(STORAGE_KEY_CLIENT_TOKEN);
      loadFromStorage();
      emitChange();
    }
  };

  // Find active case for client: matches clientToken, or activeCaseId
  const activeClientCase =
    cases.find((c) => c.token === clientToken || c.id === clientToken) || null;

  const activeCaseReports = activeClientCase
    ? reports.filter((r) => r.caseId === activeClientCase.id)
    : [];

  const updateProtocol = (updatedProto: ReportingProtocol) => {
    setProtocol(updatedProto);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_PROTOCOL, JSON.stringify(updatedProto));
      emitChange();
    }
  };

  return {
    isLoaded,
    portal,
    setPortal,
    role,
    setRole: setRoleState,
    clientToken,
    activeClientCase,
    activeCase: activeClientCase,
    activePatient: patients.find((p) => p.id === activeClientCase?.patientId) || null,
    activeCaseReports,
    clientLoginWithToken,
    clientLoginWithPhone,
    clientLogout,
    createNewCase,
    submitDailyReport,
    performReviewAction,
    addAuditLog,
    resetAllData,
    reports,
    cases,
    patients,
    auditLogs,
    protocol,
    updateProtocol,
  };
}
