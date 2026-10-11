'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import {
  ShieldCheck,
  Sliders,
  History,
  Clock,
  Camera,
  Save,
  CheckCircle2,
  Lock,
  User,
  Filter,
} from 'lucide-react';

export function AdminManagementView() {
  const { protocol, updateProtocol, auditLogs } = useAppStore();

  const [activeTab, setActiveTab] = useState<'protocols' | 'audit'>('protocols');
  const [slaMinutes, setSlaMinutes] = useState(protocol.slaReviewMinutes);
  const [protoName, setProtoName] = useState(protocol.name);
  const [isSaved, setIsSaved] = useState(false);
  const [auditFilter, setAuditFilter] = useState('all');

  const handleSaveProtocol = (e: React.FormEvent) => {
    e.preventDefault();
    updateProtocol({
      ...protocol,
      name: protoName,
      slaReviewMinutes: Number(slaMinutes),
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const filteredLogs = auditLogs.filter((log) => {
    if (auditFilter === 'all') return true;
    return log.action.includes(auditFilter);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200">
              Clinic Administration & Governance
            </span>
            <span className="text-xs text-slate-400">
              UD Clinic Post-Op Monitoring
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            การจัดการโปรโตคอลและบันทึกการตรวจสอบ (Audit Trail)
          </h2>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('protocols')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'protocols'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>ตั้งค่าโปรโตคอล (Protocols)</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>ประวัติการตรวจสอบ ({auditLogs.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'protocols' ? (
        /* Protocol Settings */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-600" />
                <span>การตั้งค่าโปรโตคอลมาตรฐาน (Face-Lift Protocol)</span>
              </h3>
              <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-bold border border-emerald-200">
                เวอร์ชัน {protocol.version} (Active)
              </span>
            </div>

            <form onSubmit={handleSaveProtocol} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  ชื่อโปรโตคอล:
                </label>
                <input
                  type="text"
                  value={protoName}
                  onChange={(e) => setProtoName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  เวลา SLA สูงสุดในการคัดกรองรายงาน (นาที):
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={slaMinutes}
                    onChange={(e) => setSlaMinutes(Number(e.target.value))}
                    min={30}
                    max={720}
                    step={15}
                    className="w-32 text-xs p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold"
                  />
                  <span className="text-xs text-slate-500">
                    นาที ({Math.floor(slaMinutes / 60)} ชม. {slaMinutes % 60} นาที)
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  หากรายงานค้างตรวจเกินเวลานี้ ระบบจะขึ้นสถานะเตือนสีส้ม/แดงใน Dashboard ของเจ้าหน้าที่
                </p>
              </div>

              {/* Photo Angles configured */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-purple-600" />
                  <span>มุมภาพที่โปรโตคอลบังคับถ่าย ({protocol.angles.length} มุม):</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {protocol.angles.map((ang, idx) => (
                    <div
                      key={ang.key}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-2.5"
                    >
                      <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-xs text-slate-800">
                          {ang.labelThai}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {ang.descriptionThai}
                        </div>
                        <span className="text-[9px] text-emerald-700 font-bold uppercase mt-1 inline-block">
                          Required
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center gap-3">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>บันทึกการตั้งค่าโปรโตคอล</span>
                </button>

                {isSaved && (
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>บันทึกและบันทึกประวัติการแก้ไขเรียบร้อยแล้ว</span>
                  </span>
                )}
              </div>
            </form>
          </div>

          {/* Clinical Authority Disclaimer Card */}
          <div className="md:col-span-4 bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-3 text-xs text-slate-600">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-purple-600" />
              <span>ข้อกำหนดการอนุมัติโปรโตคอล</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              ตามข้อกำหนด PRD ส่วนที่ 3 และ 14 การปรับเปลี่ยนมุมภาพ เกณฑ์เตือนอาการเร่งด่วน หรือระยะเวลาติดตามหลังผ่าตัด ต้องได้รับการอนุมัติโดย <strong>หัวหน้าศัลยแพทย์ (Chief Surgeon)</strong> ของ UD Clinic เท่านั้น
            </p>
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-900 text-[11px]">
              ผู้อนุมัติปัจจุบัน: นพ.สมชาย เกียรติเวชช์ (UD Chief Surgeon)
            </div>
          </div>
        </div>
      ) : (
        /* Audit Trail Table */
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <History className="w-4 h-4 text-purple-600" />
                <span>ประวัติการเข้าถึงและการทำรายการสำคัญ (PDPA Audit Logs)</span>
              </h3>
              <p className="text-xs text-slate-500">
                บันทึกการเปิดดูภาพใบหน้า, การเปลี่ยนสถานะรายงาน, และการส่งต่อเคส
              </p>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2 text-xs">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={auditFilter}
                onChange={(e) => setAuditFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-semibold cursor-pointer"
              >
                <option value="all">ทั้งหมด ({auditLogs.length})</option>
                <option value="view">การเปิดดูภาพ (View)</option>
                <option value="status">การเปลี่ยนสถานะ (Status)</option>
                <option value="refer">การส่งต่อแพทย์ (Refer)</option>
                <option value="submit">การส่งรายงาน (Submit)</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="p-3">เวลา (Timestamp)</th>
                  <th className="p-3">ผู้ทำรายการ (Actor)</th>
                  <th className="p-3">บทบาท (Role)</th>
                  <th className="p-3">การกระทำ (Action)</th>
                  <th className="p-3">รายละเอียด (Details)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="p-3 whitespace-nowrap text-slate-500">
                      {log.createdAt}
                    </td>
                    <td className="p-3 font-semibold text-slate-800 font-sans">
                      {log.actorName}
                    </td>
                    <td className="p-3 font-sans">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                        {log.actorRole}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-purple-700">
                      {log.action}
                    </td>
                    <td className="p-3 text-slate-600 font-sans max-w-md">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
