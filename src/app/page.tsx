'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { DemoBar } from '@/components/common/DemoBar';
import { ClientCameraPortal } from '@/components/patient/ClientCameraPortal';
import { StaffDashboardView } from '@/components/staff/StaffDashboardView';
import {
  Smartphone,
  Maximize2,
  Minimize2,
  Shield,
  MessageCircle,
} from 'lucide-react';

export default function Home() {
  const { portal, isLoaded } = useAppStore();
  const [isMobileFrame, setIsMobileFrame] = useState(true);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400">กำลังโหลดระบบ UD Clinic...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Demo Bar: 2 Portals (Client / Staff) */}
      <DemoBar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {portal === 'client' ? (
          /* Client Portal: Camera is the direct centerpiece! */
          <div className="flex-1 flex flex-col items-center justify-center p-0 sm:py-4 sm:px-2">
            {/* Minimal Frame View Toggle */}
            <div className="w-full max-w-[430px] hidden sm:flex items-center justify-between mb-2 text-xs text-slate-400 px-3">
              <span className="text-[11px] text-slate-400">
                LINE OA Mobile View
              </span>
              <button
                onClick={() => setIsMobileFrame(!isMobileFrame)}
                className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                title="สลับมุมมองหน้าจอเต็ม / กรอบมือถือ"
              >
                {isMobileFrame ? (
                  <>
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>เต็มจอ</span>
                  </>
                ) : (
                  <>
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span>กรอบมือถือ</span>
                  </>
                )}
              </button>
            </div>

            {/* Mobile Device Container or Full Screen */}
            <div
              className={`w-full transition-all duration-300 ${
                isMobileFrame
                  ? 'max-w-[430px] rounded-[36px] shadow-2xl border-[8px] border-slate-900 bg-black overflow-hidden ring-1 ring-slate-800'
                  : 'max-w-2xl rounded-2xl shadow-xl border border-slate-800 bg-black overflow-hidden'
              }`}
            >
              {/* LINE Browser Top Header Simulation */}
              <div className="bg-emerald-600 text-white px-4 py-2 flex items-center justify-between text-xs select-none">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span className="font-bold text-[11px]">UD Clinic Official</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] bg-emerald-700/60 px-2 py-0.5 rounded-full">
                  <Shield className="w-3 h-3" />
                  <span>Verified OA</span>
                </div>
              </div>

              {/* Client Camera Viewfinder (Immediate Centerpiece) */}
              <ClientCameraPortal />
            </div>
          </div>
        ) : (
          /* Staff Portal: Unified Staff Dashboard (Care Staff + Doctors) */
          <div className="bg-slate-100 text-slate-900 min-h-screen">
            <StaffDashboardView />
          </div>
        )}
      </main>
    </div>
  );
}
