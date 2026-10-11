'use client';

import React, { useState } from 'react';
import { AlertCircle, Phone, X, ShieldAlert } from 'lucide-react';

export function EmergencyNotice() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded-r-md text-amber-900 text-xs shadow-xs mb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">ข้อควรทราบ:</span> Web App นี้ไม่ใช่ช่องทางฉุกเฉิน หากมีอาการเลือดออกเฉียบพลัน แน่นหน้าอก หรือปวดรุนแรงผิดปกติ กรุณาติดต่อสายด่วนคลินิกทันที
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="text-amber-800 font-medium underline hover:text-amber-950 shrink-0 cursor-pointer"
          >
            เบอร์ติดต่อ
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-slate-100">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="p-2.5 bg-red-100 rounded-xl">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">ช่องทางติดต่อฉุกเฉิน 24 ชม.</h3>
                <p className="text-xs text-slate-500">UD Clinic Post-Op Urgent Care</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              หากท่านมีภาวะแทรกซ้อนเฉียบพลัน เช่น มีก้อนเลือดคั่งโตเร็ว (Hematoma), แผลฉีกขาด, หายใจติดขัด หรือหมดสติ <strong className="text-red-700">ห้ามรอคำตอบในระบบ</strong> กรุณาโทรติดต่อเจ้าหน้าที่หรือเดินทางไปยังโรงพยาบาลที่ใกล้ที่สุดทันที
            </p>

            <div className="space-y-2 mb-5">
              <a
                href="tel:021234567"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">สายด่วนพยาบาลดูแลเคส (24 ชม.)</div>
                    <div className="font-bold text-slate-900 text-sm">081-456-7890</div>
                  </div>
                </div>
                <span className="text-xs bg-blue-600 text-white font-medium px-3 py-1.5 rounded-lg">
                  โทรออก
                </span>
              </a>

              <a
                href="tel:029876543"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-200 text-slate-700 rounded-lg">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">เบอร์โทรศัพท์คลินิกส่วนกลาง</div>
                    <div className="font-bold text-slate-900 text-sm">02-123-4567 (10:00 - 20:00)</div>
                  </div>
                </div>
                <span className="text-xs bg-slate-800 text-white font-medium px-3 py-1.5 rounded-lg">
                  โทรออก
                </span>
              </a>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="w-full py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}
    </>
  );
}
