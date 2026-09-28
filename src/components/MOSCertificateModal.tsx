import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { UserProfile } from '../types/user';
import { soundManager } from '../utils/audio';
import { 
  Award, 
  Printer, 
  Download, 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  Calendar, 
  QrCode,
  Sparkles
} from 'lucide-react';

interface MOSCertificateModalProps {
  user: UserProfile;
  subject: 'word' | 'excel' | 'powerpoint' | 'mixed' | string;
  score: number;
  isOpen: boolean;
  onClose: () => void;
}

export const MOSCertificateModal: React.FC<MOSCertificateModalProps> = ({
  user,
  subject,
  score,
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    if (isOpen) {
      soundManager.playPassFanfare();
      // Burst confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const subjectName = 
    subject === 'word' ? 'MOS Word Associate (MO-100)' :
    subject === 'excel' ? 'MOS Excel Associate (MO-200)' :
    subject === 'powerpoint' ? 'MOS PowerPoint Associate (MO-300)' :
    'Microsoft Office Specialist Master';

  const certNumber = 'MOS-' + Math.abs((user.name.length * 37 + score * 13)).toString(16).toUpperCase() + '-' + new Date().getFullYear();
  const dateFormatted = new Date().toLocaleDateString('vi-VN');

  const handlePrint = () => {
    soundManager.playClick();
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl shadow-2xl border border-amber-200 max-w-3xl w-full overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 print:shadow-none print:border-none print:max-w-none">
        {/* Modal Top Actions (Hidden when printing) */}
        <div className="px-6 py-3 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
            <Sparkles className="w-4 h-4" />
            <span>Chứng Chỉ Hoàn Thành Đạt Chuẩn Khảo Thí Quốc Tế</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In Chứng Chỉ (Print / PDF)</span>
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Certificate Canvas Sheet */}
        <div className="p-8 sm:p-12 bg-linear-to-b from-amber-50/40 via-white to-amber-50/30 relative border-8 border-double border-amber-600/40 m-2 rounded-xl">
          {/* Watermark Logo Background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
            <Award className="w-96 h-96 text-slate-900" />
          </div>

          {/* Top Seal & Heading */}
          <div className="text-center relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-linear-to-tr from-amber-600 to-amber-400 text-white shadow-md mb-3">
              <Award className="w-8 h-8" />
            </div>

            <div className="text-xs font-bold tracking-[0.25em] text-amber-800 uppercase">
              CERTIFICATE OF ACHIEVEMENT
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 mt-1 tracking-wide">
              CHỨNG NHẬN NĂNG LỰC TIN HỌC QUỐC TẾ
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Chương trình chuẩn khảo thí Microsoft Office Specialist (Certiport & IIG Vietnam)
            </p>
          </div>

          {/* Recipient Details */}
          <div className="text-center mt-6 relative z-10">
            <p className="text-xs text-slate-500 italic">Chứng nhận học viên:</p>
            <h2 className="text-2xl sm:text-3xl font-serif font-extrabold text-blue-900 underline decoration-amber-400 decoration-2 underline-offset-8 mt-1">
              {user.name}
            </h2>
            <div className="text-xs text-slate-600 mt-3 font-medium">
              Mã học viên: <strong className="text-slate-800">{user.studentCode || 'HV-2026'}</strong> · Đơn vị/Lớp: <strong className="text-slate-800">{user.classRoom || 'Lớp MOS'}</strong>
            </div>
          </div>

          {/* Achievement Description */}
          <div className="text-center mt-6 max-w-xl mx-auto text-xs sm:text-sm text-slate-700 leading-relaxed relative z-10">
            Đã hoàn thành xuất sắc kỳ thi thử sát hạch mô phỏng chuẩn Certiport 50 phút môn:
            <div className="text-base sm:text-lg font-bold text-slate-900 mt-1 font-serif">
              {subjectName}
            </div>
            <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 bg-amber-100/80 border border-amber-300 rounded-full text-xs font-bold text-amber-900">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Điểm số đạt được: {score} / 1000 điểm (Chuẩn đạt {'>='} 700)</span>
            </div>
          </div>

          {/* Footer Signatures and Verification */}
          <div className="mt-10 pt-6 border-t border-slate-200 grid grid-cols-3 items-end text-center text-xs relative z-10">
            {/* Left: Teacher Verification */}
            <div>
              <div className="font-serif italic text-blue-900 font-bold text-sm mb-1">
                {user.assignedTeacherName}
              </div>
              <div className="h-0.5 w-32 bg-slate-300 mx-auto mb-1"></div>
              <div className="text-[10px] text-slate-500 font-medium">Giảng Viên Phụ Trách Môn</div>
              <div className="text-[9px] text-slate-400">{user.assignedTeacherEmail}</div>
            </div>

            {/* Center: Stamp Seal */}
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-amber-600/70 flex flex-col items-center justify-center text-amber-700 p-1">
                <ShieldCheck className="w-6 h-6 text-amber-600" />
                <span className="text-[7px] font-black uppercase tracking-tighter">VERIFIED</span>
              </div>
              <span className="text-[9px] font-mono text-slate-400 mt-1">{certNumber}</span>
            </div>

            {/* Right: Exam Director */}
            <div>
              <div className="font-serif italic text-blue-900 font-bold text-sm mb-1">
                TS. Phạm Minh Đức
              </div>
              <div className="h-0.5 w-32 bg-slate-300 mx-auto mb-1"></div>
              <div className="text-[10px] text-slate-500 font-medium">Trưởng Ban Khảo Thí MOS</div>
              <div className="text-[9px] text-slate-400">Ngày cấp: {dateFormatted}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
