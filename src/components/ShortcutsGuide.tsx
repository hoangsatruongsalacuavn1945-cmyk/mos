import React, { useState, useEffect } from 'react';
import { SHORTCUTS_DATA, RIBBON_PATHS_MAP } from '../data/shortcutsData';
import { MOSSubject } from '../types/mos';
import { Search, Keyboard, Compass, Copy, Check, Sparkles, Zap, Trophy, RotateCcw, Flame } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface ShortcutsGuideProps {
  selectedSubject: MOSSubject;
}

interface ShortcutDrillItem {
  id: string;
  action: string;
  keysDisplay: string;
  category: string;
  targetApp: string;
  hint: string;
  validator: (e: KeyboardEvent) => boolean;
}

const DRILL_QUESTIONS: ShortcutDrillItem[] = [
  {
    id: 'd1',
    action: 'Mở hộp thoại Format Cells (Định dạng ô nhanh) trong Excel',
    keysDisplay: 'Ctrl + 1',
    category: 'Định dạng',
    targetApp: 'Excel',
    hint: 'Nhấn giữ phím Ctrl rồi nhấn phím số 1',
    validator: (e) => (e.ctrlKey || e.metaKey) && e.key === '1',
  },
  {
    id: 'd2',
    action: 'Chèn siêu liên kết (Insert Hyperlink)',
    keysDisplay: 'Ctrl + K',
    category: 'Chèn đối tượng',
    targetApp: 'Word / Excel / PPT',
    hint: 'Nhấn giữ phím Ctrl rồi nhấn phím K',
    validator: (e) => (e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'k'),
  },
  {
    id: 'd3',
    action: 'Tạo bảng dữ liệu Excel Table từ vùng dữ liệu hiện tại',
    keysDisplay: 'Ctrl + T',
    category: 'Bảng tính',
    targetApp: 'Excel',
    hint: 'Nhấn phím Ctrl + T (hoặc Ctrl + L)',
    validator: (e) => (e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 't' || e.key.toLowerCase() === 'l'),
  },
  {
    id: 'd4',
    action: 'Lặp lại thao tác trước đó (Redo / Repeat Action)',
    keysDisplay: 'Ctrl + Y hoặc F4',
    category: 'Thao tác chung',
    targetApp: 'Word / Excel',
    hint: 'Nhấn tổ hợp Ctrl + Y hoặc phím F4',
    validator: (e) => ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') || e.key === 'F4',
  },
  {
    id: 'd5',
    action: 'Mở cửa sổ Tìm kiếm & Thay thế (Find and Replace)',
    keysDisplay: 'Ctrl + H',
    category: 'Chỉnh sửa',
    targetApp: 'Word / Excel',
    hint: 'Nhấn Ctrl + H để mở Replace',
    validator: (e) => (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'h',
  },
  {
    id: 'd6',
    action: 'Trình chiếu slide PowerPoint từ đầu (Slide Show)',
    keysDisplay: 'F5',
    category: 'Trình chiếu',
    targetApp: 'PowerPoint',
    hint: 'Nhấn phím chức năng F5',
    validator: (e) => e.key === 'F5',
  },
];

export const ShortcutsGuide: React.FC<ShortcutsGuideProps> = ({ selectedSubject }) => {
  const [activeTab, setActiveTab] = useState<'shortcuts' | 'ribbon' | 'drills'>('shortcuts');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Drill State
  const [drillIndex, setDrillIndex] = useState(0);
  const [drillScore, setDrillScore] = useState(0);
  const [drillStreak, setDrillStreak] = useState(0);
  const [lastFeedback, setLastFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [lastKeyPressed, setLastKeyPressed] = useState<string>('');

  const currentDrill = DRILL_QUESTIONS[drillIndex];

  // Intercept keyboard events in Drills mode
  useEffect(() => {
    if (activeTab !== 'drills') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default browser shortcuts for drills like Ctrl+S, Ctrl+H, Ctrl+K, F5
      if ((e.ctrlKey && ['s', 'k', 'h', 'y', 't', '1'].includes(e.key.toLowerCase())) || e.key === 'F5' || e.key === 'F4') {
        e.preventDefault();
      }

      const keyName = `${e.ctrlKey ? 'Ctrl + ' : ''}${e.shiftKey ? 'Shift + ' : ''}${e.altKey ? 'Alt + ' : ''}${e.key.toUpperCase()}`;
      setLastKeyPressed(keyName);

      if (currentDrill.validator(e)) {
        soundManager.playCorrect();
        setLastFeedback('correct');
        setDrillScore(s => s + 100 + drillStreak * 20);
        setDrillStreak(st => st + 1);

        setTimeout(() => {
          setLastFeedback(null);
          setDrillIndex(i => (i + 1) % DRILL_QUESTIONS.length);
        }, 800);
      } else if (!['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
        soundManager.playWrong();
        setLastFeedback('incorrect');
        setDrillStreak(0);
        setTimeout(() => setLastFeedback(null), 1000);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, drillIndex, drillStreak, currentDrill]);

  // Filter shortcuts
  const filteredShortcuts = SHORTCUTS_DATA.filter(item => {
    if (selectedSubject !== 'all') {
      if (item.subject !== 'common' && item.subject !== selectedSubject) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.keys.toLowerCase().includes(q) ||
        item.action.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filter ribbon paths
  const filteredRibbonPaths = RIBBON_PATHS_MAP.filter(item => {
    if (selectedSubject !== 'all') {
      const mapSubject =
        selectedSubject === 'word'
          ? 'Word'
          : selectedSubject === 'excel'
          ? 'Excel'
          : 'PowerPoint';
      if (item.app !== mapSubject) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.feature.toLowerCase().includes(q) ||
        item.path.toLowerCase().includes(q) ||
        item.app.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCopyPath = (path: string, idx: number) => {
    navigator.clipboard.writeText(path);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1800);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-2xl p-6 sm:p-8 mb-8 shadow-sm">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Cẩm Nang Thí Sinh MOS Quốc Tế</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">
            Tra Cứu Phím Tắt & Vị Trí Thanh Ribbon
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Trong phòng thi MOS Certiport, tốc độ là yếu tố quyết định. Nắm chắc vị trí các thẻ chức năng trên Ribbon và các phím tắt cốt lõi giúp bạn tiết kiệm đến 40% thời gian làm bài.
          </p>
        </div>
      </div>

      {/* Mode Selector & Search */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 mb-8 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Tab switch */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveTab('shortcuts')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'shortcuts'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Phím Tắt Thiết Yếu ({filteredShortcuts.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('ribbon')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'ribbon'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Đường Dẫn Ribbon ({filteredRibbonPaths.length})</span>
          </button>
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('drills');
            }}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'drills'
                ? 'bg-amber-500 text-white font-bold shadow-xs'
                : 'text-amber-700 hover:bg-amber-50'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Thử Thách Bàn Phím (Drills)</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={
              activeTab === 'shortcuts'
                ? 'Tìm phím tắt (F4, Ctrl+E, Save As...)'
                : 'Tìm tính năng (Margins, Freeze, Morph...)'
            }
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
          />
        </div>
      </div>

      {/* Shortcuts List View */}
      {activeTab === 'shortcuts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredShortcuts.map(sc => {
            const subjectLabel =
              sc.subject === 'common'
                ? 'Chung'
                : sc.subject === 'word'
                ? 'Word'
                : sc.subject === 'excel'
                ? 'Excel'
                : 'PowerPoint';

            return (
              <div
                key={sc.id}
                className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-3">
                    <span className="font-semibold text-slate-700">{subjectLabel} · {sc.category}</span>
                    <span className="text-[11px] text-blue-600 font-semibold">{sc.frequency}</span>
                  </div>

                  {/* KBD visual tags */}
                  <div className="mb-3 flex flex-wrap items-center gap-1.5">
                    {sc.keys.split(' / ').map((group, gIdx) => (
                      <div key={gIdx} className="flex items-center gap-1">
                        {gIdx > 0 && <span className="text-xs text-slate-400 font-bold mx-1">hoặc</span>}
                        {group.split('+').map((key, kIdx) => (
                          <React.Fragment key={kIdx}>
                            {kIdx > 0 && <span className="text-xs text-slate-400">+</span>}
                            <kbd className="px-2 py-1 bg-slate-100 border border-slate-300 rounded-md font-mono text-xs font-bold text-slate-800 shadow-2xs">
                              {key.trim()}
                            </kbd>
                          </React.Fragment>
                        ))}
                      </div>
                    ))}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mb-1.5">
                    {sc.action}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {sc.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ribbon Paths Table View */}
      {activeTab === 'ribbon' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="p-4 w-28">Ứng Dụng</th>
                  <th className="p-4">Tính Năng / Thao Tác</th>
                  <th className="p-4">Đường Dẫn Trên Thanh Ribbon (Chuẩn Certiport)</th>
                  <th className="p-4 w-24 text-right">Sao Chép</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRibbonPaths.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-bold">
                      <span
                        className={`text-xs font-bold ${
                          item.app === 'Word'
                            ? 'text-blue-700'
                            : item.app === 'Excel'
                            ? 'text-emerald-700'
                            : 'text-orange-700'
                        }`}
                      >
                        {item.app}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-slate-900">
                      {item.feature}
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded border border-slate-200 inline-block">
                        {item.path}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleCopyPath(item.path, idx)}
                        className="text-slate-500 hover:text-blue-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors inline-flex items-center gap-1"
                        title="Sao chép đường dẫn"
                      >
                        {copiedIndex === idx ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Interactive Keyboard Drills Mode */}
      {activeTab === 'drills' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs max-w-3xl mx-auto text-center space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <span>Thử Thách Phím Tắt MOS</span>
              <span>·</span>
              <span>Câu {drillIndex + 1}/{DRILL_QUESTIONS.length}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                <Flame className="w-4 h-4 text-amber-500" />
                <span>Combo: {drillStreak}x</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                <Trophy className="w-4 h-4 text-blue-500" />
                <span>Điểm: {drillScore}</span>
              </div>
            </div>
          </div>

          <div className="py-6 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-slate-100 text-slate-700">
              {currentDrill.targetApp} · {currentDrill.category}
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 max-w-xl mx-auto leading-snug">
              {currentDrill.action}
            </h3>
            <p className="text-xs text-slate-500 italic">
              💡 Gợi ý: {currentDrill.hint}
            </p>
          </div>

          {/* Interactive Keyboard Capture Box */}
          <div className={`p-8 rounded-2xl border-2 transition-all flex flex-col items-center justify-center min-h-[160px] ${
            lastFeedback === 'correct' 
              ? 'bg-emerald-50 border-emerald-500 scale-102' 
              : lastFeedback === 'incorrect'
              ? 'bg-rose-50 border-rose-500'
              : 'bg-slate-50 border-dashed border-slate-300'
          }`}>
            {lastFeedback === 'correct' ? (
              <div className="text-emerald-700 font-bold flex flex-col items-center gap-2 animate-bounce">
                <Check className="w-10 h-10 text-emerald-600" />
                <span className="text-lg">CHÍNH XÁC! (+{100 + drillStreak * 20} ĐIỂM)</span>
              </div>
            ) : lastFeedback === 'incorrect' ? (
              <div className="text-rose-700 font-bold flex flex-col items-center gap-1">
                <span className="text-sm">Chưa đúng! Bạn vừa nhấn: <strong>{lastKeyPressed || 'Phím khác'}</strong></span>
                <span className="text-xs text-rose-500">Đáp án chuẩn: {currentDrill.keysDisplay}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Keyboard className="w-10 h-10 text-slate-400 animate-pulse" />
                <div className="text-sm font-bold text-slate-700">
                  NHẤN PHÍM TẮT TRÊN BÀN PHÍM CỦA BẠN NGAY BÂY GIỜ
                </div>
                <div className="text-xs text-slate-400">
                  (Chuột bị vô hiệu hóa trong chế độ này để rèn phản xạ tự nhiên)
                </div>
                {lastKeyPressed && (
                  <div className="text-xs font-mono text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                    Phím vừa nhận: {lastKeyPressed}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                soundManager.playClick();
                setDrillIndex(i => (i + 1) % DRILL_QUESTIONS.length);
                setLastFeedback(null);
              }}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Bỏ Qua Câu Này
            </button>
            <button
              onClick={() => {
                soundManager.playClick();
                setDrillScore(0);
                setDrillStreak(0);
                setDrillIndex(0);
                setLastFeedback(null);
              }}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Chơi Lại Từ Đầu</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
