'use client';

import React from 'react';
import { StaffDashboardView } from '@/components/staff/StaffDashboardView';

export default function StaffPage() {
  return (
    <main className="w-full min-h-screen bg-slate-100 text-slate-900">
      <StaffDashboardView />
    </main>
  );
}
