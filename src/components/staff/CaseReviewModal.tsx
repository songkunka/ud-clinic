'use client';

import React, { useState, useEffect } from 'react';
import { DailyReport, ReviewAction, UserRole, PhotoQualityEvaluation } from '@/lib/types';
import { StatusBadge } from '@/components/common/StatusBadge';
import { dbService } from '@/lib/db-service';
import {
  X,
  Lock,
  Send,
  MessageSquare,
  ShieldAlert,
  Stethoscope,
  ZoomIn,
  Check,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Calendar,
  AlertCircle,
  FileCheck,
  UserCheck,
  Copy,
} from 'lucide-react';

interface CaseReviewModalProps {
  report: DailyReport;
  currentUserRole: UserRole;
  onClose: () => void;
  onPerformAction: (actionData: {
    actionType: ReviewAction['actionType'];
    internalNote?: string;
    customerMessage?: string;
    assignedTo?: string;
    followUpDueAt?: string;
  }) => void;
}

const RETAKE_REASONS = [
  'เส้นผมบดบังรอยเย็บหน้าหู/ขมับ',
  'ภาพเบลอ หลุดโฟกัส',
  'แสงมืดหรือจ้าเกินไป',
  'มุมกล้องไม่ตรง (ไม่ใช่ 45° หรือ 90°)',
  'สวมแว่นตาหรือผ้าคลุมบดบังแผล',
];

export function CaseReviewModal({
  report,
  currentUserRole,
  onClose,
  onPerformAction,
}: CaseReviewModalProps) {
  const [selectedPhoto, setSelectedPhoto] = useState(report.photos[0] || null);
  const [photoEvaluations, setPhotoEvaluations] = useState<
    Record<string, { status: 'acceptable' | 'retake_required'; reason: string }>
  >({});

  const [actionType, setActionType] = useState<ReviewAction['actionType']>(
    report.status === 'more_info_requested'
      ? 'request_more_info'
      : report.status === 'referred_to_doctor'
      ? 'refer'
      : 'reviewed'
  );

  const [escalationPriority, setEscalationPriority] = useState<
    'routine' | 'urgent' | 'emergency'
  >('routine');
  const [internalNote, setInternalNote] = useState('');
  const [customerMessage, setCustomerMessage] = useState(
    report.latestCustomerMessage || ''
  );
  const [assignedTo, setAssignedTo] = useState(
    report.assignedDoctorName || 'นพ.สมชาย เกียรติเวชช์'
  );
  const [doctorOrders, setDoctorOrders] = useState(report.doctorClinicalOrders || '');
  const [requiresClinicVisit, setRequiresClinicVisit] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedLineMsg, setCopiedLineMsg] = useState(false);

  const handleCopyReviewForLine = () => {
    const statusText =
      actionType === 'reviewed'
        ? 'ปกติเรียบร้อยดี (ตามเกณฑ์ฟื้นตัว)'
        : actionType === 'request_more_info'
        ? 'ขอความกรุณาถ่ายภาพซ่อมบางมุม'
        : actionType === 'refer'
        ? 'แพทย์กำลังตรวจประเมินเพิ่มเติม'
        : 'ทีมพยาบาลกำลังประสานงาน';

    const textToCopy = [
      `🏥 UD CLINIC TORO — ผลการประเมินอาการหลังผ่าตัด`,
      `👤 คนไข้: คุณ${report.patientName} (HN: ${report.hn})`,
      `📅 ระยะเวลา: D+${report.postOpDay} หลังผ่าตัด`,
      `🩺 สถานะการฟื้นตัว: ${statusText}`,
      doctorOrders ? `📋 คำสั่งแพทย์: ${doctorOrders}` : '',
      customerMessage ? `💬 คำแนะนำจากทีมดูแล: ${customerMessage}` : '',
      `📞 ติดต่อสอบถาม/สายด่วนคลินิก: 081-456-7890`,
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard.writeText(textToCopy);
    setCopiedLineMsg(true);
    setTimeout(() => setCopiedLineMsg(false), 2500);
  };

  // Load saved evaluations
  useEffect(() => {
    dbService.getPhotoQualityEvaluations(report.id).then((saved) => {
      if (saved && saved.length > 0) {
        const map: Record<string, { status: 'acceptable' | 'retake_required'; reason: string }> = {};
        saved.forEach((e) => {
          map[e.angleCode] = { status: e.qualityStatus, reason: e.retakeReason || '' };
        });
        setPhotoEvaluations(map);
      } else {
        // Initialize all as acceptable
        const map: Record<string, { status: 'acceptable' | 'retake_required'; reason: string }> = {};
        report.photos.forEach((p) => {
          map[p.angleKey] = { status: 'acceptable', reason: '' };
        });
        setPhotoEvaluations(map);
      }
    });
  }, [report.id, report.photos]);

  const currentEval = selectedPhoto ? photoEvaluations[selectedPhoto.angleKey] : null;

  const handleSetAngleStatus = (
    angleCode: string,
    status: 'acceptable' | 'retake_required',
    reason = ''
  ) => {
    setPhotoEvaluations((prev) => {
      const updated = {
        ...prev,
        [angleCode]: {
          status,
          reason: reason || (status === 'acceptable' ? '' : prev[angleCode]?.reason || ''),
        },
      };

      // If any angle needs retake, automatically switch action to request_more_info
      const hasRetake = Object.values(updated).some((v) => v.status === 'retake_required');
      if (hasRetake && actionType !== 'refer') {
        setActionType('request_more_info');
      }

      return updated;
    });
  };

  const retakeAnglesCount = Object.values(photoEvaluations).filter(
    (v) => v.status === 'retake_required'
  ).length;

  const generateRetakeMessage = () => {
    const retakeList = Object.entries(photoEvaluations)
      .filter(([_, v]) => v.status === 'retake_required')
      .map(([code, v]) => {
        const photo = report.photos.find((p) => p.angleKey === code);
        const name = photo?.angleNameThai || code;
        return `• ${name}${v.reason ? ` (เหตุผล: ${v.reason})` : ''}`;
      });

    if (retakeList.length === 0) return;

    const msg = `เรียนคุณ ${report.patientName} เจ้าหน้าที่ได้ตรวจสอบภาพถ่ายประจำวันแล้ว ขอความกรุณาถ่ายภาพซ่อมเพิ่มเติมเฉพาะมุมดังนี้ค่ะ:\n${retakeList.join(
      '\n'
    )}\n\nรบกวนเปิดระบบและถ่ายภาพตามคำแนะนำส่งเข้ามาอีกครั้งนะคะ ขอบพระคุณค่ะ`;
    setCustomerMessage(msg);
  };

  const TEMPLATES = [
    {
      category: 'แผลแห้งปกติ (D+1 ถึง D+4)',
      title: 'ประคบเย็น & หนุนศีรษะสูง',
      text: `แผลผ่าตัดแห้งสนิทดีมากค่ะ อาการบวมช้ำอยู่ในเกณฑ์ปกติของระยะ D+${report.postOpDay} แนะนำให้ประคบเย็นเบาๆ บริเวณข้างแก้มและใต้คางวันละ 4-5 ครั้ง (หลีกเลี่ยงการกดทับรอยแผลโดยตรง) และนอนหนุนหมอนสูง 2 ใบนะคะ`,
    },
    {
      category: 'แผลยุบบวม (D+5 เป็นต้นไป)',
      title: 'เปลี่ยนเป็นประคบอุ่น & ทายาลดช้ำ',
      text: `อาการบวมเริ่มคงที่และรอยช้ำเริ่มกระจายตัว แนะนำเปลี่ยนมาประคบอุ่นเบาๆ บริเวณแก้มและลำคอเพื่อเร่งการสลายรอยช้ำ ทายาลดรอยช้ำตามแพทย์สั่ง และงดรับประทานอาหารรสเค็มจัดหรือของหมักดองนะคะ`,
    },
    {
      category: 'นัดหมายคลินิก',
      title: 'ครบกำหนดตัดไหม (D+7 / D+14)',
      text: `วันพรุ่งนี้คุณคนไข้จะครบกำหนดตัดไหม (D+${report.postOpDay + 1}) รบกวนเดินทางเข้ามาที่คลินิกตามเวลาที่นัดหมายได้เลยนะคะ (ช่วงเวลา 10:00 - 17:00 น.) หากต้องการเลื่อนเวลาสามารถติดต่อเจ้าหน้าที่ได้ทันทีค่ะ`,
    },
    {
      category: 'ขอถ่ายภาพซ่อม',
      title: 'เก็บไรผม & ถ่ายในที่มีแสงสว่าง',
      text: `รบกวนคุณคนไข้ถ่ายภาพมุมที่ระบบแจ้งเตือนใหม่อีกครั้งนะคะ โดยรบกวนรวบผมหรือติดกิ๊บเปิดให้เห็นรอยเย็บบริเวณหน้าหูและขมับให้ชัดเจนในห้องที่มีแสงสว่างสม่ำเสมอค่ะ`,
    },
    {
      category: 'อาการเตือนให้พบแพทย์',
      title: 'แนะนำเข้ามาตรวจดูแผลที่คลินิกวันนี้',
      text: `จากอาการและรอยแผลที่แจ้งเข้ามา คุณหมอต้องการประเมินแผลเพิ่มเติมเพื่อความปลอดภัย จึงขอแนะนำให้คุณคนไข้เดินทางเข้ามาตรวจที่คลินิกในวันนี้ เจ้าหน้าที่กำลังโทรประสานเพื่อนัดเวลาตรวจให้นะคะ`,
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // 1. Prepare evaluations
      const evaluationsList: PhotoQualityEvaluation[] = Object.entries(photoEvaluations).map(
        ([code, evalData]) => ({
          id: `eval_${report.id}_${code}`,
          submissionId: report.id,
          angleCode: code,
          qualityStatus: evalData.status,
          retakeReason: evalData.reason,
          reviewedBy:
            currentUserRole === 'doctor'
              ? report.assignedDoctorName || 'นพ.สมชาย เกียรติเวชช์'
              : 'พว.เวชปฏิบัติ (Care Staff)',
          reviewedAt: new Date().toISOString(),
        })
      );

      // 2. Persist evaluations
      if (evaluationsList.length > 0) {
        await dbService.savePhotoQualityEvaluations(report.id, evaluationsList);
      }

      // 3. Clinical Audit Log
      await dbService.logClinicalAudit({
        actorName:
          currentUserRole === 'doctor'
            ? report.assignedDoctorName || 'นพ.สมชาย เกียรติเวชช์'
            : 'พว.เวชปฏิบัติ (Care Staff)',
        actorRole: currentUserRole,
        action:
          actionType === 'refer'
            ? 'refer_to_doctor'
            : actionType === 'request_more_info'
            ? 'request_retake'
            : 'approve_submission',
        resourceType: 'daily_report',
        resourceId: report.id,
        changes: {
          actionType,
          escalationPriority: actionType === 'refer' ? escalationPriority : undefined,
          requiresClinicVisit,
          doctorOrders: doctorOrders || undefined,
          retakeAngles: evaluationsList
            .filter((e) => e.qualityStatus === 'retake_required')
            .map((e) => e.angleCode),
        },
      });

      let finalInternalNote = internalNote;
      if (doctorOrders) {
        finalInternalNote = `[คำสั่งแพทย์: ${doctorOrders}]\n${finalInternalNote}`.trim();
      }
      if (requiresClinicVisit) {
        finalInternalNote = `[⚠️ นัดตรวจคลินิกด่วน]\n${finalInternalNote}`.trim();
      }

      onPerformAction({
        actionType,
        internalNote: finalInternalNote,
        customerMessage,
        assignedTo: actionType === 'refer' ? assignedTo : report.assignedDoctorName,
      });

      onClose();
    } catch (err) {
      console.error('Error saving review action:', err);
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto animate-fadeIn">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">{report.patientName}</h3>
                <span className="text-xs font-mono text-blue-300">HN: {report.hn}</span>
                <span className="text-xs bg-blue-700/80 px-2 py-0.5 rounded-full font-bold">
                  D+{report.postOpDay}
                </span>
                {retakeAnglesCount > 0 && (
                  <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <RotateCcw className="w-3 h-3" />
                    <span>ขอถ่ายใหม่ {retakeAnglesCount} มุม</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                ส่งเมื่อ: {report.submittedAt || report.reportDate} | ศัลยแพทย์:{' '}
                {report.assignedDoctorName || 'นพ.สมชาย'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleCopyReviewForLine}
              className="px-3 py-1.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              title="คัดลอกข้อความสรุปผลตรวจส่งต่อใน LINE"
            >
              {copiedLineMsg ? (
                <Check className="w-3.5 h-3.5 text-white" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-white" />
              )}
              <span>{copiedLineMsg ? 'คัดลอกแล้ว!' : 'คัดลอกผลตรวจส่ง LINE'}</span>
            </button>

            <StatusBadge status={report.status} />
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body (2 columns: Photos inspection left, Symptoms & Action right) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-y-auto divide-y md:divide-y-0 md:divide-x divide-slate-200">
          {/* Left Column: Photos Inspection */}
          <div className="md:col-span-7 p-4 sm:p-5 flex flex-col space-y-3.5 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <ZoomIn className="w-4 h-4 text-blue-600" />
                <span>ตรวจรับคุณภาพภาพถ่าย 5 มุม (Per-Angle Quality)</span>
              </h4>
              <span className="text-[11px] text-slate-500 font-mono">
                {report.photos.length} มุมภาพ
              </span>
            </div>

            {/* Main Preview with high-res simulation */}
            {selectedPhoto && (
              <div className="space-y-2">
                <div className="relative aspect-4/3 w-full bg-slate-900 rounded-xl overflow-hidden shadow-inner flex items-center justify-center border border-slate-300">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedPhoto.photoUrl}
                    alt={selectedPhoto.angleNameThai}
                    className="max-h-full max-w-full object-contain"
                  />
                  <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-xs text-white text-xs px-3 py-1 rounded-md font-semibold flex items-center gap-2">
                    <span>{selectedPhoto.angleNameThai}</span>
                    <span className="text-[10px] text-slate-300">
                      ({selectedPhoto.uploadedAt})
                    </span>
                  </div>

                  {/* Quality status badge overlay */}
                  <div className="absolute top-3 right-3">
                    {currentEval?.status === 'retake_required' ? (
                      <span className="px-2.5 py-1 rounded-lg bg-rose-600/90 text-white font-bold text-xs shadow-md flex items-center gap-1 backdrop-blur-xs">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>ขอถ่ายซ่อม</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-600/90 text-white font-bold text-xs shadow-md flex items-center gap-1 backdrop-blur-xs">
                        <Check className="w-3.5 h-3.5" />
                        <span>ภาพผ่านเกณฑ์</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Per-Angle Evaluation Controls */}
                <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      ผลการตรวจมุม: {selectedPhoto.angleNameThai}
                    </span>
                    <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() =>
                          handleSetAngleStatus(selectedPhoto.angleKey, 'acceptable')
                        }
                        className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                          currentEval?.status !== 'retake_required'
                            ? 'bg-emerald-600 text-white shadow-xs font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        ✓ ผ่านเกณฑ์
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleSetAngleStatus(
                            selectedPhoto.angleKey,
                            'retake_required',
                            currentEval?.reason || RETAKE_REASONS[0]
                          )
                        }
                        className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                          currentEval?.status === 'retake_required'
                            ? 'bg-rose-600 text-white shadow-xs font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        ⚠️ ขอถ่ายซ่อม
                      </button>
                    </div>
                  </div>

                  {/* Retake reason selector */}
                  {currentEval?.status === 'retake_required' && (
                    <div className="space-y-1.5 pt-1 border-t border-slate-100 animate-fadeIn">
                      <label className="text-[11px] font-semibold text-rose-700 block">
                        ระบุสาเหตุที่ต้องถ่ายซ่อม:
                      </label>
                      <div className="flex flex-wrap gap-1">
                        {RETAKE_REASONS.map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() =>
                              handleSetAngleStatus(
                                selectedPhoto.angleKey,
                                'retake_required',
                                r
                              )
                            }
                            className={`px-2 py-0.5 rounded-md text-[10px] transition-colors cursor-pointer border ${
                              currentEval?.reason === r
                                ? 'bg-rose-100 border-rose-300 text-rose-900 font-bold'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        placeholder="หรือพิมพ์สาเหตุเฉพาะ..."
                        value={currentEval?.reason || ''}
                        onChange={(e) =>
                          handleSetAngleStatus(
                            selectedPhoto.angleKey,
                            'retake_required',
                            e.target.value
                          )
                        }
                        className="w-full text-xs p-1.5 rounded-lg border border-rose-200 bg-rose-50/30 text-slate-800"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Thumbnail selector with status badge */}
            <div className="space-y-1.5">
              <div className="grid grid-cols-5 gap-2">
                {report.photos.map((p) => {
                  const ev = photoEvaluations[p.angleKey];
                  const isRetake = ev?.status === 'retake_required';
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPhoto(p)}
                      className={`relative aspect-3/4 rounded-lg overflow-hidden border-2 text-left transition-all cursor-pointer ${
                        selectedPhoto?.id === p.id
                          ? 'border-blue-600 ring-2 ring-blue-500/30 shadow-md'
                          : 'border-slate-200 opacity-80 hover:opacity-100 hover:border-slate-400'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.photoUrl}
                        alt={p.angleNameThai}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-1 right-1">
                        {isRetake ? (
                          <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                            ✕
                          </span>
                        ) : (
                          <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                            ✓
                          </span>
                        )}
                      </div>
                      <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-white p-0.5 truncate text-center">
                        {p.angleNameThai}
                      </div>
                    </button>
                  );
                })}
              </div>

              {retakeAnglesCount > 0 && (
                <button
                  type="button"
                  onClick={generateRetakeMessage}
                  className="w-full py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>สร้างข้อความขอถ่ายซ่อม ({retakeAnglesCount} มุม) ลงในช่องตอบคนไข้</span>
                </button>
              )}
            </div>

            {/* Urgent Tag if present */}
            {report.isUrgent && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">เคสนี้มีสัญญาณแจ้งเตือนเร่งด่วน:</span>{' '}
                  คนไข้รายงานอาการปวดสูง มีเลือดสดซึม หรือมีความกังวลสูง
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Symptoms & Review Action Form */}
          <div className="md:col-span-5 p-4 sm:p-5 flex flex-col space-y-4 overflow-y-auto">
            {/* Symptoms Data */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900">
                ข้อมูลอาการที่คนไข้รายงาน
              </h4>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">ระดับความปวด:</span>
                  <span
                    className={`font-bold ${
                      report.symptomAnswers.painScore >= 7
                        ? 'text-red-600'
                        : report.symptomAnswers.painScore >= 4
                        ? 'text-amber-600'
                        : 'text-slate-800'
                    }`}
                  >
                    {report.symptomAnswers.painScore}/10
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">อาการบวม:</span>
                  <span className="font-semibold text-slate-800">
                    {report.symptomAnswers.swellingLevel === 'decreasing'
                      ? 'ลดลง'
                      : report.symptomAnswers.swellingLevel === 'same'
                      ? 'ใกล้เคียงเดิม'
                      : 'บวมมากขึ้น (ต้องสังเกต)'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">การซึมของแผล:</span>
                  <span
                    className={`font-semibold ${
                      report.symptomAnswers.bleedingOrDischarge === 'heavy_fresh'
                        ? 'text-red-600'
                        : 'text-slate-800'
                    }`}
                  >
                    {report.symptomAnswers.bleedingOrDischarge === 'none'
                      ? 'ไม่มี'
                      : report.symptomAnswers.bleedingOrDischarge === 'mild_serous'
                      ? 'ซึมเล็กน้อย'
                      : 'ซึมมากต่อเนื่อง (เฝ้าระวัง)'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">ไข้:</span>
                  <span className="font-semibold text-slate-800">
                    {report.symptomAnswers.feverStatus === 'none'
                      ? 'ไม่มีไข้'
                      : report.symptomAnswers.feverStatus === 'mild'
                      ? 'รุมๆ'
                      : 'มีไข้สูง'}
                  </span>
                </div>
                {report.patientNote && (
                  <div className="pt-1">
                    <span className="text-slate-500 block mb-0.5 font-medium">
                      ข้อความจากคนไข้:
                    </span>
                    <p className="bg-white p-2 rounded-lg border border-slate-200 text-slate-800 italic">
                      &ldquo;{report.patientNote}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5 pt-2 border-t border-slate-200">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-900 block">
                  เลือกการดำเนินการ (Action)
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'reviewed', label: 'บันทึกตรวจแล้ว', desc: 'อาการปกติ' },
                    { id: 'request_more_info', label: 'ขอข้อมูล/ภาพเพิ่ม', desc: 'มุมไม่ชัด/ถ่ายซ่อม' },
                    { id: 'refer', label: 'ส่งต่อแพทย์', desc: 'ให้แพทย์ประเมิน' },
                    { id: 'urgent_contact', label: 'ติดต่อเร่งด่วน', desc: 'โทรประสานคนไข้' },
                  ].map((act) => (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() =>
                        setActionType(act.id as ReviewAction['actionType'])
                      }
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        actionType === act.id
                          ? act.id === 'urgent_contact'
                            ? 'border-red-600 bg-red-50 text-red-900 ring-1 ring-red-500 font-bold'
                            : act.id === 'refer'
                            ? 'border-purple-600 bg-purple-50 text-purple-900 ring-1 ring-purple-500 font-bold'
                            : act.id === 'request_more_info'
                            ? 'border-amber-600 bg-amber-50 text-amber-900 ring-1 ring-amber-500 font-bold'
                            : 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-500 font-bold'
                          : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold">{act.label}</div>
                      <div className="text-[10px] text-slate-500">{act.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Doctor Escalation Options if Refer Chosen */}
              {actionType === 'refer' && (
                <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200 space-y-2.5 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                      <Stethoscope className="w-4 h-4 text-purple-700" />
                      <span>ระดับความเร่งด่วนในการส่งต่อแพทย์</span>
                    </span>
                    <div className="flex gap-1">
                      {(['routine', 'urgent', 'emergency'] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setEscalationPriority(p)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase transition-all cursor-pointer ${
                            escalationPriority === p
                              ? p === 'emergency'
                                ? 'bg-red-600 text-white'
                                : p === 'urgent'
                                ? 'bg-amber-600 text-white'
                                : 'bg-purple-600 text-white'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {p === 'emergency' ? 'ฉุกเฉิน' : p === 'urgent' ? 'ด่วน' : 'ปกติ'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-purple-900 block">
                      แพทย์ผู้รับผิดชอบเคส:
                    </label>
                    <select
                      value={assignedTo}
                      onChange={(e) => setAssignedTo(e.target.value)}
                      className="w-full text-xs p-2 rounded-xl border border-purple-300 bg-white text-slate-800"
                    >
                      <option value="นพ.สมชาย เกียรติเวชช์">
                        นพ.สมชาย เกียรติเวชช์ (Chief Surgeon)
                      </option>
                      <option value="พญ.นภา วงศ์สุริยา">
                        พญ.นภา วงศ์สุริยา (Facial Plastic Specialist)
                      </option>
                    </select>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-semibold text-purple-950 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={requiresClinicVisit}
                      onChange={(e) => setRequiresClinicVisit(e.target.checked)}
                      className="rounded-md text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    <span>แนะนำให้คนไข้เข้ามาตรวจที่คลินิกทันที</span>
                  </label>
                </div>
              )}

              {/* Doctor's Orders (If Doctor role or reviewing) */}
              {(currentUserRole === 'doctor' || actionType === 'reviewed') && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>คำสั่งแพทย์ / การวินิจฉัย (Doctor Clinical Orders)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น แผลแห้งดี ให้ประคบอุ่นต่อเนื่อง ทายาลดรอยช้ำ..."
                    value={doctorOrders}
                    onChange={(e) => setDoctorOrders(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              )}

              {/* STRICT SEPARATION 1: Internal Clinical Note (Patient NEVER sees this!) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-600" />
                    <span>Internal Note (บันทึกภายในคลินิก)</span>
                  </label>
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-sm font-semibold">
                    คนไข้ไม่เห็น
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={internalNote}
                  placeholder="บันทึกอาการทางคลินิกเพื่อส่งต่อทีมแพทย์และพยาบาล..."
                  onChange={(e) => setInternalNote(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-amber-200 bg-amber-50/20 text-slate-900 focus:outline-hidden focus:border-amber-400"
                />
              </div>

              {/* STRICT SEPARATION 2: Customer Message (Shown to patient in app) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3 text-blue-600" />
                    <span>ข้อความถึงคนไข้ (Customer Message)</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowTemplates(!showTemplates)}
                      className="text-[10px] text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-md font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Sparkles className="w-3 h-3 text-blue-600" />
                      <span>{showTemplates ? 'ซ่อนเทมเพลต' : '⚡ ข้อความสำเร็จรูป'}</span>
                    </button>
                    <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-sm font-semibold">
                      คนไข้จะเห็นข้อความนี้
                    </span>
                  </div>
                </div>

                {/* Templates Accordion */}
                {showTemplates && (
                  <div className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-200 space-y-1.5 animate-fadeIn">
                    <div className="text-[11px] font-bold text-blue-900">
                      คลิกเพื่อแทรกข้อความสำเร็จรูป:
                    </div>
                    <div className="grid grid-cols-1 gap-1">
                      {TEMPLATES.map((t, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setCustomerMessage(t.text);
                            setShowTemplates(false);
                          }}
                          className="p-1.5 text-left rounded-lg bg-white hover:bg-blue-100/60 border border-blue-100 text-xs transition-colors cursor-pointer group"
                        >
                          <div className="font-bold text-slate-800 text-[11px] flex items-center justify-between">
                            <span>{t.title}</span>
                            <span className="text-[9px] text-slate-400 font-normal">
                              {t.category}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 truncate mt-0.5 group-hover:text-slate-700">
                            {t.text}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <textarea
                  rows={3}
                  value={customerMessage}
                  placeholder="พิมพ์ข้อความตอบกลับหรือคำแนะนำทางการแพทย์แก่คนไข้..."
                  onChange={(e) => setCustomerMessage(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-blue-200 bg-blue-50/20 text-slate-900 focus:outline-hidden focus:border-blue-400"
                />
              </div>

              {/* Submit Review */}
              <div className="pt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSaving}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                >
                  ปิด
                </button>

                <button
                  type="button"
                  onClick={handleCopyReviewForLine}
                  className="px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  title="คัดลอกข้อความสรุปผลตรวจพร้อมคำแนะนำเพื่อส่งต่อให้คนไข้ใน LINE"
                >
                  {copiedLineMsg ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-emerald-700" />
                  )}
                  <span>{copiedLineMsg ? 'คัดลอกข้อความแล้ว!' : 'คัดลอกผลตรวจส่ง LINE'}</span>
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer disabled:opacity-50 min-w-[170px]"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {isSaving
                      ? 'กำลังบันทึก...'
                      : actionType === 'refer'
                      ? 'ยืนยันส่งต่อแพทย์ (Refer)'
                      : actionType === 'request_more_info'
                      ? 'ส่งคำขอถ่ายภาพซ่อม (Request Retake)'
                      : 'บันทึกและส่งคำแนะนำ (Save & Send)'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
