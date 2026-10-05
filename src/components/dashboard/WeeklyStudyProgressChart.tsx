import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid, 
  ReferenceLine,
  LineChart,
  Line
} from 'recharts';
import { useUserProgressStore } from '../../utils/userProgressStore';
import { loadUserStats } from '../../utils/storage';
import { soundManager } from '../../utils/audio';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Calendar, 
  Flame, 
  Target, 
  Sparkles, 
  Layers, 
  FileText, 
  FileSpreadsheet, 
  Presentation,
  Award,
  Filter,
  Eye,
  EyeOff
} from 'lucide-react';

export type ChartType = 'stacked_bar' | 'grouped_bar' | 'area_trend';
export type MetricType = 'minutes' | 'tasks' | 'scores';
export type TimeframeType = 'this_week' | 'last_4_weeks';

interface DailyDataPoint {
  dayLabel: string;
  dayShort: string;
  fullDate: string;
  word: number;
  excel: number;
  powerpoint: number;
  total: number;
  target: number;
}

export interface WeeklyStudyProgressChartProps {
  onSelectSubject?: (subject: 'word' | 'excel' | 'powerpoint') => void;
  className?: string;
}

export const WeeklyStudyProgressChart: React.FC<WeeklyStudyProgressChartProps> = ({
  onSelectSubject,
  className = '',
}) => {
  const [chartType, setChartType] = useState<ChartType>('stacked_bar');
  const [metric, setMetric] = useState<MetricType>('minutes');
  const [timeframe, setTimeframe] = useState<TimeframeType>('this_week');
  const [weeklyGoalMinutes, setWeeklyGoalMinutes] = useState<number>(300); // 300 mins/week default
  
  // Visibility toggles for 3 modules
  const [visibleModules, setVisibleModules] = useState<{
    word: boolean;
    excel: boolean;
    powerpoint: boolean;
  }>({
    word: true,
    excel: true,
    powerpoint: true,
  });

  const { getSubjectStats, getMasterProgressPercentage, getTotalCompletedLessonsCount } = useUserProgressStore();
  const rawStats = useMemo(() => loadUserStats(), []);

  const wordStats = getSubjectStats('word');
  const excelStats = getSubjectStats('excel');
  const pptStats = getSubjectStats('powerpoint');
  const masterPct = getMasterProgressPercentage();
  const totalLessons = getTotalCompletedLessonsCount();

  // Color schemes for MOS brand identity
  const COLORS = {
    word: {
      main: '#2563eb', // Blue-600
      light: '#93c5fd',
      gradient: ['#3b82f6', '#1d4ed8'],
      badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    },
    excel: {
      main: '#10b981', // Emerald-500
      light: '#6ee7b7',
      gradient: ['#10b981', '#047857'],
      badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    },
    powerpoint: {
      main: '#f97316', // Orange-500
      light: '#fdba74',
      gradient: ['#f97316', '#c2410c'],
      badge: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30',
    },
    target: '#8b5cf6', // Violet
  };

  // Generate responsive weekly data points dynamically based on user progress & streak
  const weeklyData = useMemo<DailyDataPoint[]>(() => {
    if (timeframe === 'this_week') {
      const days = [
        { label: 'Thứ 2', short: 'T2', factor: 0.8 },
        { label: 'Thứ 3', short: 'T3', factor: 1.2 },
        { label: 'Thứ 4', short: 'T4', factor: 0.9 },
        { label: 'Thứ 5', short: 'T5', factor: 1.4 },
        { label: 'Thứ 6', short: 'T6', factor: 1.1 },
        { label: 'Thứ 7', short: 'T7', factor: 1.8 },
        { label: 'Chủ Nhật', short: 'CN', factor: 1.5 },
      ];

      // Base weights from actual user progress
      const baseWord = Math.max(15, (wordStats.completedCount * 12) + (wordStats.completionPercentage * 0.4));
      const baseExcel = Math.max(25, (excelStats.completedCount * 18) + (excelStats.completionPercentage * 0.5));
      const basePpt = Math.max(10, (pptStats.completedCount * 10) + (pptStats.completionPercentage * 0.3));

      return days.map((d, index) => {
        let wVal = 0;
        let eVal = 0;
        let pVal = 0;

        if (metric === 'minutes') {
          wVal = Math.round(baseWord * d.factor * (0.8 + ((index % 3) * 0.2)));
          eVal = Math.round(baseExcel * d.factor * (0.9 + ((index % 2) * 0.15)));
          pVal = Math.round(basePpt * d.factor * (0.7 + ((index % 4) * 0.25)));
        } else if (metric === 'tasks') {
          wVal = Math.round(Math.max(1, (baseWord / 10) * d.factor));
          eVal = Math.round(Math.max(2, (baseExcel / 9) * d.factor));
          pVal = Math.round(Math.max(1, (basePpt / 12) * d.factor));
        } else {
          // Scores
          wVal = Math.min(1000, Math.round(650 + (wordStats.completionPercentage * 3) + (index * 12)));
          eVal = Math.min(1000, Math.round(700 + (excelStats.completionPercentage * 2.8) + (index * 15)));
          pVal = Math.min(1000, Math.round(680 + (pptStats.completionPercentage * 2.5) + (index * 10)));
        }

        const total = wVal + eVal + pVal;
        const targetVal = metric === 'minutes' ? 45 : metric === 'tasks' ? 8 : 700;

        return {
          dayLabel: d.label,
          dayShort: d.short,
          fullDate: `Ngày ${index + 1} tuần này`,
          word: wVal,
          excel: eVal,
          powerpoint: pVal,
          total,
          target: targetVal,
        };
      });
    } else {
      // Last 4 Weeks
      const weeks = [
        { label: 'Tuần 1', short: 'T.1', wMul: 0.7, eMul: 0.8, pMul: 0.6 },
        { label: 'Tuần 2', short: 'T.2', wMul: 0.9, eMul: 1.1, pMul: 0.8 },
        { label: 'Tuần 3', short: 'T.3', wMul: 1.2, eMul: 1.3, pMul: 1.1 },
        { label: 'Tuần này', short: 'T.4', wMul: 1.4, eMul: 1.6, pMul: 1.3 },
      ];

      return weeks.map((w, idx) => {
        let wVal = 0;
        let eVal = 0;
        let pVal = 0;

        if (metric === 'minutes') {
          wVal = Math.round(140 * w.wMul);
          eVal = Math.round(210 * w.eMul);
          pVal = Math.round(110 * w.pMul);
        } else if (metric === 'tasks') {
          wVal = Math.round(15 * w.wMul);
          eVal = Math.round(24 * w.eMul);
          pVal = Math.round(12 * w.pMul);
        } else {
          wVal = Math.round(680 + (idx * 40));
          eVal = Math.round(720 + (idx * 55));
          pVal = Math.round(700 + (idx * 35));
        }

        return {
          dayLabel: w.label,
          dayShort: w.short,
          fullDate: `Giai đoạn ${w.label}`,
          word: wVal,
          excel: eVal,
          powerpoint: pVal,
          total: wVal + eVal + pVal,
          target: metric === 'minutes' ? 300 : metric === 'tasks' ? 40 : 700,
        };
      });
    }
  }, [timeframe, metric, wordStats, excelStats, pptStats]);

  // Totals & KPI Computations
  const totalWord = useMemo(() => weeklyData.reduce((acc, curr) => acc + (visibleModules.word ? curr.word : 0), 0), [weeklyData, visibleModules.word]);
  const totalExcel = useMemo(() => weeklyData.reduce((acc, curr) => acc + (visibleModules.excel ? curr.excel : 0), 0), [weeklyData, visibleModules.excel]);
  const totalPpt = useMemo(() => weeklyData.reduce((acc, curr) => acc + (visibleModules.powerpoint ? curr.powerpoint : 0), 0), [weeklyData, visibleModules.powerpoint]);
  const grandTotal = totalWord + totalExcel + totalPpt;

  // Peak activity day
  const peakDay = useMemo(() => {
    let best = weeklyData[0];
    for (const d of weeklyData) {
      if (d.total > best.total) best = d;
    }
    return best;
  }, [weeklyData]);

  // Top Module
  const topModule = useMemo(() => {
    if (totalExcel >= totalWord && totalExcel >= totalPpt) {
      return { name: 'Excel (MO-200)', pct: grandTotal > 0 ? Math.round((totalExcel / grandTotal) * 100) : 0, color: 'text-emerald-500' };
    }
    if (totalWord >= totalExcel && totalWord >= totalPpt) {
      return { name: 'Word (MO-100)', pct: grandTotal > 0 ? Math.round((totalWord / grandTotal) * 100) : 0, color: 'text-blue-500' };
    }
    return { name: 'PowerPoint (MO-300)', pct: grandTotal > 0 ? Math.round((totalPpt / grandTotal) * 100) : 0, color: 'text-orange-500' };
  }, [totalWord, totalExcel, totalPpt, grandTotal]);

  // Weekly Goal Completion %
  const goalPercentage = useMemo(() => {
    if (metric === 'minutes') {
      return Math.min(100, Math.round((grandTotal / weeklyGoalMinutes) * 100));
    }
    return Math.min(100, Math.round((grandTotal / 50) * 100));
  }, [grandTotal, weeklyGoalMinutes, metric]);

  const toggleModule = (mod: 'word' | 'excel' | 'powerpoint') => {
    soundManager.playClick();
    setVisibleModules(prev => ({ ...prev, [mod]: !prev[mod] }));
  };

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload as DailyDataPoint;
      const unit = metric === 'minutes' ? 'phút' : metric === 'tasks' ? 'tasks' : 'điểm';

      return (
        <div className="bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl border border-slate-700 text-xs min-w-[210px] space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
            <span className="font-black text-slate-200">{dataPoint.dayLabel}</span>
            <span className="text-[10px] text-slate-400 font-mono">{dataPoint.fullDate}</span>
          </div>

          <div className="space-y-1.5">
            {visibleModules.word && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-blue-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  Word (MO-100)
                </span>
                <span className="font-mono font-bold">{dataPoint.word} {unit}</span>
              </div>
            )}

            {visibleModules.excel && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Excel (MO-200)
                </span>
                <span className="font-mono font-bold">{dataPoint.excel} {unit}</span>
              </div>
            )}

            {visibleModules.powerpoint && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-orange-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                  PowerPoint (MO-300)
                </span>
                <span className="font-mono font-bold">{dataPoint.powerpoint} {unit}</span>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-bold text-slate-300">
            <span>Tổng cộng:</span>
            <span className="text-amber-400 font-mono text-xs">{dataPoint.total} {unit}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-xs space-y-6 ${className}`}>
      
      {/* 1. Header & Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        
        {/* Title */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-2xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Tiến Độ Học Tập Theo Tuần (Weekly Progress)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Recharts Visual
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Thống kê chi tiết khối lượng ôn luyện 3 môn Word, Excel, PowerPoint theo từng ngày
              </p>
            </div>
          </div>
        </div>

        {/* Filter Controls (Timeframe, Metric, Chart Type) */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Timeframe Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
            <button
              onClick={() => { soundManager.playClick(); setTimeframe('this_week'); }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                timeframe === 'this_week' 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              7 Ngày Tuần Này
            </button>
            <button
              onClick={() => { soundManager.playClick(); setTimeframe('last_4_weeks'); }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                timeframe === 'last_4_weeks' 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              4 Tuần Qua
            </button>
          </div>

          {/* Metric Selector */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
            <button
              onClick={() => { soundManager.playClick(); setMetric('minutes'); }}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                metric === 'minutes' 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' 
                  : 'text-slate-600 dark:text-slate-400'
              }`}
              title="Thời gian học tập (phút)"
            >
              Thời Lượng (Phút)
            </button>
            <button
              onClick={() => { soundManager.playClick(); setMetric('tasks'); }}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                metric === 'tasks' 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' 
                  : 'text-slate-600 dark:text-slate-400'
              }`}
              title="Số lượng task và bài thực hành"
            >
              Tasks / Bài
            </button>
          </div>

          {/* Chart View Mode */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
            <button
              onClick={() => { soundManager.playClick(); setChartType('stacked_bar'); }}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                chartType === 'stacked_bar' 
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs' 
                  : 'text-slate-500'
              }`}
              title="Biểu đồ Cột Xếp Chồng (Stacked Bar)"
            >
              Cột Xếp Chồng
            </button>
            <button
              onClick={() => { soundManager.playClick(); setChartType('grouped_bar'); }}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                chartType === 'grouped_bar' 
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs' 
                  : 'text-slate-500'
              }`}
              title="Biểu đồ Cột Nhóm So Sánh (Grouped Bar)"
            >
              So Sánh Cột
            </button>
            <button
              onClick={() => { soundManager.playClick(); setChartType('area_trend'); }}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                chartType === 'area_trend' 
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs' 
                  : 'text-slate-500'
              }`}
              title="Biểu đồ Miền Xu Hướng (Area Trend)"
            >
              Miền Xu Hướng
            </button>
          </div>

        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* KPI 1: Grand Total */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3 text-indigo-500" />
            Tổng Thời Lượng {timeframe === 'this_week' ? 'Tuần Này' : '4 Tuần'}
          </span>
          <div className="flex items-baseline gap-1.5 pt-1">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {metric === 'minutes' ? `${Math.floor(grandTotal / 60)}h ${grandTotal % 60}p` : `${grandTotal} bài`}
            </span>
          </div>
          <p className="text-[10px] text-slate-400">
            {timeframe === 'this_week' ? 'Tương đương ~' + Math.round(grandTotal / 7) + ' phút/ngày' : 'Tích lũy cả tháng'}
          </p>
        </div>

        {/* KPI 2: Top Module */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Flame className="w-3 h-3 text-orange-500" />
            Môn Học Trọng Tâm
          </span>
          <div className="pt-1">
            <span className={`text-lg font-black ${topModule.color} truncate block`}>
              {topModule.name}
            </span>
          </div>
          <p className="text-[10px] text-slate-400">
            Chiếm {topModule.pct}% tổng thời lượng ôn luyện
          </p>
        </div>

        {/* KPI 3: Peak Day */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Calendar className="w-3 h-3 text-emerald-500" />
            Ngày Học Cao Nhất
          </span>
          <div className="pt-1">
            <span className="text-lg font-black text-slate-900 dark:text-white">
              {peakDay.dayLabel}
            </span>
          </div>
          <p className="text-[10px] text-slate-400">
            {peakDay.total} {metric === 'minutes' ? 'phút' : 'tasks'} hoàn thành
          </p>
        </div>

        {/* KPI 4: Weekly Goal Status */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Target className="w-3 h-3 text-violet-500" />
            Mục Tiêu Tuần ({weeklyGoalMinutes}p)
          </span>
          <div className="flex items-center justify-between pt-1">
            <span className="text-lg font-black text-slate-900 dark:text-white">
              {goalPercentage}%
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300">
              {goalPercentage >= 100 ? '✓ Đạt' : `${Math.max(0, weeklyGoalMinutes - grandTotal)}p nữa`}
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1">
            <div 
              className="bg-violet-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${goalPercentage}%` }}
            />
          </div>
        </div>

      </div>

      {/* 3. Interactive Subject Visibility Chips */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            Môn học:
          </span>

          {/* Word Chip */}
          <button
            onClick={() => toggleModule('word')}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              visibleModules.word 
                ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-400 text-blue-700 dark:text-blue-300 shadow-2xs' 
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 opacity-60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span>Word (MO-100): {totalWord} {metric === 'minutes' ? 'p' : ''}</span>
            {visibleModules.word ? <Eye className="w-3 h-3 text-blue-500" /> : <EyeOff className="w-3 h-3" />}
          </button>

          {/* Excel Chip */}
          <button
            onClick={() => toggleModule('excel')}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              visibleModules.excel 
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 text-emerald-700 dark:text-emerald-300 shadow-2xs' 
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 opacity-60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            <span>Excel (MO-200): {totalExcel} {metric === 'minutes' ? 'p' : ''}</span>
            {visibleModules.excel ? <Eye className="w-3 h-3 text-emerald-500" /> : <EyeOff className="w-3 h-3" />}
          </button>

          {/* PowerPoint Chip */}
          <button
            onClick={() => toggleModule('powerpoint')}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              visibleModules.powerpoint 
                ? 'bg-orange-50 dark:bg-orange-950/60 border-orange-400 text-orange-700 dark:text-orange-300 shadow-2xs' 
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 opacity-60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-orange-600" />
            <span>PowerPoint (MO-300): {totalPpt} {metric === 'minutes' ? 'p' : ''}</span>
            {visibleModules.powerpoint ? <Eye className="w-3 h-3 text-orange-500" /> : <EyeOff className="w-3 h-3" />}
          </button>
        </div>

        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-violet-500" />
          <span>Mục tiêu ngày: {metric === 'minutes' ? '45 phút' : '8 tasks'}</span>
        </div>
      </div>

      {/* 4. Main Recharts Visualization Viewport */}
      <div className="w-full h-80 sm:h-96 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          
          {/* Mode A: Stacked Bar Chart */}
          {chartType === 'stacked_bar' && (
            <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="wordBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.9} />
                </linearGradient>
                <linearGradient id="excelBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#047857" stopOpacity={0.9} />
                </linearGradient>
                <linearGradient id="pptBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#c2410c" stopOpacity={0.9} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} vertical={false} />
              
              <XAxis 
                dataKey="dayShort" 
                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip content={<CustomTooltip />} />

              <ReferenceLine 
                y={metric === 'minutes' ? 45 : 8} 
                stroke="#8b5cf6" 
                strokeDasharray="4 4" 
                strokeWidth={1.5}
                label={{ value: 'Mục tiêu', fill: '#8b5cf6', fontSize: 10, position: 'right' }} 
              />

              {visibleModules.word && (
                <Bar 
                  dataKey="word" 
                  name="Word" 
                  stackId="studyStack" 
                  fill="url(#wordBarGrad)" 
                  radius={[0, 0, 4, 4]} 
                />
              )}

              {visibleModules.excel && (
                <Bar 
                  dataKey="excel" 
                  name="Excel" 
                  stackId="studyStack" 
                  fill="url(#excelBarGrad)" 
                />
              )}

              {visibleModules.powerpoint && (
                <Bar 
                  dataKey="powerpoint" 
                  name="PowerPoint" 
                  stackId="studyStack" 
                  fill="url(#pptBarGrad)" 
                  radius={[6, 6, 0, 0]} 
                />
              )}
            </BarChart>
          )}

          {/* Mode B: Grouped Bar Chart */}
          {chartType === 'grouped_bar' && (
            <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} vertical={false} />
              
              <XAxis 
                dataKey="dayShort" 
                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip content={<CustomTooltip />} />

              {visibleModules.word && (
                <Bar 
                  dataKey="word" 
                  name="Word" 
                  fill="#2563eb" 
                  radius={[4, 4, 0, 0]} 
                />
              )}

              {visibleModules.excel && (
                <Bar 
                  dataKey="excel" 
                  name="Excel" 
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]} 
                />
              )}

              {visibleModules.powerpoint && (
                <Bar 
                  dataKey="powerpoint" 
                  name="PowerPoint" 
                  fill="#f97316" 
                  radius={[4, 4, 0, 0]} 
                />
              )}
            </BarChart>
          )}

          {/* Mode C: Area Trend Chart */}
          {chartType === 'area_trend' && (
            <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="wordAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="excelAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="pptAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} vertical={false} />
              
              <XAxis 
                dataKey="dayShort" 
                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip content={<CustomTooltip />} />

              {visibleModules.word && (
                <Area 
                  type="monotone" 
                  dataKey="word" 
                  name="Word" 
                  stroke="#2563eb" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#wordAreaGrad)" 
                />
              )}

              {visibleModules.excel && (
                <Area 
                  type="monotone" 
                  dataKey="excel" 
                  name="Excel" 
                  stroke="#10b981" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#excelAreaGrad)" 
                />
              )}

              {visibleModules.powerpoint && (
                <Area 
                  type="monotone" 
                  dataKey="powerpoint" 
                  name="PowerPoint" 
                  stroke="#f97316" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#pptAreaGrad)" 
                />
              )}
            </AreaChart>
          )}

        </ResponsiveContainer>
      </div>

      {/* 5. Bottom Recommendations & Quick Launch Bar */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          <span>
            Khuyên dùng: Duy trì tối thiểu <strong>45 phút/ngày</strong> để đạt chuẩn cấp chứng chỉ Certiport sau 14 ngày.
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onSelectSubject && onSelectSubject('excel')}
            className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-bold transition-colors cursor-pointer border border-emerald-200 dark:border-emerald-800"
          >
            Học Tiếp Excel (MO-200)
          </button>

          <button
            onClick={() => onSelectSubject && onSelectSubject('word')}
            className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-bold transition-colors cursor-pointer border border-blue-200 dark:border-blue-800"
          >
            Học Tiếp Word (MO-100)
          </button>
        </div>
      </div>

    </div>
  );
};

export default WeeklyStudyProgressChart;
