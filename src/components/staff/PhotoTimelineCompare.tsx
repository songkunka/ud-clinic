'use client';

import React, { useState } from 'react';
import { DailyReport, PhotoAngleKey } from '@/lib/types';
import { getSamplePhotoUrl } from '@/lib/svg-silhouettes';
import {
  Columns,
  Calendar,
  Layers,
  ArrowRight,
  ZoomIn,
  CheckCircle2,
} from 'lucide-react';

interface PhotoTimelineCompareProps {
  reports: DailyReport[];
  patientName: string;
}

export function PhotoTimelineCompare({
  reports,
  patientName,
}: PhotoTimelineCompareProps) {
  // Available angles
  const angles: { key: PhotoAngleKey; label: string }[] = [
    { key: 'front', label: 'หน้าตรง' },
    { key: 'left_oblique', label: 'เฉียงซ้าย 45°' },
    { key: 'right_oblique', label: 'เฉียงขวา 45°' },
    { key: 'left_side', label: 'ด้านข้างซ้าย 90°' },
    { key: 'right_side', label: 'ด้านข้างขวา 90°' },
  ];

  const [selectedAngle, setSelectedAngle] = useState<PhotoAngleKey>('front');
  const [dayA, setDayA] = useState<number>(1);
  const [dayB, setDayB] = useState<number>(7);

  const getPhotoForDay = (day: number, angleKey: PhotoAngleKey): string | null => {
    // Check if an existing report matches this day
    const matchingReport = reports.find((r) => r.postOpDay === day);
    if (matchingReport) {
      const matchPhoto = matchingReport.photos.find(
        (p) => p.angleKey === angleKey
      );
      if (matchPhoto) return matchPhoto.photoUrl;
    }
    return null;
  };

  const photoA = getPhotoForDay(dayA, selectedAngle);
  const photoB = getPhotoForDay(dayB, selectedAngle);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
      {/* Title & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
            <Columns className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              เปรียบเทียบภาพฟื้นตัวย้อนหลัง (Side-by-Side Photo Compare)
            </h3>
            <p className="text-xs text-slate-500">
              เคส: {patientName} • เปรียบเทียบมุมภาพเดียวกันระหว่างระยะเวลา D+
            </p>
          </div>
        </div>

        {/* Angle Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {angles.map((ang) => (
            <button
              key={ang.key}
              onClick={() => setSelectedAngle(ang.key)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedAngle === ang.key
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {ang.label}
            </button>
          ))}
        </div>
      </div>

      {/* Day Selectors */}
      <div className="flex items-center justify-between gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700">ภาพเปรียบเทียบ A:</span>
          <select
            value={dayA}
            onChange={(e) => setDayA(Number(e.target.value))}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-blue-700 cursor-pointer"
          >
            {[1, 2, 3, 5, 7, 14, 30].map((d) => (
              <option key={d} value={d}>
                ระยะ D+{d} ({d === 1 ? 'วันแรก' : `${d} วันหลังผ่าตัด`})
              </option>
            ))}
          </select>
        </div>

        <div className="text-slate-400 font-bold flex items-center gap-1">
          <span>เทียบกับ</span>
          <ArrowRight className="w-4 h-4" />
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700">ภาพเปรียบเทียบ B:</span>
          <select
            value={dayB}
            onChange={(e) => setDayB(Number(e.target.value))}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-emerald-700 cursor-pointer"
          >
            {[1, 2, 3, 5, 7, 14, 30].map((d) => (
              <option key={d} value={d}>
                ระยะ D+{d} ({d === 7 ? 'ระยะตัดไหม' : `${d} วันหลังผ่าตัด`})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Side-by-Side Images */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Day A */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200">
              ระยะเริ่มต้น: D+{dayA}
            </span>
            <span className="text-slate-500 font-medium">
              มุม{angles.find((a) => a.key === selectedAngle)?.label}
            </span>
          </div>

          <div className="aspect-3/4 bg-slate-900 rounded-xl overflow-hidden border border-slate-200 shadow-md relative flex items-center justify-center">
            {photoA ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoA}
                  alt={`D+${dayA} ${selectedAngle}`}
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-md font-mono">
                  D+{dayA}
                </div>
              </>
            ) : (
              <div className="text-center p-6 text-slate-400 space-y-1">
                <Calendar className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs">ยังไม่มีภาพถ่ายจริงสำหรับ D+{dayA}</p>
              </div>
            )}
          </div>
        </div>

        {/* Day B */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200">
              ระยะติดตาม: D+{dayB}
            </span>
            <span className="text-slate-500 font-medium">
              มุม{angles.find((a) => a.key === selectedAngle)?.label}
            </span>
          </div>

          <div className="aspect-3/4 bg-slate-900 rounded-xl overflow-hidden border border-slate-200 shadow-md relative flex items-center justify-center">
            {photoB ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoB}
                  alt={`D+${dayB} ${selectedAngle}`}
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-md font-mono">
                  D+{dayB}
                </div>
              </>
            ) : (
              <div className="text-center p-6 text-slate-400 space-y-1">
                <Calendar className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs">ยังไม่มีภาพถ่ายจริงสำหรับ D+{dayB}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progression Comparison Insights */}
      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1 text-slate-700">
        <div className="font-bold text-slate-900 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>การประเมินทางคลินิก (Clinical Comparison Checklist):</span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-600">
          • อาการบวม (Edema): สังเกตการยุบตัวของแก้มและขอบกรามจาก D+{dayA} ถึง D+{dayB}<br />
          • รอยฟกช้ำ (Ecchymosis): สีของรอยช้ำเปลี่ยนจากแดง/ม่วงเป็นเหลืองจาง<br />
          • รอยเย็บหน้าและหลังใบหู (Incision Line): ตรวจสอบว่าแผลแห้ง สมานตัวเรียบร้อย และไม่มีรอยแยกก่อนกำหนดตัดไหม
        </p>
      </div>
    </div>
  );
}
