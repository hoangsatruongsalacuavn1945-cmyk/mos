import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Clock, 
  Pause, 
  Play, 
  AlertTriangle, 
  ShieldAlert, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Zap, 
  CheckCircle2, 
  Flame, 
  Lock, 
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { soundManager } from '../../utils/audio';

export type TimerVariant = 'hud' | 'badge' | 'widget' | 'full';

export interface ExamCountdownTimerProps {
  /** Initial total exam duration in seconds. Standard MOS is 3000 (50 minutes). */
  initialSeconds?: number;
  /** Current remaining seconds if controlled from parent component. */
  currentSeconds?: number;
  /** Initial paused state or controlled pause from parent. */
  isPaused?: boolean;
  /** Whether student is allowed to pause this exam session. Default true. */
  allowPause?: boolean;
  /** Display variant:
   * - 'hud': Compact bar designed for sticky top exam headers.
   * - 'badge': Pill badge with pulse and MM:SS.
   * - 'widget': Detailed card with circular gauge and pace tracker.
   * - 'full': Standalone countdown center with full statistics and pressure gauges.
   */
  variant?: TimerVariant;
  /** Warning thresholds in seconds. */
  warningThresholdSeconds?: number; // Default 900 (15m)
  urgentThresholdSeconds?: number;  // Default 300 (5m)
  criticalThresholdSeconds?: number; // Default 60 (1m)
  /** Enable audio alarms when passing 5m & 1m pressure thresholds. */
  enableAudioAlerts?: boolean;
  /** Title of the current exam / subject code. */
  examTitle?: string;
  /** Total tasks/questions in the exam to calculate pace. */
  totalTasks?: number;
  /** Completed tasks count. */
  completedTasks?: number;
  /** Callbacks */
  onTick?: (remainingSeconds: number) => void;
  onExpire?: () => void;
  onPause?: (remainingSeconds: number) => void;
  onResume?: (remainingSeconds: number) => void;
  onWarning?: (level: 'warning' | 'urgent' | 'critical') => void;
  /** Container styling */
  className?: string;
  /** Whether to show Certiport security backdrop when paused to prevent cheating. Default true. */
  showSecurityPauseModal?: boolean;
}

export const ExamCountdownTimer: React.FC<ExamCountdownTimerProps> = ({
  initialSeconds = 3000, // 50 minutes standard
  currentSeconds,
  isPaused: externalPaused,
  allowPause = true,
  variant = 'hud',
  warningThresholdSeconds = 900, // 15m
  urgentThresholdSeconds = 300,  // 5m
  criticalThresholdSeconds = 60,  // 1m
  enableAudioAlerts = true,
  examTitle = 'MOS Certiport Exam (50 Phút)',
  totalTasks = 35,
  completedTasks = 0,
  onTick,
  onExpire,
  onPause,
  onResume,
  onWarning,
  className = '',
  showSecurityPauseModal = true,
}) => {
  // Internal state if uncontrolled
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    return typeof currentSeconds === 'number' ? currentSeconds : initialSeconds;
  });

  const [internalPaused, setInternalPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => soundManager.getMuted());
  const [resumingCountdown, setResumingCountdown] = useState<number | null>(null);

  // Flags to avoid repeating alarms
  const warned5mRef = useRef(false);
  const warned1mRef = useRef(false);

  // Sync external controlled seconds
  useEffect(() => {
    if (typeof currentSeconds === 'number') {
      setTimeLeft(currentSeconds);
    }
  }, [currentSeconds]);

  const effectivePaused = typeof externalPaused === 'boolean' ? externalPaused : internalPaused;

  // Pressure urgency level
  const urgencyLevel = useMemo<'normal' | 'warning' | 'urgent' | 'critical'>(() => {
    if (timeLeft <= criticalThresholdSeconds) return 'critical';
    if (timeLeft <= urgentThresholdSeconds) return 'urgent';
    if (timeLeft <= warningThresholdSeconds) return 'warning';
    return 'normal';
  }, [timeLeft, criticalThresholdSeconds, urgentThresholdSeconds, warningThresholdSeconds]);

  // Main tick loop
  useEffect(() => {
    if (effectivePaused || timeLeft <= 0 || resumingCountdown !== null) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const next = Math.max(0, prev - 1);
        if (onTick) onTick(next);

        // 5-minute threshold trigger
        if (next === urgentThresholdSeconds && !warned5mRef.current) {
          warned5mRef.current = true;
          if (enableAudioAlerts && !isMuted) soundManager.playTimerWarning();
          if (onWarning) onWarning('urgent');
        }

        // 1-minute threshold trigger
        if (next === criticalThresholdSeconds && !warned1mRef.current) {
          warned1mRef.current = true;
          if (enableAudioAlerts && !isMuted) soundManager.playTimerUrgent();
          if (onWarning) onWarning('critical');
        }

        // Final 10 seconds tick
        if (next <= 10 && next > 0 && enableAudioAlerts && !isMuted) {
          soundManager.playTick();
        }

        // Expiration
        if (next === 0) {
          if (onExpire) onExpire();
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    effectivePaused, 
    timeLeft, 
    resumingCountdown, 
    onTick, 
    onExpire, 
    enableAudioAlerts, 
    isMuted, 
    urgentThresholdSeconds, 
    criticalThresholdSeconds, 
    onWarning
  ]);

  // Handle Pause
  const handleTogglePause = useCallback(() => {
    if (!allowPause) return;
    soundManager.playClick();

    if (effectivePaused) {
      // Begin 3-2-1 resume countdown
      setResumingCountdown(3);
    } else {
      setInternalPaused(true);
      if (onPause) onPause(timeLeft);
    }
  }, [allowPause, effectivePaused, timeLeft, onPause]);

  // Resume countdown interval (3... 2... 1... Go!)
  useEffect(() => {
    if (resumingCountdown === null) return;

    if (resumingCountdown === 0) {
      setResumingCountdown(null);
      setInternalPaused(false);
      if (onResume) onResume(timeLeft);
      soundManager.playClick();
      return;
    }

    const countTimer = setTimeout(() => {
      soundManager.playTick();
      setResumingCountdown((c) => (c !== null ? c - 1 : null));
    }, 800);

    return () => clearTimeout(countTimer);
  }, [resumingCountdown, onResume, timeLeft]);

  // Format MM:SS or HH:MM:SS
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const pad = (n: number) => String(n).padStart(2, '0');

    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  const percentage = Math.max(0, Math.min(100, (timeLeft / initialSeconds) * 100));
  const elapsedSeconds = initialSeconds - timeLeft;

  // Pace Calculation (average seconds left per remaining task)
  const remainingTasks = Math.max(1, totalTasks - completedTasks);
  const secondsPerRemainingTask = Math.round(timeLeft / remainingTasks);
  const targetSecondsPerTask = Math.round(initialSeconds / totalTasks);
  const isBehindPace = secondsPerRemainingTask < targetSecondsPerTask * 0.7;

  // Color schemes based on urgency level
  const colorStyles = useMemo(() => {
    switch (urgencyLevel) {
      case 'critical':
        return {
          bg: 'bg-rose-950/90 border-rose-500 text-rose-100',
          gaugeStroke: '#f43f5e',
          text: 'text-rose-400',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse',
          pulse: 'animate-pulse',
          label: 'KHẨN CẤP (< 1 PHÚT)',
        };
      case 'urgent':
        return {
          bg: 'bg-amber-950/90 border-amber-500 text-amber-100',
          gaugeStroke: '#f59e0b',
          text: 'text-amber-400',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          pulse: 'animate-bounce-subtle',
          label: 'CẢNH BÁO (< 5 PHÚT)',
        };
      case 'warning':
        return {
          bg: 'bg-slate-900/90 border-indigo-500/50 text-slate-100',
          gaugeStroke: '#6366f1',
          text: 'text-indigo-400',
          badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
          pulse: '',
          label: 'ĐANG THI (< 15 PHÚT)',
        };
      default:
        return {
          bg: 'bg-slate-900/90 border-slate-700 text-slate-100',
          gaugeStroke: '#10b981',
          text: 'text-emerald-400',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          pulse: '',
          label: 'TIẾN ĐỘ TỐT',
        };
    }
  }, [urgencyLevel]);

  // SVG Circular Gauge Dimensions
  const circleRadius = 24;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <>
      {/* ========================================================================= */}
      {/* VARIANT 1: HUD (COMPACT BAR FOR EXAM CONSOLE HEADER)                      */}
      {/* ========================================================================= */}
      {variant === 'hud' && (
        <div className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-2xl border backdrop-blur-md transition-all shadow-md ${colorStyles.bg} ${className}`}>
          {/* Mini Circular Ring */}
          <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
            <svg className="w-8 h-8 -rotate-90 transform" viewBox="0 0 56 56">
              <circle
                cx="28"
                cy="28"
                r={circleRadius}
                fill="transparent"
                stroke="currentColor"
                strokeWidth="4"
                className="text-white/10"
              />
              <circle
                cx="28"
                cy="28"
                r={circleRadius}
                fill="transparent"
                stroke={colorStyles.gaugeStroke}
                strokeWidth="4.5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-500 ease-linear"
              />
            </svg>
            <Clock className={`w-3.5 h-3.5 absolute ${colorStyles.text} ${urgencyLevel === 'critical' ? 'animate-spin-slow' : ''}`} />
          </div>

          {/* Time Digits */}
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 flex items-center gap-1">
              <span>Còn lại</span>
              {urgencyLevel === 'critical' && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              )}
            </span>
            <span className={`font-mono text-base font-black tracking-tight leading-none ${colorStyles.text}`}>
              {formatTime(timeLeft)}
            </span>
          </div>

          {/* Pause / Resume Controls */}
          {allowPause && (
            <button
              type="button"
              onClick={handleTogglePause}
              className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                effectivePaused
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-400 shadow-md font-bold'
                  : 'bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white border-white/10'
              }`}
              title={effectivePaused ? 'Tiếp tục làm bài' : 'Tạm dừng bài thi (Màn hình an toàn)'}
            >
              {effectivePaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Audio toggle */}
          <button
            type="button"
            onClick={() => {
              const muted = soundManager.toggleMute();
              setIsMuted(muted);
            }}
            className="p-1 text-slate-400 hover:text-white cursor-pointer transition-colors"
            title={isMuted ? 'Bật âm thanh cảnh báo' : 'Tắt âm thanh'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-500" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VARIANT 2: BADGE (ULTRA-MINIMAL PILL)                                    */}
      {/* ========================================================================= */}
      {variant === 'badge' && (
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${colorStyles.badge} ${className}`}>
          <Clock className={`w-3.5 h-3.5 ${colorStyles.text}`} />
          <span className="font-mono font-black">{formatTime(timeLeft)}</span>
          {allowPause && (
            <button
              onClick={handleTogglePause}
              className="hover:opacity-80 cursor-pointer ml-1"
              title={effectivePaused ? 'Tiếp tục' : 'Tạm dừng'}
            >
              {effectivePaused ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3" />}
            </button>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VARIANT 3: WIDGET (SIDEBAR / FLOATING COMPACT CARD)                      */}
      {/* ========================================================================= */}
      {variant === 'widget' && (
        <div className={`rounded-3xl border p-4 backdrop-blur-md shadow-lg space-y-3.5 ${colorStyles.bg} ${className}`}>
          {/* Top Bar */}
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${colorStyles.badge}`}>
              {colorStyles.label}
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  const muted = soundManager.toggleMute();
                  setIsMuted(muted);
                }}
                className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title={isMuted ? 'Bật chuông' : 'Tắt chuông'}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Central Circular Gauge + Digits */}
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
              <svg className="w-14 h-14 -rotate-90 transform" viewBox="0 0 56 56">
                <circle
                  cx="28"
                  cy="28"
                  r={circleRadius}
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-white/10"
                />
                <circle
                  cx="28"
                  cy="28"
                  r={circleRadius}
                  fill="transparent"
                  stroke={colorStyles.gaugeStroke}
                  strokeWidth="4.5"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-500 ease-linear"
                />
              </svg>
              <span className="text-[10px] font-bold font-mono text-slate-300 absolute">
                {Math.round(percentage)}%
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Thời gian làm bài</span>
              <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${colorStyles.text}`}>
                {formatTime(timeLeft)}
              </span>
              <span className="text-[10px] text-slate-400 block">
                Đã dùng {Math.floor(elapsedSeconds / 60)} phút / {Math.floor(initialSeconds / 60)} phút
              </span>
            </div>
          </div>

          {/* Pace Tracker Mini Bar */}
          <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 text-[11px] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Tốc độ giải task:</span>
              <span className={`font-mono font-bold ${isBehindPace ? 'text-amber-400' : 'text-emerald-400'}`}>
                ~{secondsPerRemainingTask}s / task
              </span>
            </div>
            <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${colorStyles.gaugeStroke}`}
                style={{ width: `${percentage}%`, backgroundColor: colorStyles.gaugeStroke }}
              />
            </div>
          </div>

          {/* Controls */}
          {allowPause && (
            <button
              type="button"
              onClick={handleTogglePause}
              className={`w-full py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95 ${
                effectivePaused
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-400'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
              }`}
            >
              {effectivePaused ? (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Tiếp Tục Bài Thi</span>
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Tạm Dừng Bài Thi</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VARIANT 4: FULL (STANDALONE MOCK EXAM COMMAND CENTER)                     */}
      {/* ========================================================================= */}
      {variant === 'full' && (
        <div className={`rounded-3xl border p-6 sm:p-8 backdrop-blur-md shadow-2xl space-y-6 ${colorStyles.bg} ${className}`}>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-full border ${colorStyles.badge}`}>
                  {colorStyles.label}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Certiport Countdown Engine
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                {examTitle}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const muted = soundManager.toggleMute();
                  setIsMuted(muted);
                }}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border border-white/10"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                <span>{isMuted ? 'Đang Tắt Chuông' : 'Chuông Cảnh Báo Bật'}</span>
              </button>

              {allowPause && (
                <button
                  type="button"
                  onClick={handleTogglePause}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-md ${
                    effectivePaused
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                  }`}
                >
                  {effectivePaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
                  <span>{effectivePaused ? 'Tiếp Tục Thi' : 'Tạm Dừng'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Big Digital Display + Circular Visual */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-4">
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                Thời Gian Khảo Thí Còn Lại
              </span>
              <div className={`text-5xl sm:text-6xl lg:text-7xl font-mono font-black tracking-tight ${colorStyles.text} flex items-baseline gap-2`}>
                <span>{formatTime(timeLeft)}</span>
                <span className="text-sm sm:text-base font-normal text-slate-400">
                  / {Math.floor(initialSeconds / 60)}:00
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {urgencyLevel === 'critical' ? (
                  <span className="text-rose-400 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4 animate-bounce" />
                    Chú ý: Chỉ còn dưới 1 phút! Hãy kiểm tra và lưu lại toàn bộ các câu trả lời.
                  </span>
                ) : urgencyLevel === 'urgent' ? (
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <Flame className="w-4 h-4" />
                    Thời gian đang cạn dần (dưới 5 phút). Tăng tốc hoàn thành các câu còn trống.
                  </span>
                ) : (
                  <span>Phân bổ thời gian đều cho 5-7 Projects chuẩn đề thi Certiport.</span>
                )}
              </p>
            </div>

            {/* Large Progress Ring */}
            <div className="relative w-32 h-32 flex items-center justify-center shrink-0 self-center md:self-auto">
              <svg className="w-32 h-32 -rotate-90 transform" viewBox="0 0 56 56">
                <circle
                  cx="28"
                  cy="28"
                  r={circleRadius}
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  className="text-white/10"
                />
                <circle
                  cx="28"
                  cy="28"
                  r={circleRadius}
                  fill="transparent"
                  stroke={colorStyles.gaugeStroke}
                  strokeWidth="4"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-500 ease-linear"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-lg font-black font-mono text-white">
                  {Math.round(percentage)}%
                </span>
                <span className="text-[10px] text-slate-400">thời gian</span>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs">
              <span className="text-slate-400 text-[10px] block">Tasks Đã Hoàn Thành</span>
              <strong className="text-base text-white font-mono font-bold">
                {completedTasks} / {totalTasks}
              </strong>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs">
              <span className="text-slate-400 text-[10px] block">Thời Gian / Task Còn Lại</span>
              <strong className={`text-base font-mono font-bold ${isBehindPace ? 'text-amber-400' : 'text-emerald-400'}`}>
                ~{secondsPerRemainingTask} giây
              </strong>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs col-span-2 sm:col-span-1">
              <span className="text-slate-400 text-[10px] block">Áp Lực Phòng Thi</span>
              <strong className={`text-sm font-bold block ${colorStyles.text}`}>
                {urgencyLevel === 'critical' ? 'Rất Cao (100%)' : urgencyLevel === 'urgent' ? 'Cao (80%)' : 'Ổn Định (Trung bình)'}
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CERTIPORT SECURITY PAUSE MODAL OVERLAY                                    */}
      {/* (Obscures exam content to prevent cheating while timer is paused)         */}
      {/* ========================================================================= */}
      {showSecurityPauseModal && effectivePaused && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 text-center text-white shadow-2xl space-y-5">
            
            {/* Countdown to resume overlay if user clicked continue */}
            {resumingCountdown !== null ? (
              <div className="py-8 space-y-4">
                <span className="text-xs uppercase font-extrabold tracking-widest text-indigo-400">
                  Chuẩn bị tiếp tục làm bài
                </span>
                <div className="text-7xl sm:text-800 font-black text-amber-400 font-mono animate-ping">
                  {resumingCountdown}
                </div>
                <p className="text-xs text-slate-400">
                  Hãy tập trung vào màn hình làm bài...
                </p>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto shadow-inner">
                  <Lock className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Certiport Exam Security Protocol
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Bài Thi Đang Tạm Dừng
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Theo quy chuẩn khảo thí quốc tế Certiport, nội dung bài thi đã được tạm thời che lại để đảm bảo tính công bằng và minh bạch. Đồng hồ đếm ngược đã đóng băng ở mốc:
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 font-mono text-3xl font-black text-amber-400">
                  {formatTime(timeLeft)}
                </div>

                <div className="pt-2 flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playClick();
                      setResumingCountdown(3);
                    }}
                    className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm transition-all shadow-lg active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Tiếp Tục Bài Thi Ngay</span>
                  </button>

                  <span className="text-[11px] text-slate-500">
                    Thời gian sẽ tự động tiếp tục đếm ngược sau hiệu lệnh 3 giây.
                  </span>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </>
  );
};

export default ExamCountdownTimer;
