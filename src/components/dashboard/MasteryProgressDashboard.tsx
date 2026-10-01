import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell
} from 'recharts';
import {
  masteryClientService,
  MasteryDashboardData,
  SubjectMastery
} from '../../services/masteryService';
import { useAuthStore } from '../../utils/userStore';
import { soundManager } from '../../utils/audio';
import {
  Award,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  FileSpreadsheet,
  FileText,
  Presentation,
  RefreshCw,
  Play,
  Zap,
  Target,
  ShieldCheck,
  Flame,
  ArrowRight,
  Database,
  Star,
  Info,
  Layers,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface MasteryProgressDashboardProps {
  onStartExam?: (subject?: 'word' | 'excel' | 'powerpoint') => void;
  onNavigateTab?: (tab: string) => void;
}

export const MasteryProgressDashboard: React.FC<MasteryProgressDashboardProps> = ({
  onStartExam,
  onNavigateTab
}) => {
  const navigate = useNavigate();
  const { user, fullName } = useAuthStore();
  const studentId = user?.id || 'current-user';
  const studentName = fullName || user?.name || user?.fullName || 'Học viên';

  const [data, setData] = useState<MasteryDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubjectTab, setSelectedSubjectTab] = useState<'all' | 'word' | 'excel' | 'powerpoint'>('all');
  const [activeChartType, setActiveChartType] = useState<'radar' | 'trend' | 'domains'>('radar');

  const loadData = async (force = false) => {
    setLoading(true);
    try {
      const res = await masteryClientService.fetchMasteryProgress(studentId, studentName, force);
      setData(res);
    } catch (err) {
      console.warn('Failed to load mastery data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [studentId, studentName]);

  const handleRefresh = () => {
    soundManager.playClick();
    loadData(true);
  };

  const handleStartExamCTA = (subject: 'word' | 'excel' | 'powerpoint') => {
    soundManager.playClick();
    if (onStartExam) {
      onStartExam(subject);
    } else {
      navigate(`/thi-thu?subject=${subject}`);
    }
  };

  // Recharts custom tooltip for AreaChart (Score Trend)
  const CustomScoreTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1.5 text-white">
          <div className="font-bold text-amber-400 border-b border-slate-800 pb-1 flex items-center justify-between gap-4">
            <span>{label}</span>
            <span className="text-[10px] text-slate-400 font-normal">Thang điểm 1000đ</span>
          </div>
          {payload.map((entry: any, index: number) => {
            const isBenchmark = entry.name === 'Chuẩn Đạt Certiport';
            return (
              <div key={index} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-slate-300 font-medium">{entry.name}:</span>
                </span>
                <span className={`font-mono font-bold ${isBenchmark ? 'text-amber-400' : 'text-white'}`}>
                  {entry.value} {isBenchmark ? 'đ' : '/ 1000đ'}
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  // Recharts custom tooltip for RadarChart
  const CustomRadarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0]?.payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1 text-white">
          <div className="font-bold text-white border-b border-slate-800 pb-1">
            {dataPoint.domain}
          </div>
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between gap-4 text-blue-300">
              <span>Word (MO-100):</span>
              <strong className="font-mono">{dataPoint.word}%</strong>
            </div>
            <div className="flex items-center justify-between gap-4 text-emerald-300">
              <span>Excel (MO-200):</span>
              <strong className="font-mono">{dataPoint.excel}%</strong>
            </div>
            <div className="flex items-center justify-between gap-4 text-orange-300">
              <span>PowerPoint (MO-300):</span>
              <strong className="font-mono">{dataPoint.powerpoint}%</strong>
            </div>
            <div className="flex items-center justify-between gap-4 text-amber-400 pt-1 border-t border-slate-800 font-semibold">
              <span>Ngưỡng chuẩn Certiport:</span>
              <span className="font-mono">70%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (!data && loading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
          Đang truy xuất chỉ số năng lực 3 môn từ CSDL...
        </p>
      </div>
    );
  }

  if (!data) return null;

  const { subjects, radarCompetency, scoreTrend, masterStatus, overallMasteryPct } = data;

  return (
    <div className="space-y-5">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & DATABASE SYNC STATUS */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-lg border border-indigo-900/60 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-400/40">
                RECHARTS ANALYTICS ENGINE
              </span>

              {/* Database indicator */}
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                <Database className="w-3 h-3" />
                <span>CSDL: {data.databaseSource === 'postgresql' ? 'PostgreSQL Live' : 'Bộ Lưu Trữ MOS'}</span>
              </span>

              {/* Master MOS status */}
              {masterStatus === 'qualified' ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center gap-1 animate-pulse">
                  <Award className="w-3 h-3 fill-amber-400" />
                  <span>ĐỦ ĐIỀU KIỆN MOS MASTER</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  <span>Tiến trình Master: {overallMasteryPct}%</span>
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2 mt-1">
              <span>Bảng Phân Tích Năng Lực & Làm Chủ 3 Môn MOS</span>
            </h2>

            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Biểu đồ trực quan hóa trình độ kỹ năng học viên trên Word, Excel, PowerPoint dựa trên lịch sử làm bài, chấm file tự động và các miền chuẩn Certiport quốc tế.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Tải lại số liệu mới nhất từ CSDL"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Cập Nhật CSDL</span>
            </button>

            <button
              onClick={() => handleStartExamCTA(data.weakestSubject.toLowerCase().includes('word') ? 'word' : data.weakestSubject.toLowerCase().includes('powerpoint') ? 'powerpoint' : 'excel')}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Rèn Luyện Ngay</span>
            </button>
          </div>
        </div>

        {/* Quick Recommendation Alert */}
        <div className="mt-4 pt-3 border-t border-indigo-900/60 flex items-center gap-2 text-xs text-indigo-200">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{data.recommendedAction}</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. 3-SUBJECT MASTERY CARDS (WORD, EXCEL, POWERPOINT) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Word Card */}
        <div
          onClick={() => {
            soundManager.playClick();
            setSelectedSubjectTab(selectedSubjectTab === 'word' ? 'all' : 'word');
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedSubjectTab === 'word'
              ? 'bg-blue-50/90 dark:bg-blue-950/50 border-blue-400 dark:border-blue-600 shadow-md ring-2 ring-blue-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  {subjects.word.code}
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">MOS Word</h3>
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                {subjects.word.masteryPercentage}%
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                subjects.word.passedCount > 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-600'
              }`}>
                {subjects.word.passedCount > 0 ? '✓ Đạt Chuẩn' : 'Đang Rèn'}
              </span>
            </div>
          </div>

          <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex justify-between">
              <span>Điểm cao nhất:</span>
              <strong className="text-slate-800 dark:text-slate-200 font-mono">{subjects.word.bestScore}/1000đ</strong>
            </div>
            <div className="flex justify-between">
              <span>Số lượt thi / bài nộp:</span>
              <span className="text-slate-800 dark:text-slate-200 font-mono">{subjects.word.totalAttempts} lần</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${subjects.word.masteryPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Excel Card */}
        <div
          onClick={() => {
            soundManager.playClick();
            setSelectedSubjectTab(selectedSubjectTab === 'excel' ? 'all' : 'excel');
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedSubjectTab === 'excel'
              ? 'bg-emerald-50/90 dark:bg-emerald-950/50 border-emerald-400 dark:border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  {subjects.excel.code}
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">MOS Excel</h3>
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {subjects.excel.masteryPercentage}%
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                subjects.excel.passedCount > 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-600'
              }`}>
                {subjects.excel.passedCount > 0 ? '✓ Đạt Chuẩn' : 'Đang Rèn'}
              </span>
            </div>
          </div>

          <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex justify-between">
              <span>Điểm cao nhất:</span>
              <strong className="text-slate-800 dark:text-slate-200 font-mono">{subjects.excel.bestScore}/1000đ</strong>
            </div>
            <div className="flex justify-between">
              <span>Số lượt thi / bài nộp:</span>
              <span className="text-slate-800 dark:text-slate-200 font-mono">{subjects.excel.totalAttempts} lần</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${subjects.excel.masteryPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* PowerPoint Card */}
        <div
          onClick={() => {
            soundManager.playClick();
            setSelectedSubjectTab(selectedSubjectTab === 'powerpoint' ? 'all' : 'powerpoint');
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedSubjectTab === 'powerpoint'
              ? 'bg-orange-50/90 dark:bg-orange-950/50 border-orange-400 dark:border-orange-600 shadow-md ring-2 ring-orange-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-orange-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-xs">
                <Presentation className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300">
                  {subjects.powerpoint.code}
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">MOS PowerPoint</h3>
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-black text-orange-600 dark:text-orange-400">
                {subjects.powerpoint.masteryPercentage}%
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                subjects.powerpoint.passedCount > 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-600'
              }`}>
                {subjects.powerpoint.passedCount > 0 ? '✓ Đạt Chuẩn' : 'Đang Rèn'}
              </span>
            </div>
          </div>

          <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex justify-between">
              <span>Điểm cao nhất:</span>
              <strong className="text-slate-800 dark:text-slate-200 font-mono">{subjects.powerpoint.bestScore}/1000đ</strong>
            </div>
            <div className="flex justify-between">
              <span>Số lượt thi / bài nộp:</span>
              <span className="text-slate-800 dark:text-slate-200 font-mono">{subjects.powerpoint.totalAttempts} lần</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
              <div
                className="bg-orange-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${subjects.powerpoint.masteryPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. RECHARTS VISUALIZATION CONTAINER */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        {/* Navigation Bar between Chart Views */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Phân Tích Chi Tiết Qua Recharts
            </h3>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => {
                soundManager.playClick();
                setActiveChartType('radar');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeChartType === 'radar'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              1. Radar 5 Miền Năng Lực
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                setActiveChartType('trend');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeChartType === 'trend'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              2. Tiến Độ Điểm Số (Timeline)
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                setActiveChartType('domains');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeChartType === 'domains'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              3. Cột Kỹ Năng Từng Môn
            </button>
          </div>
        </div>

        {/* CHART 1: RECHARTS RADARCHART */}
        {activeChartType === 'radar' && (
          <div className="space-y-3">
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>So sánh mức độ thành thạo 5 nhóm kỹ năng chính giữa Word, Excel, PowerPoint với mốc 70% chuẩn quốc tế.</span>
              <span className="font-semibold text-amber-500 flex items-center gap-1">
                <Target className="w-3.5 h-3.5" /> Mốc đạt: 70%
              </span>
            </div>

            <div className="w-full h-80 sm:h-96">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarCompetency} cx="50%" cy="50%" outerRadius="80%">
                  <PolarGrid stroke="#94a3b8" strokeDasharray="3 3" opacity={0.3} />
                  <PolarAngleAxis
                    dataKey="shortName"
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    stroke="#94a3b8"
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                  />
                  <Tooltip content={<CustomRadarTooltip />} />
                  <Legend
                    wrapperStyle={{ paddingTop: '10px', fontSize: '12px', fontWeight: 'bold' }}
                  />

                  {/* Word Radar Polygon */}
                  {(selectedSubjectTab === 'all' || selectedSubjectTab === 'word') && (
                    <Radar
                      name="Word (MO-100)"
                      dataKey="word"
                      stroke="#2563eb"
                      fill="#2563eb"
                      fillOpacity={0.3}
                    />
                  )}

                  {/* Excel Radar Polygon */}
                  {(selectedSubjectTab === 'all' || selectedSubjectTab === 'excel') && (
                    <Radar
                      name="Excel (MO-200)"
                      dataKey="excel"
                      stroke="#059669"
                      fill="#059669"
                      fillOpacity={0.3}
                    />
                  )}

                  {/* PowerPoint Radar Polygon */}
                  {(selectedSubjectTab === 'all' || selectedSubjectTab === 'powerpoint') && (
                    <Radar
                      name="PowerPoint (MO-300)"
                      dataKey="powerpoint"
                      stroke="#ea580c"
                      fill="#ea580c"
                      fillOpacity={0.3}
                    />
                  )}

                  {/* Certiport 70% Passing Benchmark */}
                  <Radar
                    name="Chuẩn Đạt Certiport (70%)"
                    dataKey="benchmark"
                    stroke="#f59e0b"
                    fill="transparent"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* CHART 2: RECHARTS AREACHART / LINECHART (SCORE TIMELINE) */}
        {activeChartType === 'trend' && (
          <div className="space-y-3">
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Đường cong tiến bộ điểm số các lần thi thử mô phỏng (Thang điểm 1000, ngưỡng đạt Certiport là 700đ).</span>
              <span className="font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Chuẩn Đạt: 700 / 1000đ
              </span>
            </div>

            <div className="w-full h-80 sm:h-96">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={scoreTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorWord" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExcel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPpt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ea580c" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis domain={[500, 1000]} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip content={<CustomScoreTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px', fontWeight: 'bold' }} />

                  {/* Benchmark 700 Reference Line */}
                  <ReferenceLine
                    y={700}
                    label={{ value: 'Mốc 700đ Đạt Chứng Chỉ', fill: '#d97706', fontSize: 11, fontWeight: 'bold', position: 'insideTopLeft' }}
                    stroke="#f59e0b"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                  />

                  {/* Word Area */}
                  {(selectedSubjectTab === 'all' || selectedSubjectTab === 'word') && (
                    <Area
                      type="monotone"
                      name="Word (MO-100)"
                      dataKey="word"
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorWord)"
                    />
                  )}

                  {/* Excel Area */}
                  {(selectedSubjectTab === 'all' || selectedSubjectTab === 'excel') && (
                    <Area
                      type="monotone"
                      name="Excel (MO-200)"
                      dataKey="excel"
                      stroke="#059669"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorExcel)"
                    />
                  )}

                  {/* PowerPoint Area */}
                  {(selectedSubjectTab === 'all' || selectedSubjectTab === 'powerpoint') && (
                    <Area
                      type="monotone"
                      name="PowerPoint (MO-300)"
                      dataKey="powerpoint"
                      stroke="#ea580c"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorPpt)"
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* CHART 3: RECHARTS BARCHART (DOMAIN ACCURACY COMPARISON) */}
        {activeChartType === 'domains' && (
          <div className="space-y-3">
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Độ chính xác % theo từng miền chuyên môn được khảo thí trong ngân hàng đề thi.</span>
              <span className="font-semibold text-slate-600 dark:text-slate-400">
                Hiển thị: <strong className="text-indigo-600">{selectedSubjectTab === 'all' ? 'Cả 3 Môn' : selectedSubjectTab.toUpperCase()}</strong>
              </span>
            </div>

            <div className="w-full h-80 sm:h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={radarCompetency} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                  <XAxis dataKey="shortName" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip
                    formatter={(val: any) => [`${val}%`, 'Mức độ làm chủ']}
                    contentStyle={{ borderRadius: '12px', backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px', fontWeight: 'bold' }} />

                  <ReferenceLine y={70} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Chuẩn 70%', fill: '#f59e0b', fontSize: 10 }} />

                  {(selectedSubjectTab === 'all' || selectedSubjectTab === 'word') && (
                    <Bar name="Word (MO-100)" dataKey="word" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  )}
                  {(selectedSubjectTab === 'all' || selectedSubjectTab === 'excel') && (
                    <Bar name="Excel (MO-200)" dataKey="excel" fill="#059669" radius={[6, 6, 0, 0]} />
                  )}
                  {(selectedSubjectTab === 'all' || selectedSubjectTab === 'powerpoint') && (
                    <Bar name="PowerPoint (MO-300)" dataKey="powerpoint" fill="#ea580c" radius={[6, 6, 0, 0]} />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. DOMAIN SKILLS TABLE & RECOMMENDATIONS */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Chi Tiết Miền Kỹ Năng ({selectedSubjectTab === 'all' ? 'Tất cả 3 môn' : subjects[selectedSubjectTab].name})
            </h4>
          </div>

          <div className="text-xs text-slate-500">
            Dữ liệu tính từ bài nộp CSDL và mô phỏng thực hành
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {(selectedSubjectTab === 'all' 
            ? [...subjects.excel.domains.map(d => ({ ...d, sub: 'Excel' })), ...subjects.word.domains.map(d => ({ ...d, sub: 'Word' }))]
            : subjects[selectedSubjectTab].domains.map(d => ({ ...d, sub: subjects[selectedSubjectTab].code }))
          ).slice(0, 8).map((domain, index) => (
            <div key={index} className="py-2.5 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                  {domain.sub} · {domain.domainCode}
                </span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{domain.name}</span>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="w-24 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden hidden sm:block">
                  <div
                    className={`h-full rounded-full ${
                      domain.scorePct >= 70 ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${domain.scorePct}%` }}
                  />
                </div>

                <strong className={`font-mono text-xs ${
                  domain.scorePct >= 70 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                }`}>
                  {domain.scorePct}%
                </strong>

                <span className={`px-2 py-0.2 rounded-md text-[10px] font-bold ${
                  domain.scorePct >= 70
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {domain.scorePct >= 70 ? 'Đạt chuẩn' : 'Cần rèn thêm'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MasteryProgressDashboard;
