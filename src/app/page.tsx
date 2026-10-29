'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const ClientCameraPortal = dynamic(
  () => import('@/components/patient/ClientCameraPortal').then((m) => m.ClientCameraPortal),
  {
    ssr: false,
    loading: () => (
      <div className="w-full min-h-screen bg-slate-950 flex items-center justify-center text-white text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-sans">กำลังเปิดระบบติดตามอาการ...</p>
        </div>
      </div>
    ),
  }
);

export default function Home() {
  return (
    <main className="w-full h-full min-h-screen bg-black flex flex-col justify-center items-center overflow-hidden overscroll-none touch-manipulation">
      <ClientCameraPortal />
    </main>
  );
}
