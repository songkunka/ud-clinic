'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { ReportPhoto, SymptomAnswers, DailyReport } from '@/lib/types';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmergencyNotice } from '@/components/common/EmergencyNotice';
import { CameraGuideCapture } from './CameraGuideCapture';
import { SymptomQuestionnaire } from './SymptomQuestionnaire';
import { ReportReviewSubmit } from './ReportReviewSubmit';
import { ReportSuccessModal } from './ReportSuccessModal';
import {
  Shield,
  Calendar,
  User,
  Activity,
  ArrowRight,
  Camera,
  FileCheck2,
  Clock,
  Eye,
  HelpCircle,
  MessageSquare,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

export function PatientHomeView() {
  const {
    activeCase,
    activePatient,
    activeCaseReports,
    protocol,
    submitDailyReport,
  } = useAppStore();

  // Wizard state: 'home' | 'capture' | 'symptoms' | 'review' | 'success' | 'view_report'
  const [currentStep, setCurrentStep] = useState<
    'home' | 'capture' | 'symptoms' | 'review' | 'success' | 'view_report'
  >('home');

  const [capturedPhotos, setCapturedPhotos] = useState<ReportPhoto[]>([]);
  const [symptomAnswers, setSymptomAnswers] = useState<SymptomAnswers>({
    painScore: 2,
    swellingLevel: 'same',
    bleedingOrDischarge: 'none',
    feverStatus: 'none',
    numbnessOrTightness: 'normal_tight',
    patientNote: '',
    hasConcerningSymptoms: false,
  });

  const [submittedReport, setSubmittedReport] = useState<DailyReport | null>(null);
  const [selectedReportToView, setSelectedReportToView] = useState<DailyReport | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Latest report for active case
  const latestReport = activeCaseReports[0] || null;

  // Calculate current post-op day
  const calculatePostOpDay = () => {
    if (!activeCase) return 1;
    const surgDate = new Date(activeCase.surgeryDate);
    const now = new Date();
    const diff = Math.floor(
      (now.getTime() - surgDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.max(1, diff);
  };

  const postOpDay = calculatePostOpDay();

  // Handle Photo Capture callback
  const handlePhotoCaptured = (photo: ReportPhoto) => {
    setCapturedPhotos((prev) => {
      const filtered = prev.filter((p) => p.angleKey !== photo.angleKey);
      return [...filtered, photo];
    });
  };

  // Submit report
  const handleFinalSubmit = () => {
    if (!activeCase) return;
    setIsSubmitting(true);

    setTimeout(() => {
      const rep = submitDailyReport(
        activeCase.id,
        capturedPhotos,
        symptomAnswers
      );
      setIsSubmitting(false);
      if (rep) {
        setSubmittedReport(rep);
        setCurrentStep('success');
      }
    }, 700);
  };

  // Render Step Content
  if (currentStep === 'capture') {
    return (
      <div className="max-w-md mx-auto p-2 sm:p-4">
        <CameraGuideCapture
          angles={protocol.angles}
          capturedPhotos={capturedPhotos}
          onPhotoCaptured={handlePhotoCaptured}
          onComplete={() => setCurrentStep('symptoms')}
          onBack={() => setCurrentStep('home')}
          postOpDay={postOpDay}
        />
      </div>
    );
  }

  if (currentStep === 'symptoms') {
    return (
      <div className="max-w-md mx-auto p-2 sm:p-4">
        <SymptomQuestionnaire
          initialAnswers={symptomAnswers}
          onSave={(ans) => {
            setSymptomAnswers(ans);
            setCurrentStep('review');
          }}
          onBack={() => setCurrentStep('capture')}
        />
      </div>
    );
  }

  if (currentStep === 'review') {
    return (
      <div className="max-w-md mx-auto p-2 sm:p-4">
        <ReportReviewSubmit
          photos={capturedPhotos}
          answers={symptomAnswers}
          postOpDay={postOpDay}
          onEditPhotos={() => setCurrentStep('capture')}
          onEditSymptoms={() => setCurrentStep('symptoms')}
          onSubmit={handleFinalSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    );
  }

  if (currentStep === 'success' && submittedReport) {
    return (
      <div className="max-w-md mx-auto p-2 sm:p-4">
        <ReportSuccessModal
          report={submittedReport}
          onClose={() => {
            setCurrentStep('home');
            setCapturedPhotos([]);
          }}
        />
      </div>
    );
  }

  if (currentStep === 'view_report' && selectedReportToView) {
    return (
      <div className="max-w-md mx-auto p-2 sm:p-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-[11px] text-slate-500 font-mono">
                {selectedReportToView.id.toUpperCase()}
              </span>
              <h3 className="font-bold text-slate-900 text-sm">
                รายงานประจำวัน (D+{selectedReportToView.postOpDay})
              </h3>
            </div>
            <StatusBadge status={selectedReportToView.status} />
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800">
              ภาพถ่ายใบหน้า ({selectedReportToView.photos.length} มุม)
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {selectedReportToView.photos.map((p) => (
                <div key={p.id} className="text-center space-y-1">
                  <div className="aspect-3/4 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.photoUrl}
                      alt={p.angleNameThai}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-[10px] text-slate-600 font-medium">
                    {p.angleNameThai}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">ระดับความปวด:</span>
              <span className="font-bold text-slate-800">
                {selectedReportToView.symptomAnswers.painScore}/10
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">อาการบวม:</span>
              <span className="font-semibold text-slate-800">
                {selectedReportToView.symptomAnswers.swellingLevel === 'decreasing'
                  ? 'ยุบลง'
                  : selectedReportToView.symptomAnswers.swellingLevel === 'same'
                  ? 'ใกล้เคียงเดิม'
                  : 'บวมมากขึ้น'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">เวลาส่งรายงาน:</span>
              <span className="font-medium text-slate-700">
                {selectedReportToView.submittedAt}
              </span>
            </div>
          </div>

          {selectedReportToView.latestCustomerMessage && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1 text-xs">
              <span className="font-bold text-blue-900 block">
                คำแนะนำจากทีมแพทย์/พยาบาล:
              </span>
              <p className="text-blue-800 leading-relaxed">
                {selectedReportToView.latestCustomerMessage}
              </p>
            </div>
          )}

          <button
            onClick={() => setCurrentStep('home')}
            className="w-full py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
          >
            ย้อนกลับ
          </button>
        </div>
      </div>
    );
  }

  // DEFAULT: Patient Home Dashboard
  return (
    <div className="max-w-md mx-auto px-3 py-4 space-y-4">
      {/* Clinic Header / In-App LINE Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-700 text-white flex items-center justify-center font-bold text-xs tracking-wider shadow-sm">
            UD
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-xs leading-none">
              UD Clinic Post-Op Care
            </h2>
            <p className="text-[10px] text-slate-500 mt-0.5">
              ระบบติดตามผลหลังผ่าตัดดึงหน้า
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
          <Shield className="w-3 h-3 text-emerald-600" />
          <span>เข้ารหัสความปลอดภัย</span>
        </div>
      </div>

      {/* Emergency Warning Banner */}
      <EmergencyNotice />

      {/* Patient & Surgery Case Summary Card */}
      <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-semibold tracking-wider text-blue-300 uppercase">
              ข้อมูลคนไข้ & การผ่าตัด
            </span>
            <h3 className="font-bold text-sm text-white mt-0.5">
              {activeCase?.patientName}
            </h3>
            <p className="text-xs text-blue-200 font-mono">
              HN: {activeCase?.hn}
            </p>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 rounded-full bg-blue-600 text-white font-extrabold text-xs shadow-xs">
              ระยะ D+{postOpDay}
            </span>
            <div className="text-[10px] text-slate-400 mt-1">
              ผ่าตัดเมื่อ: {activeCase?.surgeryDate}
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs text-slate-300">
          <div>
            <span className="text-[10px] text-slate-400 block">หัตถการ:</span>
            <span className="font-medium text-slate-100">
              {activeCase?.serviceType}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">ศัลยแพทย์:</span>
            <span className="font-medium text-slate-100">
              {activeCase?.surgeonName.split(' ')[0]} {activeCase?.surgeonName.split(' ')[1]}
            </span>
          </div>
        </div>
      </div>

      {/* Today's Daily Report Action Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3.5">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <h4 className="font-bold text-slate-900 text-xs">
              รายงานประจำวัน (วันนี้ D+{postOpDay})
            </h4>
          </div>

          {latestReport ? (
            <StatusBadge status={latestReport.status} size="sm" />
          ) : (
            <StatusBadge status="draft" size="sm" />
          )}
        </div>

        {/* Dynamic Card Body based on Status */}
        {latestReport?.status === 'more_info_requested' ? (
          /* Case: Staff requested more info */
          <div className="space-y-3">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-800">
                <HelpCircle className="w-4 h-4 text-amber-600" />
                <span>ทีมดูแลขอข้อมูลหรือภาพเพิ่มเติม</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-950">
                &ldquo;{latestReport.latestCustomerMessage}&rdquo;
              </p>
            </div>

            <button
              onClick={() => {
                setCapturedPhotos([]);
                setCurrentStep('capture');
              }}
              className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>ถ่ายภาพ/ส่งข้อมูลเพิ่มเติมทันที</span>
            </button>
          </div>
        ) : latestReport?.status === 'reviewed' ? (
          /* Case: Doctor has reviewed */
          <div className="space-y-3">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                <span>แพทย์ตรวจสอบเรียบร้อยแล้ว</span>
              </div>
              <p className="text-[11px] leading-relaxed text-emerald-950">
                {latestReport.latestCustomerMessage ||
                  'แผลสมานตัวดีตามกำหนดเวลา ดูแลแผลตามคำแนะนำได้ตามปกติค่ะ'}
              </p>
            </div>

            <button
              onClick={() => {
                setSelectedReportToView(latestReport);
                setCurrentStep('view_report');
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>เปิดดูรายละเอียดรายงานที่ส่งแล้ว</span>
            </button>
          </div>
        ) : latestReport?.status === 'pending_review' ||
          latestReport?.status === 'referred_to_doctor' ? (
          /* Case: Submitted and waiting review */
          <div className="space-y-3">
            <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-blue-900 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-blue-800">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>ส่งรายงานแล้ว — รอทีมดูแลตรวจสอบ</span>
              </div>
              <p className="text-[11px] leading-relaxed text-blue-700">
                ส่งเมื่อเวลา {latestReport.submittedAt} ทีมพยาบาลจะคัดกรองตามคิวงานและแจ้งกลับในระบบค่ะ
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedReportToView(latestReport);
                  setCurrentStep('view_report');
                }}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center justify-center gap-1 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>ดูภาพที่ส่งไป</span>
              </button>

              <button
                onClick={() => {
                  setCapturedPhotos([]);
                  setCurrentStep('capture');
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold hover:bg-blue-100 flex items-center justify-center gap-1 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>ส่งรายงานใหม่</span>
              </button>
            </div>
          </div>
        ) : (
          /* Case: Not started / draft */
          <div className="space-y-3">
            <p className="text-xs text-slate-600 leading-relaxed">
              กรุณาถ่ายภาพใบหน้า 5 มุม และตอบแบบสอบถามอาการประจำวัน เพื่อให้ทีมแพทย์ประเมินความก้าวหน้าของการฟื้นตัว
            </p>

            <button
              onClick={() => {
                setCapturedPhotos([]);
                setCurrentStep('capture');
              }}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>เริ่มรายงานอาการวันนี้ (ถ่ายภาพ 5 มุม)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Past Reports History Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
        <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span>ประวัติการส่งรายงานหลังผ่าตัด ({activeCaseReports.length} รายการ)</span>
        </h4>

        {activeCaseReports.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            ยังไม่มีประวัติการส่งรายงานของเคสนี้
          </div>
        ) : (
          <div className="space-y-2">
            {activeCaseReports.map((rep) => (
              <div
                key={rep.id}
                onClick={() => {
                  setSelectedReportToView(rep);
                  setCurrentStep('view_report');
                }}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-200 transition-colors cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-800">
                      รายงาน D+{rep.postOpDay}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ({rep.reportDate})
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    ภาพ {rep.photos.length} มุม • ปวด {rep.symptomAnswers.painScore}/10
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge status={rep.status} size="sm" />
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
