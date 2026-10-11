import { getSupabase, isSupabaseConfigured } from './supabase';
import { SurgeryCase, Patient, DailyReport } from './types';

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
        patientName: row.patient_name,
        hn: row.hn,
        phoneNumber: row.phone_number,
        token: row.token,
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
        patientName: row.patient_name,
        hn: row.hn,
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
        token: newCase.token,
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
        patientName: data.patient_name,
        hn: data.hn,
        phoneNumber: data.phone_number,
        token: data.token,
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
        patientName: data.patient_name,
        hn: data.hn,
        phoneNumber: data.phone_number,
        token: data.token,
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
};
