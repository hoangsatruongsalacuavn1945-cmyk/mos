import React, { useState, useEffect } from 'react';
import { 
  fetchQuestionsFromFirestore, 
  QuizQuestionItem 
} from '../services/questionService';
import { useUserProgressStore, MOSSubjectTrack } from '../utils/userProgressStore';
import { useAuthStore } from '../utils/userStore';
import { useGoogleSheetsStore } from '../utils/googleSheetsStore';
import { soundManager } from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Award,
  Clock,
  BookOpen,
  Sparkles,
  Database,
  ShieldCheck,
  FileSpreadsheet,
  FileText,
  Presentation,
  Check
} from 'lucide-react';

export interface QuizEngineProps {
  initialSubject?: MOSSubjectTrack;
  onFinish?: (score: number, total: number, percentage: number) => void;
}

export const QuizEngine: React.FC<QuizEngineProps> = ({ 
  initialSubject = 'excel',
  onFinish 
}) => {
  const [selectedSubject, setSelectedSubject] = useState<MOSSubjectTrack>(initialSubject);
  const [questions, setQuestions] = useState<QuizQuestionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { recordQuizScore, completeLesson } = useUserProgressStore();

  // Load questions from Firestore whenever subject changes
  const loadQuestions = async (sub: MOSSubjectTrack) => {
    setLoading(true);
    setError(null);
    setIsSubmitted(false);
    setUserAnswers({});
    setCurrentIndex(0);

    try {
      const data = await fetchQuestionsFromFirestore(sub, 10);
      if (data.length === 0) {
        throw new Error('Chưa có câu hỏi nào trong Firestore cho môn này.');
      }
      setQuestions(data);
    } catch (err: any) {
      console.error('QuizEngine load error:', err);
      setError(err.message || 'Không thể tải câu hỏi từ cơ sở dữ liệu Cloud Firestore.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions(selectedSubject);
  }, [selectedSubject]);

  const currentQuestion = questions[currentIndex];

  const handleSelectOption = (optionId: string) => {
    if (isSubmitted || !currentQuestion) return;
    soundManager.playClick();
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionId,
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Submit and calculate score
  const handleSubmit = async () => {
    soundManager.playClick();
    setIsSubmitted(true);

    try {
      const totalQ = questions.length || 1;
      let correctCount = 0;
      questions.forEach((q) => {
        if (userAnswers[q.id] === q.correctAnswer) {
          correctCount += 1;
        }
      });

      const percentage = Math.round((correctCount / totalQ) * 100);

      // Save to UserProgressStore and sync to Firestore
      await recordQuizScore(selectedSubject, {
        score: correctCount,
        total: questions.length,
        percentage,
        domainName: `Firestore Quiz ${selectedSubject.toUpperCase()}`,
      });

      // Backup quiz score to Google Sheets
      const currentUser = useAuthStore.getState().user;
      useGoogleSheetsStore.getState().backupExamScore({
        uid: currentUser.id || 'guest',
        name: currentUser.name || currentUser.fullName || 'Học viên',
        email: currentUser.email || 'N/A',
        subject: selectedSubject,
        score: correctCount,
        totalScore: questions.length,
        percentage,
        passed: percentage >= 70,
        notes: `Khảo thí trắc nghiệm Firestore - ${selectedSubject.toUpperCase()}`,
      }).catch((e) => console.warn('Google Sheets quiz backup deferred:', e));

      if (percentage >= 70) {
        soundManager.playCorrect();
        if (typeof confetti === 'function') {
          try {
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 },
            });
          } catch {}
        }

        // Auto mark first lesson as completed as encouragement
        const defaultLessonId = selectedSubject === 'word' ? 'word-101' : selectedSubject === 'excel' ? 'excel-201' : 'ppt-301';
        completeLesson(selectedSubject, defaultLessonId).catch(() => {});
      } else {
        soundManager.playWrong();
      }

      if (onFinish) {
        onFinish(correctCount, questions.length, percentage);
      }
    } catch (err) {
      console.error('[QuizEngine] Error in handleSubmit:', err);
    }
  };

  const calculateFinalStats = () => {
    let correct = 0;
    questions.forEach((q) => {
      if (userAnswers[q.id] === q.correctAnswer) {
        correct++;
      }
    });
    const pct = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
    const passed = pct >= 70;
    return { correct, total: questions.length, pct, passed };
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header & Subject Selector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Database className="w-3 h-3 text-indigo-600" />
              Cloud Firestore Realtime
            </span>
            <span className="text-xs text-slate-500 font-medium">Ma trận Certiport Quốc Tế</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            Hệ Thống Khảo Thí Trắc Nghiệm (Quiz Engine)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Bộ câu hỏi được đồng bộ trực tiếp từ Cloud Firestore, chấm điểm tự động và lưu vào tiến độ học tập.
          </p>
        </div>

        {/* Subject switcher tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start md:self-auto">
          <button
            onClick={() => setSelectedSubject('word')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedSubject === 'word'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Word (MO-100)</span>
          </button>

          <button
            onClick={() => setSelectedSubject('excel')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedSubject === 'excel'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel (MO-200)</span>
          </button>

          <button
            onClick={() => setSelectedSubject('powerpoint')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedSubject === 'powerpoint'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Presentation className="w-3.5 h-3.5" />
            <span>PPT (MO-300)</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 border-3 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mx-auto" />
          <h3 className="text-base font-bold text-slate-800">
            Đang truy vấn câu hỏi từ Cloud Firestore...
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Hệ thống đang kết nối collection <code>/questions</code> để lấy các câu hỏi thực tế chuẩn ma trận Certiport.
          </p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-3">
          <XCircle className="w-10 h-10 text-red-500 mx-auto" />
          <h3 className="text-base font-bold text-red-800">Không thể tải đề thi</h3>
          <p className="text-xs text-red-600">{error}</p>
          <button
            onClick={() => loadQuestions(selectedSubject)}
            className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-colors"
          >
            Thử tải lại
          </button>
        </div>
      )}

      {/* Active Quiz Card */}
      {!loading && !error && questions.length > 0 && !isSubmitted && currentQuestion && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Progress Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-800 shadow-xs">
                Câu {currentIndex + 1} / {questions.length}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Chuyên đề: <strong className="text-slate-800">{currentQuestion.domainName}</strong>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">
                Đã trả lời: <strong className="text-indigo-600">{Object.keys(userAnswers).length}</strong>/{questions.length}
              </span>
              {/* Mini progress bar */}
              <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-full transition-all duration-300"
                  style={{ width: `${(Object.keys(userAnswers).length / questions.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Question Body */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <div className="inline-block text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-blue-100 text-blue-800">
                Điểm: {currentQuestion.points}đ · {currentQuestion.difficulty === 'easy' ? 'Độ khó: Cơ bản' : currentQuestion.difficulty === 'hard' ? 'Độ khó: Nâng cao' : 'Độ khó: Tiêu chuẩn'}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {currentQuestion.title}
              </h3>
              {currentQuestion.scenario && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 italic">
                  Tình huống: {currentQuestion.scenario}
                </div>
              )}
            </div>

            {/* Options List */}
            <div className="space-y-3">
              {currentQuestion.options.map((option) => {
                const isSelected = userAnswers[currentQuestion.id] === option.id;

                return (
                  <button
                    key={option.id}
                    onClick={() => handleSelectOption(option.id)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/70 border-indigo-600 text-indigo-950 shadow-xs ring-2 ring-indigo-500/10'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800 hover:bg-slate-50/50'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs uppercase transition-colors ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {option.id}
                    </div>
                    <span className="text-xs sm:text-sm font-medium pt-0.5 leading-relaxed">
                      {option.text}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Actions Bar */}
          <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Câu Trước</span>
            </button>

            <div className="flex items-center gap-2">
              {currentIndex < questions.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Câu Tiếp Theo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Hoàn Thành & Nộp Bài</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quiz Submission Results Screen */}
      {isSubmitted && (() => {
        const stats = calculateFinalStats();

        return (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Score Summary Card */}
            <div className={`rounded-2xl border p-6 sm:p-8 text-center text-white shadow-xl ${
              stats.passed 
                ? 'bg-gradient-to-br from-emerald-600 to-teal-800 border-emerald-500' 
                : 'bg-gradient-to-br from-slate-900 to-indigo-950 border-slate-800'
            }`}>
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-4 border border-white/20">
                {stats.passed ? <Award className="w-9 h-9 text-amber-300" /> : <BookOpen className="w-9 h-9 text-blue-300" />}
              </div>

              <span className="text-xs uppercase tracking-wider font-bold px-3 py-1 rounded-full bg-white/20 backdrop-blur-md">
                {stats.passed ? 'ĐẠT CHUẨN CERTIPORT (PASSED)' : 'CẦN ÔN TẬP THÊM'}
              </span>

              <h3 className="text-3xl sm:text-4xl font-black mt-3">
                {stats.pct}%
              </h3>
              <p className="text-sm text-white/90 mt-1">
                Đúng <strong className="text-white">{stats.correct}</strong> trên tổng số {stats.total} câu hỏi trắc nghiệm
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 mt-4 text-xs">
                <span className="bg-black/20 px-3 py-1 rounded-lg">
                  Tiêu chuẩn đậu MOS: <strong>≥ 70%</strong>
                </span>
                <span className="bg-black/20 px-3 py-1 rounded-lg flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-emerald-300" />
                  Đã đồng bộ kết quả vào <strong>UserProgressStore</strong> & Firestore
                </span>
              </div>

              <div className="pt-6 flex justify-center gap-3">
                <button
                  onClick={() => loadQuestions(selectedSubject)}
                  className="px-5 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Làm Lại Đề Mới</span>
                </button>
              </div>
            </div>

            {/* Detailed Question Review */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
              <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                Bảng Đáp Án Chi Tiết & Hướng Dẫn Thao Tác Ribbon
              </h4>

              <div className="space-y-4">
                {questions.map((q, idx) => {
                  const userAns = userAnswers[q.id];
                  const isCorrect = userAns === q.correctAnswer;
                  const correctOption = q.options.find(o => o.id === q.correctAnswer);
                  const userOption = q.options.find(o => o.id === userAns);

                  return (
                    <div
                      key={q.id}
                      className={`p-4 rounded-xl border text-xs sm:text-sm transition-all ${
                        isCorrect ? 'bg-emerald-50/40 border-emerald-200' : 'bg-rose-50/40 border-rose-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                            isCorrect ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                          }`}>
                            {idx + 1}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900">{q.title}</span>
                            <div className="text-xs text-slate-500 mt-0.5">
                              Chuyên đề: <strong>{q.domainName}</strong>
                            </div>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded text-xs font-bold shrink-0 ${
                          isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {isCorrect ? '✓ Đúng' : '✗ Sai'}
                        </span>
                      </div>

                      {/* Answers compare */}
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                          <span className="text-slate-400 block text-[11px]">Câu trả lời của bạn:</span>
                          <strong className={isCorrect ? 'text-emerald-700' : 'text-rose-700'}>
                            {userOption ? `${userOption.id.toUpperCase()}. ${userOption.text}` : 'Chưa chọn'}
                          </strong>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white border border-emerald-300">
                          <span className="text-emerald-600 block text-[11px] font-bold">Đáp án chuẩn Certiport:</span>
                          <strong className="text-emerald-900">
                            {correctOption ? `${correctOption.id.toUpperCase()}. ${correctOption.text}` : ''}
                          </strong>
                        </div>
                      </div>

                      {/* Explanation & Ribbon */}
                      <div className="mt-3 p-3 bg-white/80 rounded-lg border border-slate-200 space-y-1.5 text-xs text-slate-700">
                        <div>
                          <strong>Giải thích:</strong> {q.explanation}
                        </div>
                        {q.officialRibbonPath && (
                          <div className="font-mono text-[11px] text-blue-700">
                            <strong>Thao tác Ribbon:</strong> {q.officialRibbonPath}
                          </div>
                        )}
                        {q.shortcutTip && (
                          <div className="text-[11px] text-amber-700">
                            <strong>Phím tắt:</strong> {q.shortcutTip}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default QuizEngine;
