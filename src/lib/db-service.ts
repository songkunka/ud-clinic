import { supabase, isSupabaseConfigured } from './supabase';
import { SurgeryCase, Patient, DailyReport } from './types';

export const dbService = {
  isAvailable(): boolean {
    return isSupabaseConfigured && supabase !== null;
  },

  async getAllCases(): Promise<SurgeryCase[]> {
    if (!this.isAvailable() || !supabase) return [];
    try {
      const { data, error } = await supabase
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
    if (!this.isAvailable() || !supabase) return [];
    try {
      const { data, error } = await supabase
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
        statusLabelThai: row.status_label_thai,
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
        internalNotes: row.internal_notes || [],
        latestCustomerMessage: row.customer_message || '',
        reviewHistory: row.review_history || [],
        isUrgent: row.is_urgent || false,
        createdAt: row.created_at || new Date().toISOString(),
        updatedAt: row.updated_at || new Date().toISOString(),
      }));
    } catch (err) {
      console.error('Error fetching reports from Supabase:', err);
      return [];
    }
  },

  async createCase(newCase: SurgeryCase, newPatient: Patient): Promise<boolean> {
    if (!this.isAvailable() || !supabase) return false;
    try {
      // 1. Upsert Patient
      const { error: patientErr } = await supabase.from('patients').upsert({
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
      const { error: caseErr } = await supabase.from('surgery_cases').upsert({
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
    if (!this.isAvailable() || !supabase) return null;
    try {
      const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
      const { data, error } = await supabase
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
    if (!this.isAvailable() || !supabase) return null;
    try {
      const { data, error } = await supabase
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
    if (!this.isAvailable() || !supabase) return false;
    try {
      const { error } = await supabase.from('daily_reports').upsert({
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
        review_history: report.reviewHistory || [],
        internal_notes: report.internalNotes || [],
        customer_message: report.latestCustomerMessage || '',
        is_urgent: report.isUrgent,
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
    if (!this.isAvailable() || !supabase) return false;
    try {
      const payload: Record<string, unknown> = {};
      if (updates.status) payload.status = updates.status;
      if (updates.statusLabelThai) payload.status_label_thai = updates.statusLabelThai;
      if (updates.internalNotes !== undefined)
        payload.internal_notes = updates.internalNotes;
      if (updates.latestCustomerMessage !== undefined)
        payload.customer_message = updates.latestCustomerMessage;
      if (updates.reviewHistory) payload.review_history = updates.reviewHistory;

      const { error } = await supabase
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
