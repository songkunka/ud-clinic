'use client';

import React, { useState } from 'react';
import { SymptomAnswers } from '@/lib/types';
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  HeartPulse,
  Thermometer,
  ShieldAlert,
  Info,
} from 'lucide-react';

interface SymptomQuestionnaireProps {
  initialAnswers?: SymptomAnswers;
  onSave: (answers: SymptomAnswers) => void;
  onBack: () => void;
}

export function SymptomQuestionnaire({
  initialAnswers,
  onSave,
  onBack,
}: SymptomQuestionnaireProps) {
  const [painScore, setPainScore] = useState<number>(
    initialAnswers?.painScore ?? 2
  );
  const [swellingLevel, setSwellingLevel] = useState<
    'decreasing' | 'same' | 'increasing'
  >(initialAnswers?.swellingLevel ?? 'same');
  const [bleedingOrDischarge, setBleedingOrDischarge] = useState<
    'none' | 'mild_serous' | 'heavy_fresh'
  >(initialAnswers?.bleedingOrDischarge ?? 'none');
  const [feverStatus, setFeverStatus] = useState<'none' | 'mild' | 'high'>(
    initialAnswers?.feverStatus ?? 'none'
  );
  const [numbnessOrTightness, setNumbnessOrTightness] = useState<
    'normal_tight' | 'mild_numbness' | 'severe_abnormal'
  >(initialAnswers?.numbnessOrTightness ?? 'normal_tight');
  const [hasConcerningSymptoms, setHasConcerningSymptoms] = useState<boolean>(
    initialAnswers?.hasConcerningSymptoms ?? false
  );
  const [patientNote, setPatientNote] = useState<string>(
    initialAnswers?.patientNote ?? ''
  );

  const isSevere =
    painScore >= 7 ||
    bleedingOrDischarge === 'heavy_fresh' ||
    feverStatus === 'high' ||
    hasConcerningSymptoms;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      painScore,
      swellingLevel,
      bleedingOrDischarge,
      feverStatus,
      numbnessOrTightness,
      hasConcerningSymptoms,
      patientNote,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>กลับไปดูรูปถ่าย</span>
        </button>
        <h3 className="font-bold text-slate-900 text-sm">
          แบบสอบถามอาการประจำวัน
        </h3>
        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
          ขั้นตอนที่ 2/3
        </span>
      </div>

      <div className="p-4 sm:p-5 space-y-6 flex-1 overflow-y-auto">
        {/* Pain Score (0 - 10) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <HeartPulse className="w-4 h-4 text-rose-500" />
              <span>1. ระดับความปวดแผลผ่าตัด (0 - 10)</span>
            </label>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                painScore >= 7
                  ? 'bg-red-100 text-red-700'
                  : painScore >= 4
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              ระดับ {painScore}/10{' '}
              {painScore === 0
                ? '(ไม่ปวดเลย)'
                : painScore <= 3
                ? '(ปวดเล็กน้อย)'
                : painScore <= 6
                ? '(ปวดปานกลาง)'
                : '(ปวดมากรุนแรง)'}
            </span>
          </div>

          <div className="grid grid-cols-11 gap-1 pt-1">
            {Array.from({ length: 11 }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPainScore(i)}
                className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  painScore === i
                    ? i >= 7
                      ? 'bg-red-600 text-white shadow-md'
                      : i >= 4
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {i}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 px-1">
            <span>0 = ไม่ปวดเลย</span>
            <span>5 = ปวดปานกลาง</span>
            <span>10 = ปวดทนไม่ไหว</span>
          </div>
        </div>

        {/* Swelling Comparison */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-800 block">
            2. อาการบวมบริเวณใบหน้าเทียบกับเมื่อวาน
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'decreasing', label: 'ยุบลงกว่าเดิม', desc: 'อาการบวมดีขึ้น' },
              { id: 'same', label: 'ใกล้เคียงเดิม', desc: 'บวมเท่าๆ เดิม' },
              { id: 'increasing', label: 'บวมมากขึ้น', desc: 'บวมตึงขึ้นชัดเจน' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() =>
                  setSwellingLevel(
                    opt.id as 'decreasing' | 'same' | 'increasing'
                  )
                }
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  swellingLevel === opt.id
                    ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-500'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="text-xs font-bold text-slate-800">
                  {opt.label}
                </div>
                <div className="text-[10px] text-slate-500">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Bleeding / Discharge */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-800 block">
            3. การซึมของเลือดหรือน้ำเหลืองบริเวณรอยแผล
          </label>
          <div className="space-y-1.5">
            {[
              {
                id: 'none',
                label: 'ไม่มีเลือดหรือน้ำเหลืองซึม (แผลแห้งสนิท)',
                tag: 'ปกติ',
              },
              {
                id: 'mild_serous',
                label: 'มีน้ำเหลืองหรือเลือดจางๆ ซึมเล็กน้อยบนผ้าก๊อซ',
                tag: 'เฝ้าระวัง',
              },
              {
                id: 'heavy_fresh',
                label: 'มีเลือดสดซึมต่อเนื่อง ชุ่มผ้าก๊อซ หรือมีก้อนบวมนูนขึ้นเร็ว',
                tag: 'เร่งด่วน',
              },
            ].map((opt) => (
              <label
                key={opt.id}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  bleedingOrDischarge === opt.id
                    ? opt.id === 'heavy_fresh'
                      ? 'border-red-500 bg-red-50/60 ring-1 ring-red-400'
                      : 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-500'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="bleeding"
                  checked={bleedingOrDischarge === opt.id}
                  onChange={() =>
                    setBleedingOrDischarge(
                      opt.id as 'none' | 'mild_serous' | 'heavy_fresh'
                    )
                  }
                  className="mt-0.5 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="text-xs font-medium text-slate-800 leading-snug">
                    {opt.label}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Fever */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Thermometer className="w-4 h-4 text-amber-500" />
            <span>4. อาการไข้หรือหนาวสั่น</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'none', label: 'ไม่มีไข้', sub: 'อุณหภูมิปกติ' },
              { id: 'mild', label: 'รู้สึกรุมๆ', sub: '< 37.8°C' },
              { id: 'high', label: 'มีไข้สูง', sub: '≥ 37.8°C หรือหนาวสั่น' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFeverStatus(f.id as 'none' | 'mild' | 'high')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  feverStatus === f.id
                    ? f.id === 'high'
                      ? 'border-red-500 bg-red-50 text-red-900 ring-1 ring-red-400'
                      : 'border-blue-600 bg-blue-50 text-blue-900 ring-1 ring-blue-500'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="text-xs font-bold">{f.label}</div>
                <div className="text-[10px] text-slate-500">{f.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Tightness / Numbness */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-800 block">
            5. อาการตึงหรือชาบริเวณใบหน้า
          </label>
          <div className="space-y-1.5">
            {[
              { id: 'normal_tight', label: 'รู้สึกตึงตามปกติของการดึงหน้า' },
              { id: 'mild_numbness', label: 'มีอาการชาบริเวณกรอบหน้า/แก้ม แต่ขยับปากและตาได้ปกติ' },
              { id: 'severe_abnormal', label: 'มุมปากตก ยิ้มไม่เท่ากัน หรือกระตุกผิดปกติอย่างเห็นได้ชัด' },
            ].map((n) => (
              <label
                key={n.id}
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                  numbnessOrTightness === n.id
                    ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-500'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="numbness"
                  checked={numbnessOrTightness === n.id}
                  onChange={() =>
                    setNumbnessOrTightness(
                      n.id as 'normal_tight' | 'mild_numbness' | 'severe_abnormal'
                    )
                  }
                  className="mt-0.5 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-800">{n.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Concerning toggle & notes */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="flex items-center gap-2 cursor-pointer p-2 bg-slate-50 rounded-xl border border-slate-200">
            <input
              type="checkbox"
              checked={hasConcerningSymptoms}
              onChange={(e) => setHasConcerningSymptoms(e.target.checked)}
              className="rounded-sm text-red-600 focus:ring-red-500 w-4 h-4"
            />
            <span className="text-xs font-semibold text-slate-800">
              มีข้อกังวลหรืออาการอื่นที่ไม่แน่ใจ ต้องการปรึกษาทีมดูแล
            </span>
          </label>

          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">
              หมายเหตุหรือรายละเอียดเพิ่มเติม (ถ้ามี)
            </label>
            <textarea
              rows={3}
              value={patientNote}
              onChange={(e) => setPatientNote(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden bg-white text-slate-900"
            />
          </div>
        </div>

        {/* Severe Alert Warning Box if triggered */}
        {isSevere && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-red-900 text-xs space-y-1.5 animate-fadeIn">
            <div className="flex items-center gap-2 font-bold text-red-700">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
              <span>คำแนะนำด้านความปลอดภัยจากคลินิก</span>
            </div>
            <p className="text-[11px] leading-relaxed text-red-800">
              จากคำตอบของท่าน มีอาการที่ควรได้รับการดูแลเป็นพิเศษ ทีมแพทย์จะเร่งคัดกรองรายงานนี้ทันที และหากเลือดออกชุ่มหรือปวดรุนแรงเฉียบพลัน กรุณาโทรติดต่อสายด่วน <strong>081-456-7890</strong> ทันที ไม่ควรรอคำตอบในระบบ
            </p>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
        >
          กลับไปดูรูปถ่าย
        </button>

        <button
          type="submit"
          className="flex-1 max-w-xs py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-colors cursor-pointer"
        >
          <span>ไปที่หน้าตรวจทานก่อนส่ง</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}
