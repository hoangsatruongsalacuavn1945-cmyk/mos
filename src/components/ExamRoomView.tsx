import React, { useState, useEffect, useRef } from 'react';
import { MOSSubject, ExamResult } from '../types/mos';
import { UserProfile } from '../types/user';
import { soundManager } from '../utils/audio';
import confetti from 'canvas-confetti';
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
  Sparkles,
  Maximize2,
  Minimize2,
  ChevronRight,
  LogOut,
  Send,
  Eye,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';

interface SanitizedQuestion {
  id: string;
  subject: 'word' | 'excel' | 'powerpoint';
  domainId: string;
  domainName: string;
  difficulty: 'easy' | 'medium' | 'hard';
  type: string;
  title: string;
  scenario?: string;
  options: {
    id: string;
    text: string;
  }[];
  points: number;
}

interface ReviewQuestion {
  id: string;
  subject: string;
  domainName: string;
  title: string;
  scenario?: string;
  options: { id: string; text: string }[];
  userAnswer?: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
  officialRibbonPath: string;
  shortcutTip?: string;
}

interface ExamRoomViewProps {
  selectedSubject: MOSSubject;
  currentUser: UserProfile;
  onExit: () => void;
  onOpenCertificate?: (subject: string, score: number) => void;
  onStatsUpdate?: () => void;
}

const LOCAL_DRAFT_KEY = 'mos_active_exam_draft_v2';

export const ExamRoomView: React.FC<ExamRoomViewProps> = ({
  selectedSubject,
  currentUser,
  onExit,
  onOpenCertificate,
  onStatsUpdate,
}) => {
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string>('');
  const [questions, setQuestions] = useState<SanitizedQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(50 * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  
  // Anti-cheat & Security states
  const [violationsCount, setViolationsCount] = useState(0);
  const [antiCheatLogs, setAntiCheatLogs] = useState<string[]>([]);
  const [antiCheatWarning, setAntiCheatWarning] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Post-exam review states
  const [submissionResult, setSubmissionResult] = useState<any | null>(null);
  const [reviewQuestions, setReviewQuestions] = useState<ReviewQuestion[]>([]);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'wrong' | 'marked'>('all');

  const warningTimeoutRef = useRef<any>(null);

  // Initialize or fetch questions from secure server API
  const startExam = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/exam/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: selectedSubject,
          studentId: currentUser.id,
          studentName: currentUser.name,
          studentCode: currentUser.studentCode,
        }),
      });

      if (!res.ok) {
        throw new Error('Không thể kết nối đến máy chủ thi');
      }

      const data = await res.json();
      setSessionId(data.sessionId);
      setQuestions(data.questions || []);
      setTimeLeftSeconds(data.durationSeconds || 50 * 60);
      setUserAnswers({});
      setMarkedForReview({});
      setIsSubmitted(false);
      setViolationsCount(0);
      setAntiCheatLogs([]);
      setCurrentIndex(0);

      // Save draft starter
      localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify({
        sessionId: data.sessionId,
        subject: selectedSubject,
        userAnswers: {},
        timeLeftSeconds: data.durationSeconds,
      }));
    } catch (err) {
      console.error('Failed to load exam questions from server:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    startExam();
  }, [selectedSubject]);

  // Anti-Cheat: Visibility API (Tab Switch Detection)
  useEffect(() => {
    if (isSubmitted || loading) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation('Thí sinh rời tab trình duyệt hoặc thu nhỏ cửa sổ thi');
      }
    };

    const handleWindowBlur = () => {
      handleViolation('Mất tiêu điểm cửa sổ làm bài (Alt-Tab hoặc click ngoài)');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [isSubmitted, loading, sessionId]);

  const handleViolation = async (reason: string) => {
    if (isSubmitted) return;

    soundManager.playWrong();
    setViolationsCount(prev => prev + 1);

    const timeStr = new Date().toLocaleTimeString('vi-VN');
    const log = `[${timeStr}] ${reason}`;
    setAntiCheatLogs(prev => [...prev, log]);

    setAntiCheatWarning(`⚠️ Cảnh báo Giám Thị: ${reason}! Kỳ thi MOS nghiêm cấm tra cứu tài liệu ngoài.`);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    warningTimeoutRef.current = setTimeout(() => {
      setAntiCheatWarning(null);
    }, 6000);

    // Sync violation to server
    if (sessionId) {
      try {
        await fetch('/api/exam/violation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            reason,
            timestamp: Date.now(),
          }),
        });
      } catch (err) {
        console.error('Error reporting violation to server:', err);
      }
    }
  };

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  // Timer countdown
  useEffect(() => {
    if (isSubmitted || loading) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        // Auto-save local draft
        if (prev % 10 === 0) {
          try {
            localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify({
              sessionId,
              subject: selectedSubject,
              userAnswers,
              timeLeftSeconds: prev - 1,
            }));
          } catch {}
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitted, loading, sessionId, userAnswers]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectAnswer = (optionId: string) => {
    if (isSubmitted) return;
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    soundManager.playClick();
    setUserAnswers(prev => ({
      ...prev,
      [currentQ.id]: optionId,
    }));
  };

  const toggleReviewMark = (qId: string) => {
    soundManager.playClick();
    setMarkedForReview(prev => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  // Submit exam with Authoritative Server Evaluation
  const handleSubmitExam = async () => {
    if (isSubmitted || submitting) return;
    setSubmitting(true);
    setShowConfirmSubmit(false);

    try {
      const timeSpent = (50 * 60) - timeLeftSeconds;
      const res = await fetch('/api/exam/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userAnswers,
          timeSpentSeconds: timeSpent,
          studentId: currentUser.id,
          studentName: currentUser.name,
          studentCode: currentUser.studentCode,
          classRoom: currentUser.classRoom,
          teacherId: currentUser.assignedTeacherId,
          teacherName: currentUser.assignedTeacherName,
          violationsCount,
          antiCheatLogs,
        }),
      });

      if (!res.ok) {
        throw new Error('Lỗi chấm thi từ server');
      }

      const data = await res.json();
      setSubmissionResult(data.submission);
      setReviewQuestions(data.reviewQuestions || []);
      setIsSubmitted(true);
      localStorage.removeItem(LOCAL_DRAFT_KEY);

      if (data.submission?.passed) {
        soundManager.playCorrect();
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
      } else {
        soundManager.playWrong();
      }

      if (onStatsUpdate) onStatsUpdate();
    } catch (err) {
      console.error('Error submitting exam:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Question Navigator items
  const currentQ = questions[currentIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(userAnswers).length;
  const markedCount = Object.values(markedForReview).filter(Boolean).length;

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h3 className="text-xl font-bold text-slate-800">Đang khởi tạo phòng thi chuẩn Certiport...</h3>
        <p className="text-sm text-slate-500 mt-1">Xác thực chứng chỉ thí sinh, nạp đề thi bảo mật từ Server</p>
      </div>
    );
  }

  // ==========================================
  // VIEW 1: POST-EXAM CERTIFIED RESULT DASHBOARD
  // ==========================================
  if (isSubmitted && submissionResult) {
    const passed = submissionResult.passed;
    const score = submissionResult.score;

    // Filter review questions
    const displayReviews = reviewQuestions.filter(q => {
      if (reviewFilter === 'wrong') return !q.isCorrect;
      if (reviewFilter === 'marked') return markedForReview[q.id];
      return true;
    });

    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Top Header */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5 text-center md:text-left">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg ${
                passed 
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/20' 
                  : 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-red-500/20'
              }`}>
                {passed ? <Award className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
              </div>
              <div>
                <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {passed ? 'ĐẠT CHUẨN CERTIPORT (PASSED)' : 'CHƯA ĐẠT (FAILED)'}
                  </span>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs font-medium text-slate-500">
                    Môn: MOS {submissionResult.subject?.toUpperCase()}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {passed ? 'Chúc Mừng! Bạn Đã Vượt Qua Kỳ Thi' : 'Rất Tiếc! Hãy Rèn Luyện Thêm'}
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  Thí sinh: <span className="font-semibold text-slate-800">{currentUser.name}</span> ({currentUser.studentCode})
                  {' '}- GV chấm: <span className="font-semibold text-blue-700">{currentUser.assignedTeacherName}</span>
                </p>
              </div>
            </div>

            {/* Score & Time Badges */}
            <div className="flex items-center gap-4 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 shrink-0">
              <div className="text-center px-3 border-r border-slate-200">
                <span className="text-xs font-semibold text-slate-500 uppercase block">Điểm Chính Thức</span>
                <div className={`text-3xl font-black ${passed ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {score}<span className="text-base text-slate-400 font-semibold">/1000</span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">Điểm đạt: 700</span>
              </div>

              <div className="text-center px-3 border-r border-slate-200">
                <span className="text-xs font-semibold text-slate-500 uppercase block">Thời Gian Làm</span>
                <div className="text-2xl font-bold text-slate-800 mt-1">
                  {Math.floor(submissionResult.timeSpentSeconds / 60)}p {submissionResult.timeSpentSeconds % 60}s
                </div>
                <span className="text-[11px] text-slate-400 font-medium">Quy chuẩn 50 phút</span>
              </div>

              <div className="text-center px-3">
                <span className="text-xs font-semibold text-slate-500 uppercase block">Số Câu Đúng</span>
                <div className="text-2xl font-bold text-slate-800 mt-1">
                  {submissionResult.correctCount}<span className="text-base text-slate-400">/{submissionResult.totalQuestions}</span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  {Math.round((submissionResult.correctCount / submissionResult.totalQuestions) * 100)}% chính xác
                </span>
              </div>
            </div>
          </div>

          {/* Anti-cheat audit badge */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className={`w-5 h-5 ${violationsCount === 0 ? 'text-emerald-600' : 'text-amber-500'}`} />
              <span className="text-xs font-bold text-slate-700">
                Hồ Sơ Giám Sát Phòng Thi (Anti-Cheat Audit):
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                violationsCount === 0 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {violationsCount === 0 ? '✓ 0 Vi Phạm - Bài thi trung thực tuyệt đối' : `⚠️ Ghi nhận ${violationsCount} lần rời màn hình`}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {passed && onOpenCertificate && (
                <button
                  onClick={() => onOpenCertificate(submissionResult.subject, score)}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
                >
                  <Award className="w-4 h-4" />
                  <span>Xem Chứng Chỉ Số Certiport</span>
                </button>
              )}
              <button
                onClick={startExam}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Thi Lại Đề Mới</span>
              </button>
              <button
                onClick={onExit}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
              >
                Trở Về Bảng Tin
              </button>
            </div>
          </div>
        </div>

        {/* Domain Breakdown Cards */}
        {submissionResult.domainScores && Object.keys(submissionResult.domainScores).length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-blue-600" />
              <span>Phân Tích Chi Tiết Theo Lĩnh Vực Đề Thi (Domain Objectives)</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(submissionResult.domainScores).map(([domName, scoreObj]: any) => {
                const pct = Math.round((scoreObj.correct / scoreObj.total) * 100);
                return (
                  <div key={domName} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-slate-800 line-clamp-1">{domName}</span>
                      <span className={`text-xs font-bold ${pct >= 70 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {pct}% ({scoreObj.correct}/{scoreObj.total})
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${pct >= 70 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Detailed Question Review Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Chi Tiết Từng Câu Hỏi & Hướng Dẫn Thao Tác Chuẩn</h2>
              <p className="text-xs text-slate-500 mt-0.5">Đối chiếu đáp án, học đường dẫn Ribbon và phím tắt thi Certiport</p>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setReviewFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  reviewFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất cả ({reviewQuestions.length})
              </button>
              <button
                onClick={() => setReviewFilter('wrong')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  reviewFilter === 'wrong' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-600 hover:text-rose-600'
                }`}
              >
                Câu Sai ({reviewQuestions.filter(q => !q.isCorrect).length})
              </button>
              <button
                onClick={() => setReviewFilter('marked')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  reviewFilter === 'marked' ? 'bg-white text-amber-600 shadow-xs' : 'text-slate-600 hover:text-amber-600'
                }`}
              >
                Đánh Dấu ({reviewQuestions.filter(q => markedForReview[q.id]).length})
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {displayReviews.map((q, idx) => (
              <div 
                key={q.id}
                className={`p-5 rounded-2xl border transition-all ${
                  q.isCorrect 
                    ? 'border-emerald-200 bg-emerald-50/20' 
                    : 'border-rose-200 bg-rose-50/20'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      q.isCorrect ? 'bg-emerald-600' : 'bg-rose-600'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      {q.domainName}
                    </span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    q.isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {q.isCorrect ? '✓ Trả lời Đúng' : '✗ Trả lời Sai'}
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-2">{q.title}</h3>
                {q.scenario && (
                  <p className="text-xs text-slate-600 italic bg-white/70 p-3 rounded-lg border border-slate-200/60 mb-3">
                    &ldquo;{q.scenario}&rdquo;
                  </p>
                )}

                {/* Options List */}
                <div className="grid grid-cols-1 gap-2 mb-3">
                  {q.options.map(opt => {
                    const isSelected = q.userAnswer === opt.id;
                    const isCorrectOpt = q.correctAnswer === opt.id;
                    return (
                      <div
                        key={opt.id}
                        className={`p-2.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                          isCorrectOpt
                            ? 'bg-emerald-100/70 border-emerald-300 font-semibold text-emerald-900'
                            : isSelected
                            ? 'bg-rose-100/70 border-rose-300 font-semibold text-rose-900'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] ${
                          isCorrectOpt ? 'bg-emerald-600 text-white' : isSelected ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {opt.id.toUpperCase()}
                        </span>
                        <span className="flex-1">{opt.text}</span>
                        {isCorrectOpt && <span className="text-emerald-700 font-bold text-[11px]">Đáp án chuẩn</span>}
                        {isSelected && !isCorrectOpt && <span className="text-rose-600 font-bold text-[11px]">Bạn đã chọn</span>}
                      </div>
                    );
                  })}
                </div>

                {/* Official Ribbon Path & Explanation */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  {q.officialRibbonPath && (
                    <div className="flex items-center gap-1.5 text-blue-700 font-semibold">
                      <Compass className="w-3.5 h-3.5 shrink-0" />
                      <span>Đường dẫn Ribbon: <code className="bg-blue-50 px-1.5 py-0.5 rounded font-mono text-[11px]">{q.officialRibbonPath}</code></span>
                    </div>
                  )}
                  {q.shortcutTip && (
                    <div className="text-slate-600 font-medium">
                      💡 Mẹo: <span className="font-semibold text-slate-800">{q.shortcutTip}</span>
                    </div>
                  )}
                  <p className="text-slate-600 leading-relaxed pt-1 border-t border-slate-100">
                    <span className="font-bold text-slate-800">Giải thích:</span> {q.explanation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: FULL CERTIPORT ACTIVE EXAM ROOM VIEW
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Certiport Status Console Bar */}
      <div className="bg-slate-800 border-b border-slate-700/80 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-sm shadow-sm">
            MOS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-wide uppercase">
                MOS {selectedSubject.toUpperCase()} 365/2019 EXAM CONSOLE
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                CHẾ ĐỘ THI CHÍNH THỨC
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Thí sinh: <span className="text-slate-200 font-medium">{currentUser.name}</span> ({currentUser.studentCode})
              {' '}· Lớp: <span className="text-slate-200 font-medium">{currentUser.classRoom || 'MOS-01'}</span>
            </div>
          </div>
        </div>

        {/* Live Countdown Timer & Anti-Cheat Badge */}
        <div className="flex items-center gap-3">
          {/* Anti-cheat shield indicator */}
          <div className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${
            violationsCount === 0 
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' 
              : 'bg-rose-950/60 border-rose-500/40 text-rose-300 animate-pulse'
          }`}>
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{violationsCount === 0 ? 'Giám sát: An Toàn' : `Cảnh báo: ${violationsCount} vi phạm`}</span>
          </div>

          {/* Countdown Clock */}
          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-mono font-bold text-sm sm:text-base ${
            timeLeftSeconds < 300 
              ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse' 
              : 'bg-slate-900 border-slate-700 text-amber-400'
          }`}>
            <Clock className="w-4 h-4 text-amber-400" />
            <span>{formatTime(timeLeftSeconds)}</span>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Toàn màn hình phòng thi'}
            className="p-2 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Exit Exam Button */}
          <button
            onClick={() => {
              if (window.confirm('Bạn có chắc chắn muốn rời khỏi phòng thi? Tiến trình bài thi hiện tại sẽ bị hủy.')) {
                onExit();
              }
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-700/60 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 text-xs font-medium transition-colors flex items-center gap-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Thoát</span>
          </button>
        </div>
      </div>

      {/* Real-time Anti-Cheat Alert Banner */}
      {antiCheatWarning && (
        <div className="bg-rose-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between shadow-lg animate-bounce">
          <div className="flex items-center gap-2 max-w-5xl mx-auto">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{antiCheatWarning}</span>
          </div>
          <button 
            onClick={() => setAntiCheatWarning(null)}
            className="text-white/80 hover:text-white text-xs px-2"
          >
            Đã hiểu
          </button>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Col: Question Card (3 cols) */}
        <div className="lg:col-span-3 flex flex-col justify-between bg-slate-800/90 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-xl">
          {currentQ ? (
            <div>
              {/* Question Task Header */}
              <div className="flex items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-700">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black text-sm flex items-center justify-center">
                    {currentIndex + 1}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                      {currentQ.domainName}
                    </div>
                    <span className="text-xs text-slate-400">
                      Điểm chuẩn câu hỏi: {currentQ.points || 25} điểm
                    </span>
                  </div>
                </div>

                {/* Mark for review toggle */}
                <button
                  onClick={() => toggleReviewMark(currentQ.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    markedForReview[currentQ.id]
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-slate-700/50 text-slate-400 border-slate-600 hover:text-slate-200'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${markedForReview[currentQ.id] ? 'fill-amber-400' : ''}`} />
                  <span>{markedForReview[currentQ.id] ? 'Đã đánh dấu xem lại' : 'Đánh dấu xem lại'}</span>
                </button>
              </div>

              {/* Question Title & Scenario */}
              <div className="mb-6">
                <h2 className="text-base sm:text-lg font-bold text-white leading-relaxed mb-3">
                  {currentQ.title}
                </h2>
                {currentQ.scenario && (
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/80 text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                    <span className="font-semibold text-blue-400 not-italic block mb-1">Tình huống thực tế (Scenario):</span>
                    &ldquo;{currentQ.scenario}&rdquo;
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="space-y-3 mb-8">
                {currentQ.options.map(opt => {
                  const isSelected = userAnswers[currentQ.id] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectAnswer(opt.id)}
                      className={`w-full text-left p-4 rounded-xl border text-sm transition-all flex items-center gap-3.5 cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600/30 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                          : 'bg-slate-900/50 border-slate-700 text-slate-300 hover:bg-slate-700/50 hover:border-slate-600'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {opt.id.toUpperCase()}
                      </span>
                      <span className="flex-1 font-medium">{opt.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400">Không tìm thấy câu hỏi</div>
          )}

          {/* Navigation Controls Bar */}
          <div className="flex items-center justify-between gap-4 pt-6 border-t border-slate-700">
            <button
              onClick={() => {
                soundManager.playClick();
                setCurrentIndex(prev => Math.max(0, prev - 1));
              }}
              disabled={currentIndex === 0}
              className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:hover:bg-slate-700 text-xs font-bold text-white flex items-center gap-1.5 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Câu Trước</span>
            </button>

            <span className="text-xs text-slate-400 font-medium">
              Câu {currentIndex + 1} / {totalQuestions}
            </span>

            {currentIndex < totalQuestions - 1 ? (
              <button
                onClick={() => {
                  soundManager.playClick();
                  setCurrentIndex(prev => Math.min(totalQuestions - 1, prev + 1));
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-sm transition-all"
              >
                <span>Câu Tiếp Theo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowConfirmSubmit(true)}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Nộp Bài Thi</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Col: Question Grid Status & Submission Actions (1 col) */}
        <div className="space-y-6">
          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-700">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Bảng Điều Khiển Bài Thi</span>
              <span className="text-xs text-blue-400 font-semibold">{answeredCount}/{totalQuestions} câu</span>
            </div>

            {/* Status Legend */}
            <div className="grid grid-cols-2 gap-2 text-[11px] mb-4 text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-blue-600" />
                <span>Đã trả lời</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-slate-700 border border-slate-600" />
                <span>Chưa trả lời</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-amber-500" />
                <span>Đánh dấu cờ</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm ring-2 ring-blue-400 bg-slate-900" />
                <span>Đang chọn</span>
              </div>
            </div>

            {/* Questions Grid */}
            <div className="grid grid-cols-5 gap-2 max-h-64 overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const isAnswered = Boolean(userAnswers[q.id]);
                const isMarked = Boolean(markedForReview[q.id]);
                const isCurrent = idx === currentIndex;

                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      soundManager.playClick();
                      setCurrentIndex(idx);
                    }}
                    className={`h-9 rounded-lg text-xs font-bold transition-all relative flex items-center justify-center ${
                      isCurrent
                        ? 'ring-2 ring-blue-400 bg-blue-600 text-white shadow-md'
                        : isMarked
                        ? 'bg-amber-500 text-slate-950'
                        : isAnswered
                        ? 'bg-blue-900/80 text-blue-200 border border-blue-500/40'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <span>{idx + 1}</span>
                    {isMarked && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-300 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Final Submit Button */}
            <div className="mt-6 pt-4 border-t border-slate-700">
              <button
                onClick={() => setShowConfirmSubmit(true)}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <FileCheck className="w-4 h-4" />
                <span>Nộp Bài Chấm Điểm Ngay</span>
              </button>
            </div>
          </div>

          {/* Real-time Session Info */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 text-xs text-slate-400 space-y-2">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>Cơ Chế Bảo Vệ Đề Thi</span>
            </div>
            <p className="leading-relaxed text-[11px]">
              Đề thi được mã hóa và bảo mật tại máy chủ. Đáp án được chấm điểm tập trung theo thuật toán Certiport. Tự động lưu bản nháp mỗi 10 giây.
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Submit Dialog */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Xác Nhận Nộp Bài Thi MOS</h3>
                <p className="text-xs text-slate-400">Bạn đã sẵn sàng kết thúc lượt thi này?</p>
              </div>
            </div>

            <div className="bg-slate-900/80 rounded-xl p-4 mb-5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Số câu đã làm:</span>
                <span className="font-bold text-blue-400">{answeredCount} / {totalQuestions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Số câu chưa làm:</span>
                <span className="font-bold text-rose-400">{totalQuestions - answeredCount} câu</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Số câu đánh dấu cờ:</span>
                <span className="font-bold text-amber-400">{markedCount} câu</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Thời gian còn lại:</span>
                <span className="font-bold text-white">{formatTime(timeLeftSeconds)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
              >
                Tiếp Tục Làm Bài
              </button>
              <button
                onClick={handleSubmitExam}
                disabled={submitting}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{submitting ? 'Đang chấm điểm...' : 'Xác Nhận Nộp'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
