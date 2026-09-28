import React, { useState, useEffect } from 'react';
import { UserStats, MOSSubject } from '../types/mos';
import { THEORY_QUESTIONS } from '../data/theoryQuestions';
import { PRACTICAL_PROJECTS } from '../data/practicalProjects';
import { 
  Compass, 
  Award, 
  Target, 
  Calendar, 
  TrendingUp, 
  CheckCircle2, 
  Circle, 
  AlertTriangle, 
  ArrowRight, 
  Sparkles, 
  BookOpen, 
  Monitor, 
  Bot, 
  Clock, 
  Flame,
  Check,
  Zap,
  RotateCcw
} from 'lucide-react';

interface PersonalizedRoadmapProps {
  stats: UserStats;
  onNavigateTab: (tab: 'theory' | 'practical' | 'mock-exam' | 'shortcuts' | 'analytics' | 'ai-tutor' | 'ai-practice') => void;
  onSelectSubject: (sub: MOSSubject) => void;
}

interface SubjectReadiness {
  subject: 'word' | 'excel' | 'powerpoint';
  title: string;
  score: number; // 0 - 100
  tier: 'beginner' | 'intermediate' | 'ready' | 'master';
  tierLabel: string;
  tierColor: string;
  theoryStats: { correct: number; total: number; wrongCount: number };
  practicalStats: { completed: number; total: number };
  examStats: { bestScore: number; attempts: number; passed: boolean };
  weakDomains: string[];
}

const ROADMAP_DAYS = [
  {
    day: 1,
    title: 'Ngày 1: Rà Soát Lỗ Hổng & Ôn Câu Sai',
    focus: 'Khắc phục các câu lý thuyết từng trả lời sai và làm quen cấu trúc đề',
    estTime: '30 phút',
    actionLabel: 'Luyện câu làm sai',
    targetTab: 'theory' as const,
    keyTasks: [
      'Làm lại toàn bộ các câu hỏi nằm trong danh sách câu sai',
      'Đọc kỹ giải thích và đường dẫn Ribbon Certiport cho từng câu',
      'Đánh dấu sao các câu có bẫy để ôn lại vào ngày 6',
    ],
  },
  {
    day: 2,
    title: 'Ngày 2: Làm Chủ Công Cụ Trọng Điểm',
    focus: 'Học sâu các tính năng chiếm 60% tổng điểm trong bài thi',
    estTime: '40 phút',
    actionLabel: 'Tra cứu Ribbon & Phím tắt',
    targetTab: 'shortcuts' as const,
    keyTasks: [
      'Word: Margins, Table of Contents, Section Breaks, Watermark',
      'Excel: VLOOKUP, IF, Freeze Panes, Total Row, Flash Fill',
      'PowerPoint: Slide Master, Morph Transition, SmartArt Graphic',
    ],
  },
  {
    day: 3,
    title: 'Ngày 3: Thực Chiến Trên Simulator Dự Án',
    focus: 'Thao tác liên hoàn không ngắt quãng trên giao diện mô phỏng Office 365',
    estTime: '45 phút',
    actionLabel: 'Vào phòng mô phỏng',
    targetTab: 'practical' as const,
    keyTasks: [
      'Hoàn thành trọn vẹn 5 Task của Project 1 mà không dùng gợi ý',
      'Sử dụng tính năng Mark for Review đối với các thao tác chưa tự tin',
      'Kiểm tra và sửa lỗi trước khi nhấn nút Chấm điểm',
    ],
  },
  {
    day: 4,
    title: 'Ngày 4: Tăng Tốc Độ & Phản Xạ Phím Tắt',
    focus: 'Rèn luyện phản xạ thao tác để tiết kiệm 15 phút làm bài',
    estTime: '30 phút',
    actionLabel: 'Hỏi Gia Sư AI các mẹo',
    targetTab: 'ai-tutor' as const,
    keyTasks: [
      'Thành thạo các phím tắt vàng: F4 (lặp lại lệnh), Ctrl+E (Flash Fill), Ctrl+Enter',
      'Hỏi Gia Sư AI về các bẫy trừ điểm không đáng có trong phòng thi thật',
      'Tạo 1 kịch bản đề thi mới bằng công cụ AI Tạo Đề để thử thách',
    ],
  },
  {
    day: 5,
    title: 'Ngày 5: Thi Thử Lần 1 — Khảo Sát Áp Lực 50 Phút',
    focus: 'Trải nghiệm áp lực thời gian thực tế chuẩn bài thi quốc tế Certiport',
    estTime: '55 phút',
    actionLabel: 'Vào thi thử 50 phút',
    targetTab: 'mock-exam' as const,
    keyTasks: [
      'Làm bài nghiêm túc trong 50 phút, không tra cứu tài liệu',
      'Mục tiêu tối thiểu: Đạt >= 700 / 1000 điểm chuẩn',
      'Chụp lại bảng phân tích Objective Domains sau khi nộp bài',
    ],
  },
  {
    day: 6,
    title: 'Ngày 6: Bù Đắp Chuyên Đề Yếu Cùng Gia Sư AI',
    focus: 'Phân tích sâu các Objective Domains có tỷ lệ đúng < 75%',
    estTime: '35 phút',
    actionLabel: 'Chat với Gia Sư AI',
    targetTab: 'ai-tutor' as const,
    keyTasks: [
      'Chat với Gia Sư AI để giải nghĩa lại các câu hỏi bị mất điểm ở Ngày 5',
      'Luyện lại các câu đánh dấu sao tích lũy từ đầu tuần',
      'Ôn lại sơ đồ các thẻ lệnh trên Ribbon chuẩn Certiport',
    ],
  },
  {
    day: 7,
    title: 'Ngày 7: Thi Thử Lần 2 — Chạm Mốc 850+ & Sẵn Sàng',
    focus: 'Khẳng định phong độ, tối ưu hóa điểm số và sẵn sàng nhận chứng chỉ',
    estTime: '50 phút',
    actionLabel: 'Thi thử bứt phá điểm số',
    targetTab: 'mock-exam' as const,
    keyTasks: [
      'Thực hiện bài thi thử thứ 2 với mục tiêu điểm xuất sắc >= 850 điểm',
      'Kiểm tra lại kỹ năng phân bổ thời gian (trung bình 1.2 phút/câu)',
      'Tự tin đăng ký ca thi tại các trung tâm khảo thí IIG gần nhất!',
    ],
  },
];

export const PersonalizedRoadmap: React.FC<PersonalizedRoadmapProps> = ({
  stats,
  onNavigateTab,
  onSelectSubject,
}) => {
  const [activeSubject, setActiveSubject] = useState<'all' | 'word' | 'excel' | 'powerpoint'>('all');
  const [targetDays, setTargetDays] = useState<7 | 14 | 30>(7);
  const [completedDays, setCompletedDays] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem('mos_roadmap_completed_days_v1');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const toggleDayCompleted = (dayNum: number) => {
    setCompletedDays(prev => {
      const updated = prev.includes(dayNum)
        ? prev.filter(d => d !== dayNum)
        : [...prev, dayNum];
      try {
        localStorage.setItem('mos_roadmap_completed_days_v1', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleResetRoadmapProgress = () => {
    setCompletedDays([]);
    localStorage.removeItem('mos_roadmap_completed_days_v1');
  };

  // Calculate readiness for each MOS subject
  const calculateSubjectReadiness = (subject: 'word' | 'excel' | 'powerpoint'): SubjectReadiness => {
    const subjectQuestions = THEORY_QUESTIONS.filter(q => q.subject === subject);
    const totalTheory = subjectQuestions.length;
    
    // Check how many wrong questions belong to this subject
    const wrongQuestionsInSubject = subjectQuestions.filter(q => stats.wrongQuestionIds.includes(q.id));
    
    // Correct questions approximation: total answered proportion
    const hasPracticed = stats.totalAnswered > 0;
    const answeredRatio = stats.totalAnswered > 0 ? stats.totalCorrect / stats.totalAnswered : 0;
    const estCorrectTheory = Math.max(0, Math.round(totalTheory * answeredRatio) - wrongQuestionsInSubject.length);

    // Practical tasks for this subject
    const subjectProjects = PRACTICAL_PROJECTS.filter(p => p.subject === subject);
    const subjectTaskIds = subjectProjects.flatMap(p => p.tasks.map(t => t.id));
    const totalPractical = subjectTaskIds.length;
    const completedPractical = subjectTaskIds.filter(id => stats.completedTaskIds.includes(id)).length;

    // Exam attempts in this subject
    const subjectExams = stats.examHistory.filter(e => e.subject === subject || e.subject === 'mixed');
    const bestExamScore = subjectExams.reduce((max, e) => Math.max(max, e.score), 0);
    const hasPassedExam = subjectExams.some(e => e.passed);

    // Compute composite readiness score (0 - 100)
    // 1. Theory component (35%)
    const theoryCoverage = hasPracticed ? Math.min(100, (stats.totalAnswered / THEORY_QUESTIONS.length) * 100) : 0;
    const theoryAccuracy = stats.totalAnswered > 0 ? (stats.totalCorrect / stats.totalAnswered) * 100 : 0;
    const theoryScore = (theoryCoverage * 0.4 + theoryAccuracy * 0.6) * 0.35;

    // 2. Practical component (40%)
    const practicalPercent = totalPractical > 0 ? (completedPractical / totalPractical) * 100 : 0;
    const practicalScore = practicalPercent * 0.40;

    // 3. Exam component (25%)
    let examScore = 0;
    if (bestExamScore > 0) {
      examScore = (bestExamScore / 1000) * 100 * 0.25;
    } else {
      // Baseline if no exam yet
      examScore = (theoryScore + practicalScore) * 0.15;
    }

    // Deduction for unsolved wrong questions
    const wrongPenalty = wrongQuestionsInSubject.length * 4;

    const finalRaw = Math.max(5, Math.min(100, Math.round(theoryScore + practicalScore + examScore - wrongPenalty)));

    let tier: 'beginner' | 'intermediate' | 'ready' | 'master' = 'beginner';
    let tierLabel = 'Cần Bổ Sung Nền Tảng (Khởi Động)';
    let tierColor = 'text-red-600 bg-red-50 border-red-200';

    if (finalRaw >= 85) {
      tier = 'master';
      tierLabel = 'Chuyên Gia (Sẵn Sàng Đạt 900-1000)';
      tierColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
    } else if (finalRaw >= 70) {
      tier = 'ready';
      tierLabel = 'Sẵn Sàng Thi Đạt Chuẩn (>= 700/1000)';
      tierColor = 'text-blue-700 bg-blue-50 border-blue-200';
    } else if (finalRaw >= 45) {
      tier = 'intermediate';
      tierLabel = 'Đang Phát Triển (Cần Thêm Thực Hành)';
      tierColor = 'text-amber-700 bg-amber-50 border-amber-200';
    }

    // Identify weak domains
    const weakDomains = Array.from(new Set(wrongQuestionsInSubject.map(q => q.domainName)));
    if (weakDomains.length === 0 && practicalPercent < 100) {
      weakDomains.push('Thao tác mô phỏng dự án thực hành Certiport');
    }

    return {
      subject,
      title: subject === 'word' ? 'MOS Word Associate' : subject === 'excel' ? 'MOS Excel Associate' : 'MOS PowerPoint Associate',
      score: finalRaw,
      tier,
      tierLabel,
      tierColor,
      theoryStats: {
        correct: estCorrectTheory,
        total: totalTheory,
        wrongCount: wrongQuestionsInSubject.length,
      },
      practicalStats: {
        completed: completedPractical,
        total: totalPractical,
      },
      examStats: {
        bestScore: bestExamScore,
        attempts: subjectExams.length,
        passed: hasPassedExam,
      },
      weakDomains,
    };
  };

  const wordReadiness = calculateSubjectReadiness('word');
  const excelReadiness = calculateSubjectReadiness('excel');
  const pptReadiness = calculateSubjectReadiness('powerpoint');

  const subjectsList = [excelReadiness, wordReadiness, pptReadiness];
  const overallAverageScore = Math.round((wordReadiness.score + excelReadiness.score + pptReadiness.score) / 3);

  const completedCount = completedDays.length;
  const progressPercent = Math.round((completedCount / ROADMAP_DAYS.length) * 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-2xl p-6 sm:p-8 mb-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
              <Compass className="w-4 h-4" />
              <span>Lộ Trình Cá Nhân Hóa Chuẩn Khảo Thí</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-2">
              Chỉ Số Sẵn Sàng (Readiness Score) & Kế Hoạch Ôn Luyện
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Dựa trên tiến độ làm câu hỏi, kết quả thi thử 50 phút và các task thực hành đã hoàn thành, hệ thống tự động tính toán chỉ số sẵn sàng và thiết lập lộ trình 7 ngày giúp bạn bù đắp ngay các lỗ hổng kiến thức.
            </p>
          </div>

          {/* Overall Composite Score Meter */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 text-center shrink-0 min-w-[220px]">
            <span className="text-[11px] font-bold text-blue-300 uppercase tracking-wider block mb-1">
              Điểm Sẵn Sàng Trung Bình
            </span>
            <div className="text-4xl font-extrabold text-white font-mono mb-1">
              {overallAverageScore}%
            </div>
            <div className="text-xs text-slate-300 font-medium mb-3">
              {overallAverageScore >= 70 ? '🟢 Đủ năng lực thi đỗ' : '🟡 Cần thêm 3-5 ngày ôn tập'}
            </div>
            <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  overallAverageScore >= 70 ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
                style={{ width: `${overallAverageScore}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Subject Readiness Cards Grid */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            <span>Chỉ Số Sẵn Sàng Từng Môn Thi (MOS Readiness Breakdown)</span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Điểm chuẩn Certiport: 700 / 1000
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {subjectsList.map(item => {
            const isExcel = item.subject === 'excel';
            const isWord = item.subject === 'word';

            return (
              <div
                key={item.subject}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {isExcel ? 'MO-200' : isWord ? 'MO-100' : 'MO-300'}
                      </span>
                      <h4 className="text-base font-bold text-slate-900 leading-tight mt-0.5">
                        {item.title}
                      </h4>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-black font-mono text-slate-900">
                        {item.score}%
                      </div>
                      <span className="text-[10px] text-slate-400 block font-medium">Readiness</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-3">
                    <div
                      className={`h-full rounded-full transition-all ${
                        item.score >= 85
                          ? 'bg-emerald-500'
                          : item.score >= 70
                          ? 'bg-blue-600'
                          : item.score >= 45
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>

                  {/* Status Badge */}
                  <div className={`p-2 rounded-lg border text-xs font-semibold mb-4 text-center ${item.tierColor}`}>
                    {item.tierLabel}
                  </div>

                  {/* Breakdown details */}
                  <div className="space-y-2 text-xs text-slate-600 mb-4 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span>Lý thuyết chuẩn Certiport:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {item.theoryStats.total} câu
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Task thực hành mô phỏng:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {item.practicalStats.completed} / {item.practicalStats.total} task
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Điểm thi thử cao nhất:</span>
                      <span className="font-mono font-bold text-blue-700">
                        {item.examStats.bestScore > 0 ? `${item.examStats.bestScore}/1000` : 'Chưa thi'}
                      </span>
                    </div>
                    {item.theoryStats.wrongCount > 0 && (
                      <div className="flex items-center justify-between text-red-600 font-semibold">
                        <span>Câu cần khắc phục:</span>
                        <span>{item.theoryStats.wrongCount} câu</span>
                      </div>
                    )}
                  </div>

                  {/* Weak Knowledge Gaps */}
                  {item.weakDomains.length > 0 && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-4 text-xs">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Lỗ hổng cần lấp đầy:
                      </span>
                      <ul className="text-slate-700 space-y-1">
                        {item.weakDomains.slice(0, 2).map((dom, dIdx) => (
                          <li key={dIdx} className="line-clamp-1 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                            <span>{dom}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Direct Action Button */}
                <button
                  onClick={() => {
                    onSelectSubject(item.subject);
                    if (item.practicalStats.completed < item.practicalStats.total) {
                      onNavigateTab('practical');
                    } else if (item.examStats.bestScore < 700) {
                      onNavigateTab('mock-exam');
                    } else {
                      onNavigateTab('theory');
                    }
                  }}
                  className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 mt-2"
                >
                  <span>Ôn luyện môn này</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7-Day Structured Daily Study Plan */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        {/* Roadmap Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
              <Calendar className="w-4 h-4" />
              <span>Kế Hoạch Học Tập Hàng Ngày (7-Day Sprint)</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              Lộ Trình Bứt Phá Mục Tiêu Chứng Chỉ MOS
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Đã hoàn thành <strong className="text-slate-800">{completedCount}</strong> / 7 ngày học ({progressPercent}%)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setTargetDays(7)}
                className={`px-3 py-1 rounded transition-colors ${
                  targetDays === 7 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Cấp tốc 7 Ngày
              </button>
              <button
                onClick={() => setTargetDays(14)}
                className={`px-3 py-1 rounded transition-colors ${
                  targetDays === 14 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Vừa sức 14 Ngày
              </button>
            </div>

            {completedCount > 0 && (
              <button
                onClick={handleResetRoadmapProgress}
                className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1"
                title="Đặt lại tiến độ lộ trình"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Đặt lại</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar of Daily Roadmap */}
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-8">
          <div
            className="bg-blue-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Daily Steps Timeline */}
        <div className="space-y-4">
          {ROADMAP_DAYS.map(dayItem => {
            const isDone = completedDays.includes(dayItem.day);

            return (
              <div
                key={dayItem.day}
                className={`p-5 rounded-2xl border transition-all ${
                  isDone
                    ? 'border-emerald-200 bg-emerald-50/40'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Day & Task Details */}
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => toggleDayCompleted(dayItem.day)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isDone
                          ? 'bg-emerald-600 text-white'
                          : 'border-2 border-slate-300 text-slate-400 hover:border-blue-500'
                      }`}
                      title={isDone ? 'Đánh dấu chưa xong' : 'Đánh dấu đã hoàn thành'}
                    >
                      {isDone ? <Check className="w-5 h-5" /> : <span className="font-bold text-xs">{dayItem.day}</span>}
                    </button>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`text-sm sm:text-base font-bold ${isDone ? 'text-emerald-950 line-through' : 'text-slate-900'}`}>
                          {dayItem.title}
                        </h4>
                        <span className="text-[11px] font-mono font-medium text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{dayItem.estTime}</span>
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                        {dayItem.focus}
                      </p>

                      {/* Checklist mini tasks */}
                      <ul className="space-y-1 text-xs text-slate-500">
                        {dayItem.keyTasks.map((t, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-slate-400" />
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Right: Quick Action Button */}
                  <div className="flex items-center gap-2 shrink-0 md:self-center pl-12 md:pl-0">
                    <button
                      onClick={() => onNavigateTab(dayItem.targetTab)}
                      className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <span>{dayItem.actionLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => toggleDayCompleted(dayItem.day)}
                      className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                        isDone
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {isDone ? 'Đã xong' : 'Xong ngày này'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Customization Prompt Box */}
        <div className="mt-8 p-5 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Cần Lộ Trình Tùy Biến Theo Ngày Thi Cụ Thể?
              </h4>
              <p className="text-xs text-slate-600">
                Nhắn tin với Gia Sư MOS AI để phân tích điểm yếu riêng và nhận lịch học kèm bài tập thực tế.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('ai-tutor')}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2 shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>Chat Cùng Gia Sư AI</span>
          </button>
        </div>
      </div>
    </div>
  );
};
