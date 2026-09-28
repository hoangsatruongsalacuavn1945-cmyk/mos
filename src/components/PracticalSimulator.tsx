import React, { useState } from 'react';
import { PracticalProject, MOSSubject } from '../types/mos';
import { PRACTICAL_PROJECTS } from '../data/practicalProjects';
import { recordCompletedTask } from '../utils/storage';
import { soundManager } from '../utils/audio';
import { PracticalDrill1000 } from './PracticalDrill1000';
import { 
  FileSpreadsheet, 
  FileText, 
  Presentation, 
  CheckCircle2, 
  HelpCircle, 
  RotateCcw, 
  Bookmark, 
  ChevronRight, 
  Play, 
  Table, 
  Layers, 
  Maximize2, 
  FilePlus, 
  Sliders, 
  Eye, 
  EyeOff, 
  Sparkles,
  BarChart,
  Grid,
  Check,
  Zap
} from 'lucide-react';

interface PracticalSimulatorProps {
  selectedSubject: MOSSubject;
  completedTaskIds: string[];
  onStatsUpdate: () => void;
}

export const PracticalSimulator: React.FC<PracticalSimulatorProps> = ({
  selectedSubject,
  completedTaskIds,
  onStatsUpdate,
}) => {
  // Mode switcher between 1000 Practical Drill Bank and Multi-Task Projects
  const [simulatorMode, setSimulatorMode] = useState<'1000-drill' | 'full-projects'>('1000-drill');

  // Available projects filtered by subject
  const availableProjects = PRACTICAL_PROJECTS.filter(
    p => selectedSubject === 'all' || p.subject === selectedSubject
  );

  const [currentProjectIndex, setCurrentProjectIndex] = useState(0);
  const currentProject = availableProjects[currentProjectIndex] || availableProjects[0] || PRACTICAL_PROJECTS[0];

  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const currentTask = currentProject.tasks[currentTaskIndex] || currentProject.tasks[0];

  // Ribbon Active Tab
  const [activeRibbonTab, setActiveRibbonTab] = useState<string>('Home');

  // Interactive Live State for Current Simulation
  const [excelTableStyled, setExcelTableStyled] = useState(false);
  const [excelTotalRow, setExcelTotalRow] = useState(false);
  const [excelFrozenRow, setExcelFrozenRow] = useState(false);
  const [excelSumFormula, setExcelSumFormula] = useState(false);
  const [excelChartInserted, setExcelChartInserted] = useState(false);
  const [activeCell, setActiveCell] = useState<{ row: number; col: number }>({ row: 1, col: 0 });

  // Word Interactive State
  const [wordMargins, setWordMargins] = useState<'normal' | 'narrow'>('normal');
  const [wordHeadingStyle, setWordHeadingStyle] = useState(false);
  const [wordLineSpacing, setWordLineSpacing] = useState<number>(1.0);
  const [wordTableInserted, setWordTableInserted] = useState(false);
  const [wordWatermark, setWordWatermark] = useState(false);

  // PowerPoint Interactive State
  const [pptSlideSize, setPptSlideSize] = useState<'4:3' | '16:9'>('4:3');
  const [pptTransitionMorph, setPptTransitionMorph] = useState(false);
  const [pptSmartArtConverted, setPptSmartArtConverted] = useState(false);
  const [pptAnimationFade, setPptAnimationFade] = useState(false);
  const [pptSlide3Hidden, setPptSlide3Hidden] = useState(false);
  const [activeSlideNum, setActiveSlideNum] = useState(1);

  // Task UI State
  const [reviewFlags, setReviewFlags] = useState<Record<string, boolean>>({});
  const [showHint, setShowHint] = useState(false);
  const [taskFeedback, setTaskFeedback] = useState<{ message: string; success: boolean } | null>(null);

  // Reset simulator state
  const handleResetCurrentTask = () => {
    setShowHint(false);
    setTaskFeedback(null);
    if (currentProject.subject === 'excel') {
      if (currentTaskIndex === 0) setExcelTableStyled(false);
      if (currentTaskIndex === 1) setExcelTotalRow(false);
      if (currentTaskIndex === 2) setExcelFrozenRow(false);
      if (currentTaskIndex === 3) setExcelSumFormula(false);
      if (currentTaskIndex === 4) setExcelChartInserted(false);
    } else if (currentProject.subject === 'word') {
      if (currentTaskIndex === 0) setWordMargins('normal');
      if (currentTaskIndex === 1) setWordHeadingStyle(false);
      if (currentTaskIndex === 2) setWordLineSpacing(1.0);
      if (currentTaskIndex === 3) setWordTableInserted(false);
      if (currentTaskIndex === 4) setWordWatermark(false);
    } else if (currentProject.subject === 'powerpoint') {
      if (currentTaskIndex === 0) setPptSlideSize('4:3');
      if (currentTaskIndex === 1) setPptTransitionMorph(false);
      if (currentTaskIndex === 2) setPptSmartArtConverted(false);
      if (currentTaskIndex === 3) setPptAnimationFade(false);
      if (currentTaskIndex === 4) setPptSlide3Hidden(false);
    }
  };

  // Toggle Review Flag
  const toggleReview = (taskId: string) => {
    setReviewFlags(prev => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  // Verify and Grade Task
  const handleVerifyTask = () => {
    let passed = false;
    let feedback = '';

    if (currentProject.subject === 'excel') {
      if (currentTaskIndex === 0) {
        passed = excelTableStyled;
        feedback = passed
          ? 'Chính xác! Bạn đã định dạng bảng với kiểu Table Style Medium 2 thành công.'
          : 'Chưa đạt: Hãy vào Thẻ Home > Format as Table > chọn Medium 2.';
      } else if (currentTaskIndex === 1) {
        passed = excelTotalRow;
        feedback = passed
          ? 'Chính xác! Bạn đã kích hoạt hàng tổng cộng Total Row.'
          : 'Chưa đạt: Hãy bật Total Row tại thẻ Table Design.';
      } else if (currentTaskIndex === 2) {
        passed = excelFrozenRow;
        feedback = passed
          ? 'Chính xác! Hàng số 1 đã được cố định hiển thị qua Freeze Top Row.'
          : 'Chưa đạt: Vào Thẻ View > Freeze Panes > Freeze Top Row.';
      } else if (currentTaskIndex === 3) {
        passed = excelSumFormula;
        feedback = passed
          ? 'Chính xác! Hàm =SUM(C2:C6) đã được chèn để tính tổng số lượng.'
          : 'Chưa đạt: Sử dụng nút AutoSum hoặc gõ công thức SUM tại thẻ Formulas.';
      } else if (currentTaskIndex === 4) {
        passed = excelChartInserted;
        feedback = passed
          ? 'Chính xác! Biểu đồ cột Clustered Column đã được chèn vào trang tính.'
          : 'Chưa đạt: Vào Thẻ Insert > Charts > Insert Column Chart.';
      }
    } else if (currentProject.subject === 'word') {
      if (currentTaskIndex === 0) {
        passed = wordMargins === 'narrow';
        feedback = passed
          ? 'Chính xác! Toàn bộ văn bản đã được căn lề Narrow (0.5 inch).'
          : 'Chưa đạt: Vào Thẻ Page Layout > Margins > chọn Narrow.';
      } else if (currentTaskIndex === 1) {
        passed = wordHeadingStyle;
        feedback = passed
          ? 'Chính xác! Dòng tiêu đề đã được áp dụng Style Heading 1.'
          : 'Chưa đạt: Chọn tiêu đề và nhấp vào Style Heading 1 tại thẻ Home.';
      } else if (currentTaskIndex === 2) {
        passed = wordLineSpacing === 1.15;
        feedback = passed
          ? 'Chính xác! Khoảng cách dãn dòng Line Spacing đã đặt thành 1.15 lines.'
          : 'Chưa đạt: Thẻ Home > Paragraph > Line Spacing > chọn 1.15.';
      } else if (currentTaskIndex === 3) {
        passed = wordTableInserted;
        feedback = passed
          ? 'Chính xác! Bảng 3 cột x 4 hàng đã được chèn vào văn bản.'
          : 'Chưa đạt: Thẻ Insert > Table > chọn Insert Table 3x4.';
      } else if (currentTaskIndex === 4) {
        passed = wordWatermark;
        feedback = passed
          ? 'Chính xác! Watermark bảo mật CONFIDENTIAL đã xuất hiện nền sau văn bản.'
          : 'Chưa đạt: Thẻ Design > Page Background > Watermark > CONFIDENTIAL.';
      }
    } else if (currentProject.subject === 'powerpoint') {
      if (currentTaskIndex === 0) {
        passed = pptSlideSize === '16:9';
        feedback = passed
          ? 'Chính xác! Kích thước slide đã chuyển sang Widescreen (16:9).'
          : 'Chưa đạt: Thẻ Design > Slide Size > chọn Widescreen (16:9).';
      } else if (currentTaskIndex === 1) {
        passed = pptTransitionMorph;
        feedback = passed
          ? 'Chính xác! Hiệu ứng chuyển tiếp Morph đã được gán cho slide.'
          : 'Chưa đạt: Thẻ Transitions > Transition to This Slide > Morph.';
      } else if (currentTaskIndex === 2) {
        passed = pptSmartArtConverted;
        feedback = passed
          ? 'Chính xác! Danh sách văn bản đã chuyển đổi thành sơ đồ SmartArt Process.'
          : 'Chưa đạt: Thẻ Home > Paragraph > Convert to SmartArt > Process.';
      } else if (currentTaskIndex === 3) {
        passed = pptAnimationFade;
        feedback = passed
          ? 'Chính xác! Hoạt ảnh Animation Fade đã được gán cho hình ảnh minh họa.'
          : 'Chưa đạt: Thẻ Animations > Animation > Fade.';
      } else if (currentTaskIndex === 4) {
        passed = pptSlide3Hidden;
        feedback = passed
          ? 'Chính xác! Trang chiếu số 3 đã được ẩn (Hide Slide) khi thuyết trình.'
          : 'Chưa đạt: Thẻ View / Slide Show > Hide Slide.';
      }
    }

    setTaskFeedback({ message: feedback, success: passed });

    if (passed) {
      soundManager.playTaskComplete();
      recordCompletedTask(currentTask.id);
      onStatsUpdate();
    } else {
      soundManager.playWrong();
    }
  };

  const isTaskCompleted = completedTaskIds.includes(currentTask.id);

  // App Theme Accent
  const appAccentColor =
    currentProject.subject === 'word'
      ? 'border-blue-600 text-blue-700'
      : currentProject.subject === 'excel'
      ? 'border-emerald-600 text-emerald-700'
      : 'border-orange-600 text-orange-700';

  const appHeaderBg =
    currentProject.subject === 'word'
      ? 'bg-blue-700'
      : currentProject.subject === 'excel'
      ? 'bg-emerald-700'
      : 'bg-orange-700';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Mode Switcher: 1,000 Practical Drill Bank vs 5 Full Projects */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => {
              soundManager.playClick();
              setSimulatorMode('1000-drill');
            }}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              simulatorMode === '1000-drill'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Ngân Hàng 1,000 Câu Thực Hành Siêu Tốc</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-black">
              1,000 Word + 1,000 Excel
            </span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setSimulatorMode('full-projects');
            }}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              simulatorMode === 'full-projects'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>5 Dự Án Mẫu Đầy Đủ (Multi-Task Sandbox)</span>
          </button>
        </div>

        <div className="px-3 text-xs text-slate-500 font-medium hidden lg:block">
          💡 Chọn chế độ 1,000 câu để luyện từng thao tác Ribbon hoặc chế độ Dự Án để thi thử mô phỏng toàn bộ tệp đề thi.
        </div>
      </div>

      {simulatorMode === '1000-drill' ? (
        <PracticalDrill1000
          selectedSubject={selectedSubject}
          completedTaskIds={completedTaskIds}
          onStatsUpdate={onStatsUpdate}
        />
      ) : (
        <>
          {/* Project Switcher Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg text-white ${appHeaderBg}`}>
            {currentProject.subject === 'word' ? (
              <FileText className="w-5 h-5" />
            ) : currentProject.subject === 'excel' ? (
              <FileSpreadsheet className="w-5 h-5" />
            ) : (
              <Presentation className="w-5 h-5" />
            )}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">
              {currentProject.title}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>Tệp bài thi: {currentProject.fileName}</span>
              <span aria-hidden="true">·</span>
              <span>5 Task Certiport</span>
            </div>
          </div>
        </div>

        {/* Project Selector tabs */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {availableProjects.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => {
                setCurrentProjectIndex(idx);
                setCurrentTaskIndex(0);
                setTaskFeedback(null);
                setShowHint(false);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap border ${
                idx === currentProjectIndex
                  ? `${appAccentColor} bg-slate-50 shadow-xs font-bold`
                  : 'border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {p.subject === 'word' ? 'Word Project' : p.subject === 'excel' ? 'Excel Project' : 'PPT Project'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Certiport Simulation Window */}
      <div className="bg-slate-900 text-slate-100 rounded-xl shadow-lg border border-slate-800 overflow-hidden mb-6">
        {/* Office Top Titlebar */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-950 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2 font-mono text-slate-300">
            <span className={`w-2.5 h-2.5 rounded-full ${appHeaderBg}`} />
            <span>{currentProject.fileName} - Microsoft {currentProject.subject === 'word' ? 'Word' : currentProject.subject === 'excel' ? 'Excel' : 'PowerPoint'} 365</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <span className="hidden sm:inline font-sans text-[11px]">Certiport Exam Sandbox Mode</span>
          </div>
        </div>

        {/* Office Ribbon Header Tabs */}
        <div className="bg-slate-800 border-b border-slate-700 px-3 flex items-center gap-1 overflow-x-auto text-xs font-medium">
          {['File', 'Home', 'Insert', currentProject.subject === 'word' ? 'Page Layout' : 'Design', currentProject.subject === 'excel' ? 'Formulas' : currentProject.subject === 'powerpoint' ? 'Transitions' : 'References', currentProject.subject === 'powerpoint' ? 'Animations' : 'Review', 'View'].map(tab => {
            const isActive = activeRibbonTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveRibbonTab(tab)}
                className={`px-3 py-1.5 rounded-t transition-all ${
                  isActive
                    ? 'bg-slate-700 text-white font-bold border-b-2 border-blue-400'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Office Ribbon Toolbar Commands */}
        <div className="bg-slate-800/90 p-2.5 border-b border-slate-700 flex items-center gap-2 overflow-x-auto text-xs min-h-[58px]">
          {/* Ribbon commands based on active tab & current subject */}
          {activeRibbonTab === 'Home' && (
            <div className="flex items-center gap-3">
              {currentProject.subject === 'excel' && (
                <>
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => setExcelTableStyled(true)}
                      className={`px-2.5 py-1 rounded border flex items-center gap-1.5 transition-colors ${
                        excelTableStyled ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                      }`}
                    >
                      <Table className="w-3.5 h-3.5" />
                      <span>Format as Table (Medium 2)</span>
                    </button>
                    <span className="text-[10px] text-slate-400 mt-0.5">Styles</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => setExcelTotalRow(!excelTotalRow)}
                      className={`px-2.5 py-1 rounded border flex items-center gap-1.5 transition-colors ${
                        excelTotalRow ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                      }`}
                    >
                      <Grid className="w-3.5 h-3.5" />
                      <span>Total Row (Bật/Tắt)</span>
                    </button>
                    <span className="text-[10px] text-slate-400 mt-0.5">Table Options</span>
                  </div>
                </>
              )}

              {currentProject.subject === 'word' && (
                <>
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => setWordHeadingStyle(true)}
                      className={`px-2.5 py-1 rounded border flex items-center gap-1.5 transition-colors ${
                        wordHeadingStyle ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Style: Heading 1</span>
                    </button>
                    <span className="text-[10px] text-slate-400 mt-0.5">Styles</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => setWordLineSpacing(1.15)}
                      className={`px-2.5 py-1 rounded border flex items-center gap-1.5 transition-colors ${
                        wordLineSpacing === 1.15 ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                      }`}
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Line Spacing: 1.15</span>
                    </button>
                    <span className="text-[10px] text-slate-400 mt-0.5">Paragraph</span>
                  </div>
                </>
              )}

              {currentProject.subject === 'powerpoint' && (
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => setPptSmartArtConverted(true)}
                    className={`px-2.5 py-1 rounded border flex items-center gap-1.5 transition-colors ${
                      pptSmartArtConverted ? 'bg-orange-600 text-white border-orange-500' : 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Convert to SmartArt (Process)</span>
                  </button>
                  <span className="text-[10px] text-slate-400 mt-0.5">Paragraph</span>
                </div>
              )}
            </div>
          )}

          {activeRibbonTab === 'Insert' && (
            <div className="flex items-center gap-3">
              {currentProject.subject === 'excel' && (
                <button
                  onClick={() => setExcelChartInserted(true)}
                  className={`px-2.5 py-1 rounded border flex items-center gap-1.5 transition-colors ${
                    excelChartInserted ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                  }`}
                >
                  <BarChart className="w-3.5 h-3.5" />
                  <span>Insert Clustered Column Chart</span>
                </button>
              )}

              {currentProject.subject === 'word' && (
                <button
                  onClick={() => setWordTableInserted(true)}
                  className={`px-2.5 py-1 rounded border flex items-center gap-1.5 transition-colors ${
                    wordTableInserted ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                  }`}
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Insert Table (3 Cột x 4 Hàng)</span>
                </button>
              )}
            </div>
          )}

          {(activeRibbonTab === 'Page Layout' || activeRibbonTab === 'Design') && (
            <div className="flex items-center gap-3">
              {currentProject.subject === 'word' && activeRibbonTab === 'Page Layout' && (
                <button
                  onClick={() => setWordMargins('narrow')}
                  className={`px-2.5 py-1 rounded border flex items-center gap-1.5 transition-colors ${
                    wordMargins === 'narrow' ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                  }`}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Margins: Narrow (0.5 inch)</span>
                </button>
              )}

              {currentProject.subject === 'word' && activeRibbonTab === 'Design' && (
                <button
                  onClick={() => setWordWatermark(true)}
                  className={`px-2.5 py-1 rounded border flex items-center gap-1.5 transition-colors ${
                    wordWatermark ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                  }`}
                >
                  <FilePlus className="w-3.5 h-3.5" />
                  <span>Watermark: CONFIDENTIAL</span>
                </button>
              )}

              {currentProject.subject === 'powerpoint' && activeRibbonTab === 'Design' && (
                <button
                  onClick={() => setPptSlideSize('16:9')}
                  className={`px-2.5 py-1 rounded border flex items-center gap-1.5 transition-colors ${
                    pptSlideSize === '16:9' ? 'bg-orange-600 text-white border-orange-500' : 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                  }`}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Slide Size: Widescreen (16:9)</span>
                </button>
              )}
            </div>
          )}

          {activeRibbonTab === 'Formulas' && currentProject.subject === 'excel' && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setExcelSumFormula(true)}
                className={`px-2.5 py-1 rounded border flex items-center gap-1.5 transition-colors ${
                  excelSumFormula ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                }`}
              >
                <span className="font-bold">∑</span>
                <span>AutoSum =SUM(C2:C6)</span>
              </button>
            </div>
          )}

          {activeRibbonTab === 'Transitions' && currentProject.subject === 'powerpoint' && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPptTransitionMorph(true)}
                className={`px-2.5 py-1 rounded border flex items-center gap-1.5 transition-colors ${
                  pptTransitionMorph ? 'bg-orange-600 text-white border-orange-500' : 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Transition: Morph (1.25s)</span>
              </button>
            </div>
          )}

          {activeRibbonTab === 'Animations' && currentProject.subject === 'powerpoint' && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPptAnimationFade(true)}
                className={`px-2.5 py-1 rounded border flex items-center gap-1.5 transition-colors ${
                  pptAnimationFade ? 'bg-orange-600 text-white border-orange-500' : 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                <span>Animation: Fade</span>
              </button>
            </div>
          )}

          {activeRibbonTab === 'View' && (
            <div className="flex items-center gap-3">
              {currentProject.subject === 'excel' && (
                <button
                  onClick={() => setExcelFrozenRow(true)}
                  className={`px-2.5 py-1 rounded border flex items-center gap-1.5 transition-colors ${
                    excelFrozenRow ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Freeze Panes: Freeze Top Row</span>
                </button>
              )}

              {currentProject.subject === 'powerpoint' && (
                <button
                  onClick={() => setPptSlide3Hidden(!pptSlide3Hidden)}
                  className={`px-2.5 py-1 rounded border flex items-center gap-1.5 transition-colors ${
                    pptSlide3Hidden ? 'bg-orange-600 text-white border-orange-500' : 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                  }`}
                >
                  {pptSlide3Hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>Hide Slide 3</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Live Document / Sheet / Slide Viewport */}
        <div className="p-4 sm:p-6 bg-slate-200 text-slate-800 min-h-[380px] flex items-center justify-center overflow-auto">
          {/* Excel Live Spreadsheet */}
          {currentProject.subject === 'excel' && (
            <div className="w-full max-w-4xl bg-white rounded-lg shadow-sm border border-slate-300 overflow-hidden font-mono text-xs">
              {/* Excel Formula Bar */}
              <div className="px-3 py-1.5 bg-slate-100 border-b border-slate-300 flex items-center gap-2">
                <span className="font-semibold text-slate-600 w-12 px-2 py-0.5 bg-white border border-slate-300 rounded text-center">
                  {String.fromCharCode(65 + activeCell.col)}{activeCell.row + 1}
                </span>
                <span className="font-serif italic text-slate-500 font-bold px-1">fx</span>
                <input
                  type="text"
                  readOnly
                  value={
                    excelSumFormula && activeCell.row === 6 && activeCell.col === 2
                      ? '=SUM(C2:C6)'
                      : (currentProject.initialData.rows?.[activeCell.row]?.[activeCell.col] as string) || ''
                  }
                  className="flex-1 bg-white border border-slate-300 px-2 py-0.5 rounded text-slate-700 text-xs focus:outline-none"
                />
              </div>

              {/* Excel Sheet Grid */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600">
                      <th className="w-10 border border-slate-300 p-1 text-center font-normal">#</th>
                      {['A', 'B', 'C', 'D'].map((col, idx) => (
                        <th
                          key={col}
                          className={`border border-slate-300 p-1 text-center font-normal ${
                            activeCell.col === idx ? 'bg-slate-200 font-bold text-slate-900' : ''
                          }`}
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentProject.initialData.rows?.map((row, rIdx) => {
                      const isHeader = rIdx === 0;
                      return (
                        <tr
                          key={rIdx}
                          className={`transition-colors ${
                            excelFrozenRow && isHeader ? 'border-b-2 border-b-blue-600 sticky top-0 shadow-xs' : ''
                          } ${
                            excelTableStyled
                              ? isHeader
                                ? 'bg-emerald-700 text-white font-bold'
                                : rIdx % 2 === 0
                                ? 'bg-emerald-50/50'
                                : 'bg-white'
                              : isHeader
                              ? 'bg-slate-100 font-bold'
                              : 'bg-white'
                          }`}
                        >
                          <td
                            className={`border border-slate-300 p-1.5 text-center text-slate-500 select-none ${
                              activeCell.row === rIdx ? 'bg-slate-200 font-bold text-slate-900' : 'bg-slate-50'
                            }`}
                          >
                            {rIdx + 1}
                          </td>
                          {row.map((cell, cIdx) => (
                            <td
                              key={cIdx}
                              onClick={() => setActiveCell({ row: rIdx, col: cIdx })}
                              className={`border border-slate-300 p-2 cursor-pointer transition-colors ${
                                activeCell.row === rIdx && activeCell.col === cIdx
                                  ? 'ring-2 ring-emerald-600 bg-emerald-100/40'
                                  : 'hover:bg-slate-50'
                              } ${cIdx === 2 || cIdx === 3 ? 'text-right' : 'text-left'}`}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      );
                    })}

                    {/* Total Row */}
                    {excelTotalRow && (
                      <tr className="bg-emerald-100/80 font-bold text-emerald-950 border-t-2 border-emerald-600">
                        <td className="border border-slate-300 p-1.5 text-center bg-slate-100">7</td>
                        <td className="border border-slate-300 p-2">Total</td>
                        <td className="border border-slate-300 p-2 text-slate-500 italic">5 sản phẩm</td>
                        <td className="border border-slate-300 p-2 text-right">
                          {excelSumFormula ? '159' : '159'}
                        </td>
                        <td className="border border-slate-300 p-2 text-right">
                          795.500.000 VNĐ
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Chart Overlay if inserted */}
              {excelChartInserted && (
                <div className="p-4 bg-white border-t border-slate-300">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-800 text-xs font-sans">
                      Biểu Đồ Doanh Thu Quý 1 (Clustered Column)
                    </span>
                    <span className="text-[11px] text-emerald-700 font-sans font-semibold">
                      ● Đã chèn thành công
                    </span>
                  </div>
                  <div className="h-28 flex items-end gap-4 pt-4 border-b border-l border-slate-300 px-3">
                    <div className="w-12 bg-emerald-600 rounded-t h-[85%] flex items-center justify-center text-[10px] text-white">Dell</div>
                    <div className="w-12 bg-emerald-500 rounded-t h-[30%] flex items-center justify-center text-[10px] text-white">Keychron</div>
                    <div className="w-12 bg-emerald-600 rounded-t h-[60%] flex items-center justify-center text-[10px] text-white">LG</div>
                    <div className="w-12 bg-emerald-500 rounded-t h-[25%] flex items-center justify-center text-[10px] text-white">Logitech</div>
                    <div className="w-12 bg-emerald-600 rounded-t h-[45%] flex items-center justify-center text-[10px] text-white">Sony</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Word Live Document */}
          {currentProject.subject === 'word' && (
            <div
              className={`relative bg-white shadow-md border border-slate-300 rounded transition-all max-w-2xl w-full ${
                wordMargins === 'narrow' ? 'p-6' : 'p-12'
              }`}
            >
              {/* Watermark overlay */}
              {wordWatermark && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-15">
                  <span className="text-6xl font-black tracking-widest text-slate-900 -rotate-45">
                    CONFIDENTIAL
                  </span>
                </div>
              )}

              <div className="relative z-10">
                <h1
                  className={`mb-4 transition-all ${
                    wordHeadingStyle
                      ? 'text-2xl font-extrabold text-blue-700 border-b border-blue-200 pb-2'
                      : 'text-xl font-bold text-slate-800'
                  }`}
                >
                  {currentProject.initialData.docTitle}
                </h1>

                <div
                  className="text-sm text-slate-700 space-y-3 transition-all"
                  style={{ lineHeight: wordLineSpacing }}
                >
                  {currentProject.initialData.docParagraphs?.map((p, idx) => (
                    <p key={idx}>{p}</p>
                  ))}
                </div>

                {wordTableInserted && (
                  <div className="mt-6 pt-4 border-t border-slate-200">
                    <span className="text-xs font-bold text-slate-600 block mb-2 font-mono">
                      Bảng 3x4: Danh Sách Diễn Giả Hội Nghị
                    </span>
                    <table className="w-full border border-slate-300 text-xs">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="border border-slate-300 p-2 text-left">Họ & Tên</th>
                          <th className="border border-slate-300 p-2 text-left">Chuyên Đề</th>
                          <th className="border border-slate-300 p-2 text-left">Thời Gian</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-slate-300 p-2">TS. Trần Anh Tuấn</td>
                          <td className="border border-slate-300 p-2">AI trong Giáo Dục</td>
                          <td className="border border-slate-300 p-2">08:30 - 09:30</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-2">ThS. Lê Hoàng Yến</td>
                          <td className="border border-slate-300 p-2">Điện Toán Đám Mây</td>
                          <td className="border border-slate-300 p-2">09:45 - 10:45</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-2">Kỹ Sư Phạm Nam</td>
                          <td className="border border-slate-300 p-2">An Ninh Dữ Liệu</td>
                          <td className="border border-slate-300 p-2">11:00 - 12:00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PowerPoint Live Slide Stage */}
          {currentProject.subject === 'powerpoint' && (
            <div className="w-full max-w-3xl flex gap-4">
              {/* Slide Thumbnails list */}
              <div className="w-24 flex flex-col gap-2 shrink-0">
                {[1, 2, 3].map(sNum => {
                  const isHidden = sNum === 3 && pptSlide3Hidden;
                  return (
                    <button
                      key={sNum}
                      onClick={() => setActiveSlideNum(sNum)}
                      className={`relative p-2 rounded border text-left bg-white transition-all text-[11px] ${
                        activeSlideNum === sNum
                          ? 'border-orange-500 ring-2 ring-orange-400/40 shadow-xs'
                          : 'border-slate-300 opacity-80'
                      }`}
                    >
                      <span className="font-bold text-slate-700 block">Slide {sNum}</span>
                      {isHidden && (
                        <span className="text-[10px] text-red-600 font-semibold flex items-center gap-0.5">
                          <EyeOff className="w-3 h-3" /> Ẩn
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Main Slide Canvas */}
              <div
                className={`flex-1 bg-white shadow-md border border-slate-300 rounded p-8 flex flex-col justify-center transition-all ${
                  pptSlideSize === '16:9' ? 'aspect-video' : 'aspect-4/3'
                }`}
              >
                {activeSlideNum === 1 && (
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 mb-2">
                      {currentProject.initialData.slideTitle}
                    </h1>
                    <p className="text-sm text-slate-600 mb-6">
                      {currentProject.initialData.slideSubtitle}
                    </p>
                    {pptAnimationFade && (
                      <div className="p-3 bg-orange-50 border border-orange-200 rounded text-xs text-orange-900 font-medium flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-orange-600" />
                        <span>Hình ảnh đã gán hiệu ứng Fade Animation</span>
                      </div>
                    )}
                  </div>
                )}

                {activeSlideNum === 2 && (
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 mb-4">
                      Quy Trình Triển Khai Năng Lượng Xanh
                    </h2>

                    {pptSmartArtConverted ? (
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-3 bg-orange-600 text-white rounded text-center text-xs font-bold shadow-xs">
                          1. Khảo Sát Hiện Trạng
                        </div>
                        <div className="p-3 bg-orange-500 text-white rounded text-center text-xs font-bold shadow-xs">
                          2. Lắp Đặt Thiết Bị
                        </div>
                        <div className="p-3 bg-orange-700 text-white rounded text-center text-xs font-bold shadow-xs">
                          3. Vận Hành Tối Ưu
                        </div>
                      </div>
                    ) : (
                      <ul className="text-sm text-slate-700 list-disc pl-5 space-y-1">
                        <li>Bước 1: Khảo sát hiện trạng tiêu thụ năng lượng</li>
                        <li>Bước 2: Lắp đặt hệ thống pin mặt trời và cảm biến</li>
                        <li>Bước 3: Vận hành và tối ưu hóa qua phần mềm quản lý</li>
                      </ul>
                    )}

                    {pptTransitionMorph && (
                      <div className="mt-6 text-xs text-orange-700 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Slide Transition: Morph (1.25s) đã kích hoạt</span>
                      </div>
                    )}
                  </div>
                )}

                {activeSlideNum === 3 && (
                  <div className="text-center py-8">
                    <h3 className="text-base font-bold text-slate-800 mb-2">
                      Phụ Lục Kỹ Thuật (Nội Bộ)
                    </h3>
                    <p className="text-xs text-slate-500">
                      {pptSlide3Hidden
                        ? 'Trang chiếu này đang ở chế độ ẨN (Hide Slide) khi trình chiếu thực tế.'
                        : 'Trang chiếu đang hiển thị công khai.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Certiport Bottom Task Panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        {/* Task Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {currentProject.tasks.map((task, idx) => {
              const isCurrent = idx === currentTaskIndex;
              const isDone = completedTaskIds.includes(task.id);
              const isFlagged = reviewFlags[task.id];

              return (
                <button
                  key={task.id}
                  onClick={() => {
                    setCurrentTaskIndex(idx);
                    setShowHint(false);
                    setTaskFeedback(null);
                  }}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                    isCurrent
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : isDone
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : isFlagged ? (
                    <Bookmark className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  ) : null}
                  <span>Task {task.taskNumber}</span>
                </button>
              );
            })}
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Tiến độ dự án: {currentProject.tasks.filter(t => completedTaskIds.includes(t.id)).length} / {currentProject.tasks.length} Task hoàn thành
          </div>
        </div>

        {/* Task Instruction */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            <span>Chỉ dẫn đề thi (Task {currentTask.taskNumber})</span>
            <span aria-hidden="true">·</span>
            <span className="text-blue-600 font-mono">Thẻ mục tiêu: {currentTask.targetTab}</span>
          </div>
          <p className="text-base text-slate-900 font-medium leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-200">
            {currentTask.instruction}
          </p>
        </div>

        {/* Action hint box if toggled */}
        {showHint && (
          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-lg mb-6 text-sm text-amber-950 flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-1">Gợi ý thao tác:</span>
              <p className="leading-relaxed">{currentTask.hint}</p>
            </div>
          </div>
        )}

        {/* Result feedback */}
        {taskFeedback && (
          <div
            className={`p-4 rounded-lg mb-6 text-sm flex items-start gap-3 border ${
              taskFeedback.success
                ? 'bg-emerald-50 text-emerald-950 border-emerald-200'
                : 'bg-red-50 text-red-950 border-red-200'
            }`}
          >
            {taskFeedback.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <HelpCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            )}
            <div className="leading-relaxed font-medium">
              {taskFeedback.message}
            </div>
          </div>
        )}

        {/* Task Footer Buttons - Certiport action bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleReview(currentTask.id)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                reviewFlags[currentTask.id]
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{reviewFlags[currentTask.id] ? 'Đã đánh dấu xem lại' : 'Mark for Review'}</span>
            </button>

            <button
              onClick={handleResetCurrentTask}
              className="px-3 py-2 rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Làm lại Task</span>
            </button>

            <button
              onClick={() => setShowHint(!showHint)}
              className="px-3 py-2 rounded-lg text-xs font-semibold text-blue-700 hover:text-blue-800 hover:bg-blue-50 transition-colors flex items-center gap-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{showHint ? 'Ẩn gợi ý' : 'Gợi ý thao tác'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleVerifyTask}
              className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Chấm Điểm & Kiểm Tra Thao Tác</span>
            </button>

            {currentTaskIndex < currentProject.tasks.length - 1 && (
              <button
                onClick={() => {
                  setCurrentTaskIndex(currentTaskIndex + 1);
                  setShowHint(false);
                  setTaskFeedback(null);
                }}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1"
              >
                <span>Task tiếp</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
};
