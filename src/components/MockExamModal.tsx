import React, { useState, useEffect } from 'react';
import { Question, MOSSubject, ExamResult } from '../types/mos';
import { THEORY_QUESTIONS } from '../data/theoryQuestions';
import { recordExamResult } from '../utils/storage';
import { getCurrentUser, getTeacherForSubject, sendSubmissionToTeacher } from '../utils/userStore';
import { soundManager } from '../utils/audio';
import { unifiedLoggingService } from '../services/unifiedLoggingService';
import { shuffleArray } from '../utils/shuffle';
import confetti from 'canvas-confetti';
import { ExamCountdownTimer } from './exam/ExamCountdownTimer';
import { 
  Clock, 
  Award, 
  CheckCircle2, 
  XCircle, 
  Bookmark, 
  ArrowRight, 
  ArrowLeft, 
  RotateCcw, 
  HelpCircle,
  AlertTriangle,
  Compass,
  FileCheck,
  ShieldCheck,
  Mail,
  Send,
  Sparkles,
  Printer
} from 'lucide-react';

interface MockExamModalProps {
  selectedSubject: MOSSubject;
  onClose: () => void;
  onStatsUpdate: () => void;
  onOpenCertificate?: (subject: string, score: number) => void;
}

export const MockExamModal: React.FC<MockExamModalProps> = ({
  selectedSubject,
  onClose,
  onStatsUpdate,
  onOpenCertificate,
}) => {
  // Select exam pool: 15-20 questions based on subject
  const examPool: Question[] = React.useMemo(() => {
    let pool = THEORY_QUESTIONS;
    if (selectedSubject !== 'all') {
      pool = THEORY_QUESTIONS.filter(q => q.subject === selectedSubject);
    }
    // Uniform shuffle and pick 15 questions or entire pool if <= 15
    const shuffled = shuffleArray(pool);
    return shuffled.slice(0, Math.min(15, shuffled.length));
  }, [selectedSubject]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(50 * 60); // 50 minutes standard MOS
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'wrong' | 'marked'>('all');
  const [assignedTeacher, setAssignedTeacher] = useState<any>(null);

  // Auto-submit when timer expires

  // Clean auto-submit when timer expires
  useEffect(() => {
    if (timeLeftSeconds === 0 && !isSubmitted) {
      handleSubmitExam();
    }
  }, [timeLeftSeconds, isSubmitted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectAnswer = (optionId: string) => {
    if (isSubmitted) return;
    const currentQ = examPool[currentIndex];
    setUserAnswers(prev => ({
      ...prev,
      [currentQ.id]: optionId,
    }));
  };

  const toggleReviewMark = (qId: string) => {
    setMarkedForReview(prev => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  const handleSubmitExam = () => {
    setShowConfirmSubmit(false);
    setIsSubmitted(true);

    let totalPoints = 0;
    let earnedPoints = 0;
    let correctCount = 0;
    const domainScores: Record<string, { total: number; correct: number }> = {};

    examPool.forEach(q => {
      totalPoints += q.points;
      const isCorrect = userAnswers[q.id] === q.correctAnswer;
      if (isCorrect) {
        earnedPoints += q.points;
        correctCount += 1;
      }

      if (!domainScores[q.domainName]) {
        domainScores[q.domainName] = { total: 0, correct: 0 };
      }
      domainScores[q.domainName].total += 1;
      if (isCorrect) {
        domainScores[q.domainName].correct += 1;
      }
    });

    // Score on 1000 scale like Certiport
    const finalScore = Math.round((earnedPoints / (totalPoints || 1)) * 1000);
    const passed = finalScore >= 700;

    const result: ExamResult = {
      id: `exam-${Date.now()}`,
      date: new Date().toLocaleDateString('vi-VN'),
      subject: selectedSubject === 'all' ? 'mixed' : selectedSubject,
      score: finalScore,
      passed,
      timeSpentSeconds: 50 * 60 - timeLeftSeconds,
      totalQuestions: examPool.length,
      correctCount,
      domainScores,
    };

    setExamResult(result);
    recordExamResult(result);
    onStatsUpdate();

    // Dual-write quiz attempt to PostgreSQL and Google Sheets transparently
    const activeUser = getCurrentUser();
    unifiedLoggingService.trackQuizAttempt({
      attemptId: result.id,
      userId: activeUser?.id,
      userName: activeUser?.name,
      userEmail: activeUser?.email,
      subject: result.subject,
      quizType: 'mock-exam',
      score: result.score,
      totalScore: 1000,
      percentage: Math.round((result.score / 1000) * 100),
      passed: result.passed,
      correctCount: result.correctCount,
      totalQuestions: result.totalQuestions,
      durationSeconds: result.timeSpentSeconds,
      notes: `Thi thử MOS ${result.subject.toUpperCase()} (1000đ chuẩn Certiport)`,
    }).catch((e) => console.warn('Mock exam attempt logging deferred:', e));

    // Prepare wrong questions breakdown
    const wrongQuestions = examPool
      .filter(q => userAnswers[q.id] !== q.correctAnswer)
      .map(q => {
        const userChoice = q.options.find(o => o.id === userAnswers[q.id]);
        const correctChoice = q.options.find(o => o.id === q.correctAnswer);
        return {
          title: q.title,
          domainName: q.domainName,
          userAnswerText: userChoice ? `[${userChoice.id.toUpperCase()}] ${userChoice.text}` : 'Chưa chọn',
          correctAnswerText: correctChoice ? `[${correctChoice.id.toUpperCase()}] ${correctChoice.text}` : q.correctAnswer,
          officialRibbonPath: q.officialRibbonPath,
          explanation: q.explanation,
        };
      });

    // Auto-send result to teacher
    const user = getCurrentUser();
    const teacher = getTeacherForSubject(selectedSubject === 'all' ? (user.targetSubject || 'excel') : selectedSubject);
    setAssignedTeacher(teacher);

    sendSubmissionToTeacher({
      studentId: user.id || 'usr-default',
      studentName: user.name,
      studentCode: user.studentCode || 'HV-2026',
      classRoom: user.classRoom || 'Lớp MOS',
      subject: selectedSubject === 'all' ? 'mixed' : selectedSubject,
      type: 'mock-exam',
      score: finalScore,
      passed,
      timeSpentSeconds: 50 * 60 - timeLeftSeconds,
      totalQuestions: examPool.length,
      correctCount,
      teacherId: teacher.id,
      teacherName: teacher.name,
      domainScores,
      wrongQuestions,
    });

    if (passed) {
      soundManager.playPassFanfare();
      try {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // Safe fallback
      }
    } else {
      soundManager.playWrong();
    }
  };

  const currentQ = examPool[currentIndex];
  const answeredCount = Object.keys(userAnswers).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex flex-col justify-between overflow-y-auto p-3 sm:p-6">
      <div className="max-w-5xl w-full mx-auto my-auto bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Exam Top Header */}
        <div className="bg-slate-950 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              <h2 className="text-base sm:text-lg font-bold">
                Kỳ Thi Thử Chuẩn Quốc Tế MOS (Certiport Standard)
              </h2>
            </div>
            <div className="text-xs text-slate-400 font-medium">
              Chế độ: {selectedSubject === 'all' ? 'Tổng Hợp (Word, Excel, PPT)' : selectedSubject.toUpperCase()} · Điểm chuẩn đạt: 700 / 1000
            </div>
          </div>

          {!isSubmitted && (
            <div className="flex items-center gap-3">
              {/* Authentic Certiport Countdown Timer with Pause/Resume */}
              <ExamCountdownTimer
                initialSeconds={50 * 60}
                currentSeconds={timeLeftSeconds}
                onTick={(t) => setTimeLeftSeconds(t)}
                onExpire={handleSubmitExam}
                variant="hud"
                allowPause={true}
                totalTasks={examPool.length}
                completedTasks={Object.keys(userAnswers).length}
                examTitle={`Kỳ Thi Thử MOS ${selectedSubject.toUpperCase()}`}
              />

              <button
                onClick={() => setShowConfirmSubmit(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0 shadow-sm"
              >
                Nộp Bài Thi
              </button>
            </div>
          )}

          {isSubmitted && (
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors"
            >
              Đóng & Thoát
            </button>
          )}
        </div>

        {/* Content area: Active Exam or Score Report */}
        {!isSubmitted ? (
          <div className="p-6 sm:p-8 flex-1">
            {/* Progress status */}
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span>Câu {currentIndex + 1} / {examPool.length}</span>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-slate-700">{currentQ.domainName}</span>
              </div>
              <div>
                Đã làm: <span className="font-mono font-bold text-blue-600">{answeredCount}</span> / {examPool.length} câu
              </div>
            </div>

            {/* Question detail */}
            <div className="mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">
                {currentQ.title}
              </h3>
              {currentQ.scenario && (
                <div className="p-4 bg-slate-50 border-l-4 border-blue-500 rounded-r-lg text-sm text-slate-700 leading-relaxed mb-6">
                  {currentQ.scenario}
                </div>
              )}

              {/* Options */}
              <div className="space-y-3">
                {currentQ.options.map(opt => {
                  const isSelected = userAnswers[currentQ.id] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectAnswer(opt.id)}
                      className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 text-blue-950 font-medium shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {opt.id.toUpperCase()}
                      </span>
                      <span className="text-sm leading-relaxed">{opt.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Nav & Review Marker */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-slate-100">
              <button
                onClick={() => toggleReviewMark(currentQ.id)}
                className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 ${
                  markedForReview[currentQ.id]
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>
                  {markedForReview[currentQ.id] ? 'Đã đánh dấu xem lại' : 'Đánh dấu xem lại (Mark for Review)'}
                </span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Câu trước</span>
                </button>

                <button
                  onClick={() => setCurrentIndex(prev => Math.min(examPool.length - 1, prev + 1))}
                  disabled={currentIndex === examPool.length - 1}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <span>Câu tiếp theo</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Question Quick Palette Bar */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Bảng điều hướng câu hỏi:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {examPool.map((q, idx) => {
                  const isCurrent = idx === currentIndex;
                  const isAnswered = !!userAnswers[q.id];
                  const isMarked = markedForReview[q.id];

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(idx)}
                      className={`w-8 h-8 rounded-lg text-xs font-mono font-bold transition-all relative border ${
                        isCurrent
                          ? 'ring-2 ring-blue-500 border-blue-600 bg-blue-600 text-white'
                          : isMarked
                          ? 'bg-amber-100 border-amber-300 text-amber-900'
                          : isAnswered
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      {idx + 1}
                      {isMarked && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Post-Exam Official Score Report */
          <div className="p-6 sm:p-8 flex-1 overflow-y-auto max-h-[80vh]">
            <div className="text-center mb-8">
              <div
                className={`w-20 h-20 rounded-2xl mx-auto flex items-center justify-center text-white mb-4 shadow-lg ${
                  examResult?.passed ? 'bg-emerald-600' : 'bg-red-600'
                }`}
              >
                <Award className="w-10 h-10" />
              </div>
              <span className="text-xs uppercase tracking-widest text-slate-400 font-bold block mb-1">
                KẾT QUẢ BÀI THI CERTIPORT MOS
              </span>
              <h3 className="text-3xl font-extrabold text-slate-900 mb-2">
                {examResult?.score} / 1000 ĐIỂM
              </h3>
              <div
                className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold tracking-wide ${
                  examResult?.passed
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {examResult?.passed ? 'ĐẠT CHỨNG CHỈ (PASS)' : 'CHƯA ĐẠT (DID NOT PASS - CẦN >= 700)'}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Thời gian làm bài: {Math.floor((examResult?.timeSpentSeconds || 0) / 60)} phút {(examResult?.timeSpentSeconds || 0) % 60} giây · Đúng {examResult?.correctCount} / {examResult?.totalQuestions} câu
              </p>

              {/* Automatic Teacher Notification Badge */}
              <div className="mt-4 max-w-lg mx-auto p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-left flex items-start gap-3 shadow-2xs">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="flex-1 text-xs">
                  <div className="font-bold text-blue-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Đã Gửi Báo Cáo Kết Quả Đến Giáo Viên Phụ Trách Môn!</span>
                  </div>
                  <p className="text-blue-800 text-[11px] mt-0.5">
                    Hệ thống đã tự động chuyển bài làm của bạn đến <strong>{assignedTeacher ? assignedTeacher.name : 'Giảng viên phụ trách bộ môn'}</strong> ({assignedTeacher?.email || 'Bộ môn Khảo thí'}). Thầy/Cô sẽ xem xét các câu sai và gửi lời nhận xét trực tiếp cho bạn.
                  </p>
                </div>
              </div>

              {/* Certificate Claim Button if Passed */}
              {examResult?.passed && onOpenCertificate && (
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={() => {
                      soundManager.playClick();
                      onOpenCertificate(selectedSubject, examResult.score);
                    }}
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 transform hover:-translate-y-0.5"
                  >
                    <Award className="w-4 h-4 text-amber-200" />
                    <span>Xem & In Giấy Chứng Nhận Năng Lực MOS (Certiport)</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                  </button>
                </div>
              )}
            </div>

            {/* Domain Mastery Breakdown */}
            <div className="bg-slate-50 rounded-xl p-5 mb-8 border border-slate-200">
              <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-600" />
                <span>Năng Lực Theo Từng Mục Tiêu (Objective Domains)</span>
              </h4>
              <div className="space-y-3">
                {examResult &&
                  Object.entries(examResult.domainScores).map(([dom, score]) => {
                    const percent = Math.round((score.correct / score.total) * 100);
                    return (
                      <div key={dom}>
                        <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-1">
                          <span>{dom}</span>
                          <span className="font-mono tabular-nums">{score.correct}/{score.total} ({percent}%)</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              percent >= 80
                                ? 'bg-emerald-500'
                                : percent >= 60
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Question Review Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-slate-900">
                  Xem Lại Đáp Án & Hướng Dẫn Thao Tác
                </h4>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                  <button
                    onClick={() => setReviewFilter('all')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded ${
                      reviewFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Tất cả ({examPool.length})
                  </button>
                  <button
                    onClick={() => setReviewFilter('wrong')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded ${
                      reviewFilter === 'wrong' ? 'bg-white text-red-600 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Câu sai ({examPool.filter(q => userAnswers[q.id] !== q.correctAnswer).length})
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {examPool
                  .filter(q => {
                    if (reviewFilter === 'wrong') return userAnswers[q.id] !== q.correctAnswer;
                    return true;
                  })
                  .map((q, idx) => {
                    const chosen = userAnswers[q.id];
                    const isCorrect = chosen === q.correctAnswer;

                    return (
                      <div
                        key={q.id}
                        className={`p-4 rounded-xl border ${
                          isCorrect ? 'border-emerald-200 bg-emerald-50/30' : 'border-red-200 bg-red-50/30'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <span className="font-bold text-sm text-slate-900">
                            {idx + 1}. {q.title}
                          </span>
                          {isCorrect ? (
                            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 shrink-0">
                              <CheckCircle2 className="w-4 h-4" /> Đúng
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-red-700 flex items-center gap-1 shrink-0">
                              <XCircle className="w-4 h-4" /> Sai
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-600 mb-2">
                          <span className="font-semibold">Bạn đã chọn: </span>
                          <span className={isCorrect ? 'text-emerald-700 font-bold' : 'text-red-600 font-bold'}>
                            {chosen ? chosen.toUpperCase() : 'Chưa chọn'}
                          </span>
                          {!isCorrect && (
                            <span className="ml-3 font-semibold text-emerald-700">
                              Đáp án đúng: {q.correctAnswer.toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                          <div>
                            <span className="font-semibold text-blue-700">Thao tác chuẩn: </span>
                            <span className="font-mono font-medium">{q.officialRibbonPath}</span>
                          </div>
                          <div>{q.explanation}</div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* Submit Confirmation Modal Overlay */}
        {showConfirmSubmit && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
              <div className="flex items-center gap-3 text-amber-600 mb-3">
                <AlertTriangle className="w-6 h-6" />
                <h4 className="text-lg font-bold text-slate-900">Xác Nhận Nộp Bài Thi</h4>
              </div>
              <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                Bạn đã trả lời <strong className="text-slate-900">{answeredCount}</strong> trên tổng số <strong className="text-slate-900">{examPool.length}</strong> câu hỏi.
                {answeredCount < examPool.length && (
                  <span className="block mt-1 text-red-600 font-medium">
                    (Vẫn còn {examPool.length - answeredCount} câu chưa có câu trả lời).
                  </span>
                )}
                Bạn có chắc chắn muốn nộp bài và chấm điểm ngay bây giờ?
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowConfirmSubmit(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Tiếp tục làm bài
                </button>
                <button
                  onClick={handleSubmitExam}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Xác nhận nộp bài
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
