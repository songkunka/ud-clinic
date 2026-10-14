'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { ReportPhoto, SymptomAnswers, DailyReport } from '@/lib/types';
import { SILHOUETTE_GUIDES } from '@/lib/svg-silhouettes';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  Camera,
  RotateCcw,
  Check,
  ChevronRight,
  Phone,
  RefreshCw,
  Send,
  FileCheck2,
  X,
  LogIn,
  Upload,
  AlertCircle,
  LogOut,
} from 'lucide-react';
import { dbService } from '@/lib/db-service';

export function ClientCameraPortal() {
  const {
    activeClientCase,
    clientLoginWithPhone,
    clientLogout,
    activeCaseReports,
    protocol,
    submitDailyReport,
  } = useAppStore();

  const angles = protocol.angles;

  // Phone Login State for Elderly Patients
  const [phoneNumberInput, setPhoneNumberInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Camera & Capture State
  const [currentAngleIndex, setCurrentAngleIndex] = useState(0);
  const [capturedPhotos, setCapturedPhotos] = useState<ReportPhoto[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isCapturing, setIsCapturing] = useState(false);

  // Minimal Symptom Modal & Feedback
  const [showSymptomSheet, setShowSymptomSheet] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [submittedReport, setSubmittedReport] = useState<DailyReport | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Per-Angle Retake Guidance
  const [retakeAngles, setRetakeAngles] = useState<string[]>([]);
  const [retakeAdvice, setRetakeAdvice] = useState<string | null>(null);

  // Symptoms values
  const [painScore, setPainScore] = useState<number>(2);
  const [swellingLevel, setSwellingLevel] = useState<'decreasing' | 'same' | 'increasing'>('same');
  const [bleedingOrDischarge, setBleedingOrDischarge] = useState<'none' | 'mild_serous' | 'heavy_fresh'>('none');
  const [feverStatus, setFeverStatus] = useState<'none' | 'mild' | 'high'>('none');
  const [patientNote, setPatientNote] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentAngle = angles[currentAngleIndex];
  const latestReport = activeCaseReports[0] || null;

  // Track retake requests from medical team
  useEffect(() => {
    if (latestReport && latestReport.status === 'more_info_requested') {
      dbService.getPhotoQualityEvaluations(latestReport.id).then((evals) => {
        const needed = evals
          .filter((e) => e.qualityStatus === 'retake_required')
          .map((e) => e.angleCode);
        setRetakeAngles(needed);
        setRetakeAdvice(latestReport.latestCustomerMessage || null);

        if (needed.length > 0) {
          const firstIdx = angles.findIndex((a) => needed.includes(a.key));
          if (firstIdx !== -1) {
            setCurrentAngleIndex(firstIdx);
          }
        }
      });
    } else {
      setRetakeAngles([]);
      setRetakeAdvice(null);
    }
  }, [latestReport, angles]);

  // Post-op day calculation
  const postOpDay = activeClientCase
    ? Math.max(
        1,
        Math.floor(
          (new Date().getTime() - new Date(activeClientCase.surgeryDate).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 1;

  // AUTO-START REAL CAMERA when logged in
  useEffect(() => {
    if (activeClientCase) {
      startRealCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeClientCase, facingMode]);

  const startRealCamera = async () => {
    setPreviewUrl(null);
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('เบราว์เซอร์ไม่รองรับการเปิดกล้อง');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1080 },
          height: { ideal: 1440 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ไม่สามารถเข้าถึงกล้องได้';
      setCameraError(msg);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const toggleFacingMode = () => {
    stopCamera();
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  // REAL CAMERA CAPTURE TO SERVER FILE STORAGE
  const captureRealPhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 960;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (video.videoWidth > 0 && video.readyState >= 2) {
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      } else {
        // Fallback canvas frame when no physical webcam is plugged into PC
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Medical capture backdrop
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.ellipse(canvas.width / 2, canvas.height / 2 - 40, 140, 180, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`ภาพถ่าย: ${currentAngle.labelThai} (D+${postOpDay})`, canvas.width / 2, canvas.height / 2 + 170);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '16px sans-serif';
        ctx.fillText(`HN: ${activeClientCase?.hn || ''} • ${new Date().toLocaleTimeString('th-TH')}`, canvas.width / 2, canvas.height / 2 + 210);
      }

      const base64Image = canvas.toDataURL('image/jpeg', 0.92);

      try {
        // Upload real photo to local server /api/upload
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64Image,
            angleKey: currentAngle.key,
            caseId: activeClientCase?.id || 'unknown',
          }),
        });

        const data = await res.json();
        if (data.url) {
          setPreviewUrl(data.url);
        } else {
          setPreviewUrl(base64Image);
        }
      } catch {
        setPreviewUrl(base64Image);
      }

      stopCamera();
    }
    setIsCapturing(false);
  };

  // REAL FILE UPLOAD (from mobile camera/gallery)
  const handleRealFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Image = reader.result as string;
        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: base64Image,
              angleKey: currentAngle.key,
              caseId: activeClientCase?.id || 'unknown',
            }),
          });
          const data = await res.json();
          setPreviewUrl(data.url || base64Image);
        } catch {
          setPreviewUrl(base64Image);
        }
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
  };

  // Confirm photo & move to next angle
  const handleAcceptPhoto = () => {
    if (!previewUrl) return;

    const newPhoto: ReportPhoto = {
      id: `p-${Date.now()}-${currentAngle.key}`,
      dailyReportId: '',
      angleKey: currentAngle.key,
      angleNameThai: currentAngle.labelThai,
      photoUrl: previewUrl,
      uploadedAt: new Date().toLocaleTimeString('th-TH'),
      sequenceNumber: currentAngleIndex + 1,
    };

    const updated = [
      ...capturedPhotos.filter((p) => p.angleKey !== currentAngle.key),
      newPhoto,
    ];
    setCapturedPhotos(updated);
    setPreviewUrl(null);

    if (currentAngleIndex < angles.length - 1) {
      setCurrentAngleIndex((prev) => prev + 1);
      startRealCamera();
    } else {
      setShowSymptomSheet(true);
    }
  };

  const handleRetake = () => {
    setPreviewUrl(null);
    startRealCamera();
  };

  // Submit report
  const handleFinalSubmit = () => {
    if (!activeClientCase) return;
    setIsSubmitting(true);

    const answers: SymptomAnswers = {
      painScore,
      swellingLevel,
      bleedingOrDischarge,
      feverStatus,
      numbnessOrTightness: 'normal_tight',
      hasConcerningSymptoms: painScore >= 7 || bleedingOrDischarge === 'heavy_fresh',
      patientNote,
    };

    setTimeout(() => {
      const rep = submitDailyReport(activeClientCase.id, capturedPhotos, answers);
      setIsSubmitting(false);
      setShowSymptomSheet(false);
      if (rep) {
        setSubmittedReport(rep);
      }
    }, 500);
  };

  // HANDLE PHONE LOGIN FOR ELDERLY PATIENTS
  const handlePhoneLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const clean = phoneNumberInput.trim().replace(/[^0-9]/g, '');
    if (clean.length < 9) {
      setLoginError('กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (9-10 หลัก)');
      return;
    }

    setIsLoggingIn(true);
    try {
      const matched = await clientLoginWithPhone(clean);
      if (!matched) {
        setLoginError(
          'ไม่พบข้อมูลเคสของเบอร์โทรนี้ในระบบ กรุณาติดต่อคลินิกเพื่อลงทะเบียนก่อนค่ะ'
        );
      }
    } catch {
      setLoginError('เกิดข้อผิดพลาดในการตรวจสอบข้อมูล กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // CASE 1: NOT LOGGED IN YET (Show ultra-simple elderly-friendly phone login)
  if (!activeClientCase) {
    return (
      <div className="w-full min-h-[100dvh] bg-slate-950 text-white flex flex-col justify-center items-center p-6 select-none overscroll-none">
        <div className="max-w-sm w-full space-y-6">
          <div className="text-center space-y-3">
            <div className="w-24 h-24 rounded-2xl overflow-hidden mx-auto shadow-2xl border border-white/10 ring-4 ring-amber-700/20">
              <img
                src="/logo.jpg"
                alt="UD CLINIC TORO"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">
                UD CLINIC TORO
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                ระบบติดตามอาการหลังผ่าตัดดึงหน้า (Face-Lift Care)
              </p>
            </div>
          </div>

          <form
            onSubmit={handlePhoneLoginSubmit}
            className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-5"
          >
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200 block text-center">
                กรุณากรอกเบอร์โทรศัพท์มือถือของท่าน
              </label>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                value={phoneNumberInput}
                onChange={(e) => setPhoneNumberInput(e.target.value)}
                disabled={isLoggingIn}
                className="w-full text-center text-lg font-black tracking-widest py-3.5 px-4 rounded-2xl bg-slate-950 border border-slate-700 text-white focus:outline-hidden focus:border-amber-600 focus:ring-2 focus:ring-amber-600/30 disabled:opacity-50"
                autoFocus
              />
              <p className="text-[11px] text-slate-400 text-center">
                กรอกเพียงครั้งแรกครั้งเดียว ระบบจะจำเครื่องมือถือของท่านไว้ถาวร
              </p>
            </div>

            {loginError && (
              <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl text-red-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-4 rounded-2xl bg-amber-700 hover:bg-amber-600 disabled:bg-amber-900 text-white text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-amber-900/40 active:scale-95 transition-all cursor-pointer"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>กำลังตรวจสอบข้อมูล...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>เข้าสู่ระบบเพื่อถ่ายรูป</span>
                </>
              )}
            </button>
          </form>

          <div className="text-center text-[11px] text-slate-500 space-y-1">
            <p>หากยังไม่ได้ลงทะเบียนเคส กรุณาติดต่อเจ้าหน้าที่คลินิก</p>
            <a
              href="tel:0814567890"
              className="text-amber-400 font-semibold underline block"
            >
              โทร 081-456-7890
            </a>
          </div>
        </div>
      </div>
    );
  }

  // CASE 2: LOGGED IN (SHOW FULL CAMERA CENTERPIECE!)
  const silhouetteOverlay =
    SILHOUETTE_GUIDES[currentAngle.key as keyof typeof SILHOUETTE_GUIDES] ||
    SILHOUETTE_GUIDES.front;

  return (
    <div className="relative w-full h-[100dvh] max-h-[100dvh] max-w-md mx-auto bg-black text-white flex flex-col justify-between overflow-hidden overscroll-none select-none touch-none">
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleRealFileUpload}
        className="hidden"
      />

      {/* TOP OVERLAY BAR (Clean & Minimal) */}
      <div className="absolute top-0 inset-x-0 z-30 p-3 bg-gradient-to-b from-black/90 via-black/40 to-transparent flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/20 shrink-0 shadow-sm">
            <img
              src="/logo.jpg"
              alt="UD Clinic"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="px-2.5 py-1 rounded-full bg-amber-700 text-white text-xs font-black tracking-wide shadow-sm">
            D+{postOpDay}
          </span>
          <span className="text-xs font-medium text-slate-200 truncate max-w-[120px]">
            {activeClientCase.patientName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {latestReport && (
            <button
              onClick={() => setShowFeedbackModal(true)}
              className="text-[11px] font-semibold bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-full text-slate-100 flex items-center gap-1 backdrop-blur-md transition-colors cursor-pointer"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-blue-400" />
              <span>ผลตรวจ</span>
            </button>
          )}

          <button
            onClick={() => setShowEmergencyModal(true)}
            className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer"
            title="ติดต่อสายด่วน"
          >
            <Phone className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={clientLogout}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="ออกจากระบบ"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Retake Notification Banner if Doctor requested retake */}
      {retakeAngles.length > 0 && (
        <div className="absolute top-12 inset-x-3 z-30 pointer-events-auto">
          <div className="bg-amber-950/90 border border-amber-500/50 rounded-2xl p-2.5 shadow-xl backdrop-blur-md text-white text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-300 text-[11px]">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>คุณหมอขอให้ถ่ายซ่อม ({retakeAngles.length} มุม):</span>
            </div>
            {retakeAdvice && (
              <p className="text-[10px] text-amber-100/90 pl-5 italic line-clamp-2">
                &ldquo;{retakeAdvice}&rdquo;
              </p>
            )}
          </div>
        </div>
      )}

      {/* ANGLE TITLE & SUBTLE TIP (Minimal 4 words) */}
      <div
        className={`absolute ${
          retakeAngles.length > 0 ? 'top-26' : 'top-13'
        } inset-x-0 z-20 flex flex-col items-center pointer-events-none transition-all`}
      >
        <div className="bg-black/60 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/10 text-center shadow-lg">
          <span className="text-xs font-bold text-blue-400">
            {currentAngleIndex + 1}/{angles.length} {currentAngle.labelThai}
          </span>
          <span className="text-[11px] text-slate-300 ml-1.5 font-light">
            (เก็บผม ถอดแว่น)
          </span>
        </div>
      </div>

      {/* MAIN CENTER REAL CAMERA VIEWPORT */}
      <div className="relative flex-1 w-full bg-zinc-950 flex items-center justify-center overflow-hidden">
        {/* Real Live Video */}
        <video
          ref={videoRef}
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover ${
            facingMode === 'user' ? 'transform -scale-x-100' : ''
          } ${cameraActive && !previewUrl ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Real Captured Preview */}
        {previewUrl && (
          <div className="absolute inset-0 z-10 bg-black flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-contain"
            />
            <div className="absolute top-20 bg-emerald-600/90 text-white text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1 shadow-md">
              <Check className="w-3.5 h-3.5" />
              <span>ภาพถ่ายพร้อมใช้งาน</span>
            </div>
          </div>
        )}

        {/* Silhouette Overlay Guide */}
        {!previewUrl && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={silhouetteOverlay}
              alt="Guide"
              className="w-full h-full object-contain opacity-40 drop-shadow-md"
            />
          </div>
        )}

        {/* Camera Permission / Error Fallback */}
        {!cameraActive && !previewUrl && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-zinc-950/90 space-y-4">
            <div className="w-16 h-16 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Camera className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-white">กล้องมือถือ</h3>
              <p className="text-xs text-slate-400">
                {cameraError || 'แตะเพื่อเปิดใช้งานกล้องถ่ายภาพจริง'}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={startRealCamera}
                className="px-4 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg transition-transform active:scale-95 cursor-pointer"
              >
                อนุญาตเปิดกล้อง
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 cursor-pointer"
              >
                เลือกรูปจากอัลบั้ม
              </button>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM CONTROLS & ANGLE STRIP */}
      <div className="relative z-30 bg-gradient-to-t from-black via-black/90 to-transparent pt-3 pb-6 px-4 space-y-4">
        {/* Angle Indicator Strip */}
        <div className="flex items-center justify-center gap-1.5 overflow-x-auto py-1">
          {angles.map((ang, idx) => {
            const isTaken = capturedPhotos.some((p) => p.angleKey === ang.key);
            const isCurrent = idx === currentAngleIndex;
            const isRetakeRequested = retakeAngles.includes(ang.key);
            return (
              <button
                key={ang.key}
                onClick={() => {
                  setCurrentAngleIndex(idx);
                  setPreviewUrl(null);
                  startRealCamera();
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-blue-600 text-white ring-2 ring-blue-400 shadow-md scale-105'
                    : isRetakeRequested
                    ? 'bg-amber-950/90 text-amber-300 border border-amber-500 animate-pulse'
                    : isTaken
                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-700/60'
                    : 'bg-white/10 text-slate-400 hover:text-white'
                }`}
              >
                {isTaken ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : isRetakeRequested ? (
                  <span className="text-[9px] font-black text-amber-400">⚠️</span>
                ) : null}
                <span>{ang.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Action Controls */}
        {previewUrl ? (
          /* Preview Mode: Retake vs Confirm */
          <div className="flex items-center justify-center gap-4 py-1">
            <button
              onClick={handleRetake}
              className="flex-1 max-w-[140px] py-3 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>ถ่ายใหม่</span>
            </button>

            <button
              onClick={handleAcceptPhoto}
              className="flex-1 max-w-[180px] py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/40 transition-transform active:scale-95 cursor-pointer"
            >
              <span>ใช้ภาพนี้</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* REAL SHUTTER BUTTON */
          <div className="flex items-center justify-between max-w-xs mx-auto px-2">
            <button
              onClick={toggleFacingMode}
              className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              title="สลับกล้องหน้า/หลัง"
            >
              <RefreshCw className="w-5 h-5 text-slate-200" />
            </button>

            {/* REAL SHUTTER BUTTON */}
            <button
              onClick={captureRealPhoto}
              disabled={isCapturing}
              className="w-20 h-20 rounded-full border-4 border-white/80 p-1 flex items-center justify-center transition-transform active:scale-95 hover:border-white shadow-2xl cursor-pointer"
              title="กดเพื่อถ่ายรูปจริง"
            >
              <div
                className={`w-full h-full rounded-full transition-colors ${
                  isCapturing ? 'bg-red-500 animate-ping' : 'bg-white active:bg-blue-200'
                }`}
              ></div>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              title="เลือกรูปจากอัลบั้ม"
            >
              <Upload className="w-5 h-5 text-slate-200" />
            </button>
          </div>
        )}

        {/* Shortcut to symptom sheet */}
        {capturedPhotos.length > 0 && !previewUrl && (
          <div className="text-center pt-1">
            <button
              onClick={() => setShowSymptomSheet(true)}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-4 cursor-pointer"
            >
              ถ่ายได้แล้ว {capturedPhotos.length}/5 มุม • แตะเพื่อบันทึกอาการและส่งรายงาน
            </button>
          </div>
        )}
      </div>

      {/* MINIMAL SYMPTOM MODAL */}
      {showSymptomSheet && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 p-0 sm:p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 text-white rounded-t-3xl sm:rounded-3xl border border-slate-800 p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-white">
                  บันทึกอาการประจำวัน (D+{postOpDay})
                </h3>
                <p className="text-[11px] text-slate-400">
                  ภาพถ่ายพร้อมส่ง: {capturedPhotos.length} มุมภาพ
                </p>
              </div>
              <button
                onClick={() => setShowSymptomSheet(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pain Score */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-300">1. ระดับความปวดแผล:</span>
                <span
                  className={`font-black ${
                    painScore >= 7
                      ? 'text-red-400'
                      : painScore >= 4
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {painScore}/10
                </span>
              </div>
              <div className="grid grid-cols-11 gap-1">
                {Array.from({ length: 11 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPainScore(i)}
                    className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      painScore === i
                        ? i >= 7
                          ? 'bg-red-600 text-white shadow-md'
                          : i >= 4
                          ? 'bg-amber-500 text-white shadow-md'
                          : 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>

            {/* Swelling */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-300 block">
                2. อาการบวม:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'decreasing', label: 'ยุบลง' },
                  { id: 'same', label: 'เท่าเดิม' },
                  { id: 'increasing', label: 'บวมขึ้น' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSwellingLevel(s.id as typeof swellingLevel)}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      swellingLevel === s.id
                        ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Wound bleeding */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-300 block">
                3. เลือดหรือน้ำเหลืองซึมแผล:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'none', label: 'แผลแห้ง' },
                  { id: 'mild_serous', label: 'ซึมเล็กน้อย' },
                  { id: 'heavy_fresh', label: 'ซึมมาก/เลือดสด' },
                ].map((b) => (
                  <button
                    key={b.id}
                    onClick={() =>
                      setBleedingOrDischarge(b.id as typeof bleedingOrDischarge)
                    }
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      bleedingOrDischarge === b.id
                        ? b.id === 'heavy_fresh'
                          ? 'bg-red-600 border-red-500 text-white shadow-md'
                          : 'bg-blue-600 border-blue-500 text-white shadow-md'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Fever */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-300 block">
                4. อาการไข้:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'none', label: 'ไม่มีไข้' },
                  { id: 'high', label: 'มีไข้ / หนาวสั่น' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFeverStatus(f.id as typeof feverStatus)}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      feverStatus === f.id
                        ? f.id === 'high'
                          ? 'bg-red-600 border-red-500 text-white shadow-md'
                          : 'bg-blue-600 border-blue-500 text-white shadow-md'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-semibold block">
                ข้อความเพิ่มเติมถึงแพทย์ (ถ้ามี)
              </label>
              <input
                type="text"
                value={patientNote}
                onChange={(e) => setPatientNote(e.target.value)}
                className="w-full text-xs p-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-hidden focus:border-amber-500"
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <span>กำลังส่งรายงาน...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>ส่งรายงานให้แพทย์และทีมดูแล</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {submittedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30">
              <Check className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-base text-white">ส่งรายงานสำเร็จ</h3>
              <p className="text-xs text-slate-400">
                รหัสอ้างอิง: {submittedReport.id.toUpperCase()}
              </p>
            </div>

            <div className="p-3 bg-blue-950/60 rounded-xl border border-blue-800/80 text-blue-300 text-xs text-left">
              <span className="font-bold block text-blue-200">
                ส่งรายงานแล้ว — รอทีมดูแลตรวจสอบ
              </span>
              ทีมแพทย์จะตรวจภาพและแจ้งคำแนะนำกลับในระบบตามรอบเวลาค่ะ
            </div>

            <button
              onClick={() => {
                setSubmittedReport(null);
                setCapturedPhotos([]);
                setCurrentAngleIndex(0);
                startRealCamera();
              }}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              ตกลง
            </button>
          </div>
        </div>
      )}

      {/* DOCTOR FEEDBACK MODAL */}
      {showFeedbackModal && latestReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <StatusBadge status={latestReport.status} />
                <span className="text-xs text-slate-400 font-mono">
                  D+{latestReport.postOpDay}
                </span>
              </div>
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {latestReport.latestCustomerMessage ? (
              <div className="p-4 bg-blue-950/70 border border-blue-800 rounded-2xl space-y-1.5">
                <span className="text-xs font-bold text-blue-300 block">
                  คำแนะนำจากแพทย์ / ทีมพยาบาล:
                </span>
                <p className="text-xs text-slate-200 leading-relaxed">
                  &ldquo;{latestReport.latestCustomerMessage}&rdquo;
                </p>
              </div>
            ) : (
              <div className="p-4 bg-slate-800/80 rounded-2xl text-xs text-slate-400">
                รายงานอยู่ในคิวคัดกรอง กำลังรอแพทย์ตรวจสอบภาพถ่ายค่ะ
              </div>
            )}

            <button
              onClick={() => setShowFeedbackModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}

      {/* EMERGENCY MODAL */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-red-600/20 text-red-500 mx-auto flex items-center justify-center">
              <Phone className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-sm text-white">
                สายด่วนฉุกเฉิน 24 ชม.
              </h3>
              <p className="text-[11px] text-slate-400">
                หากมีเลือดออกมากหรือปวดผิดปกติ กรุณาโทรติดต่อทันที
              </p>
            </div>

            <a
              href="tel:0814567890"
              className="flex items-center justify-between p-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg transition-transform active:scale-95 cursor-pointer"
            >
              <span>พยาบาลสายด่วน (24 ชม.)</span>
              <span className="underline">081-456-7890</span>
            </a>

            <button
              onClick={() => setShowEmergencyModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              ปิด
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
