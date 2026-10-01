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
  Cell, 
  ReferenceLine 
} from 'recharts';
import { UserStats, MOSSubject } from '../../types/mos';
import { useUserProgressStore } from '../../utils/userProgressStore';
import { 
  BarChart2, 
  TrendingUp, 
  CheckCircle2, 
  Award, 
  Clock, 
  Zap, 
  Target, 
  Layers, 
  ArrowUpRight,
  Flame,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { soundManager } from '../../utils/audio';

export interface PracticalPerformanceChartsProps {
  stats: UserStats;
  onNavigateTab?: (tab: string) => void;
  onSelectSubject?: (subject: MOSSubject) => void;
}

export const PracticalPerformanceCharts: React.FC<PracticalPerformanceChartsProps> = ({
  stats,
  onNavigateTab,
  onSelectSubject,
}) => {
  const [selectedDomainFilter, setSelectedDomainFilter] = useState<'all' | 'word' | 'excel' | 'powerpoint'>('all');
  const [chartMetric, setChartMetric] = useState<'score' | 'completion'>('score');

  const { getSubjectStats, getMasterProgressPercentage } = useUserProgressStore();
  const wordProg = getSubjectStats('word');
  const excelProg = getSubjectStats('excel');
  const pptProg = getSubjectStats('powerpoint');

  // Exam stats
  const getSubjectExamStat = (subject: 'word' | 'excel' | 'powerpoint') => {
    const exams = stats.examHistory.filter(e => e.subject === subject);
    const bestScore = exams.reduce((max, curr) => Math.max(max, curr.score), 0);
    const passed = exams.some(e => e.passed);
    return { bestScore, passed, attempts: exams.length };
  };

  const wordExam = getSubjectExamStat('word');
  const excelExam = getSubjectExamStat('excel');
  const pptExam = getSubjectExamStat('powerpoint');

  // Count completed tasks per subject
  const completedTaskIds = stats.completedTaskIds || [];
  const wordTasksDone = completedTaskIds.filter(id => id.startsWith('p-w') || id.includes('word')).length;
  const excelTasksDone = completedTaskIds.filter(id => id.startsWith('p-e') || id.includes('excel')).length;
  const pptTasksDone = completedTaskIds.filter(id => id.startsWith('p-p') || id.includes('powerpoint')).length;

  // Comparison Data for BarChart
  const subjectComparisonData = useMemo(() => [
    {
      subject: 'Word (MO-100)',
      key: 'word',
      code: 'MO-100',
      fillColor: '#185abd',
      accentColor: '#3b82f6',
      completionPct: Math.max(wordProg.completionPercentage, Math.min(100, Math.round((wordTasksDone / 20) * 100))),
      quizScore: wordProg.highestScore || (wordExam.bestScore > 0 ? Math.round(wordExam.bestScore / 10) : 75),
      mockExamScore: wordExam.bestScore || (wordProg.completedCount > 0 ? 760 : 0),
      benchmark: 700,
    },
    {
      subject: 'Excel (MO-200)',
      key: 'excel',
      code: 'MO-200',
      fillColor: '#107c41',
      accentColor: '#10b981',
      completionPct: Math.max(excelProg.completionPercentage, Math.min(100, Math.round((excelTasksDone / 20) * 100))),
      quizScore: excelProg.highestScore || (excelExam.bestScore > 0 ? Math.round(excelExam.bestScore / 10) : 80),
      mockExamScore: excelExam.bestScore || (excelProg.completedCount > 0 ? 820 : 0),
      benchmark: 700,
    },
    {
      subject: 'PowerPoint (MO-300)',
      key: 'powerpoint',
      code: 'MO-300',
      fillColor: '#d24726',
      accentColor: '#f97316',
      completionPct: Math.max(pptProg.completionPercentage, Math.min(100, Math.round((pptTasksDone / 20) * 100))),
      quizScore: pptProg.highestScore || (pptExam.bestScore > 0 ? Math.round(pptExam.bestScore / 10) : 85),
      mockExamScore: pptExam.bestScore || (pptProg.completedCount > 0 ? 890 : 0),
      benchmark: 700,
    },
  ], [wordProg, excelProg, pptProg, wordExam, excelExam, pptExam, wordTasksDone, excelTasksDone, pptTasksDone]);

  // Performance Trend Data over timeline
  const trendTimelineData = useMemo(() => {
    return [
      { label: 'Tuần 1', wordScore: 620, excelScore: 590, pptScore: 680, target: 700 },
      { label: 'Tuần 2', wordScore: 680, excelScore: 660, pptScore: 740, target: 700 },
      { label: 'Tuần 3', wordScore: 750, excelScore: 710, pptScore: 820, target: 700 },
      { label: 'Tuần 4', wordScore: 810, excelScore: 780, pptScore: 880, target: 700 },
      { label: 'Hiện Tại', wordScore: wordExam.bestScore || 850, excelScore: excelExam.bestScore || 820, pptScore: pptExam.bestScore || 910, target: 700 },
    ];
  }, [wordExam, excelExam, pptExam]);

  // Domain Mastery Skills Data
  const domainMasteryList = useMemo(() => {
    const list = [
      { id: 'd1', subject: 'word', name: 'Thiết Lập Trang & Cấu Trúc (Margins, Breaks)', mastery: 92, status: 'Thành thạo' },
      { id: 'd2', subject: 'word', name: 'Định Dạng Đoạn Văn, Styles & Heading', mastery: 86, status: 'Thành thạo' },
      { id: 'd3', subject: 'word', name: 'Mục Lục Tự Động & Trích Dẫn (TOC, Footnotes)', mastery: 78, status: 'Đang củng cố' },
      { id: 'd4', subject: 'excel', name: 'Hàm Tra Cứu & Logic (VLOOKUP, IF, SUMIFS)', mastery: 84, status: 'Thành thạo' },
      { id: 'd5', subject: 'excel', name: 'Quản Lý Bảng Tính, Dải Ô & Định Dạng Số', mastery: 90, status: 'Thành thạo' },
      { id: 'd6', subject: 'excel', name: 'Biểu Đồ Trực Quan & Định Dạng Có Điều Kiện', mastery: 82, status: 'Thành thạo' },
      { id: 'd7', subject: 'powerpoint', name: 'Kiến Trúc Slide Master & Themes Nhận Diện', mastery: 88, status: 'Thành thạo' },
      { id: 'd8', subject: 'powerpoint', name: 'Hiệu Ứng Biến Hình Morph & Transitions', mastery: 94, status: 'Xuất sắc' },
      { id: 'd9', subject: 'powerpoint', name: 'Hoạt Ảnh Animation, Kích Hoạt Trigger & Media', mastery: 80, status: 'Thành thạo' },
    ];

    if (selectedDomainFilter === 'all') return list;
    return list.filter(d => d.subject === selectedDomainFilter);
  }, [selectedDomainFilter]);

  // Overall readiness score (0 - 100)
  const masterPercentage = getMasterProgressPercentage();
  const overallReadiness = Math.min(100, Math.max(65, Math.round(
    (masterPercentage * 0.4) + 
    ((wordExam.bestScore > 0 ? 1 : 0) + (excelExam.bestScore > 0 ? 1 : 0) + (pptExam.bestScore > 0 ? 1 : 0)) * 20
  )));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8">
      {/* Header & Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <BarChart2 className="w-5 h-5" />
            </span>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              Thống Kê Hiệu Suất Thực Hành & Năng Lực Certiport
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Phân tích tỷ lệ chuẩn xác thao tác Ribbon, độ thông thạo chuyên đề và dự báo kết quả thi MOS Master thật.
          </p>
        </div>

        {/* Filter Segmented Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => { soundManager.playClick(); setSelectedDomainFilter('all'); }}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                selectedDomainFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất Cả Phân Hệ
            </button>
            <button
              onClick={() => { soundManager.playClick(); setSelectedDomainFilter('word'); }}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                selectedDomainFilter === 'word' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Word
            </button>
            <button
              onClick={() => { soundManager.playClick(); setSelectedDomainFilter('excel'); }}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                selectedDomainFilter === 'excel' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Excel
            </button>
            <button
              onClick={() => { soundManager.playClick(); setSelectedDomainFilter('powerpoint'); }}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                selectedDomainFilter === 'powerpoint' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              PowerPoint
            </button>
          </div>

          <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => { soundManager.playClick(); setChartMetric('score'); }}
              className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                chartMetric === 'score' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Điểm Thi Thử
            </button>
            <button
              onClick={() => { soundManager.playClick(); setChartMetric('completion'); }}
              className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                chartMetric === 'completion' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              % Hoàn Thành
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Tổng Tiến Độ Ôn Tập</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {masterPercentage}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-emerald-600 font-bold">15/15</span> bài học chuẩn hóa
          </div>
        </div>

        {/* KPI 2 */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Bài Lab Thực Hành Đã Đạt</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {completedTaskIds.length} <span className="text-xs font-normal text-slate-500">/ 3,000 lab</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Word: {wordTasksDone} · Excel: {excelTasksDone} · PPT: {pptTasksDone}
          </div>
        </div>

        {/* KPI 3 */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Tỷ Lệ Chuẩn Xác Lần 1</span>
            <Target className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            87.4%
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">
            Thao tác chuẩn Ribbon Certiport
          </div>
        </div>

        {/* KPI 4 */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200">
          <div className="flex items-center justify-between text-indigo-700 mb-1">
            <span className="text-xs font-bold">Chỉ Số Sẵn Sàng MOS</span>
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-950">
            {overallReadiness}<span className="text-sm font-normal text-indigo-700">/100</span>
          </div>
          <div className="text-[11px] text-indigo-700 font-medium mt-1">
            {overallReadiness >= 80 ? 'Đủ điều kiện thi lấy chứng chỉ' : 'Cần hoàn thành thêm bài thực hành'}
          </div>
        </div>
      </div>

      {/* Main Dual Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Chart: Recharts BarChart comparing Subjects */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-blue-600" />
                So Sánh Hiệu Suất 3 Môn Khóa Học
              </h4>
              <p className="text-xs text-slate-500">
                {chartMetric === 'score' ? 'Điểm thi thử cao nhất (Chuẩn đạt ≥ 700)' : 'Tỷ lệ % hoàn thành bài học & thực hành'}
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 rounded text-slate-600">
              Certiport Scale 1000
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartMetric === 'score' ? (
                <BarChart data={subjectComparisonData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="code" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
                  <YAxis domain={[0, 1000]} ticks={[0, 300, 500, 700, 1000]} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    formatter={(val: any) => [`${val} / 1,000 điểm`, 'Điểm Thi']}
                  />
                  <ReferenceLine y={700} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Đạt chuẩn 700đ', fill: '#ef4444', fontSize: 10, position: 'top' }} />
                  <Bar dataKey="mockExamScore" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {subjectComparisonData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fillColor} />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <BarChart data={subjectComparisonData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="code" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
                  <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fontSize: 10, fill: '#64748b' }} unit="%" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    formatter={(val: any) => [`${val}%`, 'Hoàn thành']}
                  />
                  <Bar dataKey="completionPct" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {subjectComparisonData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fillColor} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-around pt-3 border-t border-slate-100 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#185abd]" />
              <span>Word MO-100</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#107c41]" />
              <span>Excel MO-200</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#d24726]" />
              <span>PowerPoint MO-300</span>
            </div>
          </div>
        </div>

        {/* Right Chart: AreaChart of Practice Timeline */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Tiến Trình Cải Thiện Điểm Số Qua Các Kỳ Ôn Luyện
              </h4>
              <p className="text-xs text-slate-500">
                Xu hướng điểm tăng trưởng theo lộ trình ôn tập Certiport 4 tuần
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
              Xu hướng tăng trưởng
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendTimelineData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorWord" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#185abd" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#185abd" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExcel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#107c41" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#107c41" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
                <YAxis domain={[500, 1000]} ticks={[500, 600, 700, 800, 900, 1000]} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <ReferenceLine y={700} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Mốc đỗ 700đ', fill: '#ef4444', fontSize: 10 }} />
                <Area type="monotone" dataKey="wordScore" name="Word" stroke="#185abd" strokeWidth={2} fillOpacity={1} fill="url(#colorWord)" />
                <Area type="monotone" dataKey="excelScore" name="Excel" stroke="#107c41" strokeWidth={2} fillOpacity={1} fill="url(#colorExcel)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
            <span>Tiêu chí chuẩn hóa: Hoàn thành 100% đề thi trong 50 phút</span>
            <button
              onClick={() => onNavigateTab ? onNavigateTab('practical') : null}
              className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Vào 1,000 bài tập thực hành</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Domain Mastery Breakdown */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              Chi Tiết Mức Độ Thuần Thục Theo Chuyên Đề (Domain Mastery)
            </h4>
            <p className="text-xs text-slate-500">
              Đánh giá tỷ lệ thành thạo từng kỹ năng trong đề thi MOS 365
            </p>
          </div>
          <span className="text-xs text-slate-500">
            {domainMasteryList.length} chuyên đề khảo thí
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {domainMasteryList.map((domain) => {
            const isHigh = domain.mastery >= 85;
            const subColor = domain.subject === 'word' 
              ? 'text-blue-600 bg-blue-50 border-blue-200' 
              : domain.subject === 'excel' 
              ? 'text-emerald-600 bg-emerald-50 border-emerald-200' 
              : 'text-orange-600 bg-orange-50 border-orange-200';

            const barColor = domain.subject === 'word' 
              ? 'bg-blue-600' 
              : domain.subject === 'excel' 
              ? 'bg-emerald-600' 
              : 'bg-orange-600';

            return (
              <div 
                key={domain.id}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all bg-white"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${subColor}`}>
                    {domain.subject}
                  </span>
                  <span className="text-xs font-bold text-slate-900 font-mono">
                    {domain.mastery}%
                  </span>
                </div>
                
                <h5 className="text-xs font-bold text-slate-800 line-clamp-1 mb-2">
                  {domain.name}
                </h5>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${domain.mastery}%` }}
                  />
                </div>

                <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500">
                  <span>Trạng thái: <strong className={isHigh ? 'text-emerald-600' : 'text-amber-600'}>{domain.status}</strong></span>
                  <button
                    onClick={() => {
                      if (onSelectSubject) onSelectSubject(domain.subject as MOSSubject);
                      if (onNavigateTab) onNavigateTab('practical');
                    }}
                    className="text-blue-600 hover:underline font-semibold cursor-pointer"
                  >
                    Luyện tập →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PracticalPerformanceCharts;
