'use client';

import React, { useState } from 'react';
import { ReportPhoto, SymptomAnswers } from '@/lib/types';
import {
  ChevronLeft,
  CheckCircle,
  AlertTriangle,
  Camera,
  FileText,
  ShieldCheck,
  Send,
  Edit2,
  Clock,
} from 'lucide-react';

interface ReportReviewSubmitProps {
  photos: ReportPhoto[];
  answers: SymptomAnswers;
  postOpDay: number;
  onEditPhotos: () => void;
  onEditSymptoms: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function ReportReviewSubmit({
  photos,
  answers,
  postOpDay,
  onEditPhotos,
  onEditSymptoms,
  onSubmit,
  isSubmitting,
}: ReportReviewSubmitProps) {
  const [confirmedTruth, setConfirmedTruth] = useState(false);

  const getBleedingLabel = (val: string) => {
    if (val === 'none') return 'ไม่มีเลือด/น้ำเหลืองซึม (แผลแห้ง)';
    if (val === 'mild_serous') return 'มีน้ำเหลืองหรือเลือดจางๆ ซึมเล็กน้อย';
    return 'มีเลือดสดซึมต่อเนื่อง ชุ่มผ้าก๊อซ (ต้องการคำแนะนำเร่งด่วน)';
  };

  const getSwellingLabel = (val: string) => {
    if (val === 'decreasing') return 'ยุบลงกว่าเดิม';
    if (val === 'same') return 'ใกล้เคียงเดิม';
    return 'บวมมากขึ้นกว่าเดิม';
  };

  const getFeverLabel = (val: string) => {
    if (val === 'none') return 'ไม่มีไข้';
    if (val === 'mild') return 'รู้สึกรุมๆ (< 37.8°C)';
    return 'มีไข้สูง (≥ 37.8°C)';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col space-y-4 p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
            ขั้นตอนสุดท้าย: ตรวจทานข้อมูล
          </span>
          <h3 className="font-bold text-slate-900 text-sm mt-1">
            รายงานประจำวันหลังผ่าตัด (D+{postOpDay})
          </h3>
        </div>
        <div className="text-right text-xs text-slate-500">
          ครบทั้ง {photos.length} มุมภาพ
        </div>
      </div>

      {/* Section 1: Photos Review */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-blue-600" />
            <span>ภาพถ่ายใบหน้า ({photos.length} มุม)</span>
          </h4>
          <button
            type="button"
            onClick={onEditPhotos}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>แก้ไขภาพ</span>
          </button>
        </div>

        <div className="grid grid-cols-5 gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-200">
          {photos.map((p, idx) => (
            <div key={p.id || idx} className="space-y-1 text-center">
              <div className="relative aspect-3/4 rounded-lg overflow-hidden border border-slate-300 bg-white shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.photoUrl}
                  alt={p.angleNameThai}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-[10px] text-slate-700 font-medium truncate">
                {p.angleNameThai}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Symptoms Review */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>สรุปคำตอบแบบสอบถามอาการ</span>
          </h4>
          <button
            type="button"
            onClick={onEditSymptoms}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>แก้ไขคำตอบ</span>
          </button>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-slate-200/60">
            <span className="text-slate-500">ระดับความปวด:</span>
            <span className="font-bold text-slate-800">
              {answers.painScore}/10{' '}
              {answers.painScore >= 7
                ? '(ปวดมาก)'
                : answers.painScore >= 4
                ? '(ปวดปานกลาง)'
                : '(ปวดเล็กน้อย)'}
            </span>
          </div>

          <div className="flex justify-between py-1 border-b border-slate-200/60">
            <span className="text-slate-500">อาการบวมเทียบเมื่อวาน:</span>
            <span className="font-semibold text-slate-800">
              {getSwellingLabel(answers.swellingLevel)}
            </span>
          </div>

          <div className="flex justify-between py-1 border-b border-slate-200/60">
            <span className="text-slate-500">การซึมของแผล:</span>
            <span
              className={`font-semibold ${
                answers.bleedingOrDischarge === 'heavy_fresh'
                  ? 'text-red-600'
                  : 'text-slate-800'
              }`}
            >
              {getBleedingLabel(answers.bleedingOrDischarge)}
            </span>
          </div>

          <div className="flex justify-between py-1 border-b border-slate-200/60">
            <span className="text-slate-500">อาการไข้:</span>
            <span className="font-semibold text-slate-800">
              {getFeverLabel(answers.feverStatus)}
            </span>
          </div>

          {answers.patientNote && (
            <div className="pt-1">
              <span className="text-slate-500 block mb-0.5">ข้อความเพิ่มเติม:</span>
              <p className="bg-white p-2 rounded-lg border border-slate-200 text-slate-700 italic">
                &ldquo;{answers.patientNote}&rdquo;
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Checkbox */}
      <div className="pt-2">
        <label className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/50 border border-blue-200/80 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmedTruth}
            onChange={(e) => setConfirmedTruth(e.target.checked)}
            className="mt-0.5 rounded-sm text-blue-600 focus:ring-blue-500 w-4 h-4 shrink-0"
          />
          <span className="text-xs text-slate-700 leading-snug">
            ข้าพเจ้ายืนยันว่าภาพถ่ายใบหน้าและข้อมูลอาการทั้งหมดเป็นข้อมูลล่าสุดที่ถูกต้องตามความเป็นจริง และรับทราบว่ารายงานนี้จะถูกส่งให้ทีมพยาบาลและแพทย์คัดกรองตามรอบเวลา
          </span>
        </label>
      </div>

      {/* Actions */}
      <div className="pt-3 border-t border-slate-100 space-y-2">
        <button
          type="button"
          onClick={onSubmit}
          disabled={!confirmedTruth || isSubmitting}
          className={`w-full py-3.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
            confirmedTruth && !isSubmitting
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-[0.99]'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? (
            <>
              <Clock className="w-4 h-4 animate-spin" />
              <span>กำลังส่งรายงานเข้าสู่ระบบ...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>ยืนยันและส่งรายงานประจำวัน (Submit)</span>
            </>
          )}
        </button>

        <p className="text-[10px] text-center text-slate-400">
          เมื่อกดส่งแล้ว ข้อมูลจะเข้าสู่คิวตรวจสอบของทีมพยาบาล UD Clinic โดยตรง
        </p>
      </div>
    </div>
  );
}
