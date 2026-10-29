'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import {
  canReloadForFreshAssets,
  isChunkLoadError,
  reloadForFreshAssets,
} from '@/lib/error-recovery';

export function RouteErrorFallback({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry?: () => void;
}) {
  const [isRecovering] = useState(
    () => isChunkLoadError(error) && canReloadForFreshAssets()
  );

  useEffect(() => {
    console.error('UD Clinic page error:', error);
    if (isRecovering) reloadForFreshAssets();
  }, [error, isRecovering]);

  if (isRecovering) {
    return (
      <div className="w-full min-h-screen bg-slate-950 flex items-center justify-center text-white text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-sans">กำลังโหลดระบบเวอร์ชันล่าสุด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center">
        <AlertCircle className="mx-auto mb-3 h-10 w-10 text-amber-500" />
        <h1 className="text-lg font-semibold text-white">ไม่สามารถโหลดหน้านี้ได้</h1>
        <p className="mt-2 text-sm text-slate-400">
          อาจเกิดจากสัญญาณอินเทอร์เน็ตไม่เสถียร กรุณาลองใหม่อีกครั้ง
        </p>
        <div className="mt-5 flex flex-col gap-2">
          {retry && (
            <button
              type="button"
              onClick={() => retry()}
              className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-base font-semibold text-slate-950 active:bg-amber-600"
            >
              <RefreshCw className="h-4 w-4" />
              ลองอีกครั้ง
            </button>
          )}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-xl border border-slate-700 px-4 py-3 text-base text-slate-200 active:bg-slate-800"
          >
            โหลดหน้าใหม่
          </button>
        </div>
        {error.digest && (
          <p className="mt-4 text-[11px] text-slate-600">รหัสข้อผิดพลาด: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
