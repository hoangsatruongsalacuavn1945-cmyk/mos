import React, { useState, useMemo } from 'react';
import { Question, MOSSubject } from '../types/mos';
import { THEORY_QUESTIONS, MOS_DOMAINS } from '../data/theoryQuestions';
import { getWordTheoryBank, getExcelTheoryBank } from '../data/massiveQuestionBank';
import { recordQuestionAnswer, toggleBookmarkQuestion } from '../utils/storage';
import { soundManager } from '../utils/audio';
import { 
  CheckCircle2, 
  XCircle, 
  Bookmark, 
  BookmarkCheck, 
  RotateCcw, 
  ArrowRight, 
  ArrowLeft, 
  Compass, 
  Lightbulb, 
  Filter, 
  Search,
  Check,
  HelpCircle,
  Bot,
  Sparkles,
  Loader2,
  Grid,
  FileSpreadsheet,
  FileText,
  X,
  Code,
  Zap,
  ChevronRight,
  ChevronLeft,
  Layers
} from 'lucide-react';
import { TheoryFlashcards } from './TheoryFlashcards';

interface TheoryQuizProps {
  selectedSubject: MOSSubject;
  bookmarkedIds: string[];
  wrongIds: string[];
  onStatsUpdate: () => void;
}

export const TheoryQuiz: React.FC<TheoryQuizProps> = ({
  selectedSubject,
  bookmarkedIds,
  wrongIds,
  onStatsUpdate,
}) => {
  const [quizViewMode, setQuizViewMode] = useState<'quiz' | 'flashcard'>('quiz');
  const [activeFilter, setActiveFilter] = useState<'all' | 'bookmarked' | 'wrong'>('all');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [copiedPath, setCopiedPath] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Jump and Batch state for 1,000 questions
  const [jumpInput, setJumpInput] = useState('');
  const [showGridModal, setShowGridModal] = useState(false);
  const [activeBatchStart, setActiveBatchStart] = useState(1);
  const [sidebarBatchStart, setSidebarBatchStart] = useState(1);

  // Interactive Formula Playground Modal (Excel)
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [selectedFormulaPreset, setSelectedFormulaPreset] = useState<number>(0);

  // Source Questions: pulls 1,000 questions for Word, 1,000 for Excel, and combined for All
  const sourceQuestions = useMemo(() => {
    if (selectedSubject === 'word') {
      return getWordTheoryBank();
    }
    if (selectedSubject === 'excel') {
      return getExcelTheoryBank();
    }
    if (selectedSubject === 'powerpoint') {
      return THEORY_QUESTIONS.filter(q => q.subject === 'powerpoint');
    }
    return [
      ...getWordTheoryBank(),
      ...getExcelTheoryBank(),
      ...THEORY_QUESTIONS.filter(q => q.subject === 'powerpoint')
    ];
  }, [selectedSubject]);

  // Filter questions based on subject, domain, activeFilter, and search query
  const filteredQuestions = useMemo(() => {
    return sourceQuestions.filter(q => {
      // Domain match
      if (selectedDomain !== 'all' && q.domainId !== selectedDomain) return false;
      // Filter list
      if (activeFilter === 'bookmarked' && !bookmarkedIds.includes(q.id)) return false;
      if (activeFilter === 'wrong' && !wrongIds.includes(q.id)) return false;
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const inTitle = q.title.toLowerCase().includes(query);
        const inScenario = q.scenario?.toLowerCase().includes(query);
        const inExplanation = q.explanation.toLowerCase().includes(query);
        const inPath = q.officialRibbonPath.toLowerCase().includes(query);
        const inNum = q.id.includes(query);
        return inTitle || inScenario || inExplanation || inPath || inNum;
      }
      return true;
    });
  }, [sourceQuestions, selectedDomain, activeFilter, searchQuery, bookmarkedIds, wrongIds]);

  // Safe current question
  const currentQuestion: Question | undefined = filteredQuestions[currentIndex] || filteredQuestions[0];

  // Reset answer when question changes
  const handleSelectQuestion = (index: number) => {
    setCurrentIndex(index);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setAiAnalysis(null);
    // Align sidebar batch with selected question
    const batch = Math.floor(index / 50) * 50 + 1;
    setSidebarBatchStart(batch);
  };

  const handleJump = () => {
    const num = parseInt(jumpInput, 10);
    if (!isNaN(num) && num >= 1 && num <= filteredQuestions.length) {
      handleSelectQuestion(num - 1);
      setJumpInput('');
      setShowGridModal(false);
    }
  };

  const handleRequestAiAnalysis = async () => {
    if (!currentQuestion || isAiLoading) return;
    setIsAiLoading(true);
    try {
      const response = await fetch('/api/gemini/explain-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQuestion,
          userAnswer: selectedAnswer,
          isCorrect: selectedAnswer === currentQuestion.correctAnswer,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Lỗi phân tích AI');
      }
      setAiAnalysis(data.analysis);
    } catch (err: any) {
      setAiAnalysis(`⚠️ Không thể kết nối AI: ${err.message || 'Thử lại sau'}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < filteredQuestions.length - 1) {
      handleSelectQuestion(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      handleSelectQuestion(currentIndex - 1);
    }
  };

  const handleAnswerSelect = (optionId: string) => {
    if (selectedAnswer !== null) return; // Answer locked
    setSelectedAnswer(optionId);
    setShowExplanation(true);

    if (currentQuestion) {
      const isCorrect = optionId === currentQuestion.correctAnswer;
      if (isCorrect) {
        soundManager.playCorrect();
      } else {
        soundManager.playWrong();
      }
      recordQuestionAnswer(currentQuestion.id, isCorrect);
      onStatsUpdate();
    }
  };

  const handleBookmarkToggle = (qId: string) => {
    toggleBookmarkQuestion(qId);
    onStatsUpdate();
  };

  const handleCopyPath = (path: string) => {
    navigator.clipboard.writeText(path);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2000);
  };

  const isCurrentBookmarked = currentQuestion ? bookmarkedIds.includes(currentQuestion.id) : false;

  const relevantDomains = useMemo(() => {
    if (selectedSubject === 'all') return MOS_DOMAINS;
    return MOS_DOMAINS.filter(d => d.subject === selectedSubject);
  }, [selectedSubject]);

  // Excel formula presets for the interactive playground
  const FORMULA_PRESETS = [
    {
      title: 'Hàm Dò Tìm VLOOKUP',
      formula: '=VLOOKUP("SP02", A2:D5, 2, FALSE)',
      desc: 'Tìm mã "SP02" tại cột 1 của dải A2:D5 và trả về giá trị tại cột 2 (Tên sản phẩm). FALSE: Dò tìm chính xác tuyệt đối.',
      tableRows: [
        ['Mã SP', 'Tên Sản Phẩm', 'Số Lượng', 'Doanh Thu'],
        ['SP01', 'Laptop Dell XPS 13', '14', '350.000.000 ₫'],
        ['SP02', 'Bàn Phím Cơ Keychron', '45', '67.500.000 ₫'],
        ['SP03', 'Màn Hình LG UltraFine', '22', '198.000.000 ₫'],
        ['SP04', 'Chuột Không Dây Logitech', '60', '54.000.000 ₫']
      ],
      result: 'Bàn Phím Cơ Keychron',
      examTip: 'Trong bài thi MOS Excel, luôn đặt đối số thứ 4 là FALSE (hoặc 0) để đảm bảo kết quả chính xác không phụ thuộc thứ tự sắp xếp.'
    },
    {
      title: 'Hàm Tính Tổng Điều Kiện SUMIF',
      formula: '=SUMIF(C2:C5, ">=30", D2:D5)',
      desc: 'Tính tổng Doanh Thu (cột D) đối với các mặt hàng có Số Lượng bán ra từ 30 sản phẩm trở lên (cột C).',
      tableRows: [
        ['Mã SP', 'Tên Sản Phẩm', 'Số Lượng', 'Doanh Thu (Triệu)'],
        ['SP01', 'Laptop Dell', '14', '350'],
        ['SP02', 'Bàn Phím', '45', '67.5'],
        ['SP03', 'Màn Hình', '22', '198'],
        ['SP04', 'Chuột Logitech', '60', '54']
      ],
      result: '121.5 (Triệu đồng)',
      examTip: 'Điều kiện chứa dấu toán tử (>=, <=, <>) trong SUMIF phải được bao trong cặp ngoặc kép, ví dụ ">=30".'
    },
    {
      title: 'Hàm Logic IF Đa Cấp',
      formula: '=IF(C2>=700, "ĐẠT CHỨNG CHỈ", "CHƯA ĐẠT")',
      desc: 'Kiểm tra điểm số tại ô C2: nếu từ 700 điểm trở lên trả về "ĐẠT CHỨNG CHỈ", ngược lại trả về "CHƯA ĐẠT".',
      tableRows: [
        ['Mã SV', 'Họ Và Tên', 'Điểm Số', 'Kết Quả'],
        ['SV01', 'Nguyễn Hoàng Sơn', '875', 'ĐẠT CHỨNG CHỈ'],
        ['SV02', 'Trần Thị Mai', '650', 'CHƯA ĐẠT'],
        ['SV03', 'Lê Văn An', '920', 'ĐẠT CHỨNG CHỈ']
      ],
      result: 'ĐẠT CHỨNG CHỈ',
      examTip: 'Chứng chỉ MOS Certiport yêu cầu mức sàn 700/1000 điểm. Cú pháp: =IF(logical_test, value_if_true, value_if_false).'
    },
    {
      title: 'Hàm Đếm Điều Kiện COUNTIF',
      formula: '=COUNTIF(C2:C5, ">=50")',
      desc: 'Đếm số lượng mặt hàng có doanh số bán ra đạt từ 50 đơn vị trở lên.',
      tableRows: [
        ['Mã SP', 'Tên Sản Phẩm', 'Số Lượng', 'Kho'],
        ['SP01', 'Laptop', '14', 'Kho Hà Nội'],
        ['SP02', 'Bàn Phím', '45', 'Kho TP.HCM'],
        ['SP03', 'Màn Hình', '22', 'Kho Đà Nẵng'],
        ['SP04', 'Chuột', '60', 'Kho Hà Nội']
      ],
      result: '1 mặt hàng (Chuột: 60)',
      examTip: 'Hàm COUNTIF chỉ có 2 đối số: =COUNTIF(range, criteria).'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* 1,000 Questions Grand Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 uppercase">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Ngân Hàng 1,000+ Câu Hỏi Lý Thuyết Khảo Thí
              </span>
              <span className="text-xs text-slate-400">· Chuẩn Khảo Thí Quốc Tế Certiport MO-100 & MO-200</span>
            </div>
            <h1 className="text-2xl font-black mt-2 text-white flex items-center gap-2">
              {selectedSubject === 'word' ? (
                <>
                  <FileText className="w-6 h-6 text-blue-400" />
                  <span>1,000 Câu Hỏi Lý Thuyết MOS Word 365/2019</span>
                </>
              ) : selectedSubject === 'excel' ? (
                <>
                  <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
                  <span>1,000 Câu Hỏi Lý Thuyết MOS Excel 365/2019</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6 text-indigo-400" />
                  <span>Ngân Hàng 2,000+ Câu Hỏi Lý Thuyết MOS (Word & Excel)</span>
                </>
              )}
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Toàn bộ câu hỏi bao quát trọn vẹn 5 Domain mục tiêu thi, tích hợp chỉ dẫn đường dẫn Ribbon, phím tắt thực chiến và phân tích trí tuệ nhân tạo Gemini.
            </p>
          </div>

          {/* Quick Action Tools */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                soundManager.playClick();
                setQuizViewMode(quizViewMode === 'flashcard' ? 'quiz' : 'flashcard');
              }}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md flex items-center gap-2 ${
                quizViewMode === 'flashcard'
                  ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
              }`}
              title="Chuyển sang chế độ thẻ ghi nhớ Flashcard 3D cho 1,000 câu hỏi lý thuyết"
            >
              <Layers className="w-4 h-4" />
              <span>{quizViewMode === 'flashcard' ? 'Trắc Nghiệm Chuẩn' : 'Chế Độ Flashcard Lật Thẻ'}</span>
            </button>

            <button
              onClick={() => setShowGridModal(true)}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md flex items-center gap-2"
            >
              <Grid className="w-4 h-4" />
              <span>Bảng Điều Hướng 1,000 Câu</span>
            </button>

            {(selectedSubject === 'excel' || selectedSubject === 'all') && (
              <button
                onClick={() => setShowFormulaModal(true)}
                className="px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md flex items-center gap-2"
              >
                <Code className="w-4 h-4" />
                <span>Thử Nghiệm Hàm Excel (Playground)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {quizViewMode === 'flashcard' ? (
        <TheoryFlashcards
          questions={sourceQuestions}
          bookmarkedIds={bookmarkedIds}
          wrongIds={wrongIds}
          onStatsUpdate={onStatsUpdate}
          onExitFlashcard={() => setQuizViewMode('quiz')}
          selectedSubject={selectedSubject}
        />
      ) : (
        <>
          {/* Mode Switcher Tabs */}
          <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => {
                  soundManager.playClick();
                  setQuizViewMode('quiz');
                }}
                className="px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 bg-blue-600 text-white shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Trắc Nghiệm Chuẩn</span>
              </button>

              <button
                onClick={() => {
                  soundManager.playClick();
                  setQuizViewMode('flashcard');
                }}
                className="px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              >
                <Layers className="w-4 h-4" />
                <span>Thẻ Flashcard 3D (Ghi Nhớ 1,000 Câu)</span>
              </button>
            </div>

            <div className="px-3 text-xs text-slate-500 font-medium hidden sm:block">
              💡 Dùng Flashcard để lật thẻ ghi nhớ nhanh đáp án và quy trình Ribbon mà không bị áp lực tính điểm.
            </div>
          </div>

          {/* Control bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm câu hỏi, hàm (VLOOKUP, IF...), tính năng (Watermark, Margins)..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentIndex(0);
              }}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
            />
          </div>

          {/* Domain dropdown & filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedDomain}
              onChange={e => {
                setSelectedDomain(e.target.value);
                setCurrentIndex(0);
              }}
              aria-label="Chọn chủ đề mục tiêu"
              className="text-xs sm:text-sm font-medium bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-3 py-2 focus:outline-hidden focus:border-blue-500"
            >
              <option value="all">Tất cả mục tiêu (Domains)</option>
              {relevantDomains.map(d => (
                <option key={d.id} value={d.id}>
                  {d.code}: {d.name}
                </option>
              ))}
            </select>

            {/* Segmented Filter control */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
              <button
                onClick={() => {
                  setActiveFilter('all');
                  setCurrentIndex(0);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  activeFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất cả ({sourceQuestions.length})
              </button>
              <button
                onClick={() => {
                  setActiveFilter('bookmarked');
                  setCurrentIndex(0);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1 ${
                  activeFilter === 'bookmarked'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                Đánh dấu ({bookmarkedIds.length})
              </button>
              <button
                onClick={() => {
                  setActiveFilter('wrong');
                  setCurrentIndex(0);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1 ${
                  activeFilter === 'wrong'
                    ? 'bg-white text-red-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <XCircle className="w-3.5 h-3.5 text-red-500" />
                Làm sai ({wrongIds.length})
              </button>
            </div>

            {/* Direct Jump to Question Number */}
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={1}
                max={filteredQuestions.length}
                value={jumpInput}
                onChange={e => setJumpInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleJump()}
                placeholder={`1-${filteredQuestions.length}`}
                className="w-20 px-2 py-1.5 text-xs border border-slate-200 rounded-lg text-center font-bold"
              />
              <button
                onClick={handleJump}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Tới
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Question Display */}
      {currentQuestion ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Question & Options Area */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs">
              {/* Question metadata badge bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 text-xs font-bold bg-blue-50 text-blue-700 rounded-md">
                    Câu {currentIndex + 1} / {filteredQuestions.length}
                  </span>
                  <span className="px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-700 rounded-md">
                    {currentQuestion.domainName}
                  </span>
                  <span
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md uppercase ${
                      currentQuestion.difficulty === 'hard'
                        ? 'bg-purple-50 text-purple-700'
                        : currentQuestion.difficulty === 'medium'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {currentQuestion.difficulty === 'hard' ? 'Khó' : currentQuestion.difficulty === 'medium' ? 'Trung bình' : 'Dễ'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    ID: {currentQuestion.id}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleBookmarkToggle(currentQuestion.id)}
                    className={`p-2 rounded-lg border transition-colors ${
                      isCurrentBookmarked
                        ? 'bg-amber-50 border-amber-200 text-amber-600'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
                    }`}
                    title={isCurrentBookmarked ? 'Bỏ đánh dấu' : 'Đánh dấu câu hỏi này'}
                  >
                    {isCurrentBookmarked ? (
                      <BookmarkCheck className="w-4 h-4" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Title & Scenario */}
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 leading-snug">
                {currentQuestion.title}
              </h2>

              {currentQuestion.scenario && (
                <div className="bg-slate-50 border-l-4 border-blue-500 p-4 rounded-r-lg mb-6 text-sm text-slate-700 leading-relaxed font-sans">
                  <strong>Tình huống:</strong> {currentQuestion.scenario}
                </div>
              )}

              {/* Options */}
              <div className="space-y-3 mb-6">
                {currentQuestion.options.map(option => {
                  const isSelected = selectedAnswer === option.id;
                  const isCorrect = currentQuestion.correctAnswer === option.id;
                  const showResult = selectedAnswer !== null;

                  let optionStyle = 'border-slate-200 hover:border-blue-400 hover:bg-slate-50';

                  if (showResult) {
                    if (isCorrect) {
                      optionStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-medium ring-2 ring-emerald-500/20';
                    } else if (isSelected && !isCorrect) {
                      optionStyle = 'border-red-500 bg-red-50 text-red-950 ring-2 ring-red-500/20';
                    } else {
                      optionStyle = 'border-slate-200 opacity-60';
                    }
                  } else if (isSelected) {
                    optionStyle = 'border-blue-600 bg-blue-50 text-blue-950 ring-2 ring-blue-600/20 font-medium';
                  }

                  return (
                    <button
                      key={option.id}
                      onClick={() => handleAnswerSelect(option.id)}
                      disabled={selectedAnswer !== null}
                      className={`w-full p-4 text-left text-sm rounded-xl border transition-all flex items-start gap-3.5 ${optionStyle}`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs uppercase shrink-0 mt-0.5 border ${
                          showResult && isCorrect
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : showResult && isSelected && !isCorrect
                            ? 'bg-red-600 text-white border-red-600'
                            : isSelected
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-600 border-slate-300'
                        }`}
                      >
                        {option.id}
                      </span>
                      <span className="flex-1 leading-relaxed text-slate-800 font-sans">
                        {option.text}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Action row */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Câu trước</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedAnswer(null);
                      setShowExplanation(false);
                      setAiAnalysis(null);
                    }}
                    className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Làm lại</span>
                  </button>

                  <button
                    onClick={handleNext}
                    disabled={currentIndex === filteredQuestions.length - 1}
                    className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <span>Câu tiếp theo</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Explanation & Official Ribbon Path Card */}
            {showExplanation && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-xs space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-amber-500" />
                    <span>Giải thích chuẩn Certiport</span>
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      selectedAnswer === currentQuestion.correctAnswer
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {selectedAnswer === currentQuestion.correctAnswer ? 'Đúng (+25 điểm)' : 'Chưa chính xác'}
                  </span>
                </div>

                <p className="text-sm text-slate-700 leading-relaxed">
                  {currentQuestion.explanation}
                </p>

                {/* Official Ribbon Path Box */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs">
                    <Compass className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="font-semibold text-slate-700">Đường dẫn Ribbon:</span>
                    <code className="bg-white px-2.5 py-1 rounded border border-slate-200 font-mono text-blue-700 font-bold text-xs">
                      {currentQuestion.officialRibbonPath}
                    </code>
                  </div>
                  <button
                    onClick={() => handleCopyPath(currentQuestion.officialRibbonPath)}
                    className="text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors shrink-0"
                  >
                    {copiedPath ? 'Đã sao chép!' : 'Sao chép đường dẫn'}
                  </button>
                </div>

                {/* Shortcut tip if available */}
                {currentQuestion.shortcutTip && (
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span className="font-semibold text-slate-700">Mẹo phím tắt:</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-mono font-medium">
                      {currentQuestion.shortcutTip}
                    </span>
                  </div>
                )}

                {/* Ask AI Tutor for Deep Breakdown */}
                <div className="pt-2 border-t border-slate-100">
                  {!aiAnalysis ? (
                    <button
                      onClick={handleRequestAiAnalysis}
                      disabled={isAiLoading}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 rounded-lg text-xs font-bold text-blue-900 flex items-center justify-center gap-2 transition-all shadow-2xs"
                    >
                      {isAiLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                          <span>Gia Sư MOS AI Đang Phân Tích Chi Tiết...</span>
                        </>
                      ) : (
                        <>
                          <Bot className="w-4 h-4 text-blue-600" />
                          <span>Hỏi Gia Sư AI Giải Thích Sâu Thêm Về Bẫy Đề Thi Này</span>
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="bg-slate-50 border border-blue-200 rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                        <Bot className="w-4 h-4 text-blue-600" />
                        <span>Phân Tích Chuyên Sâu Từ Gia Sư MOS AI:</span>
                      </div>
                      <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line font-sans">
                        {aiAnalysis}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar: 50-batch Question Grid & Strategy Tips */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm text-slate-900">Danh Sách Câu Hỏi</h3>
                <span className="text-xs text-slate-500 font-mono">
                  {filteredQuestions.length} câu
                </span>
              </div>

              {/* Batch Selector Bar */}
              {filteredQuestions.length > 50 && (
                <div className="mb-3 flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">
                    Nhóm {sidebarBatchStart} - {Math.min(sidebarBatchStart + 49, filteredQuestions.length)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={sidebarBatchStart <= 1}
                      onClick={() => setSidebarBatchStart(Math.max(1, sidebarBatchStart - 50))}
                      className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={sidebarBatchStart + 50 > filteredQuestions.length}
                      onClick={() => setSidebarBatchStart(sidebarBatchStart + 50)}
                      className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Grid of 50 questions */}
              <div className="grid grid-cols-5 gap-2 max-h-[360px] overflow-y-auto pr-1">
                {filteredQuestions.slice(sidebarBatchStart - 1, sidebarBatchStart + 49).map((q, localIdx) => {
                  const idx = sidebarBatchStart - 1 + localIdx;
                  const isCurrent = idx === currentIndex;
                  const isBookmarked = bookmarkedIds.includes(q.id);
                  const isWrong = wrongIds.includes(q.id);

                  return (
                    <button
                      key={q.id}
                      onClick={() => handleSelectQuestion(idx)}
                      className={`relative h-9 rounded-lg text-xs font-mono font-bold transition-all border ${
                        isCurrent
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-400/30'
                          : isWrong
                          ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                          : isBookmarked
                          ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {idx + 1}
                      {isBookmarked && (
                        <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-500 rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Open Full 1000 Grid Button */}
              <button
                onClick={() => setShowGridModal(true)}
                className="w-full mt-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Mở Bảng Điều Hướng 1,000 Câu</span>
              </button>
            </div>

            {/* Strategy Tips Card */}
            <div className="bg-slate-900 text-white rounded-xl p-5 shadow-xs">
              <h4 className="font-bold text-sm mb-2 text-blue-400 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Bí Quyết MOS Điểm Tuyệt Đối</span>
              </h4>
              <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
                <li>
                  • <strong>Ưu tiên thao tác Ribbon:</strong> Hệ thống khảo thí Certiport chấm theo sự kiện Ribbon. Hãy luyện tập chính xác vị trí Tab và Group.
                </li>
                <li>
                  • <strong>Đúng tham số mặc định:</strong> Khi đề yêu cầu Margin "Narrow", không chỉnh lề tùy ý mà chọn đúng preset Narrow.
                </li>
                <li>
                  • <strong>Quản lý thời gian 50 phút:</strong> Với 35 thao tác, hãy sử dụng tính năng Mark for Review để làm các câu chắc chắn trước.
                </li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
          <HelpCircle className="w-10 h-10 mx-auto text-slate-300 mb-3" />
          <p className="text-base font-medium">Không tìm thấy câu hỏi phù hợp với bộ lọc hiện tại.</p>
          <p className="text-xs text-slate-400 mt-1">Hãy thử xóa bộ lọc tìm kiếm hoặc chọn "Tất cả mục tiêu".</p>
        </div>
      )}
        </>
      )}

      {/* Grid Modal: All 1,000 Questions Navigator */}
      {showGridModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <Grid className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold">
                  Bảng Điều Hướng 1,000 Câu Hỏi Lý Thuyết ({selectedSubject === 'word' ? 'MOS Word' : selectedSubject === 'excel' ? 'MOS Excel' : 'MOS Master'})
                </h3>
              </div>
              <button
                onClick={() => setShowGridModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Batch Selector Bar */}
            <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto text-xs shrink-0">
              <span className="font-bold text-slate-600 mr-1">Khoảng câu:</span>
              {[1, 101, 201, 301, 401, 501, 601, 701, 801, 901].map(start => (
                <button
                  key={start}
                  onClick={() => setActiveBatchStart(start)}
                  className={`px-2.5 py-1 rounded font-bold transition-colors ${
                    activeBatchStart === start
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-white text-slate-700 border hover:bg-slate-50'
                  }`}
                >
                  {start}-{Math.min(start + 99, filteredQuestions.length)}
                </button>
              ))}
            </div>

            {/* Grid of 100 items for current batch */}
            <div className="p-6 overflow-y-auto grid grid-cols-5 sm:grid-cols-10 gap-2">
              {filteredQuestions.slice(activeBatchStart - 1, activeBatchStart + 99).map((q, batchIdx) => {
                const idx = activeBatchStart - 1 + batchIdx;
                const isCurrent = idx === currentIndex;
                const isBookmarked = bookmarkedIds.includes(q.id);
                const isWrong = wrongIds.includes(q.id);

                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      handleSelectQuestion(idx);
                      setShowGridModal(false);
                    }}
                    className={`h-11 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center relative border ${
                      isCurrent
                        ? 'ring-2 ring-blue-600 bg-blue-100 text-blue-900 border-blue-400 shadow-xs'
                        : isWrong
                        ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                        : isBookmarked
                        ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>#{idx + 1}</span>
                    {isBookmarked && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 absolute top-1 right-1" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-blue-600" /> Đang chọn
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-amber-400" /> Đã đánh dấu
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-red-400" /> Câu làm sai
                </span>
              </div>
              <button
                onClick={() => setShowGridModal(false)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 font-bold rounded-lg text-slate-700"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Excel Formula Playground Modal */}
      {showFormulaModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold">
                  <Code className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Phòng Thử Nghiệm Hàm Excel Trực Quan (Formula Playground)</h3>
                  <p className="text-xs text-emerald-300">Thao tác, tính toán và giải mã các công thức trọng điểm Certiport MO-200</p>
                </div>
              </div>
              <button
                onClick={() => setShowFormulaModal(false)}
                className="w-8 h-8 rounded-lg bg-emerald-800 hover:bg-emerald-700 flex items-center justify-center text-emerald-200 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Presets */}
              <div className="flex flex-wrap gap-2">
                {FORMULA_PRESETS.map((preset, idx) => (
                  <button
                    key={preset.title}
                    onClick={() => setSelectedFormulaPreset(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedFormulaPreset === idx
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {preset.title}
                  </button>
                ))}
              </div>

              {/* Active Formula Box */}
              <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2">
                <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider">
                  Công Thức Excel Chuẩn:
                </div>
                <div className="font-mono text-base font-bold text-amber-300 bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                  <span>{FORMULA_PRESETS[selectedFormulaPreset].formula}</span>
                  <span className="text-xs font-sans text-emerald-400 font-normal">
                    Kết quả: <strong>{FORMULA_PRESETS[selectedFormulaPreset].result}</strong>
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {FORMULA_PRESETS[selectedFormulaPreset].desc}
                </p>
              </div>

              {/* Sample Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Bảng Dữ Liệu Mô Phỏng (Vùng A1:D5):
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b">
                      <tr>
                        {FORMULA_PRESETS[selectedFormulaPreset].tableRows[0].map((h, i) => (
                          <th key={i} className="py-2.5 px-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {FORMULA_PRESETS[selectedFormulaPreset].tableRows.slice(1).map((r, ri) => (
                        <tr key={ri} className="hover:bg-emerald-50/40">
                          {r.map((c, ci) => (
                            <td key={ci} className="py-2.5 px-4 text-slate-700 font-medium">
                              {c}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Certiport Exam Tip Box */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950 flex items-start gap-2.5">
                <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-900">Bí Quyết Thi MOS:</strong> {FORMULA_PRESETS[selectedFormulaPreset].examTip}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end shrink-0">
              <button
                onClick={() => setShowFormulaModal(false)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors"
              >
                Đã Hiểu & Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
