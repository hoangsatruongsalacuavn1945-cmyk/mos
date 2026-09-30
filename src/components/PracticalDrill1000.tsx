import React, { useState, useMemo } from 'react';
import { MOSSubject } from '../types/mos';
import { getWordPracticalBank, getExcelPracticalBank, MassivePracticalTask } from '../data/massiveQuestionBank';
import { recordCompletedTask } from '../utils/storage';
import { soundManager } from '../utils/audio';
import { OfficeRibbon } from './office/OfficeRibbon';
import { WordDocumentView } from './office/WordDocumentView';
import { ExcelSheetView } from './office/ExcelSheetView';
import { GMetrixTaskDock } from './office/GMetrixTaskDock';
import { 
  FileSpreadsheet, 
  FileText, 
  Search, 
  Sparkles,
  Grid,
  Check,
  X
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
  const [activeRibbonTab, setActiveRibbonTab] = useState<string>('Layout');
  const [lastExecutedCmd, setLastExecutedCmd] = useState<string>('');

  // Interactive Live Document Manipulation States
  const [docMargins, setDocMargins] = useState<'normal' | 'narrow' | 'moderate' | 'wide'>('normal');
  const [docOrientation, setDocOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [docLineSpacing, setDocLineSpacing] = useState<string>('1.0');
  const [docStyleHeading, setDocStyleHeading] = useState<string>('Normal');
  const [docWatermark, setDocWatermark] = useState<string | undefined>(undefined);
  const [docHasTable, setDocHasTable] = useState<boolean>(false);

  // Excel Live Workbook States
  const [excelActiveFormula, setExcelActiveFormula] = useState<string>('=SUM(D2:D10)');
  const [excelHasTotalRow, setExcelHasTotalRow] = useState<boolean>(false);
  const [excelTableFormatted, setExcelTableFormatted] = useState<boolean>(false);
  const [excelConditionalFormatted, setExcelConditionalFormatted] = useState<boolean>(false);

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

  // Reset document to default initial state for current task
  const handleResetTask = () => {
    soundManager.playClick();
    setDocMargins('normal');
    setDocOrientation('portrait');
    setDocLineSpacing('1.0');
    setDocStyleHeading('Normal');
    setDocWatermark(undefined);
    setDocHasTable(false);
    setExcelHasTotalRow(false);
    setExcelTableFormatted(false);
    setExcelConditionalFormatted(false);
    setExcelActiveFormula('=SUM(D2:D10)');
    setTaskFeedback(null);
    setShowHint(false);
  };

  // Set default ribbon tab to match current task or Home
  const handleSelectTask = (index: number) => {
    setCurrentIndex(index);
    setShowHint(false);
    setTaskFeedback(null);
    setLastExecutedCmd('');
    handleResetTask();

    // Automatically select the ribbon tab matching this task for best GMetrix flow
    const targetTask = filteredTasks[index] || allTasks[index];
    if (targetTask && targetTask.targetTab) {
      setActiveRibbonTab(targetTask.targetTab);
    }
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

  // Interactive command click on the 90% authentic Office Ribbon
  const handleExecuteRibbonCommand = (tab: string, commandName: string, param?: string) => {
    soundManager.playClick();
    setLastExecutedCmd(`${tab} > ${commandName}${param ? ` (${param})` : ''}`);

    if (!currentTask) return;

    // Apply Live Document / Spreadsheet Visual Transformations
    const cmdLower = commandName.toLowerCase();
    const paramLower = (param || '').toLowerCase();

    if (cmdLower.includes('margin')) {
      if (paramLower.includes('narrow')) setDocMargins('narrow');
      else if (paramLower.includes('wide')) setDocMargins('wide');
      else if (paramLower.includes('moderate')) setDocMargins('moderate');
      else setDocMargins('normal');
    } else if (cmdLower.includes('orientation')) {
      setDocOrientation(paramLower.includes('landscape') ? 'landscape' : 'portrait');
    } else if (cmdLower.includes('line spacing')) {
      setDocLineSpacing(param || '1.5');
    } else if (cmdLower.includes('style') || cmdLower.includes('heading')) {
      setDocStyleHeading(param || 'Heading 1');
    } else if (cmdLower.includes('watermark')) {
      setDocWatermark(param || 'DRAFT 1');
    } else if (cmdLower.includes('table')) {
      setDocHasTable(true);
      setExcelTableFormatted(true);
    } else if (cmdLower.includes('autosum') || cmdLower.includes('formula')) {
      setExcelActiveFormula(param || '=SUM(D2:D10)');
      setExcelHasTotalRow(true);
    } else if (cmdLower.includes('total row')) {
      setExcelHasTotalRow(true);
    } else if (cmdLower.includes('conditional')) {
      setExcelConditionalFormatted(true);
    }

    // GMetrix Rule Engine Verification
    const isTabMatch = currentTask.targetTab.toLowerCase().includes(tab.toLowerCase()) || 
      tab.toLowerCase().includes(currentTask.targetTab.toLowerCase());

    const isCmdMatch = currentTask.targetCommand.toLowerCase() === commandName.toLowerCase() ||
      commandName.toLowerCase().includes(currentTask.targetCommand.toLowerCase()) ||
      currentTask.targetCommand.toLowerCase().includes(commandName.toLowerCase());

    // Optional parameter match (e.g. "Narrow" for Margins)
    const isParamMatch = !currentTask.expectedParam || 
      !param || 
      param.toLowerCase().includes(currentTask.expectedParam.toLowerCase()) ||
      currentTask.expectedParam.toLowerCase().includes(param.toLowerCase());

    if (isTabMatch && isCmdMatch && isParamMatch) {
      soundManager.playTaskComplete();
      recordCompletedTask(currentTask.id);
      onStatsUpdate();
      setTaskFeedback({
        message: `🎉 CHÍNH XÁC (GMETRIX PASSED)! Bạn đã áp dụng thành công thao tác [${tab} > ${commandName}${param ? ` > ${param}` : ''}] cho tài liệu theo chuẩn Certiport.`,
        success: true
      });
    } else {
      soundManager.playWrong();
      setTaskFeedback({
        message: `Chưa đúng yêu cầu: Bạn vừa thực hiện [${tab} > ${commandName}${param ? ` > ${param}` : ''}]. Gợi ý từ GMetrix: Hãy mở thẻ [${currentTask.targetTab}], tìm lệnh [${currentTask.targetCommand}]${currentTask.expectedParam ? ` với giá trị [${currentTask.expectedParam}]` : ''}.`,
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
                Môi Trường Thực Hành GMetrix 365 Chuẩn 90%
              </span>
              <span className="text-xs text-slate-400">· Chuẩn Khảo Thí Certiport MO-100 & MO-200</span>
            </div>
            <h2 className="text-2xl font-black mt-2 text-white flex items-center gap-2">
              {activeSubject === 'word' ? (
                <>
                  <FileText className="w-6 h-6 text-blue-400" />
                  <span>1,000 Bài Tập Thực Hành MOS Word 365 (Certiport)</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
                  <span>1,000 Bài Tập Thực Hành MOS Excel 365 (Certiport)</span>
                </>
              )}
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Thao tác trực tiếp trên giao diện Ribbon Microsoft Office 365 chân thực. Mọi thay đổi về căn lề (Margins), giãn dòng, hàm số và bảng biểu sẽ phản hồi trực quan ngay trên tài liệu mẫu.
            </p>
          </div>

          {/* Switcher & Stats */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex bg-slate-800/90 p-1 rounded-xl border border-slate-700 w-full sm:w-auto">
              <button
                onClick={() => {
                  soundManager.playClick();
                  setActiveSubject('word');
                  setCurrentIndex(0);
                  setActiveRibbonTab('Layout');
                  handleResetTask();
                }}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  activeSubject === 'word'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>MOS Word (1,000)</span>
              </button>
              <button
                onClick={() => {
                  soundManager.playClick();
                  setActiveSubject('excel');
                  setCurrentIndex(0);
                  setActiveRibbonTab('Home');
                  handleResetTask();
                }}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  activeSubject === 'excel'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>MOS Excel (1,000)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
            <span>Tiến độ thực hành {activeSubject.toUpperCase()}: {completedCount} / {allTasks.length} câu hoàn thành</span>
            <span className="font-mono text-indigo-400 font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
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
              placeholder="Tìm theo lệnh, từ khóa (#1, Margins, VLOOKUP)..."
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
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Nhảy Tới
              </button>
            </div>

            {/* Open Full 1000 Grid Navigator */}
            <button
              onClick={() => setShowGridModal(true)}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Bảng 1,000 Câu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main GMetrix Working Area */}
      {currentTask && (
        <div className="space-y-4">
          {/* 1. GMetrix Top Task Instruction Dock */}
          <GMetrixTaskDock
            taskNumber={currentTask.taskNumber}
            totalTasks={allTasks.length}
            instruction={currentTask.instruction}
            hint={currentTask.hint}
            officialRibbonPath={currentTask.officialRibbonPath}
            isCompleted={isCompleted}
            isFlagged={isFlagged}
            showHint={showHint}
            feedback={taskFeedback}
            onToggleFlag={() => toggleFlag(currentTask.id)}
            onToggleHint={() => setShowHint(!showHint)}
            onResetTask={handleResetTask}
            onNextTask={() => currentIndex < filteredTasks.length - 1 && handleSelectTask(currentIndex + 1)}
            onPrevTask={() => currentIndex > 0 && handleSelectTask(currentIndex - 1)}
          />

          {/* 2. Microsoft Office 365 Virtual Ribbon Container (90% authentic) */}
          <div className="rounded-2xl border border-slate-300 shadow-md overflow-hidden bg-white">
            <OfficeRibbon
              appType={activeSubject}
              activeTab={activeRibbonTab}
              onTabChange={tab => {
                soundManager.playClick();
                setActiveRibbonTab(tab);
              }}
              onExecuteCommand={handleExecuteRibbonCommand}
              currentMargins={docMargins}
              currentOrientation={docOrientation}
              currentLineSpacing={docLineSpacing}
              currentStyle={docStyleHeading}
            />

            {/* 3. Live Authentic Word Document or Excel Worksheet Simulation */}
            {activeSubject === 'word' ? (
              <WordDocumentView
                margins={docMargins}
                orientation={docOrientation}
                lineSpacing={docLineSpacing}
                styleHeading={docStyleHeading}
                watermark={docWatermark}
                hasTable={docHasTable}
                selectedParagraph={2}
              />
            ) : (
              <ExcelSheetView
                activeFormula={excelActiveFormula}
                hasTotalRow={excelHasTotalRow}
                isTableFormatted={excelTableFormatted}
                conditionalFormatted={excelConditionalFormatted}
              />
            )}
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
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
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
                  className={`px-2.5 py-1 rounded font-bold transition-colors cursor-pointer ${
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
                        setTabFilter('all');
                        setDifficultyFilter('all');
                        setSearchQuery('');
                        const newIdx = allTasks.findIndex(at => at.id === t.id);
                        handleSelectTask(newIdx);
                      }
                      setShowGridModal(false);
                    }}
                    className={`h-11 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center relative border cursor-pointer ${
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
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 font-bold rounded-lg text-slate-700 cursor-pointer"
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
export default PracticalDrill1000;
