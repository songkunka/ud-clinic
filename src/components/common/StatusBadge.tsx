'use client';

import React from 'react';
import { ReportStatus } from '@/lib/types';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  UserCheck,
  PhoneCall,
  FileEdit,
  XCircle,
} from 'lucide-react';

interface StatusBadgeProps {
  status: ReportStatus;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-medium',
  }[size];

  switch (status) {
    case 'pending_review':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-blue-50 text-blue-700 border border-blue-200 ${sizeClasses}`}
        >
          <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>รอทีมดูแลตรวจสอบ</span>
        </span>
      );
    case 'in_review':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 ${sizeClasses}`}
        >
          <Clock className="w-3.5 h-3.5 text-indigo-600 animate-spin shrink-0" />
          <span>กำลังตรวจสอบ</span>
        </span>
      );
    case 'reviewed':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>ตรวจสอบแล้ว</span>
        </span>
      );
    case 'more_info_requested':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-300 ${sizeClasses}`}
        >
          <HelpCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>ขอภาพ/ข้อมูลเพิ่มเติม</span>
        </span>
      );
    case 'referred_to_doctor':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-purple-50 text-purple-700 border border-purple-200 ${sizeClasses}`}
        >
          <UserCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
          <span>ส่งต่อแพทย์ตรวจสอบ</span>
        </span>
      );
    case 'urgent_contact_required':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-red-50 text-red-700 border border-red-300 font-semibold ${sizeClasses}`}
        >
          <PhoneCall className="w-3.5 h-3.5 text-red-600 animate-pulse shrink-0" />
          <span>ต้องติดต่อเร่งด่วน</span>
        </span>
      );
    case 'follow_up_required':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-sky-50 text-sky-700 border border-sky-200 ${sizeClasses}`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-sky-600 shrink-0" />
          <span>รอติดตามผลต่อเนื่อง</span>
        </span>
      );
    case 'draft':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}
        >
          <FileEdit className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>ยังไม่เริ่มรายงาน</span>
        </span>
      );
    case 'closed':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-gray-100 text-gray-700 border border-gray-300 ${sizeClasses}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-gray-500 shrink-0" />
          <span>ปิดรอบติดตาม</span>
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center rounded-full bg-gray-100 text-gray-700 ${sizeClasses}`}
        >
          <XCircle className="w-3.5 h-3.5 text-gray-500 shrink-0" />
          <span>{status}</span>
        </span>
      );
  }
}
