'use client';

import React from 'react';
import { useAppStore } from '@/lib/store';
import {
  Camera,
  Users2,
  RotateCcw,
  User,
} from 'lucide-react';

export function DemoBar() {
  const {
    portal,
    setPortal,
    activeClientCase,
    cases,
    resetAllData,
  } = useAppStore();

  return (
    <header className="bg-slate-950 text-slate-100 border-b border-slate-800/80 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2.5">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-[11px] shadow-sm">
            UD
          </div>
          <span className="font-bold text-xs tracking-tight text-white">
            UD CLINIC
          </span>
          <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">
            Post-Op Face-Lift Care
          </span>
        </div>

        {/* 2 Main Portals Switcher */}
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 shadow-inner">
          <button
            onClick={() => setPortal('client')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              portal === 'client'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>คนไข้ (Client)</span>
          </button>

          <button
            onClick={() => setPortal('staff')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              portal === 'staff'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Users2 className="w-3.5 h-3.5" />
            <span>เจ้าหน้าที่ & แพทย์ (Staff)</span>
          </button>
        </div>

        {/* Active Client Status or Cases Indicator */}
        <div className="flex items-center gap-2 text-xs">
          {activeClientCase ? (
            <div className="flex items-center gap-1.5 bg-blue-950/60 text-blue-300 border border-blue-800/60 px-2.5 py-1 rounded-lg">
              <User className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-semibold">{activeClientCase.patientName}</span>
            </div>
          ) : (
            <span className="text-[11px] text-slate-500">
              เคสในระบบ: {cases.length} เคส
            </span>
          )}

          <button
            onClick={() => {
              if (confirm('ต้องการล้างข้อมูลและเริ่มต้นระบบใหม่หรือไม่?')) {
                resetAllData();
              }
            }}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
            title="ล้างข้อมูลระบบใหม่ทั้งหมด"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
