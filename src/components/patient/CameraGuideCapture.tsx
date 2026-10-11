'use client';

import React, { useState, useRef, useEffect } from 'react';
import { PhotoAngleConfig, ReportPhoto } from '@/lib/types';
import { SILHOUETTE_GUIDES, getSamplePhotoUrl } from '@/lib/svg-silhouettes';
import {
  Camera,
  RotateCcw,
  Check,
  Upload,
  Info,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface CameraGuideCaptureProps {
  angles: PhotoAngleConfig[];
  capturedPhotos: ReportPhoto[];
  onPhotoCaptured: (photo: ReportPhoto) => void;
  onComplete: () => void;
  onBack: () => void;
  postOpDay: number;
}

export function CameraGuideCapture({
  angles,
  capturedPhotos,
  onPhotoCaptured,
  onComplete,
  onBack,
  postOpDay,
}: CameraGuideCaptureProps) {
  const [currentAngleIndex, setCurrentAngleIndex] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentAngle = angles[currentAngleIndex];
  const existingPhoto = capturedPhotos.find(
    (p) => p.angleKey === currentAngle.key
  );

  // If already captured for this angle and not previewing new, show existing
  useEffect(() => {
    if (existingPhoto) {
      setPreviewUrl(existingPhoto.photoUrl);
    } else {
      setPreviewUrl(null);
    }
  }, [currentAngleIndex, existingPhoto]);

  // Start live camera
  const startCamera = async () => {
    setCameraError(null);
    setPreviewUrl(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('อุปกรณ์ไม่รองรับการเปิดกล้องผ่านเบราว์เซอร์');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // Front selfie camera
          width: { ideal: 720 },
          height: { ideal: 960 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'ไม่สามารถเข้าถึงกล้องได้';
      setCameraError(
        `${errMsg} กรุณาอนุญาตสิทธิ์การใช้กล้อง หรือเลือกอัปโหลดรูปภาพจากเครื่องแทน`
      );
      setCameraActive(false);
    }
  };

  // Stop live camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Take snapshot from live video
  const captureFromVideo = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 800;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Mirror image if front camera
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setPreviewUrl(dataUrl);
      stopCamera();
    }
  };

  // Instant simulated clinic capture (works flawlessly on desktop or when camera is unavailable)
  const captureSimulatedPhoto = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const sample = getSamplePhotoUrl(
        currentAngle.key,
        postOpDay,
        currentAngle.labelThai
      );
      setPreviewUrl(sample);
      stopCamera();
      setIsProcessing(false);
    }, 400);
  };

  // Handle local file upload fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('ขนาดไฟล์ต้องไม่เกิน 10MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
  };

  // Confirm photo for current angle
  const handleConfirmPhoto = () => {
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

    onPhotoCaptured(newPhoto);

    // If next angle exists, go to next, else complete
    if (currentAngleIndex < angles.length - 1) {
      setCurrentAngleIndex((prev) => prev + 1);
      setPreviewUrl(null);
    } else {
      onComplete();
    }
  };

  const handleRetake = () => {
    setPreviewUrl(null);
  };

  const silhouetteOverlay =
    SILHOUETTE_GUIDES[currentAngle.key as keyof typeof SILHOUETTE_GUIDES] ||
    SILHOUETTE_GUIDES.front;

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white min-h-[560px] rounded-2xl overflow-hidden shadow-xl border border-slate-800">
      {/* Top Header / Angle Selector Indicator */}
      <div className="bg-slate-950/80 p-3 border-b border-slate-800 flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-slate-400 hover:text-white p-1 rounded-md text-xs flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>ย้อนกลับ</span>
        </button>

        <div className="text-center">
          <div className="text-[11px] text-blue-400 font-medium">
            มุมที่ {currentAngleIndex + 1} จาก {angles.length}
          </div>
          <div className="text-sm font-bold text-white tracking-wide">
            {currentAngle.labelThai}
          </div>
        </div>

        <div className="w-12 text-right text-xs text-slate-400">
          D+{postOpDay}
        </div>
      </div>

      {/* Progress Dots */}
      <div className="grid grid-cols-5 gap-1 p-2 bg-slate-950/40">
        {angles.map((ang, idx) => {
          const isDone = capturedPhotos.some((p) => p.angleKey === ang.key);
          const isCurrent = idx === currentAngleIndex;
          return (
            <button
              key={ang.key}
              onClick={() => {
                stopCamera();
                setCurrentAngleIndex(idx);
              }}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                isCurrent
                  ? 'bg-blue-500 ring-2 ring-blue-400/50'
                  : isDone
                  ? 'bg-emerald-500'
                  : 'bg-slate-700'
              }`}
              title={ang.labelThai}
            />
          );
        })}
      </div>

      {/* Viewfinder Viewport */}
      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[380px]">
        {/* Hidden Canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Live Video */}
        <video
          ref={videoRef}
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 ${
            cameraActive && !previewUrl ? 'block' : 'hidden'
          }`}
        />

        {/* Preview of captured image */}
        {previewUrl ? (
          <div className="relative w-full h-full flex items-center justify-center bg-slate-950">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt={currentAngle.labelThai}
              className="max-h-[380px] w-auto object-contain rounded-lg shadow-md"
            />
            <div className="absolute top-3 left-3 bg-emerald-600/90 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm backdrop-blur-xs">
              <Check className="w-3.5 h-3.5" />
              <span>ภาพพร้อมใช้งาน</span>
            </div>
          </div>
        ) : !cameraActive ? (
          /* Guide / Standby screen */
          <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center">
            {/* Background SVG Silhouette */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={silhouetteOverlay}
              alt="Guide Overlay"
              className="absolute inset-0 w-full h-full object-contain opacity-40 pointer-events-none"
            />

            <div className="relative z-10 max-w-xs space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <Camera className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-white">
                คำแนะนำมุม: {currentAngle.labelThai}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {currentAngle.instructionThai}
              </p>
              <div className="text-[11px] text-slate-400 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                แสงไฟสว่างเพียงพอ • ถอดแว่นตา • รวบผมเปิดรอยแผล
              </div>

              {cameraError && (
                <div className="text-xs text-amber-300 bg-amber-950/60 border border-amber-800/80 p-2 rounded-lg text-left flex items-start gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{cameraError}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Active Camera with Silhouette Overlay */
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={silhouetteOverlay}
              alt="Overlay Guide"
              className="w-full h-full object-contain opacity-50"
            />
          </div>
        )}
      </div>

      {/* Viewfinder Controls & Actions */}
      <div className="bg-slate-950 p-4 border-t border-slate-800 space-y-3">
        {previewUrl ? (
          /* When photo is captured, show Retake and Accept */
          <div className="flex items-center gap-3">
            <button
              onClick={handleRetake}
              className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>ถ่ายใหม่</span>
            </button>
            <button
              onClick={handleConfirmPhoto}
              className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-blue-900/30 transition-colors cursor-pointer"
            >
              <span>ใช้ภาพนี้</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : cameraActive ? (
          /* When camera is actively streaming */
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={stopCamera}
              className="text-xs text-slate-400 hover:text-white px-3 py-2"
            >
              ยกเลิก
            </button>

            {/* Shutter Button */}
            <button
              onClick={captureFromVideo}
              className="w-16 h-16 rounded-full bg-white border-4 border-blue-500 flex items-center justify-center shadow-lg active:scale-95 transition-transform cursor-pointer"
              title="กดเพื่อถ่ายภาพ"
            >
              <div className="w-12 h-12 rounded-full bg-blue-600"></div>
            </button>

            {/* Quick simulated capture button */}
            <button
              onClick={captureSimulatedPhoto}
              className="text-xs text-blue-400 hover:text-blue-300 px-3 py-2 flex items-center gap-1"
              title="จำลองภาพทางการแพทย์"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>ภาพจำลอง</span>
            </button>
          </div>
        ) : (
          /* When idle / ready to start capture */
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <button
                onClick={startCamera}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>เปิดกล้องมือถือ</span>
              </button>

              <button
                onClick={captureSimulatedPhoto}
                disabled={isProcessing}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-medium flex items-center justify-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                title="ใช้ภาพตัวอย่างทางการแพทย์ของ UD Clinic"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isProcessing ? 'กำลังโหลด...' : 'ภาพจำลอง'}</span>
              </button>
            </div>

            <div className="flex items-center justify-center pt-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 py-1 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>หรือเลือกรูปจากอัลบั้มในเครื่อง</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
