'use client';

import React, { useState, useEffect } from 'react';
import { DailyReport, ReviewAction, UserRole, PhotoQualityEvaluation } from '@/lib/types';
import { StatusBadge } from '@/components/common/StatusBadge';
import { dbService } from '@/lib/db-service';
import { useAppStore } from '@/lib/store';
import {
  X,
  Lock,
  Send,
  MessageSquare,
  ShieldAlert,
  Stethoscope,
  ZoomIn,
  Check,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Copy,
  Smartphone,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Camera,
  HeartPulse,
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
  'มุมกล้องไม่ตรงตามเกณฑ์',
  'สวมแว่นตาหรือผ้าคลุมบดบังแผล',
];

export function CaseReviewModal({
  report,
  currentUserRole,
  onClose,
  onPerformAction,
}: CaseReviewModalProps) {
  const { protocol, cases } = useAppStore();
  const currentCase = cases.find((c) => c.id === report.caseId);

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
  const [showInternalNotes, setShowInternalNotes] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedLineMsg, setCopiedLineMsg] = useState(false);

  // Post-Save Confirmation Modal State
  const [showPostSaveModal, setShowPostSaveModal] = useState(false);

  // Real LINE Push Notification State
  const [isSendingLinePush, setIsSendingLinePush] = useState(false);
  const [linePushStatus, setLinePushStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const isLineLinked = Boolean(currentCase?.lineUserId && currentCase.lineUserId.trim().startsWith('U'));

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
        return `• ${name}${v.reason ? ` (${v.reason})` : ''}`;
      });

    if (retakeList.length === 0) return;

    const msg = `เรียนคุณ ${report.patientName} เจ้าหน้าที่ได้ตรวจสอบภาพประจำวันแล้ว ขอความกรุณาถ่ายภาพซ่อมเพิ่มเติมเฉพาะมุมดังนี้ค่ะ:\n${retakeList.join(
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

  const handleSendRealLinePush = async () => {
    const targetLineId = (currentCase?.lineUserId || (typeof window !== 'undefined' ? localStorage.getItem('ud_patient_line_user_id') || '' : '')).trim();

    if (!targetLineId || !targetLineId.startsWith('U')) {
      handleCopyReviewForLine();
      return;
    }

    setIsSendingLinePush(true);
    setLinePushStatus(null);

    const retakeAngs = Object.entries(photoEvaluations)
      .filter(([_, evalItem]) => evalItem.status === 'retake_required')
      .map(([code]) => {
        const angDef = protocol.angles.find((a) => a.key === code);
        return {
          key: code,
          labelThai: angDef ? angDef.labelThai : code,
        };
      });

    try {
      const res = await fetch('/api/line/push-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toLineUserId: targetLineId,
          patientName: report.patientName,
          hn: report.hn,
          postOpDay: report.postOpDay,
          messageType: actionType === 'request_more_info' ? 'retake_request' : 'doctor_feedback',
          customerMessage: customerMessage || 'แผลแห้งดี ไม่มีความผิดปกติ ติดตามอาการตามรอบนัดค่ะ',
          retakeAngles: retakeAngs,
          doctorOrStaffName: report.assignedDoctorName || 'ทีมแพทย์ UD Clinic',
          caseId: report.caseId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setLinePushStatus({
          success: true,
          message: `ส่งข้อความเข้า LINE คนไข้เรียบร้อยแล้ว`,
        });
        if (typeof window !== 'undefined') {
          localStorage.setItem('ud_patient_line_user_id', targetLineId);
        }
      } else {
        setLinePushStatus({
          success: false,
          message: data.error || 'ไม่สามารถส่งข้อความได้',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
      setLinePushStatus({ success: false, message: msg });
    } finally {
      setIsSendingLinePush(false);
    }
  };

  const handleCopyReviewForLine = () => {
    const statusText =
      actionType === 'reviewed'
        ? 'ปกติเรียบร้อยดี (ตามเกณฑ์ฟื้นตัว)'
        : actionType === 'request_more_info'
        ? 'ขอความกรุณาถ่ายภาพซ่อมบางมุม'
        : 'แพทย์กำลังตรวจประเมินเพิ่มเติม';

    const textToCopy = [
      `🏥 UD CLINIC TORO — ผลการประเมินอาการหลังผ่าตัด`,
      `👤 คนไข้: คุณ${report.patientName} (HN: ${report.hn})`,
      `📅 ระยะเวลา: D+${report.postOpDay} หลังผ่าตัด`,
      `🩺 สถานะการฟื้นตัว: ${statusText}`,
      doctorOrders ? `📋 คำสั่งแพทย์: ${doctorOrders}` : '',
      customerMessage ? `💬 คำแนะนำ: ${customerMessage}` : '',
      `📞 ติดต่อสอบถามคลินิก: 081-456-7890`,
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard.writeText(textToCopy);
    setCopiedLineMsg(true);
    setTimeout(() => setCopiedLineMsg(false), 2500);
  };

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
              : 'พยาบาลผู้ดูแล (Care Staff)',
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
            : 'พยาบาลผู้ดูแล (Care Staff)',
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

      // Instead of closing immediately, show post-save confirmation modal
      setIsSaving(false);
      setShowPostSaveModal(true);
    } catch (err) {
      console.error('Error saving review action:', err);
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-5 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto animate-fadeIn">
        {/* Header - Clean & Focused (No duplicate LINE/copy buttons) */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
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
              <p className="text-xs text-slate-400 mt-0.5">
                ส่งเมื่อ: {report.submittedAt || report.reportDate} | ศัลยแพทย์:{' '}
                {report.assignedDoctorName || 'นพ.สมชาย'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={report.status} />
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              title="ปิดหน้าต่าง"
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
                <span>ตรวจคุณภาพภาพถ่าย 5 มุม</span>
              </h4>
              <span className="text-[11px] text-slate-500 font-mono">
                {report.photos.length} มุมภาพ
              </span>
            </div>

            {/* Main Preview with high-res display */}
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
                        placeholder="หรือพิมพ์ระบุเพิ่มเติม..."
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
                  <span>สร้างข้อความขอถ่ายซ่อม ({retakeAnglesCount} มุม) ลงในกล่องแจ้งคนไข้</span>
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
            {/* Symptoms Data - Compact Horizontal Status Chips */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <HeartPulse className="w-3.5 h-3.5 text-blue-600" />
                  <span>อาการที่คนไข้รายงาน</span>
                </h4>
                <span className="text-[10px] text-slate-500">ประเมินตนเอง</span>
              </div>

              {/* Horizontal Chips */}
              <div className="flex flex-wrap gap-1.5">
                {/* Pain Score Chip */}
                <div
                  className={`px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-1 ${
                    report.symptomAnswers.painScore >= 7
                      ? 'bg-rose-50 border-rose-200 text-rose-700 font-bold'
                      : report.symptomAnswers.painScore >= 4
                      ? 'bg-amber-50 border-amber-200 text-amber-700 font-bold'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}
                >
                  <span className="text-slate-500 text-[11px]">ปวด:</span>
                  <span>{report.symptomAnswers.painScore}/10</span>
                </div>

                {/* Swelling Level Chip */}
                <div className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1">
                  <span className="text-slate-500 text-[11px]">บวม:</span>
                  <span>
                    {report.symptomAnswers.swellingLevel === 'decreasing'
                      ? 'ลดลง'
                      : report.symptomAnswers.swellingLevel === 'same'
                      ? 'ใกล้เคียงเดิม'
                      : 'บวมมากขึ้น'}
                  </span>
                </div>

                {/* Bleeding/Discharge Chip */}
                <div
                  className={`px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-1 ${
                    report.symptomAnswers.bleedingOrDischarge === 'heavy_fresh'
                      ? 'bg-rose-50 border-rose-200 text-rose-700 font-bold'
                      : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="text-slate-500 text-[11px]">แผล:</span>
                  <span>
                    {report.symptomAnswers.bleedingOrDischarge === 'none'
                      ? 'แห้งดี'
                      : report.symptomAnswers.bleedingOrDischarge === 'mild_serous'
                      ? 'ซึมเล็กน้อย'
                      : 'ซึมมาก (เฝ้าระวัง)'}
                  </span>
                </div>

                {/* Fever Chip */}
                <div
                  className={`px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-1 ${
                    report.symptomAnswers.feverStatus === 'high'
                      ? 'bg-rose-50 border-rose-200 text-rose-700 font-bold'
                      : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="text-slate-500 text-[11px]">ไข้:</span>
                  <span>
                    {report.symptomAnswers.feverStatus === 'none'
                      ? 'ไม่มี'
                      : report.symptomAnswers.feverStatus === 'mild'
                      ? 'รุมๆ'
                      : 'มีไข้สูง'}
                  </span>
                </div>
              </div>

              {/* Patient Note if provided */}
              {report.patientNote && (
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 mt-1">
                  <span className="text-slate-500 block text-[10px] font-semibold mb-0.5">
                    ข้อความจากคนไข้:
                  </span>
                  <p className="italic text-slate-800">&ldquo;{report.patientNote}&rdquo;</p>
                </div>
              )}
            </div>

            {/* Action Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5 pt-3 border-t border-slate-200">
              {/* Segmented 3-Choice Action Control */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-900 block">
                  ผลการตรวจประเมิน
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                  {/* Option 1: Reviewed (Normal) */}
                  <button
                    type="button"
                    onClick={() => setActionType('reviewed')}
                    className={`py-2 px-1.5 rounded-lg text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                      actionType === 'reviewed'
                        ? 'bg-white text-emerald-700 shadow-sm border border-emerald-300 font-bold ring-1 ring-emerald-500/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    <div className="flex items-center gap-1 text-xs font-bold">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>แผลปกติ</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-normal">ตามเกณฑ์ฟื้นตัว</span>
                  </button>

                  {/* Option 2: Request More Info (Retake) */}
                  <button
                    type="button"
                    onClick={() => setActionType('request_more_info')}
                    className={`py-2 px-1.5 rounded-lg text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                      actionType === 'request_more_info'
                        ? 'bg-white text-amber-700 shadow-sm border border-amber-300 font-bold ring-1 ring-amber-500/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    <div className="flex items-center gap-1 text-xs font-bold">
                      <Camera className="w-3.5 h-3.5 text-amber-600" />
                      <span>ขอถ่ายซ่อม</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-normal">
                      {retakeAnglesCount > 0 ? `${retakeAnglesCount} มุม` : 'ภาพไม่ชัด'}
                    </span>
                  </button>

                  {/* Option 3: Refer */}
                  <button
                    type="button"
                    onClick={() => setActionType('refer')}
                    className={`py-2 px-1.5 rounded-lg text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                      actionType === 'refer'
                        ? 'bg-white text-purple-700 shadow-sm border border-purple-300 font-bold ring-1 ring-purple-500/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    <div className="flex items-center gap-1 text-xs font-bold">
                      <Stethoscope className="w-3.5 h-3.5 text-purple-600" />
                      <span>ส่งต่อแพทย์</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-normal">ให้แพทย์ประเมิน</span>
                  </button>
                </div>
              </div>

              {/* Doctor Escalation Options if Refer Chosen */}
              {actionType === 'refer' && (
                <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200 space-y-2.5 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                      <Stethoscope className="w-4 h-4 text-purple-700" />
                      <span>ระดับความเร่งด่วน</span>
                    </span>
                    <div className="flex gap-1">
                      {(['routine', 'urgent', 'emergency'] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setEscalationPriority(p)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                            escalationPriority === p
                              ? p === 'emergency'
                                ? 'bg-red-600 text-white shadow-xs'
                                : p === 'urgent'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-purple-600 text-white shadow-xs'
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
                        นพ.สมชาย เกียรติเวชช์ (แพทย์เจ้าของไข้)
                      </option>
                      <option value="พญ.นภา วงศ์สุริยา">
                        พญ.นภา วงศ์สุริยา (ศัลยแพทย์ตกแต่ง)
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

              {/* PRIMARY TEXTAREA: Customer Message (Direct to Patient LINE) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                    <span>ข้อความแจ้งคนไข้ (ส่งทาง LINE)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowTemplates(!showTemplates)}
                    className="text-[10px] text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-md font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Sparkles className="w-3 h-3 text-blue-600" />
                    <span>{showTemplates ? 'ซ่อนเทมเพลต' : 'ข้อความสำเร็จรูป'}</span>
                  </button>
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
                  placeholder="พิมพ์ข้อความตอบกลับหรือคำแนะนำการดูแลแผลแก่คนไข้..."
                  onChange={(e) => setCustomerMessage(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-blue-200 bg-blue-50/20 text-slate-900 focus:outline-hidden focus:border-blue-400"
                />
              </div>

              {/* COLLAPSIBLE ACCORDION: Internal Notes & Doctor Orders */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/60">
                <button
                  type="button"
                  onClick={() => setShowInternalNotes(!showInternalNotes)}
                  className="w-full px-3 py-2 text-left flex items-center justify-between text-xs text-slate-700 font-semibold hover:bg-slate-100/80 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    <span>บันทึกช่วยจำภายในคลินิก (เฉพาะเจ้าหน้าที่)</span>
                    <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-sm font-bold">
                      คนไข้ไม่เห็น
                    </span>
                  </div>
                  {showInternalNotes ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {showInternalNotes && (
                  <div className="p-3 pt-1 space-y-2.5 border-t border-slate-200 bg-white animate-fadeIn">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        คำแนะนำ / วินิจฉัยของแพทย์:
                      </label>
                      <input
                        type="text"
                        placeholder="เช่น แผลแห้งดี ให้ประคบอุ่นต่อเนื่อง ทายาลดรอยช้ำ..."
                        value={doctorOrders}
                        onChange={(e) => setDoctorOrders(e.target.value)}
                        className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:outline-hidden focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        บันทึกอาการและข้อสังเกตภายในคลินิก:
                      </label>
                      <textarea
                        rows={2}
                        value={internalNote}
                        placeholder="บันทึกข้อมูลทางคลินิกเพื่อส่งต่อทีมแพทย์และพยาบาล..."
                        onChange={(e) => setInternalNote(e.target.value)}
                        className="w-full text-xs p-2 rounded-xl border border-amber-200 bg-amber-50/20 text-slate-900 focus:outline-hidden focus:border-amber-400"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Action Bar: Clean, Single Primary Action CTA */}
              <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSaving}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                >
                  ปิด
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer disabled:opacity-50 ${
                    actionType === 'refer'
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : actionType === 'request_more_info'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {isSaving
                      ? 'กำลังบันทึก...'
                      : actionType === 'refer'
                      ? 'ยืนยันส่งต่อแพทย์'
                      : actionType === 'request_more_info'
                      ? `ยืนยันขอถ่ายซ่อม (${retakeAnglesCount > 0 ? `${retakeAnglesCount} มุม` : 'เลือกมุม'})`
                      : 'บันทึกผลตรวจ (แผลปกติ)'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* POST-SAVE CONFIRMATION MODAL (Step 2: Smooth Notification Decision) */}
      {showPostSaveModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-base text-slate-900">บันทึกผลตรวจเรียบร้อยแล้ว</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                บันทึกการประเมินเข้าระบบคลินิกเรียบร้อย คุณต้องการส่งข้อความแจ้งเตือนผลตรวจนี้เข้า LINE ของคนไข้ทันทีเลยหรือไม่?
              </p>
            </div>

            {/* Notification Summary Preview */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-200 pb-1">
                <span>คนไข้: <strong className="text-slate-800">{report.patientName}</strong></span>
                <span>HN: <strong className="font-mono text-slate-800">{report.hn}</strong></span>
              </div>
              <div className="text-slate-700 text-[11px]">
                <span className="font-semibold text-slate-900 block mb-0.5">ข้อความที่จะส่ง:</span>
                <p className="line-clamp-3 italic text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
                  {customerMessage || (actionType === 'request_more_info' ? 'ขอความกรุณาถ่ายภาพซ่อมเพิ่มเติม...' : 'แผลแห้งดี ไม่มีความผิดปกติค่ะ')}
                </p>
              </div>
            </div>

            {/* Status Message if LINE was sent */}
            {linePushStatus && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center justify-between border ${
                  linePushStatus.success
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                    : 'bg-amber-50 border-amber-300 text-amber-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  {linePushStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                  <span>{linePushStatus.message}</span>
                </div>
              </div>
            )}

            {/* Post-Save Actions */}
            <div className="space-y-2 pt-1">
              {!linePushStatus?.success ? (
                isLineLinked ? (
                  <>
                    <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>ผูก LINE กับระบบเรียบร้อยแล้ว</span>
                      </span>
                      <span className="text-[10px] text-emerald-600 font-mono">พร้อมส่งอัตโนมัติ</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSendRealLinePush()}
                      disabled={isSendingLinePush}
                      className="w-full py-3 rounded-xl bg-[#06C755] hover:bg-[#05b34c] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer disabled:opacity-50"
                    >
                      {isSendingLinePush ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>กำลังส่งเข้า LINE คนไข้...</span>
                        </>
                      ) : (
                        <>
                          <Smartphone className="w-4 h-4" />
                          <span>ส่งข้อความเข้า LINE คนไข้ทันที</span>
                        </>
                      )}
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={handleCopyReviewForLine}
                        className="py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        {copiedLineMsg ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700 font-bold">คัดลอกแล้ว!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>คัดลอกข้อความ</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={onClose}
                        className="py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
                      >
                        ปิดหน้าต่าง
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-amber-950">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>คนไข้ยังไม่ได้เข้าสู่ระบบผ่าน LINE</span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        คนไข้ยังไม่ได้เปิดเว็บผ่าน LINE OA คุณสามารถกดปุ่มคัดลอกข้อความด้านล่าง เพื่อนำไปวางส่งในห้องแชทของคลินิกได้ทันทีค่ะ
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyReviewForLine}
                      className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
                    >
                      {copiedLineMsg ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-300" />
                          <span>คัดลอกข้อความแล้ว! นำไปวางในแชท LINE ได้ทันที</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>คัดลอกข้อความส่งทาง LINE</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
                    >
                      ปิดหน้าต่าง
                    </button>
                  </>
                )
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  เสร็จสิ้น (ปิดหน้าต่าง)
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
