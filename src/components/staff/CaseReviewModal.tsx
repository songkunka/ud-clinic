'use client';

import React, { useState } from 'react';
import { DailyReport, ReviewAction, UserRole } from '@/lib/types';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  X,
  User,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Send,
  MessageSquare,
  ShieldAlert,
  HelpCircle,
  Stethoscope,
  ChevronRight,
  ZoomIn,
} from 'lucide-react';

interface CaseReviewModalProps {
  report: DailyReport;
  currentUserRole: UserRole;
  onClose: () => void;
  onPerformAction: (actionData: {
    actionType: ReviewAction['actionType'];
    internalNote?: string;
    customerMessage?: string;
    assignedTo?: string;
    followUpDueAt?: string;
  }) => void;
}

export function CaseReviewModal({
  report,
  currentUserRole,
  onClose,
  onPerformAction,
}: CaseReviewModalProps) {
  const [selectedPhoto, setSelectedPhoto] = useState(report.photos[0] || null);
  const [actionType, setActionType] = useState<ReviewAction['actionType']>(
    report.status === 'more_info_requested'
      ? 'request_more_info'
      : report.status === 'referred_to_doctor'
      ? 'refer'
      : 'reviewed'
  );
  const [internalNote, setInternalNote] = useState('');
  const [customerMessage, setCustomerMessage] = useState(
    report.latestCustomerMessage || ''
  );
  const [assignedTo, setAssignedTo] = useState(
    report.assignedDoctorName || 'นพ.สมชาย เกียรติเวชช์'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPerformAction({
      actionType,
      internalNote,
      customerMessage,
      assignedTo,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto animate-fadeIn">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">
                  {report.patientName}
                </h3>
                <span className="text-xs font-mono text-blue-300">
                  HN: {report.hn}
                </span>
                <span className="text-xs bg-blue-700/80 px-2 py-0.5 rounded-full font-bold">
                  D+{report.postOpDay}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                ส่งเมื่อ: {report.submittedAt || report.reportDate} | ศัลยแพทย์:{' '}
                {report.assignedDoctorName || 'นพ.สมชาย'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={report.status} />
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body (2 columns: Photos inspection left, Symptoms & Action right) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-y-auto divide-y md:divide-y-0 md:divide-x divide-slate-200">
          {/* Left Column: Photos Inspection */}
          <div className="md:col-span-7 p-4 sm:p-5 flex flex-col space-y-4 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <ZoomIn className="w-4 h-4 text-blue-600" />
                <span>ภาพถ่ายใบหน้า 5 มุม (ตรวจสอบรอยแผลและการบวม)</span>
              </h4>
              <span className="text-[11px] text-slate-500 font-mono">
                {report.photos.length} files
              </span>
            </div>

            {/* Main Preview with high-res simulation */}
            {selectedPhoto && (
              <div className="relative aspect-4/3 w-full bg-slate-900 rounded-xl overflow-hidden shadow-inner flex items-center justify-center border border-slate-300">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedPhoto.photoUrl}
                  alt={selectedPhoto.angleNameThai}
                  className="max-h-full max-w-full object-contain"
                />
                <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-xs text-white text-xs px-3 py-1 rounded-md font-semibold flex items-center gap-2">
                  <span>{selectedPhoto.angleNameThai}</span>
                  <span className="text-[10px] text-slate-300">
                    ({selectedPhoto.uploadedAt})
                  </span>
                </div>
              </div>
            )}

            {/* Thumbnail selector */}
            <div className="grid grid-cols-5 gap-2">
              {report.photos.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPhoto(p)}
                  className={`aspect-3/4 rounded-lg overflow-hidden border-2 text-left transition-all cursor-pointer ${
                    selectedPhoto?.id === p.id
                      ? 'border-blue-600 ring-2 ring-blue-500/30 shadow-md'
                      : 'border-slate-200 opacity-70 hover:opacity-100 hover:border-slate-400'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.photoUrl}
                    alt={p.angleNameThai}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>

            {/* Urgent Tag if present */}
            {report.isUrgent && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">เคสนี้มีสัญญาณแจ้งเตือนเร่งด่วน:</span>{' '}
                  คนไข้รายงานอาการปวดสูง มีเลือดสดซึม หรือมีความกังวลสูง
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Symptoms & Review Action Form */}
          <div className="md:col-span-5 p-4 sm:p-5 flex flex-col space-y-4 overflow-y-auto">
            {/* Symptoms Data */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900">
                ข้อมูลอาการที่คนไข้รายงาน
              </h4>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">ระดับความปวด:</span>
                  <span
                    className={`font-bold ${
                      report.symptomAnswers.painScore >= 7
                        ? 'text-red-600'
                        : report.symptomAnswers.painScore >= 4
                        ? 'text-amber-600'
                        : 'text-slate-800'
                    }`}
                  >
                    {report.symptomAnswers.painScore}/10
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">อาการบวม:</span>
                  <span className="font-semibold text-slate-800">
                    {report.symptomAnswers.swellingLevel === 'decreasing'
                      ? 'ลดลง'
                      : report.symptomAnswers.swellingLevel === 'same'
                      ? 'ใกล้เคียงเดิม'
                      : 'บวมมากขึ้น (ต้องสังเกต)'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">การซึมของแผล:</span>
                  <span
                    className={`font-semibold ${
                      report.symptomAnswers.bleedingOrDischarge === 'heavy_fresh'
                        ? 'text-red-600'
                        : 'text-slate-800'
                    }`}
                  >
                    {report.symptomAnswers.bleedingOrDischarge === 'none'
                      ? 'ไม่มี'
                      : report.symptomAnswers.bleedingOrDischarge === 'mild_serous'
                      ? 'ซึมเล็กน้อย'
                      : 'ซึมมากต่อเนื่อง (เฝ้าระวัง)'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">ไข้:</span>
                  <span className="font-semibold text-slate-800">
                    {report.symptomAnswers.feverStatus === 'none'
                      ? 'ไม่มีไข้'
                      : report.symptomAnswers.feverStatus === 'mild'
                      ? 'รุมๆ'
                      : 'มีไข้สูง'}
                  </span>
                </div>
                {report.patientNote && (
                  <div className="pt-1">
                    <span className="text-slate-500 block mb-0.5 font-medium">
                      ข้อความจากคนไข้:
                    </span>
                    <p className="bg-white p-2 rounded-lg border border-slate-200 text-slate-800 italic">
                      &ldquo;{report.patientNote}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5 pt-2 border-t border-slate-200">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-900 block">
                  เลือกการดำเนินการ (Action)
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'reviewed', label: 'บันทึกตรวจแล้ว', desc: 'อาการปกติ' },
                    { id: 'request_more_info', label: 'ขอข้อมูล/ภาพเพิ่ม', desc: 'มุมไม่ชัด/ข้อมูลไม่พอ' },
                    { id: 'refer', label: 'ส่งต่อแพทย์', desc: 'ให้แพทย์ประเมิน' },
                    { id: 'urgent_contact', label: 'ติดต่อเร่งด่วน', desc: 'โทรประสานคนไข้' },
                  ].map((act) => (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() =>
                        setActionType(act.id as ReviewAction['actionType'])
                      }
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        actionType === act.id
                          ? act.id === 'urgent_contact'
                            ? 'border-red-600 bg-red-50 text-red-900 ring-1 ring-red-500 font-bold'
                            : act.id === 'refer'
                            ? 'border-purple-600 bg-purple-50 text-purple-900 ring-1 ring-purple-500 font-bold'
                            : act.id === 'request_more_info'
                            ? 'border-amber-600 bg-amber-50 text-amber-900 ring-1 ring-amber-500 font-bold'
                            : 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-500 font-bold'
                          : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold">{act.label}</div>
                      <div className="text-[10px] text-slate-500">{act.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Refer to doctor selection if refer chosen */}
              {actionType === 'refer' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    ส่งต่อแพทย์ท่านใด:
                  </label>
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white text-slate-800"
                  >
                    <option value="นพ.สมชาย เกียรติเวชช์">
                      นพ.สมชาย เกียรติเวชช์ (Chief Surgeon)
                    </option>
                    <option value="พญ.นภา วงศ์สุริยา">
                      พญ.นภา วงศ์สุริยา (Facial Plastic Specialist)
                    </option>
                  </select>
                </div>
              )}

              {/* STRICT SEPARATION 1: Internal Clinical Note (Patient NEVER sees this!) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-600" />
                    <span>Internal Note (บันทึกภายในคลินิก)</span>
                  </label>
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-sm font-semibold">
                    คนไข้ไม่เห็น
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  placeholder="บันทึกข้อสังเกตทางการแพทย์ แผนการรักษา หรือประเด็นที่ปรึกษาแพทย์..."
                  className="w-full text-xs p-2.5 rounded-xl border border-amber-200 bg-amber-50/20 text-slate-900 focus:outline-hidden focus:border-amber-400"
                />
              </div>

              {/* STRICT SEPARATION 2: Customer Message (Shown to patient in app) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3 text-blue-600" />
                    <span>ข้อความถึงคนไข้ (Customer Message)</span>
                  </label>
                  <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-sm font-semibold">
                    คนไข้จะเห็นข้อความนี้
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={customerMessage}
                  onChange={(e) => setCustomerMessage(e.target.value)}
                  placeholder="คำแนะนำที่อนุมัติให้แจ้งคนไข้ เช่น การประคบเย็น แผลแห้งดี หรือภาพที่ขอเพิ่มเติม..."
                  className="w-full text-xs p-2.5 rounded-xl border border-blue-200 bg-blue-50/20 text-slate-900 focus:outline-hidden focus:border-blue-400"
                />
              </div>

              {/* Submit Review */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  ปิด
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>บันทึกและอัปเดตสถานะ (Save Action)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
