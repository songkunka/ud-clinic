'use client';

import React, { useState, useEffect } from 'react';
import { X, Phone, MessageSquare, Check, Clock, AlertCircle } from 'lucide-react';
import { ContactLog, ContactChannel, ContactOutcome } from '@/lib/types';
import { dbService } from '@/lib/db-service';

interface ContactLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  hn: string;
  phoneNumber: string;
  caseId: string;
  patientId: string;
  dayLabel?: string;
  onLogSaved?: () => void;
}

export function ContactLogModal({
  isOpen,
  onClose,
  patientName,
  hn,
  phoneNumber,
  caseId,
  patientId,
  dayLabel,
  onLogSaved,
}: ContactLogModalProps) {
  const [channel, setChannel] = useState<ContactChannel>('phone');
  const [outcome, setOutcome] = useState<ContactOutcome>('reached');
  const [summary, setSummary] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [contactedBy, setContactedBy] = useState('พว.เวชปฏิบัติ (Care Staff)');
  const [history, setHistory] = useState<ContactLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && caseId) {
      loadHistory();
      setSummary('');
      setNextAction('');
      setSavedSuccess(false);
    }
  }, [isOpen, caseId]);

  const loadHistory = async () => {
    try {
      const logs = await dbService.getContactLogs(caseId);
      setHistory(logs);
    } catch (err) {
      console.error('Error loading contact logs:', err);
    }
  };

  if (!isOpen) return null;

  const quickTemplates = [
    'คนไข้รับสาย แจ้งว่าจะรีบถ่ายภาพ 5 มุมส่งเข้ามาก่อน 20.00 น.',
    'คนไข้รับสาย อาการปวดลดลง แผลแห้งดี สะดวกถ่ายส่งช่วงค่ำ',
    'โทรแล้วไม่รับสาย ส่งข้อความเตือนพร้อม Magic Link ทางแชท LINE แล้ว',
    'คนไข้ขอให้โทรกลับช่วงเย็น เนื่องจากติดธุระ',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) {
      alert('กรุณากรอกบันทึกสรุปการติดต่อ');
      return;
    }

    setLoading(true);
    const newLog: ContactLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      patientId,
      caseId,
      contactedAt: new Date().toISOString(),
      contactedBy,
      channel,
      contactOutcome: outcome,
      summary: summary.trim(),
      nextAction: nextAction.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    const ok = await dbService.createContactLog(newLog);
    setLoading(false);
    if (ok) {
      setSavedSuccess(true);
      await loadHistory();
      if (onLogSaved) onLogSaved();
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">บันทึกการโทรติดตามคนไข้</h3>
              <p className="text-xs text-slate-500">
                {patientName} • HN: {hn} {dayLabel && `• ${dayLabel}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {savedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-700 text-xs font-semibold">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>บันทึกประวัติการติดต่อสำเร็จแล้ว</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Quick dial button */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  เบอร์โทรศัพท์คนไข้
                </div>
                <div className="text-base font-black text-slate-900 tracking-wide">
                  {phoneNumber}
                </div>
              </div>
              <a
                href={`tel:${phoneNumber}`}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>กดโทรออก</span>
              </a>
            </div>

            {/* Channel Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ช่องทางการติดต่อ
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setChannel('phone')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    channel === 'phone'
                      ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-500/10'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>โทรศัพท์ (Voice Call)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChannel('line')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    channel === 'line'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/10'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>LINE Official Account</span>
                </button>
              </div>
            </div>

            {/* Outcome Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ผลการติดต่อ
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOutcome('reached')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold text-left transition-all ${
                    outcome === 'reached'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/10'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>รับสาย / พูดคุยแล้ว</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setOutcome('no_answer')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold text-left transition-all ${
                    outcome === 'no_answer'
                      ? 'bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/10'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>ไม่รับสาย (No Answer)</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setOutcome('unreachable')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold text-left transition-all ${
                    outcome === 'unreachable'
                      ? 'bg-red-50 border-red-500 text-red-800 ring-2 ring-red-500/10'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                    <span>ติดต่อไม่ได้ / ปิดเครื่อง</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setOutcome('callback_requested')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold text-left transition-all ${
                    outcome === 'callback_requested'
                      ? 'bg-purple-50 border-purple-500 text-purple-800 ring-2 ring-purple-500/10'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-purple-600" />
                    <span>ขอให้โทรกลับภายหลัง</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Quick Templates */}
            <div>
              <div className="text-[11px] font-bold text-slate-500 mb-1">
                คลิกเพื่อเลือกข้อความสรุปด่วน:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {quickTemplates.map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSummary(tpl)}
                    className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-left"
                  >
                    {tpl}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary Textarea */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                บันทึกรายละเอียดการพูดคุย
              </label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Next Action */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                แผนติดตามครั้งต่อไป (ถ้ามี)
              </label>
              <input
                type="text"
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Staff name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                เจ้าหน้าที่ผู้บันทึก
              </label>
              <input
                type="text"
                value={contactedBy}
                onChange={(e) => setContactedBy(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer"
            >
              {loading ? 'กำลังบันทึก...' : 'บันทึกประวัติการติดต่อ'}
            </button>
          </form>

          {/* Historical Logs */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
              <span>ประวัติการติดต่อก่อนหน้า</span>
              <span className="text-[10px] text-slate-400 font-normal">
                {history.length} รายการ
              </span>
            </h4>
            {history.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-400 bg-slate-50 rounded-xl">
                ยังไม่มีประวัติการโทรสำหรับเคสนี้
              </div>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {history.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 bg-slate-50 border border-slate-200/70 rounded-xl text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-700">
                        {log.contactedBy} ({log.channel === 'phone' ? 'โทรศัพท์' : 'LINE'})
                      </span>
                      <span>{new Date(log.contactedAt).toLocaleString('th-TH')}</span>
                    </div>
                    <div className="text-slate-800 font-medium">{log.summary}</div>
                    {log.nextAction && (
                      <div className="text-[10px] text-blue-600 font-semibold">
                        ติดตามต่อ: {log.nextAction}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
