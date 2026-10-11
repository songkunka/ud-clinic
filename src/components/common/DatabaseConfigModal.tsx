'use client';

import React, { useState, useEffect } from 'react';
import {
  getSupabaseCredentials,
  setSupabaseCredentials,
  clearSupabaseCredentials,
  isSupabaseConfigured,
} from '@/lib/supabase';
import { dbService } from '@/lib/db-service';
import { useAppStore } from '@/lib/store';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Globe,
  Key,
  ShieldCheck,
  CloudUpload,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function DatabaseConfigModal({ isOpen, onClose }: Props) {
  const { cases, patients, reports } = useAppStore();
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const creds = getSupabaseCredentials();
      setUrl(creds.url);
      setKey(creds.key);
      setIsConnected(isSupabaseConfigured());
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestAndConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const cleanUrl = url.trim();
    const cleanKey = key.trim();

    if (!cleanUrl || !cleanKey) {
      setStatusMessage({
        type: 'error',
        text: 'กรุณากรอกทั้ง Project URL และ anon public key ให้ครบถ้วน',
      });
      return;
    }

    if (!cleanUrl.startsWith('https://') || !cleanUrl.includes('supabase.co')) {
      setStatusMessage({
        type: 'error',
        text: 'Project URL ต้องขึ้นต้นด้วย https:// และลงท้ายด้วย .supabase.co',
      });
      return;
    }

    setTesting(true);

    // Save credentials to memory / localStorage
    setSupabaseCredentials(cleanUrl, cleanKey);

    // Save to local .env.local via API route
    try {
      await fetch('/api/config-supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cleanUrl, key: cleanKey }),
      });
    } catch {
      // Ignore in serverless
    }

    // Test connection
    const res = await dbService.testConnection();
    setTesting(false);

    if (res.success) {
      setIsConnected(true);

      // Auto-sync existing local cases/patients/reports if any
      if (cases.length > 0 || reports.length > 0) {
        setSyncing(true);
        const syncRes = await dbService.syncAllLocalToCloud(cases, patients, reports);
        setSyncing(false);
        if (syncRes.success) {
          setStatusMessage({
            type: 'success',
            text: `เชื่อมต่อ Supabase สำเร็จ! และได้นำข้อมูลคนไข้ที่ลงทะเบียนไว้ (${syncRes.syncedCases} เคส) ซิงค์ขึ้น Cloud เรียบร้อยแล้ว`,
          });
        } else {
          setStatusMessage({
            type: 'success',
            text: 'เชื่อมต่อ Supabase สำเร็จแล้ว!',
          });
        }
      } else {
        setStatusMessage({
          type: 'success',
          text: 'เชื่อมต่อฐานข้อมูล Supabase สำเร็จเรียบร้อยแล้ว!',
        });
      }
    } else {
      setIsConnected(false);
      setStatusMessage({
        type: 'error',
        text: res.message,
      });
    }
  };

  const handleDisconnect = () => {
    clearSupabaseCredentials();
    setUrl('');
    setKey('');
    setIsConnected(false);
    setStatusMessage({
      type: 'info',
      text: 'ตัดการเชื่อมต่อ Supabase แล้ว ระบบจะทำงานในโหมด Offline (LocalStorage)',
    });
  };

  const handleManualSync = async () => {
    setSyncing(true);
    setStatusMessage(null);
    const syncRes = await dbService.syncAllLocalToCloud(cases, patients, reports);
    setSyncing(false);

    if (syncRes.success) {
      setStatusMessage({
        type: 'success',
        text: `ซิงค์ข้อมูลขึ้น Supabase สำเร็จ: ${syncRes.syncedCases} เคสคนไข้ และ ${syncRes.syncedReports} รายงาน`,
      });
    } else {
      setStatusMessage({
        type: 'error',
        text: syncRes.error || 'เกิดข้อผิดพลาดในการซิงค์ข้อมูล',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                ตั้งค่าเชื่อมต่อ Supabase Cloud Database
              </h3>
              <p className="text-xs text-slate-400">
                ซิงค์ข้อมูลคนไข้และรายงานระหว่างคอมพิวเตอร์กับมือถือ Real-time
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Banner */}
        <div className="px-5 py-3 bg-slate-800/50 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isConnected ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50' : 'bg-amber-500'
              }`}
            />
            <span className="text-xs font-semibold text-slate-200">
              สถานะ:{' '}
              {isConnected ? (
                <span className="text-emerald-400">เชื่อมต่อ Supabase แล้ว</span>
              ) : (
                <span className="text-amber-400">ยังไม่ได้เชื่อมต่อ (ทำงานบนเครื่องเท่านั้น)</span>
              )}
            </span>
          </div>

          {isConnected && cases.length > 0 && (
            <button
              onClick={handleManualSync}
              disabled={syncing}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
            >
              <CloudUpload className="w-3.5 h-3.5" />
              <span>{syncing ? 'กำลังซิงค์...' : 'กดซิงค์ข้อมูลขึ้น Cloud'}</span>
            </button>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleTestAndConnect} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>Project URL</span>
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full text-xs font-mono py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-hidden focus:border-blue-500"
              required
            />
            <p className="text-[11px] text-slate-400">
              ดูได้จาก Supabase $\rightarrow$ Project Settings $\rightarrow$ Data API $\rightarrow$ Project URL
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>API Key (anon public key)</span>
            </label>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full text-xs font-mono py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-hidden focus:border-blue-500"
              required
            />
            <p className="text-[11px] text-slate-400">
              ดูได้จาก Supabase $\rightarrow$ Project Settings $\rightarrow$ Data API $\rightarrow$ anon public key
            </p>
          </div>

          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-200'
                  : statusMessage.type === 'error'
                  ? 'bg-red-950/80 border border-red-800 text-red-200'
                  : 'bg-blue-950/80 border border-blue-800 text-blue-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{statusMessage.text}</span>
            </div>
          )}

          <div className="pt-2 flex items-center gap-2">
            <button
              type="submit"
              disabled={testing || syncing}
              className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              {testing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>กำลังทดสอบการเชื่อมต่อ...</span>
                </>
              ) : syncing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>กำลังซิงค์ข้อมูลขึ้น Cloud...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>บันทึกและเชื่อมต่อ (Connect & Sync)</span>
                </>
              )}
            </button>

            {isConnected && (
              <button
                type="button"
                onClick={handleDisconnect}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-red-950/50 hover:text-red-400 text-slate-400 text-xs font-semibold transition-colors cursor-pointer"
              >
                ตัดการเชื่อมต่อ
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
