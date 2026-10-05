import React, { useState } from 'react';
import { 
  X, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  Flame, 
  RotateCcw, 
  Play, 
  Pause, 
  AlertTriangle, 
  Volume2, 
  VolumeX, 
  Layers, 
  Award,
  Zap,
  Target
} from 'lucide-react';
import { ExamCountdownTimer, TimerVariant } from './ExamCountdownTimer';
import { soundManager } from '../../utils/audio';

export interface ExamTimerSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_DURATIONS = [
  { label: '50 Phút', seconds: 50 * 60, desc: 'Thời lượng chuẩn kỳ thi MOS Certiport quốc tế', tag: 'Chuẩn Certiport', color: 'border-blue-500 text-blue-400' },
  { label: '15 Phút', seconds: 15 * 60, desc: 'Kiểm tra tốc độ làm bài dự phòng', tag: 'Tốc Độ', color: 'border-indigo-500 text-indigo-400' },
  { label: '5 Phút', seconds: 5 * 60, desc: 'Mô phỏng áp lực phòng thi khi sắp hết giờ', tag: 'Cảnh Báo Vàng', color: 'border-amber-500 text-amber-400' },
  { label: '1 Phút', seconds: 60, desc: 'Kiểm tra áp lực đếm ngược giây cuối cùng', tag: 'Báo Động Đỏ', color: 'border-rose-500 text-rose-400' },
];

export const ExamTimerSimulatorModal: React.FC<ExamTimerSimulatorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedDuration, setSelectedDuration] = useState<number>(50 * 60);
  const [selectedVariant, setSelectedVariant] = useState<TimerVariant>('full');
  const [timerKey, setTimerKey] = useState<number>(Date.now());
  const [allowPause, setAllowPause] = useState<boolean>(true);
  const [audioAlerts, setAudioAlerts] = useState<boolean>(true);
  const [completedTasks, setCompletedTasks] = useState<number>(18);
  const [totalTasks, setTotalTasks] = useState<number>(35);

  if (!isOpen) return null;

  const handleResetTimer = (durationSeconds?: number) => {
    soundManager.playClick();
    if (durationSeconds) setSelectedDuration(durationSeconds);
    setTimerKey(Date.now());
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-800 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Công Cụ Giả Lập Áp Lực Thi
                </span>
                <span className="text-xs text-slate-400">Certiport Pressure Engine</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Bộ Đếm Giờ Áp Lực Thi MOS & Màn Hình Tạm Dừng Bảo Mật
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 space-y-6 overflow-y-auto max-h-[75vh]">
          
          {/* Controls Bar: Preset Durations & Variants */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Presets */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                Chọn Kịch Bản Thời Gian Thử Nghiệm:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_DURATIONS.map((preset) => (
                  <button
                    key={preset.seconds}
                    type="button"
                    onClick={() => handleResetTimer(preset.seconds)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      selectedDuration === preset.seconds
                        ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-sm text-white">{preset.label}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-white/10">{preset.tag}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{preset.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Display Variant Switcher */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-500" />
                Kiểu Hiển Thị (Display Variant):
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['full', 'widget', 'hud', 'badge'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => {
                      soundManager.playClick();
                      setSelectedVariant(v);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      selectedVariant === v
                        ? 'bg-blue-950/60 border-blue-500 text-white shadow-md'
                        : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-bold text-xs uppercase text-white flex items-center justify-between">
                      <span>{v === 'full' ? 'Bảng Đầy Đủ (Full)' : v === 'widget' ? 'Thẻ Widget' : v === 'hud' ? 'Thanh HUD' : 'Huy Hiệu Badge'}</span>
                      {selectedVariant === v && <span className="w-2 h-2 rounded-full bg-blue-400" />}
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {v === 'full' ? 'Trung tâm đếm ngược lớn' : v === 'widget' ? 'Thẻ theo dõi tiến độ' : v === 'hud' ? 'Gắn thanh tiêu đề phòng thi' : 'Pill nhỏ gọn'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Feature toggles */}
          <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-semibold select-none">
                <input
                  type="checkbox"
                  checked={allowPause}
                  onChange={(e) => setAllowPause(e.target.checked)}
                  className="rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Cho phép Tạm dừng / Tiếp tục (Pause / Resume)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-semibold select-none">
                <input
                  type="checkbox"
                  checked={audioAlerts}
                  onChange={(e) => setAudioAlerts(e.target.checked)}
                  className="rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Chuông cảnh báo áp lực (5 phút & 1 phút)</span>
              </label>
            </div>

            <button
              onClick={() => handleResetTimer()}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors flex items-center gap-1.5 cursor-pointer ml-auto"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Khởi Động Lại Bộ Đếm</span>
            </button>
          </div>

          {/* Active Reusable Timer Preview */}
          <div className="pt-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Bản Xem Thử Trực Tiếp (Live Active Preview):</span>
              <span className="text-slate-500 font-mono">ExamCountdownTimer.tsx</span>
            </div>

            <div className="p-4 sm:p-6 rounded-3xl bg-slate-950 border border-slate-800 flex items-center justify-center min-h-[220px]">
              <ExamCountdownTimer
                key={timerKey}
                initialSeconds={selectedDuration}
                variant={selectedVariant}
                allowPause={allowPause}
                enableAudioAlerts={audioAlerts}
                totalTasks={totalTasks}
                completedTasks={completedTasks}
                examTitle={`Kỳ Thi Thử Nghiệm MOS (${Math.floor(selectedDuration / 60)} Phút)`}
                onWarning={(level) => {
                  console.log('[Timer Warning Triggered]', level);
                }}
                onExpire={() => {
                  soundManager.playPassFanfare();
                  alert('⏰ Hết giờ làm bài! Hệ thống tự động kích hoạt nộp bài thi theo chuẩn Certiport.');
                }}
              />
            </div>
          </div>

          {/* Description of Certiport Exam Pressure Mechanics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-1">
              <strong className="text-emerald-400 block font-bold">1. Mốc Bình Thường (&gt; 15p)</strong>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Màu xanh thư thái, hiển thị tốc độ giải quyết từng task để phân bổ 50 phút hợp lý cho 5-7 Projects.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-1">
              <strong className="text-amber-400 block font-bold">2. Mốc Cảnh Báo (5 - 15p)</strong>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Đổi sang vàng cam, phát chuông kép thông báo 5 phút cuối và nhắc nhở thí sinh hoàn tất các câu còn lại.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-1">
              <strong className="text-rose-400 block font-bold">3. Mốc Khẩn Cấp (&lt; 1p)</strong>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Đổi sang đỏ rực với hiệu ứng nhịp tim (pulse heartbeat), phát chuông khẩn cấp và tiếng tích tắc 10 giây cuối.
              </p>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Chuẩn khảo thí quốc tế: Certiport Console MOS 365/2019</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors cursor-pointer"
          >
            Đóng Cửa Sổ
          </button>
        </div>

      </div>
    </div>
  );
};

export default ExamTimerSimulatorModal;
