import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid, 
  Cell, 
  PieChart, 
  Pie, 
  RadarChart, 
  Radar, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis 
} from 'recharts';
import { useUserProgressStore, MOSSubjectTrack, CURRICULUM_LESSONS } from '../utils/userProgressStore';
import { useAuthStore } from '../utils/userStore';
import { useGoogleSheetsStore } from '../utils/googleSheetsStore';
import { GoogleSheetsBackupModal } from './GoogleSheetsBackupModal';
import { 
  BarChart3, 
  Award, 
  CheckCircle2, 
  TrendingUp, 
  Sparkles, 
  Database, 
  FileText, 
  FileSpreadsheet, 
  Presentation, 
  RefreshCw,
  Clock,
  Layers,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';

export const ProgressDashboard: React.FC = () => {
  const [isSheetsModalOpen, setIsSheetsModalOpen] = React.useState(false);
  const { isConnected: isSheetsConnected, spreadsheetUrl } = useGoogleSheetsStore();

  const { 
    word, 
    excel, 
    powerpoint, 
    getSubjectStats, 
    getMasterProgressPercentage, 
    getTotalCompletedLessonsCount,
    lastSyncedAt,
    syncWithFirestore
  } = useUserProgressStore();

  const { fullName, role } = useAuthStore();

  const wordStats = getSubjectStats('word');
  const excelStats = getSubjectStats('excel');
  const pptStats = getSubjectStats('powerpoint');

  const masterPct = getMasterProgressPercentage();
  const totalCompleted = getTotalCompletedLessonsCount();
  const totalPossible = 
    CURRICULUM_LESSONS.word.length + 
    CURRICULUM_LESSONS.excel.length + 
    CURRICULUM_LESSONS.powerpoint.length;

  // Data for BarChart: Completion % vs Quiz Performance
  const barChartData = [
    {
      subject: 'Word (MO-100)',
      completionPct: wordStats.completionPercentage,
      highestQuiz: wordStats.highestScore,
      avgQuiz: wordStats.averageQuizPercentage,
      color: '#2563eb', // blue
    },
    {
      subject: 'Excel (MO-200)',
      completionPct: excelStats.completionPercentage,
      highestQuiz: excelStats.highestScore,
      avgQuiz: excelStats.averageQuizPercentage,
      color: '#059669', // emerald
    },
    {
      subject: 'PowerPoint (MO-300)',
      completionPct: pptStats.completionPercentage,
      highestQuiz: pptStats.highestScore,
      avgQuiz: pptStats.averageQuizPercentage,
      color: '#ea580c', // orange
    },
  ];

  // Data for PieChart: Completed lessons breakdown
  const pieChartData = [
    { name: 'Word', value: wordStats.completedCount, color: '#2563eb' },
    { name: 'Excel', value: excelStats.completedCount, color: '#059669' },
    { name: 'PowerPoint', value: pptStats.completedCount, color: '#ea580c' },
  ].filter(d => d.value > 0);

  // If no lessons completed yet, show placeholder distribution
  const displayPieData = pieChartData.length > 0 
    ? pieChartData 
    : [
        { name: 'Word Chưa Học', value: 5, color: '#93c5fd' },
        { name: 'Excel Chưa Học', value: 5, color: '#a7f3d0' },
        { name: 'PowerPoint Chưa Học', value: 5, color: '#fed7aa' },
      ];

  // Data for RadarChart: Competency Balance
  const radarData = [
    { area: 'Word Layout & Styles', score: Math.max(20, wordStats.completionPercentage) },
    { area: 'Word TOC & Refs', score: Math.max(15, wordStats.highestScore || 20) },
    { area: 'Excel Functions', score: Math.max(20, excelStats.completionPercentage) },
    { area: 'Excel Data & Charts', score: Math.max(15, excelStats.highestScore || 20) },
    { area: 'PPT Slide Master', score: Math.max(20, pptStats.completionPercentage) },
    { area: 'PPT Animations', score: Math.max(15, pptStats.highestScore || 20) },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Metrics Overview */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
                Dữ Liệu Trực Quan Recharts
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <Database className="w-3.5 h-3.5" />
                UserProgressStore & Firestore Sync
              </span>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Báo Cáo Tiến Độ & Năng Lực Học Tập MOS
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
              Biểu đồ trực quan hóa tỷ lệ hoàn thành các chuyên đề bài học và điểm số bài thi trắc nghiệm trên cả 3 lộ trình Word (MO-100), Excel (MO-200), và PowerPoint (MO-300).
            </p>
          </div>

          {/* Sync Trigger button - ONLY for Teachers and Owner/Admin */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {(role === 'admin' || role === 'teacher') && (
              <>
                <button
                  onClick={() => setIsSheetsModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Quản trị Bảng Tính Google Sheets (Chỉ Giáo viên & Chủ sở hữu)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isSheetsConnected ? 'Google Sheets (Quản Trị)' : 'Sao Lưu Google Sheets'}</span>
                </button>

                {spreadsheetUrl && (
                  <a
                    href={spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                    title="Mở bảng tính Google Sheets trong tab mới (Chỉ dành cho GV / Chủ sở hữu)"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    <span className="hidden sm:inline">Mở Sheet</span>
                  </a>
                )}
              </>
            )}

            <button
              onClick={() => syncWithFirestore()}
              className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Đồng Bộ Cloud</span>
            </button>
          </div>
        </div>

        {/* Key KPI Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-500 block">Tiến độ MOS Master</span>
            <strong className="text-2xl font-extrabold text-blue-600 mt-1 block">
              {masterPct}%
            </strong>
            <span className="text-[11px] text-slate-400">Mục tiêu: 100% 3 môn</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-500 block">Bài học hoàn thành</span>
            <strong className="text-2xl font-extrabold text-slate-900 mt-1 block">
              {totalCompleted} / {totalPossible}
            </strong>
            <span className="text-[11px] text-emerald-600 font-semibold">5 bài/chuyên đề</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-500 block">Điểm Quiz cao nhất</span>
            <strong className="text-2xl font-extrabold text-emerald-600 mt-1 block">
              {Math.max(wordStats.highestScore, excelStats.highestScore, pptStats.highestScore)}%
            </strong>
            <span className="text-[11px] text-slate-400">Chuẩn đỗ: ≥ 70%</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-500 block">Trạng thái Cloud</span>
            <strong className="text-sm font-bold text-slate-800 mt-2 block flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Đã kết nối Firestore
            </strong>
            <span className="text-[11px] text-slate-400 truncate block mt-0.5">
              {lastSyncedAt ? `Vừa cập nhật` : 'Lưu trữ cục bộ & đám mây'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recharts Chart 1: BarChart Completion & Quiz Percentage */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  Tỷ Lệ Hoàn Thành & Điểm Quiz Theo Môn
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  So sánh tỷ lệ % hoàn thành bài học và điểm trắc nghiệm cao nhất
                </p>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="subject" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                  <Tooltip 
                    formatter={(value: any, name: any) => [
                      `${value}%`, 
                      name === 'completionPct' ? 'Tiến độ hoàn thành' : 'Quiz cao nhất'
                    ]}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Legend 
                    formatter={(value) => value === 'completionPct' ? 'Tỷ Lệ Hoàn Thành (%)' : 'Điểm Quiz Cao Nhất (%)'}
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  />
                  <Bar dataKey="completionPct" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={28} />
                  <Bar dataKey="highestQuiz" fill="#10b981" radius={[6, 6, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Tiêu chuẩn Certiport MOS</span>
            <strong className="text-slate-700">Điểm đạt chuẩn: ≥ 70%</strong>
          </div>
        </div>

        {/* Recharts Chart 2: RadarChart Skill Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Cân Bằng Năng Lực 6 Trọng Tâm (Skill Radar)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Đánh giá độ đồng đều giữa các kỹ năng Word, Excel và PowerPoint
                </p>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="area" tick={{ fill: '#475569', fontSize: 10, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#cbd5e1" tick={{ fontSize: 9 }} />
                  <Radar 
                    name="Năng lực học viên" 
                    dataKey="score" 
                    stroke="#6366f1" 
                    fill="#818cf8" 
                    fillOpacity={0.45} 
                  />
                  <Tooltip 
                    formatter={(val: any) => [`${val}%`, 'Độ thành thạo']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Mức độ hoàn thiện:</span>
            <strong className="text-indigo-600 font-bold">{masterPct >= 70 ? 'Toàn diện cao' : 'Đang trong quá trình rèn luyện'}</strong>
          </div>
        </div>
      </div>

      {/* Subject Detailed Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Word Detail Card */}
        <div className="bg-white rounded-2xl border-2 border-blue-100 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Word (MO-100)</h4>
                <span className="text-[11px] text-blue-600 font-semibold">Associate Path</span>
              </div>
            </div>
            <span className="text-base font-extrabold text-blue-700">
              {wordStats.completionPercentage}%
            </span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${wordStats.completionPercentage}%` }}
            />
          </div>

          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Bài học đã xong:</span>
              <strong className="text-slate-800">{wordStats.completedCount}/5 bài</strong>
            </div>
            <div className="flex justify-between">
              <span>Điểm Quiz cao nhất:</span>
              <strong className="text-blue-700">{wordStats.highestScore > 0 ? `${wordStats.highestScore}%` : 'Chưa thi'}</strong>
            </div>
            <div className="flex justify-between">
              <span>Số lần kiểm tra:</span>
              <strong className="text-slate-800">{wordStats.quizzesTaken} lần</strong>
            </div>
          </div>
        </div>

        {/* Excel Detail Card */}
        <div className="bg-white rounded-2xl border-2 border-emerald-100 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Excel (MO-200)</h4>
                <span className="text-[11px] text-emerald-600 font-semibold">Associate Path</span>
              </div>
            </div>
            <span className="text-base font-extrabold text-emerald-700">
              {excelStats.completionPercentage}%
            </span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-emerald-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${excelStats.completionPercentage}%` }}
            />
          </div>

          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Bài học đã xong:</span>
              <strong className="text-slate-800">{excelStats.completedCount}/5 bài</strong>
            </div>
            <div className="flex justify-between">
              <span>Điểm Quiz cao nhất:</span>
              <strong className="text-emerald-700">{excelStats.highestScore > 0 ? `${excelStats.highestScore}%` : 'Chưa thi'}</strong>
            </div>
            <div className="flex justify-between">
              <span>Số lần kiểm tra:</span>
              <strong className="text-slate-800">{excelStats.quizzesTaken} lần</strong>
            </div>
          </div>
        </div>

        {/* PowerPoint Detail Card */}
        <div className="bg-white rounded-2xl border-2 border-orange-100 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-xs">
                <Presentation className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">PowerPoint (MO-300)</h4>
                <span className="text-[11px] text-orange-600 font-semibold">Associate Path</span>
              </div>
            </div>
            <span className="text-base font-extrabold text-orange-700">
              {pptStats.completionPercentage}%
            </span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-orange-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${pptStats.completionPercentage}%` }}
            />
          </div>

          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Bài học đã xong:</span>
              <strong className="text-slate-800">{pptStats.completedCount}/5 bài</strong>
            </div>
            <div className="flex justify-between">
              <span>Điểm Quiz cao nhất:</span>
              <strong className="text-orange-700">{pptStats.highestScore > 0 ? `${pptStats.highestScore}%` : 'Chưa thi'}</strong>
            </div>
            <div className="flex justify-between">
              <span>Số lần kiểm tra:</span>
              <strong className="text-slate-800">{pptStats.quizzesTaken} lần</strong>
            </div>
          </div>
        </div>

      </div>

      {/* Google Sheets Backup & Synchronization Modal */}
      <GoogleSheetsBackupModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
      />
    </div>
  );
};

export default ProgressDashboard;
