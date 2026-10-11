'use client';

import React from 'react';
import { ClientCameraPortal } from '@/components/patient/ClientCameraPortal';

export default function Home() {
  return (
    <main className="w-full h-full min-h-screen bg-black flex flex-col justify-center items-center overflow-hidden overscroll-none touch-manipulation">
      <ClientCameraPortal />
    </main>
  );
}
