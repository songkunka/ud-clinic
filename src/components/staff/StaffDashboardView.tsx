'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { DailyReport, SurgeryCase } from '@/lib/types';
import { StatusBadge } from '@/components/common/StatusBadge';
import { CaseReviewModal } from './CaseReviewModal';
import { PhotoTimelineCompare } from './PhotoTimelineCompare';
import {
  Clock,
  UserPlus,
  PhoneCall,
  CheckCircle2,
  Search,
  Columns,
  List,
  AlertTriangle,
  Eye,
  Copy,
  Check,
  X,
  Calendar,
  User,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

export function StaffDashboardView() {
  const {
    reports,
    cases,
    createNewCase,
    performReviewAction,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<
    'all' | 'pending' | 'referred' | 'more_info' | 'urgent' | 'reviewed'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);
  const [viewMode, setViewMode] = useState<'queue' | 'cases' | 'compare'>('queue');

  // Register New Case Modal State
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [hn, setHn] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [serviceType, setServiceType] = useState('SMAS Full Face-Lift & Neck Lift');
  const [surgeonName, setSurgeonName] = useState('นพ.สมชาย เกียรติเวชช์');
  const [surgeryDate, setSurgeryDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [createdCaseResult, setCreatedCaseResult] = useState<SurgeryCase | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

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

  const handleCreateCaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !hn.trim() || !phoneNumber.trim()) {
      alert('กรุณากรอกชื่อคนไข้, เลข HN และเบอร์โทรศัพท์ให้ครบถ้วน');
      return;
    }

    const created = createNewCase({
      patientName,
      hn,
      phoneNumber,
      serviceType,
      surgeonName,
      surgeryDate,
    });

    setCreatedCaseResult(created);
  };

  const copyMagicLink = (token: string) => {
    const url = `${window.location.origin}/?token=${token}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-md border border-blue-200">
              Staff & Doctor Clinical Portal
            </span>
            <span className="text-xs text-slate-500">UD Clinic</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            ศูนย์ติดตามและคัดกรองเคสหลังผ่าตัดดึงหน้า
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Register New Case Button */}
          <button
            onClick={() => {
              setCreatedCaseResult(null);
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
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div
          onClick={() => setActiveTab('pending')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-blue-700 font-semibold mb-1">
            <span>รอตรวจวันนี้</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-slate-900">{countPending}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">คิวรอแพทย์/พยาบาล</div>
        </div>

        <div
          onClick={() => setActiveTab('urgent')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'urgent'
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
          onClick={() => setActiveTab('referred')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'referred'
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
          onClick={() => setActiveTab('more_info')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'more_info'
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
          onClick={() => setActiveTab('reviewed')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'reviewed'
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
                    <th className="p-3 text-right">Magic Link ส่งให้คนไข้</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cases.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{c.patientName}</div>
                        <div className="text-[10px] font-mono text-slate-500">HN: {c.hn}</div>
                      </td>
                      <td className="p-3 font-mono font-semibold text-slate-800">
                        {c.phoneNumber}
                      </td>
                      <td className="p-3 text-slate-700">{c.serviceType}</td>
                      <td className="p-3 text-slate-600">{c.surgeryDate}</td>
                      <td className="p-3 text-slate-600">{c.surgeonName}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => copyMagicLink(c.token)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-semibold text-xs border border-slate-200 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>คัดลอกลิงก์</span>
                        </button>
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
                      ? 'bg-blue-600 text-white shadow-xs'
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
                placeholder="ค้นหาชื่อคนไข้ หรือ HN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500 bg-slate-50 text-slate-800"
              />
            </div>
          </div>

          {filteredReports.length === 0 ? (
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
              /* Success Screen showing Magic Link */
              <div className="space-y-4 text-center py-2">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                  <Check className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-base">ลงทะเบียนเคสสำเร็จ!</h4>
                  <p className="text-xs text-slate-500">
                    {createdCaseResult.patientName} (HN: {createdCaseResult.hn})
                  </p>
                </div>

                <div className="p-3.5 bg-blue-50 rounded-2xl border border-blue-200 text-left space-y-2 text-xs">
                  <span className="font-bold text-blue-900 block">
                    ลิงก์เฉพาะบุคคลสำหรับส่งให้คนไข้ทาง LINE (Magic Link):
                  </span>
                  <div className="p-2 bg-white rounded-xl border border-blue-200 font-mono text-[11px] text-blue-700 break-all select-all">
                    {typeof window !== 'undefined'
                      ? `${window.location.origin}/?token=${createdCaseResult.token}`
                      : `/?token=${createdCaseResult.token}`}
                  </div>
                  <p className="text-[11px] text-blue-800">
                    คนไข้สามารถแตะลิงก์นี้จาก LINE เพื่อเปิดกล้องถ่ายรูปได้ทันทีโดยไม่ต้องกรอกรหัสผ่าน หรือเข้าผ่านเบอร์โทรศัพท์: <strong>{createdCaseResult.phoneNumber}</strong>
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => copyMagicLink(createdCaseResult.token)}
                    className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'คัดลอกลิงก์แล้ว!' : 'คัดลอกลิงก์ส่งทาง LINE'}</span>
                  </button>

                  <button
                    onClick={() => setShowNewCaseModal(false)}
                    className="px-4 py-3 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    ปิด
                  </button>
                </div>
              </div>
            ) : (
              /* Case Registration Form */
              <form onSubmit={handleCreateCaseSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    ชื่อ-นามสกุล คนไข้: *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น คุณวรรณา สุขสมบูรณ์"
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
                      placeholder="เช่น 69-00124"
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
                      placeholder="เช่น 0814567890"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
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
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md cursor-pointer"
                  >
                    สร้างเคสและออก Magic Link
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
    </div>
  );
}
