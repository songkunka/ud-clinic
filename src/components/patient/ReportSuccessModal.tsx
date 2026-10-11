'use client';

import React from 'react';
import { DailyReport } from '@/lib/types';
import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  ArrowRight,
  Phone,
  FileText,
} from 'lucide-react';

interface ReportSuccessModalProps {
  report: DailyReport;
  onClose: () => void;
}

export function ReportSuccessModal({
  report,
  onClose,
}: ReportSuccessModalProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 text-center space-y-5 animate-fadeIn">
      {/* Icon */}
      <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
        <CheckCircle2 className="w-9 h-9" />
      </div>

      <div className="space-y-1">
        <h3 className="text-lg font-bold text-slate-900">
          ส่งรายงานประจำวันสำเร็จ
        </h3>
        <p className="text-xs text-slate-500">
          ข้อมูลและภาพถ่ายถูกเข้ารหัสและส่งเข้าสู่ระบบ UD Clinic แล้ว
        </p>
      </div>

      {/* Prominent Status Banner as required by PRD Section 3 & 10 */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-blue-900 space-y-1 text-left">
        <div className="flex items-center gap-2 font-bold text-xs text-blue-800">
          <Clock className="w-4 h-4 text-blue-600 shrink-0" />
          <span>ส่งรายงานแล้ว — รอทีมดูแลตรวจสอบ</span>
        </div>
        <p className="text-[11px] text-blue-700 leading-relaxed">
          รายงานของท่านอยู่ในคิวคัดกรอง เจ้าหน้าที่หรือแพทย์จะตรวจสอบภาพถ่ายและตอบกลับภายในเวลาทำการตามลำดับ
        </p>
      </div>

      {/* Report Receipt Metadata */}
      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-1.5 text-left">
        <div className="flex justify-between">
          <span className="text-slate-500">เลขอ้างอิงรายงาน:</span>
          <span className="font-mono font-bold text-slate-800">
            {report.id.toUpperCase()}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">วันที่ส่งรายงาน:</span>
          <span className="font-medium text-slate-700">{report.submittedAt}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">ระยะเวลาหลังผ่าตัด:</span>
          <span className="font-bold text-blue-700">D+{report.postOpDay}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">จำนวนภาพถ่าย:</span>
          <span className="font-medium text-slate-700">
            {report.photos.length} มุมภาพ
          </span>
        </div>
      </div>

      {/* Safety Notice Reminder */}
      <div className="text-[11px] text-slate-500 bg-amber-50/60 p-2.5 rounded-lg border border-amber-200 text-left">
        <span className="font-semibold text-amber-800">กรณีมีเหตุเร่งด่วน:</span>{' '}
        หากมีเลือดออกมากหรือปวดผิดปกติ กรุณาโทรติดต่อคลินิกทันทีที่ <strong>081-456-7890</strong>
      </div>

      {/* Action Button */}
      <button
        onClick={onClose}
        className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
      >
        <span>กลับสู่หน้าหลัก</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
