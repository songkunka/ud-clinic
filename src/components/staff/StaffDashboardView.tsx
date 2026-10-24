'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { DailyReport, SurgeryCase, FollowupSchedule, GroupedPatientSchedule } from '@/lib/types';
import { StatusBadge } from '@/components/common/StatusBadge';
import { CaseReviewModal } from './CaseReviewModal';
import { PhotoTimelineCompare } from './PhotoTimelineCompare';
import {
  Clock,
  UserPlus,
  PhoneCall,
  Phone,
  CheckCircle2,
  Search,
  Columns,
  List,
  AlertTriangle,
  Eye,
  Check,
  X,
  Calendar,
  User,
  ShieldCheck,
  ExternalLink,
  Database,
  Settings,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { DatabaseConfigModal } from '@/components/common/DatabaseConfigModal';
import { ContactLogModal } from './ContactLogModal';
import { dbService } from '@/lib/db-service';
import { isSupabaseConfigured } from '@/lib/supabase';

export function StaffDashboardView() {
  const {
    reports,
    cases,
    createNewCase,
    performReviewAction,
  } = useAppStore();

  const [showDbModal, setShowDbModal] = useState(false);

  const [activeTab, setActiveTab] = useState<
    'all' | 'pending' | 'due_overdue' | 'referred' | 'more_info' | 'urgent' | 'reviewed'
  >('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);
  const [viewMode, setViewMode] = useState<'queue' | 'cases' | 'compare'>('queue');
  const [dueOverdueSchedules, setDueOverdueSchedules] = useState<FollowupSchedule[]>([]);
  const [expandedCaseIds, setExpandedCaseIds] = useState<Set<string>>(new Set());
  const [selectedContactCase, setSelectedContactCase] = useState<{
    patientName: string;
    hn: string;
    phoneNumber: string;
    caseId: string;
    patientId: string;
    dayLabel?: string;
  } | null>(null);

  // Register New Case Modal State
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [hn, setHn] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState<'female' | 'male' | 'other'>('female');
  const [age, setAge] = useState('');
  const [medicalConditions, setMedicalConditions] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [serviceType, setServiceType] = useState('SMAS Full Face-Lift & Neck Lift');
  const [surgeonName, setSurgeonName] = useState('นพ.สมชาย เกียรติเวชช์');
  const [surgeryDate, setSurgeryDate] = useState('2026-10-11');
  const [createdCaseResult, setCreatedCaseResult] = useState<SurgeryCase | null>(null);

  const refreshOverdueSchedules = async () => {
    try {
      const list = await dbService.getDueAndOverdueSchedules();
      setDueOverdueSchedules(list);
    } catch (err) {
      console.error('Error loading due/overdue schedules:', err);
    }
  };

  useEffect(() => {
    setSurgeryDate(new Date().toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    refreshOverdueSchedules();
  }, [cases, reports]);

  // Metrics
  const countPending = reports.filter(
    (r) => r.status === 'pending_review' || r.status === 'submitted'
  ).length;
  const countReferred = reports.filter(
    (r) => r.status === 'referred_to_doctor'
  ).length;
  const countMoreInfo = reports.filter(
    (r) => r.status === 'more_info_requested'
  ).length;
  const countUrgent = reports.filter((r) => r.isUrgent).length;
  const countReviewed = reports.filter((r) => r.status === 'reviewed').length;

  // Grouped due/overdue schedules by patient
  const groupedSchedules = useMemo(() => {
    return dbService.getGroupedDueAndOverdueSchedules(dueOverdueSchedules, cases);
  }, [dueOverdueSchedules, cases]);

  // Filtered reports
  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.hn.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'pending')
      return r.status === 'pending_review' || r.status === 'submitted';
    if (activeTab === 'referred') return r.status === 'referred_to_doctor';
    if (activeTab === 'more_info') return r.status === 'more_info_requested';
    if (activeTab === 'urgent') return r.isUrgent;
    if (activeTab === 'reviewed') return r.status === 'reviewed';

    return true;
  });

  // Filtered grouped schedules for due/overdue follow-up queue
  const filteredGroupedSchedules = useMemo(() => {
    if (!searchQuery) return groupedSchedules;
    const q = searchQuery.toLowerCase();
    return groupedSchedules.filter(
      (g) =>
        g.patientName.toLowerCase().includes(q) ||
        g.hn.toLowerCase().includes(q) ||
        g.phoneNumber.toLowerCase().includes(q) ||
        g.procedureName.toLowerCase().includes(q) ||
        g.surgeonName.toLowerCase().includes(q)
    );
  }, [groupedSchedules, searchQuery]);

  const toggleExpandCase = (caseId: string) => {
    setExpandedCaseIds((prev) => {
      const next = new Set(prev);
      if (next.has(caseId)) next.delete(caseId);
      else next.add(caseId);
      return next;
    });
  };

  const resetNewCaseForm = () => {
    setPatientName('');
    setHn('');
    setPhoneNumber('');
    setGender('female');
    setAge('');
    setMedicalConditions('');
    setSpecialInstructions('');
    setServiceType('SMAS Full Face-Lift & Neck Lift');
    setSurgeonName('นพ.สมชาย เกียรติเวชช์');
    setSurgeryDate(new Date().toISOString().split('T')[0]);
    setCreatedCaseResult(null);
  };

  const handleCreateCaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    if (!patientName.trim() || !hn.trim() || cleanPhone.length < 9) {
      alert('กรุณากรอกชื่อคนไข้, เลข HN และเบอร์โทรศัพท์ (9-10 หลัก) ให้ครบถ้วน');
      return;
    }

    const created = createNewCase({
      patientName: patientName.trim(),
      hn: hn.trim(),
      phoneNumber: cleanPhone,
      serviceType,
      surgeonName,
      surgeryDate,
      gender,
      age: age ? parseInt(age, 10) : undefined,
      medicalConditions: medicalConditions.trim() || undefined,
      specialInstructions: specialInstructions.trim() || undefined,
    });

    setCreatedCaseResult(created);
    refreshOverdueSchedules();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 shadow-sm shrink-0">
            <img
              src="/logo.jpg"
              alt="UD CLINIC TORO"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                UD CLINIC TORO
              </span>
              <span className="text-xs text-slate-500 font-semibold">Staff & Doctor Portal</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-0.5">
              ศูนย์ติดตามและคัดกรองเคสหลังผ่าตัดดึงหน้า
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Register New Case Button */}
          <button
            onClick={() => {
              resetNewCaseForm();
              setShowNewCaseModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ ลงทะเบียนคนไข้ใหม่</span>
          </button>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl border border-slate-300">
            <button
              onClick={() => setViewMode('queue')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'queue'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-4 h-4" />
              <span>คิวรายงาน ({reports.length})</span>
            </button>

            <button
              onClick={() => setViewMode('cases')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'cases'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4" />
              <span>รายชื่อคนไข้ ({cases.length})</span>
            </button>

            <button
              onClick={() => setViewMode('compare')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'compare'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Columns className="w-4 h-4" />
              <span>เปรียบเทียบภาพ</span>
            </button>
          </div>

          {/* Admin Settings Button */}
          <button
            onClick={() => setShowDbModal(true)}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            title="ตั้งค่าฐานข้อมูลและระบบ (Admin Settings)"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Offline Alert Banner if Supabase not configured */}
      {!isSupabaseConfigured() && (
        <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs text-amber-900 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold text-amber-950 text-xs">
                ระบบกำลังทำงานในโหมด Offline (บันทึกเฉพาะในเบราว์เซอร์เครื่องนี้)
              </p>
              <p className="text-[11px] text-amber-800">
                ข้อมูลคนไข้ที่ลงทะเบียนไว้ยังไม่ได้ซิงค์ไปที่ Supabase Cloud ทำให้เมื่อเปิดบนมือถือจะไม่พบข้อมูล
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowDbModal(true)}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            ใส่ API Keys เพื่อเชื่อมต่อและซิงค์ข้อมูลขึ้น Supabase
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          onClick={() => {
            setViewMode('queue');
            setActiveTab('pending');
          }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'pending' && viewMode === 'queue'
              ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-blue-700 font-semibold mb-1">
            <span>รอตรวจภาพ</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-slate-900">{countPending}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">คิวรอแพทย์/พยาบาล</div>
        </div>

        <div
          onClick={() => {
            setViewMode('queue');
            setActiveTab('due_overdue');
          }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'due_overdue' && viewMode === 'queue'
              ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-amber-800 font-semibold mb-1">
            <span>ค้างส่ง/ถึงกำหนด</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600">{groupedSchedules.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">คนไข้ที่ถึงเวลาส่งภาพ</div>
        </div>

        <div
          onClick={() => {
            setViewMode('queue');
            setActiveTab('urgent');
          }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'urgent' && viewMode === 'queue'
              ? 'bg-red-50/80 border-red-400 ring-2 ring-red-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-red-700 font-semibold mb-1">
            <span>อาการเร่งด่วน</span>
            <PhoneCall className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-red-600">{countUrgent}</div>
          <div className="text-[10px] text-red-700 mt-0.5">เลือดออก/บวมผิดปกติ</div>
        </div>

        <div
          onClick={() => {
            setViewMode('queue');
            setActiveTab('referred');
          }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'referred' && viewMode === 'queue'
              ? 'bg-purple-50/80 border-purple-400 ring-2 ring-purple-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-purple-700 font-semibold mb-1">
            <span>ส่งต่อแพทย์</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-slate-900">{countReferred}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">รอแพทย์ตรวจเคส</div>
        </div>

        <div
          onClick={() => {
            setViewMode('queue');
            setActiveTab('more_info');
          }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'more_info' && viewMode === 'queue'
              ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-amber-700 font-semibold mb-1">
            <span>ขอภาพเพิ่ม</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-slate-900">{countMoreInfo}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">รอคนไข้ถ่ายใหม่</div>
        </div>

        <div
          onClick={() => {
            setViewMode('queue');
            setActiveTab('reviewed');
          }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'reviewed' && viewMode === 'queue'
              ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold mb-1">
            <span>ตรวจแล้วเสร็จ</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-slate-900">{countReviewed}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">ตอบคำแนะนำแล้ว</div>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'compare' ? (
        <PhotoTimelineCompare
          reports={reports}
          patientName={cases[0]?.patientName || 'คนไข้ในระบบ'}
        />
      ) : viewMode === 'cases' ? (
        /* Cases List */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">
              รายชื่อคนไข้ที่ลงทะเบียนไว้ในระบบ ({cases.length} เคส)
            </h3>
            <button
              onClick={() => {
                setCreatedCaseResult(null);
                setShowNewCaseModal(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer"
            >
              + ลงทะเบียนเคสใหม่
            </button>
          </div>

          {cases.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <User className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-sm font-semibold">ยังไม่มีคนไข้ในระบบ</p>
              <p className="text-xs">กดปุ่ม &ldquo;+ ลงทะเบียนเคสใหม่&rdquo; ด้านบนเพื่อเพิ่มเคสคนไข้จริง</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="p-3">คนไข้ & HN</th>
                    <th className="p-3">เบอร์โทรศัพท์</th>
                    <th className="p-3">หัตถการผ่าตัด</th>
                    <th className="p-3">วันที่ผ่าตัด</th>
                    <th className="p-3">แพทย์ผู้ผ่าตัด</th>
                    <th className="p-3 text-right">สถานะการติดตาม</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cases.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{c.patientName}</div>
                        <div className="text-[10px] font-mono text-slate-500">
                          HN: {c.hn}
                          {c.gender && ` · ${c.gender === 'female' ? 'หญิง' : c.gender === 'male' ? 'ชาย' : 'อื่นๆ'}`}
                          {c.age && ` ${c.age} ปี`}
                        </div>
                        {c.medicalConditions && (
                          <div className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 mt-1 inline-block">
                            ⚠️ {c.medicalConditions}
                          </div>
                        )}
                      </td>
                      <td className="p-3 font-mono font-semibold text-slate-800">
                        {c.phoneNumber}
                      </td>
                      <td className="p-3 text-slate-700">
                        <div>{c.serviceType}</div>
                        {c.specialInstructions && (
                          <div className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 mt-0.5 inline-block">
                            📝 {c.specialInstructions}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-slate-600">{c.surgeryDate}</td>
                      <td className="p-3 text-slate-600">{c.surgeonName}</td>
                      <td className="p-3 text-right">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>กำลังติดตาม (Active)</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Queue View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: `ทั้งหมด (${reports.length})` },
                { id: 'pending', label: `รอตรวจ (${countPending})` },
                { id: 'due_overdue', label: `⚠️ ค้างส่ง/ถึงกำหนด (${groupedSchedules.length})` },
                { id: 'urgent', label: `เร่งด่วน (${countUrgent})` },
                { id: 'referred', label: `ส่งต่อแพทย์ (${countReferred})` },
                { id: 'more_info', label: `ขอข้อมูลเพิ่ม (${countMoreInfo})` },
                { id: 'reviewed', label: `ตรวจแล้ว (${countReviewed})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? tab.id === 'due_overdue'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-blue-600 text-white shadow-xs'
                      : tab.id === 'due_overdue' && groupedSchedules.length > 0
                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500 bg-slate-50 text-slate-800"
              />
            </div>
          </div>

          {activeTab === 'due_overdue' ? (
            filteredGroupedSchedules.length === 0 ? (
              <div className="text-center py-16 text-slate-400 space-y-2">
                <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500" />
                <p className="text-sm font-semibold text-slate-700">ไม่มีเคสที่ค้างส่งภาพในขณะนี้</p>
                <p className="text-xs">คนไข้ทุกคนส่งภาพครบถ้วนตามโปรโตคอลกำหนด</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="p-3">คนไข้ & เวชระเบียน</th>
                      <th className="p-3">หัตถการ & ศัลยแพทย์</th>
                      <th className="p-3">ระยะปัจจุบัน</th>
                      <th className="p-3">เบอร์ติดต่อ</th>
                      <th className="p-3">สถานะติดตาม</th>
                      <th className="p-3 text-right">ดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredGroupedSchedules.map((g) => {
                      const isExpanded = expandedCaseIds.has(g.caseId);
                      return (
                        <React.Fragment key={g.caseId}>
                          <tr className="hover:bg-amber-50/40 transition-colors">
                            <td className="p-3">
                              <div className="font-bold text-slate-900">{g.patientName}</div>
                              <div className="text-[10px] font-mono text-slate-500">
                                HN: {g.hn}
                                {g.gender && ` · ${g.gender === 'female' ? 'หญิง' : g.gender === 'male' ? 'ชาย' : 'อื่นๆ'}`}
                                {g.age && ` ${g.age} ปี`}
                              </div>
                              {g.medicalConditions && (
                                <div className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 mt-1 inline-block">
                                  ⚠️ {g.medicalConditions}
                                </div>
                              )}
                            </td>

                            <td className="p-3 text-slate-600 max-w-[200px]">
                              <div className="font-medium text-slate-800">{g.procedureName}</div>
                              <div className="text-[10px] text-slate-400">ศัลยแพทย์: {g.surgeonName}</div>
                              {g.specialInstructions && (
                                <div className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 mt-1 inline-block">
                                  📝 {g.specialInstructions}
                                </div>
                              )}
                            </td>

                            <td className="p-3 whitespace-nowrap">
                              <span className="inline-block px-2.5 py-0.5 rounded-md font-black text-xs bg-blue-100 text-blue-900">
                                {g.currentDayLabel}
                              </span>
                            </td>

                            <td className="p-3 whitespace-nowrap">
                              {g.phoneNumber ? (
                                <a
                                  href={`tel:${g.phoneNumber}`}
                                  className="text-blue-600 hover:underline font-mono font-medium flex items-center gap-1"
                                >
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  {g.phoneNumber}
                                </a>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>

                            <td className="p-3 whitespace-nowrap">
                              <div>
                                {g.daysOverdueCount > 0 ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                    <AlertTriangle className="w-3 h-3 text-rose-500" />
                                    ค้างส่ง {g.daysOverdueCount} วัน
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    <Clock className="w-3 h-3 text-amber-500" />
                                    ถึงกำหนดวันนี้
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => toggleExpandCase(g.caseId)}
                                className="mt-1 text-[11px] text-slate-500 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-3.5 h-3.5 text-blue-600" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                                )}
                                <span>{isExpanded ? 'ซ่อนวันย่อย' : `ดู ${g.subSchedules.length} วันย่อย`}</span>
                              </button>
                            </td>

                            <td className="p-3 text-right whitespace-nowrap">
                              <button
                                onClick={() =>
                                  setSelectedContactCase({
                                    patientName: g.patientName,
                                    hn: g.hn,
                                    phoneNumber: g.phoneNumber,
                                    caseId: g.caseId,
                                    patientId: g.patientId,
                                    dayLabel: g.currentDayLabel,
                                  })
                                }
                                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                              >
                                <PhoneCall className="w-3.5 h-3.5" />
                                <span>บันทึกโทร</span>
                              </button>
                            </td>
                          </tr>

                          {/* Expandable Sub-Schedules Breakdown */}
                          {isExpanded && (
                            <tr className="bg-slate-50/80 border-b border-slate-200 animate-fadeIn">
                              <td colSpan={6} className="p-3.5">
                                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2 shadow-xs">
                                  <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                                    <span>กำหนดการติดตามรายวันของเคสนี้ (D+1 ถึง D+14):</span>
                                    <span className="text-slate-400 font-normal">
                                      ทั้งหมด {g.subSchedules.length} รายการที่ต้องติดตาม
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
                                    {g.subSchedules.map((sub) => (
                                      <div
                                        key={sub.id}
                                        className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] space-y-1"
                                      >
                                        <div className="flex items-center justify-between font-bold">
                                          <span className="text-slate-900">{sub.dayLabel}</span>
                                          <span
                                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                              sub.scheduleStatus === 'overdue'
                                                ? 'bg-rose-100 text-rose-700'
                                                : 'bg-amber-100 text-amber-800'
                                            }`}
                                          >
                                            {sub.scheduleStatus === 'overdue' ? 'เกินกำหนด' : 'วันนี้'}
                                          </span>
                                        </div>
                                        <div className="text-[10px] text-slate-500">
                                          {sub.scheduledDate}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-16 text-slate-400 space-y-2">
              <CheckCircle2 className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-sm font-semibold">ไม่มีรายงานที่ค้างตรวจในขณะนี้</p>
              <p className="text-xs">เมื่อคนไข้ถ่ายภาพจาก Client Portal รายงานจะเข้าสู่คิวนี้ทันที</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="p-3">คนไข้ & HN</th>
                    <th className="p-3">ระยะ D+</th>
                    <th className="p-3">ภาพถ่ายจริง</th>
                    <th className="p-3">อาการที่รายงาน</th>
                    <th className="p-3">เวลาส่ง</th>
                    <th className="p-3">สถานะ</th>
                    <th className="p-3 text-right">ดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReports.map((r) => (
                    <tr key={r.id} className="hover:bg-blue-50/40">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{r.patientName}</div>
                        <div className="text-[10px] font-mono text-slate-500">HN: {r.hn}</div>
                      </td>

                      <td className="p-3">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-black text-xs">
                          D+{r.postOpDay}
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="flex items-center -space-x-2">
                          {r.photos.map((p) => (
                            <div
                              key={p.id}
                              className="w-8 h-10 rounded-md overflow-hidden border-2 border-white shadow-xs bg-slate-900"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={p.photoUrl}
                                alt={p.angleNameThai}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="font-semibold text-slate-800">
                          ปวด {r.symptomAnswers.painScore}/10 • บวม: {r.symptomAnswers.swellingLevel === 'increasing' ? 'มากขึ้น' : 'ปกติ'}
                        </div>
                        {r.patientNote && (
                          <p className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5">
                            &ldquo;{r.patientNote}&rdquo;
                          </p>
                        )}
                      </td>

                      <td className="p-3 text-slate-600 whitespace-nowrap">
                        {r.submittedAt || r.reportDate}
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <StatusBadge status={r.status} size="sm" />
                      </td>

                      <td className="p-3 text-right">
                        <button
                          onClick={() => setSelectedReport(r)}
                          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>เปิดตรวจ</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* REGISTER NEW CASE MODAL */}
      {showNewCaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <span>ลงทะเบียนเคสผ่าตัดคนไข้ใหม่</span>
              </h3>
              <button
                onClick={() => setShowNewCaseModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createdCaseResult ? (
              /* Success Screen */
              <div className="space-y-4 text-center py-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-xs">
                  <Check className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-base">ลงทะเบียนเคสผ่าตัดสำเร็จ</h4>
                  <p className="text-xs text-slate-600 font-semibold">
                    {createdCaseResult.patientName} (HN: {createdCaseResult.hn})
                  </p>
                </div>

                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-left space-y-2 text-xs">
                  <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    สร้างตารางติดตามอาการ D+1 ถึง D+14 เรียบร้อยแล้ว
                  </span>
                  <div className="text-emerald-800 text-[11px] space-y-1 pt-1.5 border-t border-emerald-200/60">
                    <div>เบอร์โทรศัพท์สำหรับเข้าสู่ระบบ: <strong className="font-mono text-emerald-950">{createdCaseResult.phoneNumber}</strong></div>
                    <div>หัตถการ: <strong>{createdCaseResult.serviceType}</strong></div>
                    <div>แพทย์ผู้ผ่าตัด: <strong>{createdCaseResult.surgeonName}</strong></div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowNewCaseModal(false);
                    resetNewCaseForm();
                  }}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  เสร็จสิ้น (ไปที่หน้าคิวงาน)
                </button>
              </div>
            ) : (
              /* Case Registration Form with Clinical Fields */
              <form onSubmit={handleCreateCaseSubmit} className="space-y-3 text-xs max-h-[75vh] overflow-y-auto pr-1">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    ชื่อ-นามสกุล คนไข้: *
                  </label>
                  <input
                    type="text"
                    required
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      เลข HN: *
                    </label>
                    <input
                      type="text"
                      required
                      value={hn}
                      onChange={(e) => setHn(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      เบอร์โทรศัพท์มือถือ (10 หลัก): *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      เพศ:
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as 'female' | 'male' | 'other')}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:border-blue-500"
                    >
                      <option value="female">หญิง</option>
                      <option value="male">ชาย</option>
                      <option value="other">อื่นๆ</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      อายุ (ปี):
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={120}
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    โรคประจำตัว / ยาที่แพ้ / ยาต้านการแข็งตัวของเลือด:
                  </label>
                  <input
                    type="text"
                    value={medicalConditions}
                    onChange={(e) => setMedicalConditions(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    คำสั่งแพทย์เฉพาะเคส / ข้อควรระวังพิเศษ:
                  </label>
                  <input
                    type="text"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    หัตถการผ่าตัดดึงหน้า:
                  </label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="SMAS Full Face-Lift & Neck Lift">
                      SMAS Full Face-Lift & Neck Lift
                    </option>
                    <option value="Deep Plane Face-Lift">Deep Plane Face-Lift</option>
                    <option value="Mini Face-Lift + Submentoplasty">
                      Mini Face-Lift + Submentoplasty
                    </option>
                    <option value="Full Face-Lift & Temporal Lift">
                      Full Face-Lift & Temporal Lift
                    </option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      วันที่ผ่าตัด:
                    </label>
                    <input
                      type="date"
                      value={surgeryDate}
                      onChange={(e) => setSurgeryDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      ศัลยแพทย์ผู้ผ่าตัด:
                    </label>
                    <select
                      value={surgeonName}
                      onChange={(e) => setSurgeonName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:border-blue-500"
                    >
                      <option value="นพ.สมชาย เกียรติเวชช์">
                        นพ.สมชาย เกียรติเวชช์
                      </option>
                      <option value="พญ.นภา วงศ์สุริยา">
                        พญ.นภา วงศ์สุริยา
                      </option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewCaseModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    ยกเลิก
                  </button>

                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md cursor-pointer transition-colors"
                  >
                    บันทึกและเปิดเคสผ่าตัด
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedReport && (
        <CaseReviewModal
          report={selectedReport}
          currentUserRole="doctor"
          onClose={() => setSelectedReport(null)}
          onPerformAction={(act) => performReviewAction(selectedReport.id, act)}
        />
      )}

      {/* Database Setup Modal */}
      <DatabaseConfigModal
        isOpen={showDbModal}
        onClose={() => setShowDbModal(false)}
      />

      {/* Contact Log Tracking Modal */}
      {selectedContactCase && (
        <ContactLogModal
          isOpen={!!selectedContactCase}
          onClose={() => setSelectedContactCase(null)}
          patientName={selectedContactCase.patientName}
          hn={selectedContactCase.hn}
          phoneNumber={selectedContactCase.phoneNumber}
          caseId={selectedContactCase.caseId}
          patientId={selectedContactCase.patientId}
          dayLabel={selectedContactCase.dayLabel}
          onLogSaved={refreshOverdueSchedules}
        />
      )}
    </div>
  );
}
