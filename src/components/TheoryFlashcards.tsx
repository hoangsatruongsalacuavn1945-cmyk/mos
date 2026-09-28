import React, { useState, useEffect, useMemo } from 'react';
import { Question, MOSSubject } from '../types/mos';
import { recordQuestionAnswer, toggleBookmarkQuestion } from '../utils/storage';
import { soundManager } from '../utils/audio';
import { 
  RotateCw, 
  ChevronLeft, 
  ChevronRight, 
  Shuffle, 
  Bookmark, 
  BookmarkCheck, 
  CheckCircle2, 
  XCircle, 
  Compass, 
  Lightbulb, 
  Sparkles, 
  Layers, 
  Search, 
  Grid, 
  X, 
  Copy, 
  Check, 
  RotateCcw,
  Zap,
  ArrowRight
} from 'lucide-react';

interface TheoryFlashcardsProps {
  questions: Question[];
  bookmarkedIds: string[];
  wrongIds: string[];
  onStatsUpdate: () => void;
  onExitFlashcard: () => void;
  selectedSubject: MOSSubject;
}

export const TheoryFlashcards: React.FC<TheoryFlashcardsProps> = ({
  questions,
  bookmarkedIds,
  wrongIds,
  onStatsUpdate,
  onExitFlashcard,
  selectedSubject,
}) => {
  // Navigation & Flipping state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);
  
  // Filters
  const [cardFilter, setCardFilter] = useState<'all' | 'unlearned' | 'wrong' | 'bookmarked'>('all');
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Memorization tracking
  const [memorizedIds, setMemorizedIds] = useState<Record<string, boolean>>({});
  const [copiedPath, setCopiedPath] = useState(false);
  const [jumpInput, setJumpInput] = useState('');
  const [showDeckNavigator, setShowDeckNavigator] = useState(false);
  const [batchStart, setBatchStart] = useState(1);

  // Available unique domains
  const availableDomains = useMemo(() => {
    const map = new Map<string, string>();
    questions.forEach(q => {
      if (q.domainId && q.domainName) {
        map.set(q.domainId, q.domainName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [questions]);

  // Filtered list of questions
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      // Domain filter
      if (domainFilter !== 'all' && q.domainId !== domainFilter) return false;
      // Card status filter
      if (cardFilter === 'bookmarked' && !bookmarkedIds.includes(q.id)) return false;
      if (cardFilter === 'wrong' && !wrongIds.includes(q.id)) return false;
      if (cardFilter === 'unlearned' && memorizedIds[q.id]) return false;
      // Search
      if (searchQuery.trim()) {
        const qStr = searchQuery.toLowerCase();
        const inTitle = q.title.toLowerCase().includes(qStr);
        const inScenario = q.scenario?.toLowerCase().includes(qStr);
        const inPath = q.officialRibbonPath.toLowerCase().includes(qStr);
        const inExpl = q.explanation.toLowerCase().includes(qStr);
        const inNum = q.id.includes(qStr);
        return inTitle || inScenario || inPath || inExpl || inNum;
      }
      return true;
    });
  }, [questions, domainFilter, cardFilter, searchQuery, bookmarkedIds, wrongIds, memorizedIds]);

  // Active question deck taking shuffle into account
  const activeDeck = useMemo(() => {
    if (!isShuffled || shuffledIndices.length !== filteredQuestions.length) {
      return filteredQuestions;
    }
    return shuffledIndices.map(i => filteredQuestions[i]).filter(Boolean);
  }, [filteredQuestions, isShuffled, shuffledIndices]);

  const currentQuestion: Question | undefined = activeDeck[currentIndex] || activeDeck[0];

  // Reset flip when switching question
  const goToCard = (index: number) => {
    setIsFlipped(false);
    setCurrentIndex(index);
  };

  const handleNext = () => {
    if (currentIndex < activeDeck.length - 1) {
      goToCard(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      goToCard(currentIndex - 1);
    }
  };

  const handleFlip = () => {
    soundManager.playClick();
    setIsFlipped(prev => !prev);
  };

  // Keyboard navigation: Space/Enter to flip, Left/Right arrows to navigate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        handleFlip();
      } else if (e.code === 'ArrowRight' || e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft' || e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, activeDeck.length]);

  // Toggle shuffle
  const handleToggleShuffle = () => {
    soundManager.playClick();
    if (!isShuffled) {
      // Generate randomized indices
      const indices = Array.from({ length: filteredQuestions.length }, (_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      setShuffledIndices(indices);
      setIsShuffled(true);
      setCurrentIndex(0);
      setIsFlipped(false);
    } else {
      setIsShuffled(false);
      setShuffledIndices([]);
      setCurrentIndex(0);
      setIsFlipped(false);
    }
  };

  // Mark memorized status
  const handleMarkMemorized = (remembered: boolean) => {
    if (!currentQuestion) return;
    if (remembered) {
      soundManager.playCorrect();
      setMemorizedIds(prev => ({ ...prev, [currentQuestion.id]: true }));
      recordQuestionAnswer(currentQuestion.id, true);
    } else {
      soundManager.playWrong();
      setMemorizedIds(prev => ({ ...prev, [currentQuestion.id]: false }));
      recordQuestionAnswer(currentQuestion.id, false);
    }
    onStatsUpdate();
    // Advance to next card smoothly
    if (currentIndex < activeDeck.length - 1) {
      setTimeout(() => {
        goToCard(currentIndex + 1);
      }, 350);
    }
  };

  const handleCopyPath = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(path);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2000);
  };

  const handleJump = () => {
    const num = parseInt(jumpInput, 10);
    if (!isNaN(num) && num >= 1 && num <= activeDeck.length) {
      goToCard(num - 1);
      setJumpInput('');
      setShowDeckNavigator(false);
    }
  };

  const isBookmarked = currentQuestion ? bookmarkedIds.includes(currentQuestion.id) : false;
  const isMemorized = currentQuestion ? !!memorizedIds[currentQuestion.id] : false;

  const memorizedTotal = Object.values(memorizedIds).filter(Boolean).length;
  const memorizedPercent = activeDeck.length > 0 ? Math.round((memorizedTotal / activeDeck.length) * 100) : 0;

  // Find correct option object
  const correctOption = currentQuestion?.options.find(o => o.id === currentQuestion.correctAnswer);

  return (
    <div className="space-y-6">
      {/* Flashcard Header Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 uppercase">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Chế Độ Flashcard Lật Thẻ Ghi Nhớ
              </span>
              <span className="text-xs text-slate-400">· Ôn Tập Nhanh 1,000 Câu Hỏi MOS</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-1.5 text-white flex items-center gap-2">
              <Layers className="w-6 h-6 text-indigo-400" />
              <span>Thẻ Học Ghi Nhớ Phản Xạ ({selectedSubject === 'word' ? 'MOS Word' : selectedSubject === 'excel' ? 'MOS Excel' : 'Toàn Bộ Môn'})</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Nhấp vào thẻ hoặc bấm phím <strong>Space (Dấu cách)</strong> để lật xem đáp án, đường dẫn Ribbon và mẹo làm bài.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Toggle Shuffle */}
            <button
              onClick={handleToggleShuffle}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                isShuffled
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-extrabold'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700'
              }`}
              title="Xáo trộn ngẫu nhiên thứ tự thẻ học"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>{isShuffled ? 'Đã Xáo Trộn' : 'Trộn Ngẫu Nhiên'}</span>
            </button>

            {/* Deck Navigator */}
            <button
              onClick={() => setShowDeckNavigator(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Bảng Thẻ 1,000 Câu</span>
            </button>

            {/* Exit to Standard Quiz */}
            <button
              onClick={onExitFlashcard}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors border border-slate-700 flex items-center gap-1.5"
            >
              <span>Về Trắc Nghiệm Chuẩn</span>
            </button>
          </div>
        </div>

        {/* Memorization Progress Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-400">Tiến độ ghi nhớ trong bộ lọc:</span>
            <strong className="text-emerald-400 font-bold text-sm">
              {memorizedTotal} / {activeDeck.length} thẻ thành thạo ({memorizedPercent}%)
            </strong>
          </div>
          <div className="w-full sm:w-72 bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
            <div
              className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
              style={{ width: `${memorizedPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter and Quick Jump Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                goToCard(0);
              }}
              placeholder="Tìm theo nội dung, thao tác Ribbon, số câu..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-slate-50"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Filter by memorization status */}
            <select
              value={cardFilter}
              onChange={e => {
                setCardFilter(e.target.value as any);
                goToCard(0);
              }}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-medium bg-white"
            >
              <option value="all">Tất cả thẻ ({questions.length})</option>
              <option value="unlearned">Chưa thuộc ({questions.length - memorizedTotal})</option>
              <option value="wrong">Làm sai ({wrongIds.length})</option>
              <option value="bookmarked">Đã đánh dấu ({bookmarkedIds.length})</option>
            </select>

            {/* Filter by Domain */}
            {availableDomains.length > 0 && (
              <select
                value={domainFilter}
                onChange={e => {
                  setDomainFilter(e.target.value);
                  goToCard(0);
                }}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-medium bg-white max-w-[200px] truncate"
              >
                <option value="all">Tất cả mục tiêu (Domains)</option>
                {availableDomains.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            )}

            {/* Jump input */}
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={1}
                max={activeDeck.length}
                value={jumpInput}
                onChange={e => setJumpInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleJump()}
                placeholder={`1-${activeDeck.length}`}
                className="w-20 px-2 py-1.5 text-xs border border-slate-200 rounded-lg text-center font-bold"
              />
              <button
                onClick={handleJump}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Nhảy
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Flashcard Interactive Deck */}
      {currentQuestion ? (
        <div className="space-y-4">
          {/* Card Container with 3D Flip Perspective */}
          <div className="w-full max-w-4xl mx-auto" style={{ perspective: '1400px' }}>
            <div
              onClick={handleFlip}
              className="relative w-full transition-transform duration-500 cursor-pointer select-none"
              style={{
                transformStyle: 'preserve-3d',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                minHeight: '460px',
              }}
            >
              {/* ================= FRONT SIDE (QUESTION) ================= */}
              <div
                className="w-full min-h-[460px] bg-white rounded-2xl border-2 border-slate-200 p-6 sm:p-8 shadow-xl flex flex-col justify-between transition-shadow hover:shadow-2xl"
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}
              >
                {/* Front Top Meta Bar */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-1 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-md">
                      Thẻ {currentIndex + 1} / {activeDeck.length}
                    </span>
                    <span className="px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-700 rounded-md">
                      {currentQuestion.domainName}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${
                        currentQuestion.difficulty === 'hard'
                          ? 'bg-purple-100 text-purple-700'
                          : currentQuestion.difficulty === 'medium'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {currentQuestion.difficulty === 'hard' ? 'Khó' : currentQuestion.difficulty === 'medium' ? 'Trung bình' : 'Cơ bản'}
                    </span>
                    {isMemorized && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-md flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ĐÃ THUỘC
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        toggleBookmarkQuestion(currentQuestion.id);
                        onStatsUpdate();
                      }}
                      className={`p-2 rounded-lg border transition-colors ${
                        isBookmarked
                          ? 'bg-amber-50 border-amber-200 text-amber-600'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
                      }`}
                      title={isBookmarked ? 'Bỏ đánh dấu' : 'Ghim thẻ này'}
                    >
                      {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Front Question Body */}
                <div className="py-6 space-y-4 my-auto">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-relaxed font-sans">
                    {currentQuestion.title}
                  </h3>

                  {currentQuestion.scenario && (
                    <div className="p-3.5 bg-blue-50/80 border-l-4 border-blue-500 rounded-r-lg text-xs sm:text-sm text-slate-700 leading-relaxed">
                      <strong>Tình huống:</strong> {currentQuestion.scenario}
                    </div>
                  )}

                  {/* 4 Options Preview */}
                  <div className="space-y-2 pt-2">
                    {currentQuestion.options.map(opt => (
                      <div
                        key={opt.id}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm flex items-start gap-2.5 text-slate-700 font-medium"
                      >
                        <span className="w-5 h-5 rounded-full bg-white border border-slate-300 font-bold text-xs uppercase flex items-center justify-center text-slate-600 shrink-0 mt-0.5">
                          {opt.id}
                        </span>
                        <span className="leading-relaxed">{opt.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Front Footer CTA */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span className="hidden sm:inline">Phím tắt: Space để lật thẻ · Mũi tên ← / → để chuyển câu</span>
                  <div className="flex items-center gap-1.5 text-indigo-600 font-bold ml-auto hover:text-indigo-700">
                    <RotateCw className="w-4 h-4" />
                    <span>Lật Xem Đáp Án (Mặt Sau)</span>
                  </div>
                </div>
              </div>

              {/* ================= BACK SIDE (ANSWER & RIBBON PATH) ================= */}
              <div
                className="w-full min-h-[460px] bg-slate-900 text-white rounded-2xl border-2 border-indigo-500/50 p-6 sm:p-8 shadow-2xl flex flex-col justify-between absolute inset-0"
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              >
                {/* Back Top Meta Bar */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-emerald-500 text-slate-950 font-black text-xs rounded-full uppercase flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Đáp Án Đúng: {currentQuestion.correctAnswer.toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-400">
                      Thẻ #{currentIndex + 1}
                    </span>
                  </div>

                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        toggleBookmarkQuestion(currentQuestion.id);
                        onStatsUpdate();
                      }}
                      className={`p-2 rounded-lg border transition-colors ${
                        isBookmarked
                          ? 'bg-amber-500/20 border-amber-400/40 text-amber-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Back Answer & Explanation Content */}
                <div className="py-5 space-y-4 my-auto overflow-y-auto">
                  {/* Correct Option Display */}
                  <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-xl space-y-1">
                    <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                      Lựa Chọn Chính Xác Chuẩn Khảo Thí:
                    </div>
                    <div className="text-sm sm:text-base font-bold text-white">
                      {correctOption ? `${correctOption.id.toUpperCase()}. ${correctOption.text}` : currentQuestion.correctAnswer}
                    </div>
                  </div>

                  {/* Official Ribbon Path Box */}
                  <div className="p-4 bg-slate-800/90 rounded-xl border border-slate-700 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-indigo-400 font-bold">
                        <Compass className="w-4 h-4" />
                        <span>Quy Trình Thao Tác Ribbon Certiport:</span>
                      </div>
                      <button
                        onClick={e => handleCopyPath(currentQuestion.officialRibbonPath, e)}
                        className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-[11px] text-slate-300 flex items-center gap-1 transition-colors"
                      >
                        {copiedPath ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedPath ? 'Đã chép' : 'Sao chép'}</span>
                      </button>
                    </div>
                    <code className="block p-2 bg-slate-950 rounded font-mono text-xs sm:text-sm text-amber-300 font-bold border border-slate-800 break-all">
                      {currentQuestion.officialRibbonPath}
                    </code>
                  </div>

                  {/* Detailed Explanation */}
                  <div className="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-2 bg-slate-800/40 p-4 rounded-xl border border-slate-800">
                    <div className="font-bold text-slate-200 flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4 text-amber-400" />
                      <span>Giải thích chuyên sâu:</span>
                    </div>
                    <p className="text-slate-300">{currentQuestion.explanation}</p>
                  </div>

                  {/* Shortcut Tip */}
                  {currentQuestion.shortcutTip && (
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Phím tắt hỗ trợ:</span>
                      <kbd className="px-2 py-0.5 bg-slate-800 text-slate-200 rounded font-mono text-xs border border-slate-700">
                        {currentQuestion.shortcutTip}
                      </kbd>
                    </div>
                  )}
                </div>

                {/* Back Footer: Self-Evaluation Actions */}
                <div
                  className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3"
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    onClick={handleFlip}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Lật Lại Câu Hỏi</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleMarkMemorized(false)}
                      className="px-4 py-2 bg-red-900/60 hover:bg-red-800 text-red-200 text-xs font-bold rounded-xl border border-red-700 transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <XCircle className="w-4 h-4 text-red-400" />
                      <span>Chưa Nhớ / Cần Ôn Lại</span>
                    </button>

                    <button
                      onClick={() => handleMarkMemorized(true)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Đã Nhớ Kỹ (Thuộc)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Controls Bar */}
          <div className="flex items-center justify-between max-w-4xl mx-auto p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
            <button
              disabled={currentIndex === 0}
              onClick={handlePrev}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Thẻ Trước (←)</span>
            </button>

            <div className="text-center">
              <span className="text-xs font-bold text-slate-800">
                Câu #{currentIndex + 1} / {activeDeck.length}
              </span>
              <div className="text-[11px] text-slate-400">
                Nhấp thẻ hoặc bấm Space để lật
              </div>
            </div>

            <button
              disabled={currentIndex >= activeDeck.length - 1}
              onClick={handleNext}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
            >
              <span>Thẻ Tiếp (→)</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
          <Layers className="w-10 h-10 mx-auto text-slate-300 mb-3" />
          <p className="text-base font-medium">Không tìm thấy thẻ nào phù hợp với bộ lọc hiện tại.</p>
          <button
            onClick={() => {
              setCardFilter('all');
              setDomainFilter('all');
              setSearchQuery('');
            }}
            className="mt-3 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg"
          >
            Hiển thị tất cả {questions.length} câu
          </button>
        </div>
      )}

      {/* Grid Deck Navigator Modal */}
      {showDeckNavigator && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <Grid className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold">
                  Bảng Điều Hướng 1,000 Thẻ Flashcard ({selectedSubject === 'word' ? 'MOS Word' : 'MOS Excel'})
                </h3>
              </div>
              <button
                onClick={() => setShowDeckNavigator(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Batch selector */}
            <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto text-xs shrink-0">
              <span className="font-bold text-slate-600 mr-1">Khoảng câu:</span>
              {[1, 101, 201, 301, 401, 501, 601, 701, 801, 901].map(start => (
                <button
                  key={start}
                  onClick={() => setBatchStart(start)}
                  className={`px-2.5 py-1 rounded font-bold transition-colors ${
                    batchStart === start
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-white text-slate-700 border hover:bg-slate-50'
                  }`}
                >
                  {start}-{Math.min(start + 99, activeDeck.length)}
                </button>
              ))}
            </div>

            {/* Grid */}
            <div className="p-6 overflow-y-auto grid grid-cols-5 sm:grid-cols-10 gap-2">
              {activeDeck.slice(batchStart - 1, batchStart + 99).map((q, idx) => {
                const actualIdx = batchStart - 1 + idx;
                const isCur = actualIdx === currentIndex;
                const isMem = !!memorizedIds[q.id];
                const isBmk = bookmarkedIds.includes(q.id);

                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      goToCard(actualIdx);
                      setShowDeckNavigator(false);
                    }}
                    className={`h-11 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center relative border ${
                      isCur
                        ? 'ring-2 ring-indigo-600 bg-indigo-100 text-indigo-900 border-indigo-400 shadow-xs'
                        : isMem
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>#{actualIdx + 1}</span>
                    {isMem && <Check className="w-3 h-3 text-emerald-600" />}
                    {isBmk && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 absolute top-1 right-1" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-indigo-600" /> Đang xem
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-emerald-500" /> Đã thuộc
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-slate-200" /> Chưa học
                </span>
              </div>
              <button
                onClick={() => setShowDeckNavigator(false)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 font-bold rounded-lg text-slate-700"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
