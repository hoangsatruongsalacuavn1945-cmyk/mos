import React, { useState } from 'react';
import {
  Scissors,
  Copy,
  Clipboard,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  ChevronDown,
  Table,
  Image as ImageIcon,
  BarChart3,
  Bookmark,
  FileSpreadsheet,
  Maximize2,
  Columns as ColumnsIcon,
  HelpCircle,
  Undo2,
  Redo2,
  Save,
  Check,
  Search,
  Filter,
  Type
} from 'lucide-react';

export interface OfficeRibbonProps {
  appType: 'word' | 'excel';
  activeTab: string;
  onTabChange: (tab: string) => void;
  onExecuteCommand: (tab: string, command: string, param?: string) => void;
  currentMargins?: 'normal' | 'narrow' | 'moderate' | 'wide';
  currentOrientation?: 'portrait' | 'landscape';
  currentLineSpacing?: string;
  currentStyle?: string;
}

export const OfficeRibbon: React.FC<OfficeRibbonProps> = ({
  appType,
  activeTab,
  onTabChange,
  onExecuteCommand,
  currentMargins = 'normal',
  currentOrientation = 'portrait',
  currentLineSpacing = '1.0',
  currentStyle = 'Normal',
}) => {
  // Dropdown states for realistic Office interactions
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const toggleDropdown = (name: string) => {
    setOpenDropdown(prev => (prev === name ? null : name));
  };

  const closeDropdown = () => setOpenDropdown(null);

  // Tabs by application
  const tabs = appType === 'word'
    ? ['Home', 'Insert', 'Design', 'Layout', 'References', 'Review', 'View']
    : ['Home', 'Insert', 'Page Layout', 'Formulas', 'Data', 'Review', 'View'];

  const themeBg = appType === 'word' ? 'bg-[#185abd]' : 'bg-[#107c41]';

  return (
    <div className="w-full bg-[#f3f4f6] border-b border-slate-300 font-sans select-none text-slate-800">
      {/* Top Application Title Bar & Quick Access Toolbar */}
      <div className={`${themeBg} text-white px-3 py-1.5 flex items-center justify-between text-xs`}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 opacity-90 hover:opacity-100">
            <button title="Lưu (Ctrl+S)" className="p-1 hover:bg-white/20 rounded transition-colors">
              <Save className="w-3.5 h-3.5" />
            </button>
            <button title="Hoàn tác (Ctrl+Z)" className="p-1 hover:bg-white/20 rounded transition-colors">
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button title="Làm lại (Ctrl+Y)" className="p-1 hover:bg-white/20 rounded transition-colors">
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <span className="text-[11px] font-semibold text-white/90 border-l border-white/30 pl-3">
            {appType === 'word' ? 'Báo Cáo Khảo Thí MOS Certiport 2026.docx - Word' : 'Bảng Điểm và Thống Kê Điểm Thi MOS 2026.xlsx - Excel'}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-white/80">
          <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold text-white tracking-wide">
            MICROSOFT 365 APPS
          </span>
        </div>
      </div>

      {/* Ribbon Tab Row */}
      <div className="flex items-center bg-[#f3f4f6] px-2 pt-1 border-b border-slate-300 overflow-x-auto text-[12px] font-medium text-slate-700">
        <button
          className={`${themeBg} text-white font-bold px-3 py-1 rounded-t text-[11px] uppercase tracking-wider mr-1 shadow-2xs`}
        >
          File
        </button>

        {tabs.map(tab => {
          const isActive = activeTab.toLowerCase() === tab.toLowerCase();
          return (
            <button
              key={tab}
              onClick={() => {
                closeDropdown();
                onTabChange(tab);
              }}
              className={`px-3.5 py-1.5 rounded-t transition-all relative whitespace-nowrap ${
                isActive
                  ? 'bg-white text-slate-900 font-bold border-t-2 ' + (appType === 'word' ? 'border-[#185abd]' : 'border-[#107c41]') + ' shadow-xs'
                  : 'hover:bg-slate-200/70 text-slate-700'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Ribbon Command Strip (Realistic Group Box Container) */}
      <div className="bg-white p-2 flex items-stretch gap-1 overflow-x-auto min-h-[96px] text-xs">
        {/* ========================================================================= */}
        {/* WORD / EXCEL HOME TAB */}
        {/* ========================================================================= */}
        {activeTab.toLowerCase() === 'home' && (
          <>
            {/* Clipboard Group */}
            <div className="flex flex-col justify-between border-r border-slate-200 pr-2 mr-1">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onExecuteCommand('Home', 'Paste Special', 'Values Only')}
                  className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-100 rounded text-slate-700 min-w-[48px]"
                  title="Paste Special"
                >
                  <Clipboard className="w-5 h-5 text-amber-600 mb-0.5" />
                  <span className="text-[10px]">Paste</span>
                </button>
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => onExecuteCommand('Home', 'Cut')}
                    className="flex items-center gap-1 px-1.5 py-0.5 hover:bg-slate-100 rounded text-[11px] text-slate-700"
                    title="Cut (Ctrl+X)"
                  >
                    <Scissors className="w-3.5 h-3.5 text-slate-600" />
                    <span>Cut</span>
                  </button>
                  <button
                    onClick={() => onExecuteCommand('Home', 'Copy')}
                    className="flex items-center gap-1 px-1.5 py-0.5 hover:bg-slate-100 rounded text-[11px] text-slate-700"
                    title="Copy (Ctrl+C)"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-600" />
                    <span>Copy</span>
                  </button>
                </div>
              </div>
              <span className="text-[9px] text-slate-400 font-semibold text-center mt-1">Clipboard</span>
            </div>

            {/* Font Group */}
            <div className="flex flex-col justify-between border-r border-slate-200 pr-2 mr-1">
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <select
                    className="border border-slate-300 rounded px-1.5 py-0.5 text-[11px] bg-white text-slate-700 w-28"
                    defaultValue="Calibri"
                  >
                    <option value="Calibri">Calibri</option>
                    <option value="Arial">Arial</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Segoe UI">Segoe UI</option>
                  </select>
                  <select
                    className="border border-slate-300 rounded px-1.5 py-0.5 text-[11px] bg-white text-slate-700 w-12"
                    defaultValue="11"
                  >
                    <option value="10">10</option>
                    <option value="11">11</option>
                    <option value="12">12</option>
                    <option value="14">14</option>
                    <option value="16">16</option>
                  </select>
                </div>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => onExecuteCommand('Home', 'Bold')}
                    className="p-1 hover:bg-slate-100 rounded font-black text-slate-800"
                    title="Bold (Ctrl+B)"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onExecuteCommand('Home', 'Italic')}
                    className="p-1 hover:bg-slate-100 rounded italic text-slate-800"
                    title="Italic (Ctrl+I)"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onExecuteCommand('Home', 'Underline')}
                    className="p-1 hover:bg-slate-100 rounded underline text-slate-800"
                    title="Underline (Ctrl+U)"
                  >
                    <Underline className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-px h-3 bg-slate-200 mx-0.5" />
                  <button
                    onClick={() => onExecuteCommand('Home', 'Highlight Color', 'Yellow')}
                    className="p-1 hover:bg-slate-100 rounded flex items-center gap-0.5"
                    title="Text Highlight Color"
                  >
                    <span className="w-3.5 h-2.5 bg-yellow-300 border border-slate-400 rounded-xs" />
                  </button>
                  <button
                    onClick={() => onExecuteCommand('Home', 'Font Color', 'Red')}
                    className="p-1 hover:bg-slate-100 rounded flex flex-col items-center"
                    title="Font Color"
                  >
                    <span className="text-[10px] font-black text-slate-900 leading-none">A</span>
                    <span className="w-3 h-0.5 bg-red-600 mt-0.5" />
                  </button>
                </div>
              </div>
              <span className="text-[9px] text-slate-400 font-semibold text-center mt-1">Font</span>
            </div>

            {/* Paragraph Group */}
            <div className="flex flex-col justify-between border-r border-slate-200 pr-2 mr-1">
              <div className="space-y-1">
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => onExecuteCommand('Home', 'Bullets')}
                    className="p-1 hover:bg-slate-100 rounded"
                    title="Bullets"
                  >
                    <List className="w-3.5 h-3.5 text-slate-700" />
                  </button>
                  <button
                    onClick={() => onExecuteCommand('Home', 'Numbering')}
                    className="p-1 hover:bg-slate-100 rounded"
                    title="Numbering"
                  >
                    <ListOrdered className="w-3.5 h-3.5 text-slate-700" />
                  </button>
                  <span className="w-px h-3 bg-slate-200 mx-0.5" />
                  <button
                    onClick={() => onExecuteCommand('Home', 'Align Left')}
                    className="p-1 hover:bg-slate-100 rounded"
                    title="Align Left (Ctrl+L)"
                  >
                    <AlignLeft className="w-3.5 h-3.5 text-slate-700" />
                  </button>
                  <button
                    onClick={() => onExecuteCommand('Home', 'Align Center')}
                    className="p-1 hover:bg-slate-100 rounded"
                    title="Align Center (Ctrl+E)"
                  >
                    <AlignCenter className="w-3.5 h-3.5 text-slate-700" />
                  </button>
                  <button
                    onClick={() => onExecuteCommand('Home', 'Align Right')}
                    className="p-1 hover:bg-slate-100 rounded"
                    title="Align Right (Ctrl+R)"
                  >
                    <AlignRight className="w-3.5 h-3.5 text-slate-700" />
                  </button>
                  <button
                    onClick={() => onExecuteCommand('Home', 'Justify')}
                    className="p-1 hover:bg-slate-100 rounded"
                    title="Justify (Ctrl+J)"
                  >
                    <AlignJustify className="w-3.5 h-3.5 text-slate-700" />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onExecuteCommand('Home', 'Line Spacing', '1.5 lines')}
                    className={`px-2 py-0.5 text-[11px] rounded border transition-colors flex items-center gap-1 ${
                      currentLineSpacing === '1.5'
                        ? 'bg-blue-50 text-blue-700 border-blue-300 font-bold'
                        : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                    title="Giãn dòng 1.5 Lines"
                  >
                    <span>↕ Line Spacing 1.5</span>
                  </button>
                </div>
              </div>
              <span className="text-[9px] text-slate-400 font-semibold text-center mt-1">Paragraph</span>
            </div>

            {/* Word Styles Gallery */}
            {appType === 'word' && (
              <div className="flex flex-col justify-between border-r border-slate-200 pr-2 mr-1">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onExecuteCommand('Home', 'Styles', 'Normal')}
                    className={`px-2.5 py-1.5 rounded border text-[11px] text-left transition-all ${
                      currentStyle === 'Normal'
                        ? 'border-blue-500 bg-blue-50 text-blue-800 font-bold'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="font-semibold">Normal</div>
                    <div className="text-[9px] text-slate-400">AaBbCc</div>
                  </button>
                  <button
                    onClick={() => onExecuteCommand('Home', 'Styles', 'Heading 1')}
                    className={`px-2.5 py-1.5 rounded border text-[11px] text-left transition-all ${
                      currentStyle === 'Heading 1'
                        ? 'border-blue-500 bg-blue-50 text-blue-800 font-bold'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="font-bold text-[#185abd]">Heading 1</div>
                    <div className="text-[9px] text-slate-400">AaBbCc</div>
                  </button>
                  <button
                    onClick={() => onExecuteCommand('Home', 'Styles', 'Heading 2')}
                    className={`px-2.5 py-1.5 rounded border text-[11px] text-left transition-all ${
                      currentStyle === 'Heading 2'
                        ? 'border-blue-500 bg-blue-50 text-blue-800 font-bold'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-sky-700">Heading 2</div>
                    <div className="text-[9px] text-slate-400">AaBbCc</div>
                  </button>
                </div>
                <span className="text-[9px] text-slate-400 font-semibold text-center mt-1">Styles</span>
              </div>
            )}

            {/* Excel Specific Home Commands (Number & Styles) */}
            {appType === 'excel' && (
              <>
                <div className="flex flex-col justify-between border-r border-slate-200 pr-2 mr-1">
                  <div className="space-y-1">
                    <button
                      onClick={() => onExecuteCommand('Home', 'Number Format', 'Currency VND')}
                      className="px-2 py-0.5 border border-slate-200 hover:bg-slate-100 rounded text-[11px] font-semibold text-slate-700 flex items-center gap-1"
                    >
                      <span>₫ Định dạng Tiền Tệ</span>
                    </button>
                    <button
                      onClick={() => onExecuteCommand('Home', 'Percent Format', 'Percentage')}
                      className="px-2 py-0.5 border border-slate-200 hover:bg-slate-100 rounded text-[11px] font-semibold text-slate-700 flex items-center gap-1"
                    >
                      <span>% Tỷ Lệ Phần Trăm</span>
                    </button>
                  </div>
                  <span className="text-[9px] text-slate-400 font-semibold text-center mt-1">Number</span>
                </div>

                <div className="flex flex-col justify-between border-r border-slate-200 pr-2 mr-1">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onExecuteCommand('Home', 'Conditional Formatting', 'Highlight > 500')}
                      className="p-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded text-emerald-800 text-[10px] font-bold flex flex-col items-center"
                    >
                      <span>🎨 Định Dạng</span>
                      <span>Có Điều Kiện</span>
                    </button>
                    <button
                      onClick={() => onExecuteCommand('Home', 'Format as Table', 'Table Style Medium 2')}
                      className="p-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded text-emerald-800 text-[10px] font-bold flex flex-col items-center"
                    >
                      <span>📊 Định Dạng</span>
                      <span>Dạng Bảng</span>
                    </button>
                    <button
                      onClick={() => onExecuteCommand('Home', 'Total Row', 'Enable Total Row')}
                      className="p-1.5 hover:bg-slate-100 border border-slate-200 rounded text-slate-700 text-[10px] font-medium flex flex-col items-center"
                    >
                      <span>∑ Hàng Tổng</span>
                      <span>Total Row</span>
                    </button>
                  </div>
                  <span className="text-[9px] text-slate-400 font-semibold text-center mt-1">Styles</span>
                </div>
              </>
            )}
          </>
        )}

        {/* ========================================================================= */}
        {/* WORD / EXCEL LAYOUT / PAGE LAYOUT TAB (Essential for Question 1 Margins: Narrow!) */}
        {/* ========================================================================= */}
        {(activeTab.toLowerCase() === 'layout' || activeTab.toLowerCase() === 'page layout') && (
          <>
            {/* Page Setup Group */}
            <div className="flex flex-col justify-between border-r border-slate-200 pr-2 mr-1">
              <div className="flex items-center gap-1.5">
                {/* MARGINS BUTTON WITH REAL DROPDOWN */}
                <div className="relative">
                  <button
                    onClick={() => toggleDropdown('margins')}
                    className={`flex flex-col items-center justify-center p-1.5 rounded transition-all min-w-[56px] border ${
                      openDropdown === 'margins'
                        ? 'bg-blue-100 border-blue-400 text-blue-900 shadow-xs'
                        : currentMargins === 'narrow'
                        ? 'bg-blue-50 border-blue-300 text-blue-800 font-bold'
                        : 'border-transparent hover:bg-slate-100 text-slate-800'
                    }`}
                    title="Margins (Căn Lề Trang)"
                  >
                    <div className="w-5 h-5 border-2 border-dashed border-slate-600 rounded-xs mb-0.5 flex items-center justify-center">
                      <span className="w-2.5 h-2.5 bg-slate-300" />
                    </div>
                    <span className="text-[10px] font-bold flex items-center gap-0.5">
                      Margins <ChevronDown className="w-2.5 h-2.5" />
                    </span>
                  </button>

                  {/* Margins Dropdown Menu */}
                  {openDropdown === 'margins' && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-300 rounded-lg shadow-xl z-50 p-1.5 text-xs animate-in fade-in zoom-in-95">
                      <div className="px-2 py-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 mb-1">
                        Thiết Lập Lề Trang (Margins)
                      </div>

                      <button
                        onClick={() => {
                          onExecuteCommand('Layout', 'Margins', 'Normal');
                          closeDropdown();
                        }}
                        className={`w-full text-left p-2 rounded hover:bg-slate-100 flex items-center justify-between ${
                          currentMargins === 'normal' ? 'bg-blue-50 font-bold text-blue-800' : 'text-slate-800'
                        }`}
                      >
                        <div>
                          <div className="font-bold flex items-center gap-1.5">
                            <span>Normal</span>
                            {currentMargins === 'normal' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                          </div>
                          <div className="text-[10px] text-slate-500">Top: 1" · Bottom: 1" · Left: 1" · Right: 1"</div>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          onExecuteCommand('Layout', 'Margins', 'Narrow');
                          closeDropdown();
                        }}
                        className={`w-full text-left p-2 rounded hover:bg-blue-50 flex items-center justify-between ${
                          currentMargins === 'narrow' ? 'bg-blue-100 font-black text-blue-900' : 'text-slate-800'
                        }`}
                      >
                        <div>
                          <div className="font-bold flex items-center gap-1.5 text-blue-700">
                            <span>Narrow</span>
                            <span className="px-1.5 py-0.2 bg-blue-600 text-white rounded text-[9px] font-black">YÊU CẦU ĐỀ BÀI</span>
                            {currentMargins === 'narrow' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                          </div>
                          <div className="text-[10px] text-slate-600">Top: 0.5" · Bottom: 0.5" · Left: 0.5" · Right: 0.5" (1.27 cm)</div>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          onExecuteCommand('Layout', 'Margins', 'Moderate');
                          closeDropdown();
                        }}
                        className="w-full text-left p-2 rounded hover:bg-slate-100 text-slate-800"
                      >
                        <div className="font-semibold">Moderate</div>
                        <div className="text-[10px] text-slate-500">Top: 1" · Bottom: 1" · Left: 0.75" · Right: 0.75"</div>
                      </button>

                      <button
                        onClick={() => {
                          onExecuteCommand('Layout', 'Margins', 'Wide');
                          closeDropdown();
                        }}
                        className="w-full text-left p-2 rounded hover:bg-slate-100 text-slate-800"
                      >
                        <div className="font-semibold">Wide</div>
                        <div className="text-[10px] text-slate-500">Top: 1" · Bottom: 1" · Left: 2" · Right: 2"</div>
                      </button>
                    </div>
                  )}
                </div>

                {/* ORIENTATION BUTTON WITH DROPDOWN */}
                <div className="relative">
                  <button
                    onClick={() => toggleDropdown('orientation')}
                    className={`flex flex-col items-center justify-center p-1.5 rounded transition-all min-w-[56px] border ${
                      openDropdown === 'orientation'
                        ? 'bg-blue-100 border-blue-400 text-blue-900 shadow-xs'
                        : 'border-transparent hover:bg-slate-100 text-slate-800'
                    }`}
                    title="Orientation (Hướng Trang)"
                  >
                    <div className="w-4 h-5 border border-slate-600 rounded-xs mb-0.5 bg-slate-100" />
                    <span className="text-[10px] font-bold flex items-center gap-0.5">
                      Orientation <ChevronDown className="w-2.5 h-2.5" />
                    </span>
                  </button>

                  {openDropdown === 'orientation' && (
                    <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-slate-300 rounded-lg shadow-xl z-50 p-1 text-xs animate-in fade-in zoom-in-95">
                      <button
                        onClick={() => {
                          onExecuteCommand('Layout', 'Orientation', 'Portrait');
                          closeDropdown();
                        }}
                        className="w-full text-left p-2 rounded hover:bg-slate-100 flex items-center justify-between"
                      >
                        <span>Portrait (Dọc)</span>
                        {currentOrientation === 'portrait' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </button>
                      <button
                        onClick={() => {
                          onExecuteCommand('Layout', 'Orientation', 'Landscape');
                          closeDropdown();
                        }}
                        className="w-full text-left p-2 rounded hover:bg-slate-100 flex items-center justify-between"
                      >
                        <span>Landscape (Ngang)</span>
                        {currentOrientation === 'landscape' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </button>
                    </div>
                  )}
                </div>

                {/* SIZE BUTTON */}
                <button
                  onClick={() => onExecuteCommand('Layout', 'Size', 'A4')}
                  className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-100 rounded text-slate-800 min-w-[48px]"
                  title="Page Size"
                >
                  <span className="text-xs font-black border border-slate-600 px-1 py-0.5 rounded-xs">A4</span>
                  <span className="text-[10px] font-bold mt-0.5">Size</span>
                </button>

                {/* COLUMNS BUTTON */}
                <button
                  onClick={() => onExecuteCommand('Layout', 'Columns', 'Two Columns')}
                  className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-100 rounded text-slate-800 min-w-[48px]"
                  title="Columns"
                >
                  <ColumnsIcon className="w-4 h-4 text-slate-700 mb-0.5" />
                  <span className="text-[10px] font-bold">Columns</span>
                </button>

                {/* BREAKS BUTTON */}
                <button
                  onClick={() => onExecuteCommand('Layout', 'Breaks', 'Next Page Section Break')}
                  className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-100 rounded text-slate-800 min-w-[48px]"
                  title="Section Breaks"
                >
                  <span className="text-sm">✂️</span>
                  <span className="text-[10px] font-bold">Breaks</span>
                </button>

                {/* Excel Print Area */}
                {appType === 'excel' && (
                  <button
                    onClick={() => onExecuteCommand('Page Layout', 'Print Area', 'Set Print Area A1:F20')}
                    className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-100 rounded text-emerald-800 font-bold min-w-[56px]"
                    title="Set Print Area"
                  >
                    <span className="text-sm">🖨️</span>
                    <span className="text-[10px]">Print Area</span>
                  </button>
                )}
              </div>
              <span className="text-[9px] text-slate-400 font-semibold text-center mt-1">Page Setup</span>
            </div>

            {/* Paragraph / Indent Group */}
            <div className="flex flex-col justify-between border-r border-slate-200 pr-2 mr-1">
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 font-semibold">Indent Left:</span>
                  <input type="text" readOnly value="0 cm" className="w-12 border border-slate-300 rounded px-1 text-center bg-slate-50" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 font-semibold">Spacing Before:</span>
                  <input type="text" readOnly value="0 pt" className="w-12 border border-slate-300 rounded px-1 text-center bg-slate-50" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 font-semibold">Indent Right:</span>
                  <input type="text" readOnly value="0 cm" className="w-12 border border-slate-300 rounded px-1 text-center bg-slate-50" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 font-semibold">Spacing After:</span>
                  <input type="text" readOnly value="8 pt" className="w-12 border border-slate-300 rounded px-1 text-center bg-slate-50" />
                </div>
              </div>
              <span className="text-[9px] text-slate-400 font-semibold text-center mt-1">Paragraph</span>
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* INSERT TAB */}
        {/* ========================================================================= */}
        {activeTab.toLowerCase() === 'insert' && (
          <>
            <div className="flex flex-col justify-between border-r border-slate-200 pr-2 mr-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onExecuteCommand('Insert', 'Format as Table', 'Table 4x4')}
                  className="flex flex-col items-center p-1.5 hover:bg-slate-100 rounded text-slate-800"
                >
                  <Table className="w-5 h-5 text-blue-600 mb-0.5" />
                  <span className="text-[10px] font-bold">Table</span>
                </button>
              </div>
              <span className="text-[9px] text-slate-400 font-semibold text-center mt-1">Tables</span>
            </div>

            <div className="flex flex-col justify-between border-r border-slate-200 pr-2 mr-1">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onExecuteCommand('Insert', 'Pictures', 'Stock Images')}
                  className="flex flex-col items-center p-1.5 hover:bg-slate-100 rounded text-slate-800"
                >
                  <ImageIcon className="w-4 h-4 text-emerald-600 mb-0.5" />
                  <span className="text-[10px]">Pictures</span>
                </button>
                <button
                  onClick={() => onExecuteCommand('Insert', 'SmartArt', 'Basic Process')}
                  className="flex flex-col items-center p-1.5 hover:bg-slate-100 rounded text-slate-800"
                >
                  <span className="text-sm">💠</span>
                  <span className="text-[10px]">SmartArt</span>
                </button>
                <button
                  onClick={() => onExecuteCommand('Insert', 'Insert Column Chart', 'Clustered Column')}
                  className="flex flex-col items-center p-1.5 hover:bg-slate-100 rounded text-slate-800 font-bold text-emerald-800"
                >
                  <BarChart3 className="w-4 h-4 text-emerald-600 mb-0.5" />
                  <span className="text-[10px]">Chart</span>
                </button>
              </div>
              <span className="text-[9px] text-slate-400 font-semibold text-center mt-1">Illustrations</span>
            </div>

            <div className="flex flex-col justify-between border-r border-slate-200 pr-2 mr-1">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onExecuteCommand('Insert', 'Drop Cap', 'Dropped')}
                  className="flex flex-col items-center p-1.5 hover:bg-slate-100 rounded text-slate-800"
                >
                  <Type className="w-4 h-4 text-indigo-600 mb-0.5" />
                  <span className="text-[10px]">Drop Cap</span>
                </button>
                <button
                  onClick={() => onExecuteCommand('Insert', 'Chart Title', 'Báo Cáo Doanh Thu 2026')}
                  className="flex flex-col items-center p-1.5 hover:bg-slate-100 rounded text-slate-800"
                >
                  <span className="text-sm">🏷️</span>
                  <span className="text-[10px]">Title</span>
                </button>
              </div>
              <span className="text-[9px] text-slate-400 font-semibold text-center mt-1">Text</span>
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* DESIGN TAB */}
        {/* ========================================================================= */}
        {activeTab.toLowerCase() === 'design' && (
          <>
            <div className="flex flex-col justify-between border-r border-slate-200 pr-2 mr-1">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onExecuteCommand('Design', 'Watermark', 'DRAFT 1')}
                  className="flex flex-col items-center p-1.5 hover:bg-slate-100 rounded text-blue-800 font-bold"
                >
                  <span className="text-sm">💧</span>
                  <span className="text-[10px]">Watermark</span>
                </button>
                <button
                  onClick={() => onExecuteCommand('Design', 'Page Borders', 'Box Border 1.5pt')}
                  className="flex flex-col items-center p-1.5 hover:bg-slate-100 rounded text-slate-800"
                >
                  <span className="text-sm">🖼️</span>
                  <span className="text-[10px]">Page Borders</span>
                </button>
                <button
                  onClick={() => onExecuteCommand('Design', 'Table Style', 'Grid Table 4 - Accent 1')}
                  className="flex flex-col items-center p-1.5 hover:bg-slate-100 rounded text-slate-800"
                >
                  <span className="text-sm">🎨</span>
                  <span className="text-[10px]">Table Style</span>
                </button>
              </div>
              <span className="text-[9px] text-slate-400 font-semibold text-center mt-1">Page Background</span>
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* EXCEL FORMULAS TAB */}
        {/* ========================================================================= */}
        {activeTab.toLowerCase() === 'formulas' && (
          <>
            <div className="flex flex-col justify-between border-r border-slate-200 pr-2 mr-1">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onExecuteCommand('Formulas', 'AutoSum', '=SUM(D2:D11)')}
                  className="flex flex-col items-center p-1.5 bg-emerald-600 text-white rounded font-bold min-w-[56px] shadow-2xs"
                >
                  <span className="text-sm font-black">∑</span>
                  <span className="text-[10px]">AutoSum</span>
                </button>
                <button
                  onClick={() => onExecuteCommand('Formulas', 'Formula IF', '=IF(G2>=700,"Đạt (Pass)","Thi Lại (Fail)")')}
                  className="flex flex-col items-center p-1.5 hover:bg-slate-100 rounded text-slate-800"
                >
                  <span className="text-sm">⚡</span>
                  <span className="text-[10px] font-semibold">Logical IF</span>
                </button>
                <button
                  onClick={() => onExecuteCommand('Formulas', 'Formula VLOOKUP', '=VLOOKUP(A2,$E$2:$G$10,2,FALSE)')}
                  className="flex flex-col items-center p-1.5 hover:bg-slate-100 rounded text-slate-800 font-bold text-indigo-700"
                >
                  <span className="text-sm">🔍</span>
                  <span className="text-[10px]">VLOOKUP</span>
                </button>
                <button
                  onClick={() => onExecuteCommand('Formulas', 'Formula COUNTIF', '=COUNTIF(H2:H11, "Đạt")')}
                  className="flex flex-col items-center p-1.5 hover:bg-slate-100 rounded text-slate-800"
                >
                  <span className="text-sm">🔢</span>
                  <span className="text-[10px]">COUNTIF</span>
                </button>
              </div>
              <span className="text-[9px] text-slate-400 font-semibold text-center mt-1">Function Library</span>
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* EXCEL DATA TAB */}
        {/* ========================================================================= */}
        {activeTab.toLowerCase() === 'data' && (
          <>
            <div className="flex flex-col justify-between border-r border-slate-200 pr-2 mr-1">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onExecuteCommand('Data', 'Sort', 'Sort A to Z')}
                  className="flex flex-col items-center p-1.5 hover:bg-slate-100 rounded text-slate-800"
                >
                  <span className="text-sm">📶</span>
                  <span className="text-[10px]">Sort A-Z</span>
                </button>
                <button
                  onClick={() => onExecuteCommand('Data', 'Flash Fill', 'Ctrl + E')}
                  className="flex flex-col items-center p-1.5 bg-blue-50 text-blue-800 border border-blue-200 rounded font-bold"
                >
                  <span className="text-sm">⚡</span>
                  <span className="text-[10px]">Flash Fill</span>
                </button>
                <button
                  onClick={() => onExecuteCommand('Data', 'Remove Duplicates', 'Remove')}
                  className="flex flex-col items-center p-1.5 hover:bg-slate-100 rounded text-slate-800"
                >
                  <span className="text-sm">✂️</span>
                  <span className="text-[10px]">Duplicates</span>
                </button>
              </div>
              <span className="text-[9px] text-slate-400 font-semibold text-center mt-1">Data Tools</span>
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* REFERENCES TAB */}
        {/* ========================================================================= */}
        {activeTab.toLowerCase() === 'references' && (
          <>
            <div className="flex flex-col justify-between border-r border-slate-200 pr-2 mr-1">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onExecuteCommand('References', 'Table of Contents', 'Automatic Table 1')}
                  className="flex flex-col items-center p-1.5 bg-blue-50 text-blue-800 border border-blue-200 rounded font-bold"
                >
                  <span className="text-sm">📑</span>
                  <span className="text-[10px]">Mục Lục (TOC)</span>
                </button>
                <button
                  onClick={() => onExecuteCommand('References', 'Footnote', 'Insert Footnote')}
                  className="flex flex-col items-center p-1.5 hover:bg-slate-100 rounded text-slate-800"
                >
                  <span className="text-sm">📝</span>
                  <span className="text-[10px]">Footnote</span>
                </button>
              </div>
              <span className="text-[9px] text-slate-400 font-semibold text-center mt-1">Table of Contents</span>
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* VIEW TAB */}
        {/* ========================================================================= */}
        {activeTab.toLowerCase() === 'view' && (
          <>
            <div className="flex flex-col justify-between border-r border-slate-200 pr-2 mr-1">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onExecuteCommand('View', 'Freeze Panes', 'Freeze Top Row')}
                  className="flex flex-col items-center p-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-bold"
                >
                  <span className="text-sm">❄️</span>
                  <span className="text-[10px]">Freeze Top Row</span>
                </button>
                <button
                  onClick={() => onExecuteCommand('View', 'Freeze Panes', 'Freeze First Column')}
                  className="flex flex-col items-center p-1.5 hover:bg-slate-100 rounded text-slate-800"
                >
                  <span className="text-sm">❄️</span>
                  <span className="text-[10px]">Freeze 1st Col</span>
                </button>
              </div>
              <span className="text-[9px] text-slate-400 font-semibold text-center mt-1">Window</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
