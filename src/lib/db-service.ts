import { getSupabase, isSupabaseConfigured } from './supabase';
import {
  SurgeryCase,
  Patient,
  DailyReport,
  FollowupSchedule,
  GroupedPatientSchedule,
  ScheduleStatus,
  ClinicalTask,
  ContactLog,
  PhotoQualityEvaluation,
  ClinicalAuditLog,
} from './types';

export const dbService = {
  isAvailable(): boolean {
    return isSupabaseConfigured() && getSupabase() !== null;
  },

  async testConnection(): Promise<{ success: boolean; message: string }> {
    const sb = getSupabase();
    if (!sb) {
      return {
        success: false,
        message: 'ยังไม่ได้ระบุ Project URL หรือ anon public API key',
      };
    }
    try {
      const { error } = await sb.from('patients').select('id').limit(1);
      if (error) {
        return {
          success: false,
          message: `Supabase Error (${error.code || 'FAIL'}): ${error.message}. กรุณาตรวจสอบว่าได้ Run สคริปต์ SQL ใน SQL Editor แล้วหรือไม่`,
        };
      }
      return { success: true, message: 'เชื่อมต่อฐานข้อมูล Supabase สำเร็จแล้ว 100%' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ไม่สามารถเชื่อมต่อได้';
      return { success: false, message: msg };
    }
  },

  async syncAllLocalToCloud(
    cases: SurgeryCase[],
    patients: Patient[],
    reports: DailyReport[]
  ): Promise<{ success: boolean; syncedCases: number; syncedReports: number; error?: string }> {
    const sb = getSupabase();
    if (!sb) {
      return { success: false, syncedCases: 0, syncedReports: 0, error: 'ยังไม่ได้เชื่อมต่อ Supabase' };
    }

    let syncedCases = 0;
    let syncedReports = 0;

    try {
      for (const p of patients) {
        await sb.from('patients').upsert({
          id: p.id,
          hn: p.hn,
          display_name: p.displayName,
          phone_number: p.phoneNumber,
          consent_accepted: true,
        });
      }

      for (const c of cases) {
        const { error } = await sb.from('surgery_cases').upsert({
          id: c.id,
          patient_id: c.patientId,
          patient_name: c.patientName,
          hn: c.hn,
          phone_number: c.phoneNumber,
          token: c.token,
          service_type: c.serviceType,
          surgeon_name: c.surgeonName,
          surgery_date: c.surgeryDate,
          follow_up_start_date: c.followUpStartDate,
          case_status: c.caseStatus,
          notes: c.notes,
        });
        if (!error) syncedCases++;
      }

      for (const r of reports) {
        const internalNotesText = Array.isArray(r.internalNotes)
          ? r.internalNotes.join('\n')
          : (r.internalNotes || '');

        const { error } = await sb.from('daily_reports').upsert({
          id: r.id,
          case_id: r.caseId,
          patient_id: r.patientId,
          patient_name: r.patientName,
          hn: r.hn,
          surgery_date: r.surgeryDate,
          report_date: r.reportDate,
          post_op_day: r.postOpDay,
          status: r.status,
          status_label_thai: r.statusLabelThai,
          submitted_at: r.submittedAt,
          photos: r.photos,
          symptoms: r.symptomAnswers,
          review_notes: r.reviewHistory || [],
          internal_clinical_notes: internalNotesText,
          customer_message: r.latestCustomerMessage || '',
        });
        if (!error) syncedReports++;
      }

      return { success: true, syncedCases, syncedReports };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการซิงค์';
      return { success: false, syncedCases, syncedReports, error: msg };
    }
  },

  async getAllCases(): Promise<SurgeryCase[]> {
    const sb = getSupabase();
    if (!sb) return [];
    try {
      const { data, error } = await sb
        .from('surgery_cases')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase getAllCases error:', error);
        return [];
      }

      return (data || []).map((row) => ({
        id: row.id,
        patientId: row.patient_id,
        patientName: row.patient_name ?? '',
        hn: row.hn ?? '',
        phoneNumber: row.phone_number ?? '',
        gender: row.gender,
        age: row.age,
        medicalConditions: row.medical_conditions,
        specialInstructions: row.special_instructions,
        token: row.token,
        lineUserId: row.line_user_id,
        serviceType: row.service_type,
        surgeonName: row.surgeon_name,
        surgeryDate: row.surgery_date,
        followUpStartDate: row.follow_up_start_date || row.surgery_date,
        caseStatus: row.case_status || 'active',
        notes: row.notes,
      }));
    } catch (err) {
      console.error('Error fetching cases from Supabase:', err);
      return [];
    }
  },

  async getAllReports(): Promise<DailyReport[]> {
    const sb = getSupabase();
    if (!sb) return [];
    try {
      const { data, error } = await sb
        .from('daily_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase getAllReports error:', error);
        return [];
      }

      return (data || []).map((row) => ({
        id: row.id,
        caseId: row.case_id,
        patientId: row.patient_id,
        patientName: row.patient_name ?? '',
        hn: row.hn ?? '',
        surgeryDate: row.surgery_date,
        reportDate: row.report_date,
        postOpDay: row.post_op_day,
        status: row.status,
        statusLabelThai: row.status_label_thai || 'ส่งรายงานแล้ว',
        submittedAt: row.submitted_at,
        photos: row.photos || [],
        symptomAnswers: row.symptoms || {
          painScore: 0,
          swellingLevel: 'same',
          bleedingOrDischarge: 'none',
          feverStatus: 'none',
          numbnessOrTightness: 'normal_tight',
          hasConcerningSymptoms: false,
        },
        internalNotes: Array.isArray(row.internal_notes)
          ? row.internal_notes
          : row.internal_clinical_notes
          ? [row.internal_clinical_notes]
          : [],
        latestCustomerMessage: row.customer_message || '',
        reviewHistory: row.review_notes || row.review_history || [],
        isUrgent:
          row.is_urgent ||
          Boolean(
            row.symptoms?.painScore >= 8 ||
              row.symptoms?.bleedingOrDischarge === 'heavy_fresh' ||
              row.symptoms?.hasConcerningSymptoms
          ),
        createdAt: row.created_at || new Date().toISOString(),
        updatedAt: row.created_at || new Date().toISOString(),
      }));
    } catch (err) {
      console.error('Error fetching reports from Supabase:', err);
      return [];
    }
  },

  async createCase(newCase: SurgeryCase, newPatient: Patient): Promise<boolean> {
    const sb = getSupabase();
    if (!sb) return false;
    try {
      // 1. Upsert Patient
      const { error: patientErr } = await sb.from('patients').upsert({
        id: newPatient.id,
        hn: newPatient.hn,
        display_name: newPatient.displayName,
        phone_number: newPatient.phoneNumber,
        gender: newPatient.gender,
        age: newPatient.age,
        medical_conditions: newPatient.medicalConditions,
        consent_accepted: true,
      });

      if (patientErr) {
        console.error('Supabase createPatient error:', patientErr);
      }

      // 2. Upsert Surgery Case
      const { error: caseErr } = await sb.from('surgery_cases').upsert({
        id: newCase.id,
        patient_id: newCase.patientId,
        patient_name: newCase.patientName,
        hn: newCase.hn,
        phone_number: newCase.phoneNumber,
        gender: newCase.gender,
        age: newCase.age,
        medical_conditions: newCase.medicalConditions,
        special_instructions: newCase.specialInstructions,
        token: newCase.token,
        line_user_id: newCase.lineUserId,
        service_type: newCase.serviceType,
        surgeon_name: newCase.surgeonName,
        surgery_date: newCase.surgeryDate,
        follow_up_start_date: newCase.followUpStartDate,
        case_status: newCase.caseStatus,
        notes: newCase.notes,
      });

      if (caseErr) {
        console.error('Supabase createCase error:', caseErr);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error creating case in Supabase:', err);
      return false;
    }
  },

  async findCaseByPhone(phone: string): Promise<SurgeryCase | null> {
    const sb = getSupabase();
    if (!sb) return null;
    try {
      const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
      const { data, error } = await sb
        .from('surgery_cases')
        .select('*')
        .eq('phone_number', cleanPhone)
        .limit(1)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        patientId: data.patient_id,
        patientName: data.patient_name ?? '',
        hn: data.hn ?? '',
        phoneNumber: data.phone_number ?? '',
        gender: data.gender,
        age: data.age,
        medicalConditions: data.medical_conditions,
        specialInstructions: data.special_instructions,
        token: data.token,
        lineUserId: data.line_user_id,
        serviceType: data.service_type,
        surgeonName: data.surgeon_name,
        surgeryDate: data.surgery_date,
        followUpStartDate: data.follow_up_start_date,
        caseStatus: data.case_status,
      };
    } catch {
      return null;
    }
  },

  async findCaseByToken(token: string): Promise<SurgeryCase | null> {
    const sb = getSupabase();
    if (!sb) return null;
    try {
      const { data, error } = await sb
        .from('surgery_cases')
        .select('*')
        .eq('token', token)
        .limit(1)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        patientId: data.patient_id,
        patientName: data.patient_name ?? '',
        hn: data.hn ?? '',
        phoneNumber: data.phone_number ?? '',
        gender: data.gender,
        age: data.age,
        medicalConditions: data.medical_conditions,
        specialInstructions: data.special_instructions,
        token: data.token,
        lineUserId: data.line_user_id,
        serviceType: data.service_type,
        surgeonName: data.surgeon_name,
        surgeryDate: data.surgery_date,
        followUpStartDate: data.follow_up_start_date,
        caseStatus: data.case_status,
      };
    } catch {
      return null;
    }
  },

  async updateCaseLineUserId(caseId: string, lineUserId: string): Promise<boolean> {
    const sb = getSupabase();
    if (!sb) return false;
    try {
      const { error } = await sb
        .from('surgery_cases')
        .update({ line_user_id: lineUserId })
        .eq('id', caseId);
      return !error;
    } catch {
      return false;
    }
  },

  async submitReport(report: DailyReport): Promise<boolean> {
    const sb = getSupabase();
    if (!sb) return false;
    try {
      const internalNotesText = Array.isArray(report.internalNotes)
        ? report.internalNotes.join('\n')
        : (report.internalNotes || '');

      const { error } = await sb.from('daily_reports').upsert({
        id: report.id,
        case_id: report.caseId,
        patient_id: report.patientId,
        patient_name: report.patientName,
        hn: report.hn,
        surgery_date: report.surgeryDate,
        report_date: report.reportDate,
        post_op_day: report.postOpDay,
        status: report.status,
        status_label_thai: report.statusLabelThai,
        submitted_at: report.submittedAt,
        photos: report.photos,
        symptoms: report.symptomAnswers,
        review_notes: report.reviewHistory || [],
        internal_clinical_notes: internalNotesText,
        customer_message: report.latestCustomerMessage || '',
      });

      if (error) {
        console.error('Supabase submitReport error:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Error submitting report to Supabase:', err);
      return false;
    }
  },

  async updateReport(
    reportId: string,
    updates: Partial<DailyReport>
  ): Promise<boolean> {
    const sb = getSupabase();
    if (!sb) return false;
    try {
      const payload: Record<string, unknown> = {};
      if (updates.status) payload.status = updates.status;
      if (updates.statusLabelThai) payload.status_label_thai = updates.statusLabelThai;
      if (updates.internalNotes !== undefined) {
        payload.internal_clinical_notes = Array.isArray(updates.internalNotes)
          ? updates.internalNotes.join('\n')
          : String(updates.internalNotes || '');
      }
      if (updates.latestCustomerMessage !== undefined) {
        payload.customer_message = updates.latestCustomerMessage;
      }
      if (updates.reviewHistory) {
        payload.review_notes = updates.reviewHistory;
      }

      const { error } = await sb
        .from('daily_reports')
        .update(payload)
        .eq('id', reportId);

      if (error) {
        console.error('Supabase updateReport error:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Error updating report in Supabase:', err);
      return false;
    }
  },

  // ============================================================================
  // Clinical Operations: Follow-up Schedules, Overdue Queues & Contact Logs
  // ============================================================================

  getBangkokToday(): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  },

  computeScheduleDate(baseDateStr: string, dayOffset: number): string {
    const parts = baseDateStr.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2] + dayOffset);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  async createFollowupSchedulesForCase(
    caseId: string,
    patientId: string,
    surgeryDate: string
  ): Promise<FollowupSchedule[]> {
    const todayStr = this.getBangkokToday();
    const schedules: FollowupSchedule[] = [];
    const angles = ['frontal', 'right_45', 'left_45', 'right_profile', 'left_profile'];

    for (let day = 1; day <= 14; day++) {
      const scheduledDate = this.computeScheduleDate(surgeryDate, day);
      let status: ScheduleStatus = 'upcoming';
      if (scheduledDate < todayStr) {
        status = 'overdue';
      } else if (scheduledDate === todayStr) {
        status = 'due';
      }

      schedules.push({
        id: `sch_${caseId}_d${day}`,
        caseId,
        patientId,
        scheduledDate,
        dueAt: `${scheduledDate}T20:00:00+07:00`,
        postOpDay: day,
        dayLabel: `D+${day}`,
        scheduleStatus: status,
        requiredPhotoAngles: angles,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Try saving to Supabase if table exists
    const sb = getSupabase();
    if (sb) {
      try {
        const rows = schedules.map((s) => ({
          id: s.id,
          case_id: s.caseId,
          patient_id: s.patientId,
          scheduled_date: s.scheduledDate,
          due_at: s.dueAt,
          post_op_day: s.postOpDay,
          day_label: s.dayLabel,
          schedule_status: s.scheduleStatus,
          required_photo_angles: s.requiredPhotoAngles,
        }));
        await sb.from('followup_schedules').upsert(rows);
      } catch (err) {
        console.warn('Could not upsert to followup_schedules (table may be pending migration):', err);
      }
    }

    // Fallback cache in localStorage
    if (typeof window !== 'undefined') {
      try {
        const key = `ud_schedules_${caseId}`;
        localStorage.setItem(key, JSON.stringify(schedules));
      } catch {
        // ignore storage errors
      }
    }

    return schedules;
  },

  async getDueAndOverdueSchedules(): Promise<FollowupSchedule[]> {
    const todayStr = this.getBangkokToday();
    const cases = await this.getAllCases();
    const reports = await this.getAllReports();
    const result: FollowupSchedule[] = [];

    for (const c of cases) {
      // Find reports for this case
      const caseReports = reports.filter((r: DailyReport) => r.caseId === c.id);
      const angles = ['frontal', 'right_45', 'left_45', 'right_profile', 'left_profile'];

      for (let day = 1; day <= 14; day++) {
        const scheduledDate = this.computeScheduleDate(c.surgeryDate, day);
        const existingReport = caseReports.find((r: DailyReport) => r.postOpDay === day);

        let status: ScheduleStatus = 'upcoming';
        if (existingReport) {
          status = existingReport.status === 'reviewed' ? 'completed' : 'submitted';
        } else if (scheduledDate < todayStr) {
          status = 'overdue';
        } else if (scheduledDate === todayStr) {
          status = 'due';
        }

        // Only include due and overdue
        if (status === 'due' || status === 'overdue') {
          result.push({
            id: `sch_${c.id}_d${day}`,
            caseId: c.id,
            patientId: c.patientId,
            patientName: c.patientName,
            hn: c.hn,
            phoneNumber: c.phoneNumber,
            token: c.token,
            procedureName: c.serviceType,
            surgeonName: c.surgeonName,
            scheduledDate,
            dueAt: `${scheduledDate}T20:00:00+07:00`,
            postOpDay: day,
            dayLabel: `D+${day}`,
            scheduleStatus: status,
            requiredPhotoAngles: angles,
            createdAt: c.surgeryDate,
            updatedAt: new Date().toISOString(),
          });
        }
      }
    }

    // Sort: overdue first, then by date ascending
    return result.sort((a, b) => {
      if (a.scheduleStatus === 'overdue' && b.scheduleStatus !== 'overdue') return -1;
      if (a.scheduleStatus !== 'overdue' && b.scheduleStatus === 'overdue') return 1;
      return a.scheduledDate.localeCompare(b.scheduledDate);
    });
  },

  getGroupedDueAndOverdueSchedules(
    schedules: FollowupSchedule[],
    cases: SurgeryCase[] = [],
    providedToday?: string
  ): GroupedPatientSchedule[] {
    const caseMap = new Map<string, SurgeryCase>();
    cases.forEach((c) => caseMap.set(c.id, c));

    const groupedMap = new Map<string, FollowupSchedule[]>();
    for (const s of schedules) {
      const list = groupedMap.get(s.caseId) || [];
      list.push(s);
      groupedMap.set(s.caseId, list);
    }

    const result: GroupedPatientSchedule[] = [];
    const todayStr =
      providedToday ||
      (typeof window !== 'undefined' ? this.getBangkokToday() : '2026-10-24');

    groupedMap.forEach((subSchedules, caseId) => {
      // Sort sub-schedules chronologically (e.g. D+1 to D+14)
      subSchedules.sort((a, b) => a.postOpDay - b.postOpDay);

      const first = subSchedules[0];
      const matchedCase = caseMap.get(caseId);

      const overdueList = subSchedules.filter((s) => s.scheduleStatus === 'overdue');
      const dueList = subSchedules.filter((s) => s.scheduleStatus === 'due');

      // Latest active sub-schedule
      const latest = subSchedules[subSchedules.length - 1];

      // Calculate current D+ based on surgeryDate if available
      let currentPostOpDay = latest.postOpDay;
      if (matchedCase?.surgeryDate && typeof window !== 'undefined') {
        try {
          const parts = matchedCase.surgeryDate.split('-').map(Number);
          const surgDate = new Date(parts[0], parts[1] - 1, parts[2]);
          const todayParts = todayStr.split('-').map(Number);
          const todayDate = new Date(todayParts[0], todayParts[1] - 1, todayParts[2]);
          const diffDays = Math.floor(
            (todayDate.getTime() - surgDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (diffDays > 0) currentPostOpDay = diffDays;
        } catch {
          // ignore date parse errors
        }
      }

      result.push({
        caseId,
        patientId: first.patientId,
        patientName: first.patientName || matchedCase?.patientName || 'คนไข้',
        hn: first.hn || matchedCase?.hn || '-',
        phoneNumber: first.phoneNumber || matchedCase?.phoneNumber || '',
        procedureName:
          first.procedureName || matchedCase?.serviceType || 'ศัลยกรรมตกแต่ง',
        surgeonName: first.surgeonName || matchedCase?.surgeonName || '',
        gender: matchedCase?.gender,
        age: matchedCase?.age,
        medicalConditions: matchedCase?.medicalConditions,
        specialInstructions: matchedCase?.specialInstructions,
        currentPostOpDay,
        currentDayLabel: `D+${currentPostOpDay}`,
        daysOverdueCount: overdueList.length,
        daysDueCount: dueList.length,
        latestScheduleStatus: overdueList.length > 0 ? 'overdue' : 'due',
        subSchedules,
      });
    });

    // Sort: patients with overdue first, then by days overdue descending
    return result.sort((a, b) => {
      if (a.daysOverdueCount !== b.daysOverdueCount) {
        return b.daysOverdueCount - a.daysOverdueCount;
      }
      return b.currentPostOpDay - a.currentPostOpDay;
    });
  },

  async getContactLogs(caseId?: string): Promise<ContactLog[]> {
    const sb = getSupabase();
    if (sb) {
      try {
        let query = sb.from('contact_logs').select('*').order('contacted_at', { ascending: false });
        if (caseId) query = query.eq('case_id', caseId);
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data.map((row) => ({
            id: row.id,
            patientId: row.patient_id,
            caseId: row.case_id,
            taskId: row.task_id,
            contactedAt: row.contacted_at,
            contactedBy: row.contacted_by,
            channel: row.channel,
            contactOutcome: row.contact_outcome,
            summary: row.summary,
            nextAction: row.next_action,
            nextActionDueAt: row.next_action_due_at,
            createdAt: row.created_at,
          }));
        }
      } catch {
        // fallback
      }
    }

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('ud_contact_logs');
        if (stored) {
          const parsed: ContactLog[] = JSON.parse(stored);
          if (caseId) return parsed.filter((l) => l.caseId === caseId);
          return parsed;
        }
      } catch {
        // ignore
      }
    }
    return [];
  },

  async createContactLog(log: ContactLog): Promise<boolean> {
    const sb = getSupabase();
    if (sb) {
      try {
        const { error } = await sb.from('contact_logs').insert({
          id: log.id,
          patient_id: log.patientId,
          case_id: log.caseId,
          task_id: log.taskId || null,
          contacted_at: log.contactedAt,
          contacted_by: log.contactedBy,
          channel: log.channel,
          contact_outcome: log.contactOutcome,
          summary: log.summary,
          next_action: log.nextAction || null,
          next_action_due_at: log.nextActionDueAt || null,
        });
        if (!error) return true;
      } catch {
        // fallback to localStorage
      }
    }

    if (typeof window !== 'undefined') {
      try {
        const current = await this.getContactLogs();
        localStorage.setItem('ud_contact_logs', JSON.stringify([log, ...current]));
        return true;
      } catch {
        return false;
      }
    }
    return true;
  },

  async savePhotoQualityEvaluations(
    submissionId: string,
    evaluations: PhotoQualityEvaluation[]
  ): Promise<boolean> {
    const sb = getSupabase();
    if (sb) {
      try {
        const rows = evaluations.map((e) => ({
          id: e.id,
          submission_id: submissionId,
          angle_code: e.angleCode,
          quality_status: e.qualityStatus,
          retake_reason: e.retakeReason || null,
          reviewed_by: e.reviewedBy,
          reviewed_at: e.reviewedAt,
        }));
        await sb.from('photo_quality_evaluations').upsert(rows);
      } catch (err) {
        console.warn('Could not upsert photo_quality_evaluations to Supabase:', err);
      }
    }

    if (typeof window !== 'undefined') {
      try {
        const key = `ud_evaluations_${submissionId}`;
        localStorage.setItem(key, JSON.stringify(evaluations));
        return true;
      } catch {
        return false;
      }
    }
    return true;
  },

  async getPhotoQualityEvaluations(
    submissionId: string
  ): Promise<PhotoQualityEvaluation[]> {
    const sb = getSupabase();
    if (sb) {
      try {
        const { data, error } = await sb
          .from('photo_quality_evaluations')
          .select('*')
          .eq('submission_id', submissionId);

        if (!error && data && data.length > 0) {
          return data.map((row) => ({
            id: row.id,
            submissionId: row.submission_id,
            angleCode: row.angle_code,
            qualityStatus: row.quality_status,
            retakeReason: row.retake_reason || undefined,
            reviewedBy: row.reviewed_by,
            reviewedAt: row.reviewed_at,
          }));
        }
      } catch {
        // fallback to localStorage
      }
    }

    if (typeof window !== 'undefined') {
      try {
        const key = `ud_evaluations_${submissionId}`;
        const stored = localStorage.getItem(key);
        if (stored) return JSON.parse(stored);
      } catch {
        // ignore
      }
    }
    return [];
  },

  async logClinicalAudit(
    entry: Omit<ClinicalAuditLog, 'id' | 'createdAt'>
  ): Promise<boolean> {
    const audit: ClinicalAuditLog = {
      ...entry,
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };

    const sb = getSupabase();
    if (sb) {
      try {
        await sb.from('clinical_audit_logs').insert({
          id: audit.id,
          actor_name: audit.actorName,
          actor_role: audit.actorRole,
          action: audit.action,
          resource_type: audit.resourceType,
          resource_id: audit.resourceId,
          changes: audit.changes || {},
          ip_address: audit.ipAddress || null,
        });
      } catch (err) {
        console.warn('Could not write clinical_audit_logs to Supabase:', err);
      }
    }

    if (typeof window !== 'undefined') {
      try {
        const existing = await this.getClinicalAuditLogs();
        localStorage.setItem(
          'ud_clinical_audit_logs',
          JSON.stringify([audit, ...existing.slice(0, 100)])
        );
        return true;
      } catch {
        return false;
      }
    }
    return true;
  },

  async getClinicalAuditLogs(resourceId?: string): Promise<ClinicalAuditLog[]> {
    const sb = getSupabase();
    if (sb) {
      try {
        let query = sb
          .from('clinical_audit_logs')
          .select('*')
          .order('created_at', { ascending: false });

        if (resourceId) {
          query = query.eq('resource_id', resourceId);
        }

        const { data, error } = await query.limit(50);
        if (!error && data) {
          return data.map((row) => ({
            id: row.id,
            actorName: row.actor_name,
            actorRole: row.actor_role,
            action: row.action,
            resourceType: row.resource_type,
            resourceId: row.resource_id,
            changes: row.changes,
            ipAddress: row.ip_address,
            createdAt: row.created_at,
          }));
        }
      } catch {
        // fallback
      }
    }

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('ud_clinical_audit_logs');
        if (stored) {
          const list: ClinicalAuditLog[] = JSON.parse(stored);
          if (resourceId) return list.filter((l) => l.resourceId === resourceId);
          return list;
        }
      } catch {
        // ignore
      }
    }
    return [];
  },
};
