import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../utils/userStore';
import { loadUserStats } from '../../utils/storage';
import { MOSCertificateModal } from '../../components/MOSCertificateModal';
import { Award, CheckCircle2, XCircle, ArrowRight, RotateCcw, Clock, Trophy, BarChart2 } from 'lucide-react';

export const Result: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const stats = loadUserStats();

  const querySubject = searchParams.get('subject') || 'excel';
  const queryScore = parseInt(searchParams.get('score') || '850', 10);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);

  const passedExam = stats.examHistory.find(e => e.passed) || {
    id: 'exam-sample',
    date: new Date().toLocaleDateString('vi-VN'),
    subject: querySubject,
    score: queryScore,
    totalQuestions: 35,
    correctCount: Math.round((queryScore / 1000) * 35),
    timeSpentSeconds: 2450,
    passed: queryScore >= 700,
  };

  const isPassed = queryScore >= 700;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm text-center space-y-4">
        <div className={`w-20 h-20 rounded-2xl mx-auto flex items-center justify-center shadow-lg ${
          isPassed ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
        }`}>
          {isPassed ? <Award className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
        </div>

        <div>
          <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
            isPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
          }`}>
            {isPassed ? 'ĐẠT CHỨNG CHỈ (PASSED)' : 'CHƯA ĐẠT (FAILED)'}
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-2">
            Báo Cáo Kết Quả Thi Thử Chuẩn MOS
          </h1>
          <p className="text-xs text-slate-500">
            Thí sinh: <b className="text-slate-800">{user.name}</b> · Môn thi: <span className="uppercase font-bold text-blue-600">MOS {querySubject}</span>
          </p>
        </div>

        <div className="flex items-center justify-center gap-6 py-4 border-y border-slate-100">
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase">Điểm Số Đạt Được</div>
            <div className={`text-4xl font-black ${isPassed ? 'text-emerald-600' : 'text-red-600'}`}>
              {queryScore} <span className="text-sm font-semibold text-slate-400">/ 1000</span>
            </div>
          </div>
          <div className="h-10 w-px bg-slate-200" />
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase">Điểm Chuẩn Certiport</div>
            <div className="text-4xl font-black text-slate-700">700</div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
          {isPassed && (
            <button
              onClick={() => setIsCertificateOpen(true)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Trophy className="w-4 h-4" />
              <span>Xem & Tải Chứng Chỉ MOS Quốc Tế</span>
            </button>
          )}

          <Link
            to="/thi-thu"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Thi Lại Đề Khác</span>
          </Link>

          <Link
            to="/"
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all"
          >
            Về Trang Ôn Luyện
          </Link>
        </div>
      </div>

      {/* Exam History List */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-blue-600" />
          <span>Lịch Sử Các Lần Thi Thử Trước</span>
        </h2>

        {stats.examHistory.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            Chưa có bài thi nào được ghi nhận.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {stats.examHistory.slice(0, 5).map((exam, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-800">
                    Bài thi MOS {exam.subject.toUpperCase()}
                  </div>
                  <div className="text-[11px] text-slate-400">{exam.date} · {Math.round(exam.timeSpentSeconds / 60)} phút</div>
                </div>

                <div className="text-right">
                  <span className={`font-black text-sm ${exam.passed ? 'text-emerald-600' : 'text-red-500'}`}>
                    {exam.score} / 1000
                  </span>
                  <div className="text-[10px] uppercase font-bold text-slate-400">
                    {exam.passed ? 'Đạt' : 'Chưa đạt'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Certificate Modal */}
      <MOSCertificateModal
        isOpen={isCertificateOpen}
        user={user}
        subject={querySubject}
        score={queryScore}
        onClose={() => setIsCertificateOpen(false)}
      />
    </div>
  );
};

export default Result;
