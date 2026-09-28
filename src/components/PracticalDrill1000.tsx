import React, { useState, useMemo } from 'react';
import { MOSSubject } from '../types/mos';
import { getWordPracticalBank, getExcelPracticalBank, MassivePracticalTask } from '../data/massiveQuestionBank';
import { recordCompletedTask } from '../utils/storage';
import { soundManager } from '../utils/audio';
import { 
  FileSpreadsheet, 
  FileText, 
  CheckCircle2, 
  HelpCircle, 
  RotateCcw, 
  Bookmark, 
  ChevronRight, 
  ChevronLeft, 
  Search, 
  Filter, 
  Sparkles,
  Grid,
  Check,
  Award,
  Layers,
  Sliders,
  Eye,
  X,
  Compass,
  Zap,
  ArrowRight
} from 'lucide-react';

interface PracticalDrill1000Props {
  selectedSubject: MOSSubject;
  completedTaskIds: string[];
  onStatsUpdate: () => void;
}

export const PracticalDrill1000: React.FC<PracticalDrill1000Props> = ({
  selectedSubject,
  completedTaskIds,
  onStatsUpdate,
}) => {
  // Active subject within the 1000-task bank (default to selectedSubject if word/excel, else 'word')
  const [activeSubject, setActiveSubject] = useState<'word' | 'excel'>(
    selectedSubject === 'excel' ? 'excel' : 'word'
  );

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [tabFilter, setTabFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  
  // Navigation
  const [currentIndex, setCurrentIndex] = useState(0);
  const [jumpInput, setJumpInput] = useState('');
  const [showGridModal, setShowGridModal] = useState(false);
  const [activeBatchStart, setActiveBatchStart] = useState(1);
  const [showHint, setShowHint] = useState(false);
  const [taskFeedback, setTaskFeedback] = useState<{ message: string; success: boolean } | null>(null);
  const [flaggedIds, setFlaggedIds] = useState<Record<string, boolean>>({});

  // Ribbon state for current interaction
  const [activeRibbonTab, setActiveRibbonTab] = useState<string>('Home');
  const [lastExecutedCmd, setLastExecutedCmd] = useState<string>('');

  // Fetch full 1,000 tasks based on active subject
  const allTasks = useMemo(() => {
    return activeSubject === 'word' ? getWordPracticalBank() : getExcelPracticalBank();
  }, [activeSubject]);

  // Filtered task bank
  const filteredTasks = useMemo(() => {
    return allTasks.filter(t => {
      // Tab filter
      if (tabFilter !== 'all' && t.targetTab !== tabFilter) return false;
      // Difficulty filter
      if (difficultyFilter !== 'all' && t.difficulty !== difficultyFilter) return false;
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inInst = t.instruction.toLowerCase().includes(q);
        const inCmd = t.targetCommand.toLowerCase().includes(q);
        const inHint = t.hint.toLowerCase().includes(q);
        const inCat = t.category.toLowerCase().includes(q);
        const inNum = `#${t.taskNumber}`.includes(q) || `${t.taskNumber}` === q;
        return inInst || inCmd || inHint || inCat || inNum;
      }
      return true;
    });
  }, [allTasks, tabFilter, difficultyFilter, searchQuery]);

  const currentTask: MassivePracticalTask | undefined = filteredTasks[currentIndex] || filteredTasks[0] || allTasks[0];

  // Set default ribbon tab to match current task or Home
  const handleSelectTask = (index: number) => {
    setCurrentIndex(index);
    setShowHint(false);
    setTaskFeedback(null);
    setLastExecutedCmd('');
  };

  const handleJump = () => {
    const num = parseInt(jumpInput, 10);
    if (!isNaN(num) && num >= 1 && num <= filteredTasks.length) {
      handleSelectTask(num - 1);
      setJumpInput('');
      setShowGridModal(false);
    }
  };

  // Toggle review flag
  const toggleFlag = (taskId: string) => {
    soundManager.playClick();
    setFlaggedIds(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  // Interactive command click on the virtual Ribbon
  const handleExecuteRibbonCommand = (tab: string, commandName: string, param?: string) => {
    soundManager.playClick();
    setLastExecutedCmd(`${tab} > ${commandName}`);

    if (!currentTask) return;

    // Check if this matches the current task requirements
    const isTabMatch = currentTask.targetTab.toLowerCase().includes(tab.toLowerCase()) || tab.toLowerCase().includes(currentTask.targetTab.toLowerCase());
    const isCmdMatch = currentTask.targetCommand.toLowerCase() === commandName.toLowerCase() ||
      commandName.toLowerCase().includes(currentTask.targetCommand.toLowerCase()) ||
      currentTask.targetCommand.toLowerCase().includes(commandName.toLowerCase());

    if (isTabMatch && isCmdMatch) {
      soundManager.playTaskComplete();
      recordCompletedTask(currentTask.id);
      onStatsUpdate();
      setTaskFeedback({
        message: `🎉 CHÍNH XÁC! Bạn đã thực hiện đúng thao tác "${commandName}" trên thẻ ${tab} theo chuẩn khảo thí Certiport.`,
        success: true
      });
    } else {
      soundManager.playWrong();
      setTaskFeedback({
        message: `Chưa đúng yêu cầu: Bạn vừa nhấp "${commandName}" trên thẻ ${tab}. Gợi ý: Hãy tìm thẻ [${currentTask.targetTab}] và lệnh [${currentTask.targetCommand}].`,
        success: false
      });
    }
  };

  const isCompleted = currentTask ? completedTaskIds.includes(currentTask.id) : false;
  const isFlagged = currentTask ? !!flaggedIds[currentTask.id] : false;

  // Total completed count for this subject's 1000 tasks
  const completedCount = allTasks.filter(t => completedTaskIds.includes(t.id)).length;
  const progressPercent = Math.round((completedCount / allTasks.length) * 100);

  // Available ribbon tabs for Word vs Excel
  const ribbonTabs = activeSubject === 'word'
    ? ['Home', 'Insert', 'Design', 'Layout', 'References', 'Review', 'View']
    : ['Home', 'Insert', 'Page Layout', 'Formulas', 'Data', 'Review', 'View'];

  return (
    <div className="space-y-6">
      {/* Top Banner & Subject Switcher */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 uppercase">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Ngân Hàng 1,000 Câu Hỏi Thực Hành Siêu Cấp
              </span>
              <span className="text-xs text-slate-400">· Chuẩn Khảo Thí Certiport MO-100 & MO-200</span>
            </div>
            <h2 className="text-2xl font-black mt-2 text-white flex items-center gap-2">
              {activeSubject === 'word' ? (
                <>
                  <FileText className="w-6 h-6 text-blue-400" />
                  <span>1,000 Bài Tập Thực Hành MOS Word 365/2019</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
                  <span>1,000 Bài Tập Thực Hành MOS Excel 365/2019</span>
                </>
              )}
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Luyện tập thực chiến với thanh Ribbon ảo tương tác trực tiếp. Mỗi câu hỏi mô phỏng chính xác thao tác trong phòng thi quốc tế.
            </p>
          </div>

          {/* Subject Toggle Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setActiveSubject('word');
                setCurrentIndex(0);
                setTaskFeedback(null);
                setShowHint(false);
              }}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                activeSubject === 'word'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>MOS Word (1,000 Câu)</span>
            </button>

            <button
              onClick={() => {
                setActiveSubject('excel');
                setCurrentIndex(0);
                setTaskFeedback(null);
                setShowHint(false);
              }}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                activeSubject === 'excel'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-400'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>MOS Excel (1,000 Câu)</span>
            </button>
          </div>
        </div>

        {/* Progress Bar across the 1000 tasks */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-400">Tiến độ thực hành:</span>
            <strong className="text-emerald-400 font-bold text-sm">
              {completedCount} / 1,000 câu hoàn thành ({progressPercent}%)
            </strong>
          </div>
          <div className="w-full sm:w-72 bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                activeSubject === 'word' ? 'bg-blue-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter and Jump Toolbar */}
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
                setCurrentIndex(0);
              }}
              placeholder="Tìm theo lệnh, từ khóa (#450, VLOOKUP, Margins)..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Filter by Ribbon Tab */}
            <select
              value={tabFilter}
              onChange={e => {
                setTabFilter(e.target.value);
                setCurrentIndex(0);
              }}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-medium bg-white"
            >
              <option value="all">Thẻ Ribbon: Tất cả</option>
              {ribbonTabs.map(t => (
                <option key={t} value={t}>Thẻ {t}</option>
              ))}
            </select>

            {/* Filter by Difficulty */}
            <select
              value={difficultyFilter}
              onChange={e => {
                setDifficultyFilter(e.target.value as any);
                setCurrentIndex(0);
              }}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-medium bg-white"
            >
              <option value="all">Độ khó: Tất cả</option>
              <option value="easy">Dễ (Cơ bản)</option>
              <option value="medium">Trung bình</option>
              <option value="hard">Nâng cao (Phức tạp)</option>
            </select>

            {/* Jump input */}
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={1}
                max={filteredTasks.length}
                value={jumpInput}
                onChange={e => setJumpInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleJump()}
                placeholder={`1-${filteredTasks.length}`}
                className="w-20 px-2 py-1.5 text-xs border border-slate-200 rounded-lg text-center font-bold"
              />
              <button
                onClick={handleJump}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Nhảy Tới
              </button>
            </div>

            {/* Open Full 1000 Grid Navigator */}
            <button
              onClick={() => setShowGridModal(true)}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Bảng 1,000 Câu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Task Working Area */}
      {currentTask && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
          {/* Task Header Information */}
          <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white shrink-0 shadow-xs ${
                activeSubject === 'word' ? 'bg-blue-600' : 'bg-emerald-600'
              }`}>
                #{currentTask.taskNumber}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">
                    Câu Hỏi Thực Hành Số {currentTask.taskNumber} / {allTasks.length}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    currentTask.difficulty === 'hard'
                      ? 'bg-purple-100 text-purple-700'
                      : currentTask.difficulty === 'medium'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {currentTask.difficulty === 'hard' ? 'Nâng Cao' : currentTask.difficulty === 'medium' ? 'Trung Bình' : 'Cơ Bản'}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 text-slate-700">
                    {currentTask.category}
                  </span>
                  {isCompleted && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      ĐÃ HOÀN THÀNH
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {currentTask.instruction}
                </h3>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => toggleFlag(currentTask.id)}
                className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  isFlagged
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
                title="Đánh dấu câu hỏi cần xem lại"
              >
                <Bookmark className="w-4 h-4" />
                <span className="hidden sm:inline">{isFlagged ? 'Đã ghim' : 'Ghim'}</span>
              </button>

              <button
                onClick={() => setShowHint(!showHint)}
                className="px-3 py-2 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors flex items-center gap-1.5"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{showHint ? 'Ẩn Hướng Dẫn' : 'Xem Gợi Ý Ribbon'}</span>
              </button>
            </div>
          </div>

          {/* Hint Card if toggled */}
          {showHint && (
            <div className="p-4 bg-amber-50/80 border-b border-amber-200 text-amber-950 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <Compass className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Chỉ dẫn Certiport:</strong> {currentTask.hint}
                <div className="mt-1 font-mono text-[11px] text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded w-fit">
                  Đường dẫn: {currentTask.officialRibbonPath}
                </div>
              </div>
            </div>
          )}

          {/* Feedback Card if executed */}
          {taskFeedback && (
            <div className={`p-4 border-b text-xs flex items-start gap-2.5 animate-in fade-in duration-200 ${
              taskFeedback.success
                ? 'bg-emerald-50 text-emerald-950 border-emerald-200'
                : 'bg-red-50 text-red-950 border-red-200'
            }`}>
              {taskFeedback.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <HelpCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="font-semibold leading-relaxed">
                {taskFeedback.message}
              </div>
            </div>
          )}

          {/* Virtual Ribbon 365 Bar */}
          <div className="border-b border-slate-200 bg-slate-100">
            {/* Ribbon Tabs */}
            <div className="flex items-center gap-1 px-4 pt-2 border-b border-slate-200 overflow-x-auto text-xs font-bold">
              <span className="px-3 py-1.5 bg-blue-700 text-white rounded-t-md cursor-default text-[11px]">
                {activeSubject === 'word' ? 'Word' : 'Excel'} 365
              </span>
              {ribbonTabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => {
                    soundManager.playClick();
                    setActiveRibbonTab(tab);
                  }}
                  className={`px-4 py-1.5 rounded-t-md transition-colors ${
                    activeRibbonTab === tab
                      ? 'bg-white text-blue-700 shadow-2xs border-t-2 border-blue-600 font-extrabold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Ribbon Commands Palette */}
            <div className="p-3 bg-white flex flex-wrap items-center gap-2 text-xs overflow-x-auto min-h-[64px]">
              {/* Home Tab Commands */}
              {activeRibbonTab === 'Home' && (
                <>
                  <div className="flex items-center gap-1 border-r border-slate-200 pr-2">
                    <button
                      onClick={() => handleExecuteRibbonCommand('Home', 'Cut')}
                      className="px-2 py-1.5 hover:bg-slate-100 rounded text-slate-700 font-medium"
                    >
                      ✂️ Cut
                    </button>
                    <button
                      onClick={() => handleExecuteRibbonCommand('Home', 'Copy')}
                      className="px-2 py-1.5 hover:bg-slate-100 rounded text-slate-700 font-medium"
                    >
                      📄 Copy
                    </button>
                    <button
                      onClick={() => handleExecuteRibbonCommand('Home', 'Paste Special', 'Values Only')}
                      className="px-2 py-1.5 hover:bg-slate-100 rounded text-slate-700 font-medium"
                    >
                      📋 Paste Special
                    </button>
                  </div>

                  <div className="flex items-center gap-1 border-r border-slate-200 pr-2">
                    <button
                      onClick={() => handleExecuteRibbonCommand('Home', 'Line Spacing', '1.5 lines')}
                      className="px-2 py-1.5 hover:bg-slate-100 rounded text-slate-700 font-medium"
                    >
                      ↕️ Line Spacing
                    </button>
                    <button
                      onClick={() => handleExecuteRibbonCommand('Home', 'Styles', 'Heading 1')}
                      className="px-2 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded font-bold"
                    >
                      Heading 1
                    </button>
                    <button
                      onClick={() => handleExecuteRibbonCommand('Home', 'Styles', 'Heading 2')}
                      className="px-2 py-1.5 hover:bg-slate-100 rounded text-slate-700 font-medium"
                    >
                      Heading 2
                    </button>
                  </div>

                  {activeSubject === 'excel' && (
                    <div className="flex items-center gap-1 border-r border-slate-200 pr-2">
                      <button
                        onClick={() => handleExecuteRibbonCommand('Home', 'Format as Table', 'Table Style Medium 2')}
                        className="px-2 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded font-bold"
                      >
                        📊 Format as Table
                      </button>
                      <button
                        onClick={() => handleExecuteRibbonCommand('Home', 'Total Row', 'Enable Total Row')}
                        className="px-2 py-1.5 hover:bg-slate-100 rounded text-slate-700 font-medium"
                      >
                        ∑ Total Row
                      </button>
                      <button
                        onClick={() => handleExecuteRibbonCommand('Home', 'Conditional Formatting', 'Highlight > 500')}
                        className="px-2 py-1.5 hover:bg-slate-100 rounded text-slate-700 font-medium"
                      >
                        🎨 Conditional Formatting
                      </button>
                      <button
                        onClick={() => handleExecuteRibbonCommand('Home', 'Number Format', 'Currency VND')}
                        className="px-2 py-1.5 hover:bg-slate-100 rounded text-slate-700 font-medium"
                      >
                        💲 Currency Format
                      </button>
                      <button
                        onClick={() => handleExecuteRibbonCommand('Home', 'Convert to Range', 'Convert to Normal Range')}
                        className="px-2 py-1.5 hover:bg-slate-100 rounded text-slate-700 font-medium"
                      >
                        🔄 Convert to Range
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Layout / Page Layout Commands */}
              {(activeRibbonTab === 'Layout' || activeRibbonTab === 'Page Layout') && (
                <>
                  <button
                    onClick={() => handleExecuteRibbonCommand('Layout', 'Margins', 'Narrow')}
                    className="px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded font-bold"
                  >
                    📐 Margins: Narrow (0.5")
                  </button>
                  <button
                    onClick={() => handleExecuteRibbonCommand('Layout', 'Margins', 'Wide')}
                    className="px-2.5 py-1.5 hover:bg-slate-100 rounded text-slate-700 font-medium"
                  >
                    Margins: Wide
                  </button>
                  <button
                    onClick={() => handleExecuteRibbonCommand('Layout', 'Orientation', 'Landscape')}
                    className="px-2.5 py-1.5 hover:bg-slate-100 rounded text-slate-700 font-medium"
                  >
                    🔄 Orientation: Landscape
                  </button>
                  <button
                    onClick={() => handleExecuteRibbonCommand('Layout', 'Breaks', 'Next Page Section Break')}
                    className="px-2.5 py-1.5 hover:bg-slate-100 rounded text-slate-700 font-medium"
                  >
                    ✂️ Section Breaks: Next Page
                  </button>
                  <button
                    onClick={() => handleExecuteRibbonCommand('Layout', 'Columns', 'Two Columns')}
                    className="px-2.5 py-1.5 hover:bg-slate-100 rounded text-slate-700 font-medium"
                  >
                    📰 Columns: Two
                  </button>
                  {activeSubject === 'excel' && (
                    <button
                      onClick={() => handleExecuteRibbonCommand('Page Layout', 'Print Area', 'Set Print Area A1:F20')}
                      className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded font-bold"
                    >
                      🖨️ Set Print Area
                    </button>
                  )}
                </>
              )}

              {/* Insert Tab Commands */}
              {activeRibbonTab === 'Insert' && (
                <>
                  <button
                    onClick={() => handleExecuteRibbonCommand('Insert', 'Format as Table', 'Table 4x4')}
                    className="px-2.5 py-1.5 hover:bg-slate-100 rounded text-slate-700 font-medium"
                  >
                    🔲 Insert Table
                  </button>
                  <button
                    onClick={() => handleExecuteRibbonCommand('Insert', 'Drop Cap', 'Dropped')}
                    className="px-2.5 py-1.5 hover:bg-slate-100 rounded text-slate-700 font-medium"
                  >
                    🔤 Drop Cap: Dropped
                  </button>
                  <button
                    onClick={() => handleExecuteRibbonCommand('Insert', 'SmartArt', 'Basic Process')}
                    className="px-2.5 py-1.5 hover:bg-slate-100 rounded text-slate-700 font-medium"
                  >
                    💠 SmartArt: Basic Process
                  </button>
                  <button
                    onClick={() => handleExecuteRibbonCommand('Insert', 'Insert Column Chart', 'Clustered Column')}
                    className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded font-bold"
                  >
                    📊 Insert Column Chart
                  </button>
                  <button
                    onClick={() => handleExecuteRibbonCommand('Insert', 'Chart Title', 'Báo Cáo Doanh Thu 2026')}
                    className="px-2.5 py-1.5 hover:bg-slate-100 rounded text-slate-700 font-medium"
                  >
                    🏷️ Chart Title
                  </button>
                  <button
                    onClick={() => handleExecuteRibbonCommand('Insert', 'Move Chart', 'New Sheet named "Charts"')}
                    className="px-2.5 py-1.5 hover:bg-slate-100 rounded text-slate-700 font-medium"
                  >
                    ➡️ Move Chart
                  </button>
                </>
              )}

              {/* Formulas Tab (Excel) */}
              {activeRibbonTab === 'Formulas' && (
                <>
                  <button
                    onClick={() => handleExecuteRibbonCommand('Formulas', 'AutoSum', '=SUM(C2:C20)')}
                    className="px-2.5 py-1.5 bg-emerald-600 text-white rounded font-bold"
                  >
                    ∑ AutoSum (=SUM)
                  </button>
                  <button
                    onClick={() => handleExecuteRibbonCommand('Formulas', 'Formula IF', '=IF(Score>=700,"Pass","Fail")')}
                    className="px-2.5 py-1.5 hover:bg-slate-100 rounded text-slate-700 font-medium"
                  >
                    ⚡ Logical IF
                  </button>
                  <button
                    onClick={() => handleExecuteRibbonCommand('Formulas', 'Formula VLOOKUP', '=VLOOKUP(A2,$E$2:$G$10,2,FALSE)')}
                    className="px-2.5 py-1.5 hover:bg-slate-100 rounded text-slate-700 font-medium"
                  >
                    🔍 VLOOKUP Formula
                  </button>
                  <button
                    onClick={() => handleExecuteRibbonCommand('Formulas', 'Formula COUNTIF', '=COUNTIF(B2:B30, "Hoàn Thành")')}
                    className="px-2.5 py-1.5 hover:bg-slate-100 rounded text-slate-700 font-medium"
                  >
                    🔢 COUNTIF Formula
                  </button>
                </>
              )}

              {/* Data Tab (Excel) */}
              {activeRibbonTab === 'Data' && (
                <>
                  <button
                    onClick={() => handleExecuteRibbonCommand('Data', 'Flash Fill', 'Ctrl + E')}
                    className="px-2.5 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded font-bold"
                  >
                    ⚡ Flash Fill (Ctrl+E)
                  </button>
                  <button
                    onClick={() => handleExecuteRibbonCommand('Data', 'Sort', 'Custom Sort')}
                    className="px-2.5 py-1.5 hover:bg-slate-100 rounded text-slate-700 font-medium"
                  >
                    📶 Sort & Filter
                  </button>
                  <button
                    onClick={() => handleExecuteRibbonCommand('Data', 'Repeat Header Rows', 'Enabled')}
                    className="px-2.5 py-1.5 hover:bg-slate-100 rounded text-slate-700 font-medium"
                  >
                    🔁 Repeat Header Rows
                  </button>
                </>
              )}

              {/* References Tab (Word) */}
              {activeRibbonTab === 'References' && (
                <>
                  <button
                    onClick={() => handleExecuteRibbonCommand('References', 'Table of Contents', 'Automatic Table 1')}
                    className="px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded font-bold"
                  >
                    📑 Table of Contents: Automatic 1
                  </button>
                  <button
                    onClick={() => handleExecuteRibbonCommand('References', 'Footnote', 'Insert Footnote')}
                    className="px-2.5 py-1.5 hover:bg-slate-100 rounded text-slate-700 font-medium"
                  >
                    📝 Insert Footnote
                  </button>
                </>
              )}

              {/* Design Tab */}
              {activeRibbonTab === 'Design' && (
                <>
                  <button
                    onClick={() => handleExecuteRibbonCommand('Design', 'Watermark', 'DRAFT 1')}
                    className="px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded font-bold"
                  >
                    💧 Watermark: DRAFT 1
                  </button>
                  <button
                    onClick={() => handleExecuteRibbonCommand('Design', 'Page Borders', 'Box Border 1.5pt')}
                    className="px-2.5 py-1.5 hover:bg-slate-100 rounded text-slate-700 font-medium"
                  >
                    🖼️ Page Borders
                  </button>
                  <button
                    onClick={() => handleExecuteRibbonCommand('Design', 'Table Style', 'Grid Table 4 - Accent 1')}
                    className="px-2.5 py-1.5 hover:bg-slate-100 rounded text-slate-700 font-medium"
                  >
                    🎨 Table Style: Grid Table 4
                  </button>
                </>
              )}

              {/* View Tab */}
              {activeRibbonTab === 'View' && (
                <>
                  <button
                    onClick={() => handleExecuteRibbonCommand('View', 'Freeze Panes', 'Freeze Top Row')}
                    className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded font-bold"
                  >
                    ❄️ Freeze Top Row
                  </button>
                  <button
                    onClick={() => handleExecuteRibbonCommand('View', 'Freeze Panes', 'Freeze First Column')}
                    className="px-2.5 py-1.5 hover:bg-slate-100 rounded text-slate-700 font-medium"
                  >
                    ❄️ Freeze First Column
                  </button>
                </>
              )}

              {/* Review Tab */}
              {activeRibbonTab === 'Review' && (
                <>
                  <button
                    onClick={() => handleExecuteRibbonCommand('Review', 'Alt Text', 'Add Description')}
                    className="px-2.5 py-1.5 hover:bg-slate-100 rounded text-slate-700 font-medium"
                  >
                    ♿ Alt Text Description
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Interactive Document / Spreadsheet Live View */}
          <div className="p-6 bg-slate-100 min-h-[220px] flex items-center justify-center">
            {activeSubject === 'word' ? (
              // Live Word Canvas
              <div className="bg-white rounded-lg shadow-md border border-slate-300 p-8 max-w-2xl w-full min-h-[200px] relative transition-all">
                {currentTask.targetCommand === 'Watermark' && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-5xl font-black text-slate-200/60 -rotate-45 select-none tracking-widest">
                      {currentTask.expectedParam || 'CONFIDENTIAL'}
                    </span>
                  </div>
                )}
                <div className="space-y-3">
                  <div className="h-4 bg-blue-600/30 rounded w-1/3 mb-4" />
                  <div className="h-3 bg-slate-200 rounded w-full" />
                  <div className="h-3 bg-slate-200 rounded w-5/6" />
                  <div className="h-3 bg-slate-200 rounded w-4/6" />

                  {currentTask.targetCommand === 'Format as Table' && (
                    <div className="mt-4 border border-blue-300 rounded overflow-hidden">
                      <div className="grid grid-cols-4 bg-blue-600 text-white p-1 text-[10px] font-bold">
                        <span>Tiêu Đề 1</span>
                        <span>Tiêu Đề 2</span>
                        <span>Tiêu Đề 3</span>
                        <span>Tiêu Đề 4</span>
                      </div>
                      <div className="grid grid-cols-4 p-1 text-[10px] bg-blue-50/50">
                        <span>Data 1</span>
                        <span>Data 2</span>
                        <span>Data 3</span>
                        <span>Data 4</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Live Excel Canvas
              <div className="bg-white rounded-lg shadow-md border border-slate-300 p-4 max-w-3xl w-full overflow-x-auto">
                <div className="text-[11px] font-mono mb-2 flex items-center gap-2 text-slate-600">
                  <span className="font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">fx</span>
                  <span className="text-slate-400">
                    {currentTask.expectedParam?.startsWith('=') ? currentTask.expectedParam : '=SUM(B2:B10)'}
                  </span>
                </div>
                <table className="w-full text-[11px] border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-bold">
                      <th className="border border-slate-300 w-8 text-center bg-slate-200">#</th>
                      <th className="border border-slate-300 px-3 py-1">A</th>
                      <th className="border border-slate-300 px-3 py-1">B</th>
                      <th className="border border-slate-300 px-3 py-1">C</th>
                      <th className="border border-slate-300 px-3 py-1">D</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4, 5].map(row => (
                      <tr key={row}>
                        <td className="border border-slate-300 text-center bg-slate-100 font-bold text-slate-400">
                          {row}
                        </td>
                        <td className="border border-slate-200 px-3 py-1">Mã SP 0{row}</td>
                        <td className="border border-slate-200 px-3 py-1 text-right">{row * 150}.000 ₫</td>
                        <td className="border border-slate-200 px-3 py-1 text-center">{row * 12}</td>
                        <td className="border border-slate-200 px-3 py-1 text-emerald-700 font-semibold">Đạt chuẩn</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Task Navigation Bar */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                disabled={currentIndex === 0}
                onClick={() => handleSelectTask(currentIndex - 1)}
                className="px-3 py-2 bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Câu Trước</span>
              </button>

              <button
                disabled={currentIndex >= filteredTasks.length - 1}
                onClick={() => handleSelectTask(currentIndex + 1)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
              >
                <span>Câu Tiếp Theo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Đang làm câu <strong>#{currentTask.taskNumber}</strong> (vị trí {currentIndex + 1} / {filteredTasks.length} trong bộ lọc)
            </div>
          </div>
        </div>
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
                  Bảng Điều Hướng 1,000 Câu Hỏi Thực Hành ({activeSubject === 'word' ? 'MOS Word' : 'MOS Excel'})
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
                  {start}-{Math.min(start + 99, 1000)}
                </button>
              ))}
            </div>

            {/* Grid of 100 items for current batch */}
            <div className="p-6 overflow-y-auto grid grid-cols-5 sm:grid-cols-10 gap-2">
              {allTasks.slice(activeBatchStart - 1, activeBatchStart + 99).map(t => {
                const done = completedTaskIds.includes(t.id);
                const flagged = !!flaggedIds[t.id];
                const isCurrent = currentTask?.id === t.id;

                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      const idx = filteredTasks.findIndex(ft => ft.id === t.id);
                      if (idx !== -1) {
                        handleSelectTask(idx);
                      } else {
                        // Reset filters to view this task
                        setTabFilter('all');
                        setDifficultyFilter('all');
                        setSearchQuery('');
                        const newIdx = allTasks.findIndex(at => at.id === t.id);
                        handleSelectTask(newIdx);
                      }
                      setShowGridModal(false);
                    }}
                    className={`h-11 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center relative border ${
                      isCurrent
                        ? 'ring-2 ring-blue-600 bg-blue-100 text-blue-900 border-blue-400 shadow-xs'
                        : done
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>#{t.taskNumber}</span>
                    {done && <Check className="w-3 h-3 text-emerald-600" />}
                    {flagged && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 absolute top-1 right-1" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-emerald-500" /> Đã hoàn thành
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-amber-500" /> Đã ghim
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-slate-200" /> Chưa làm
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
    </div>
  );
};
