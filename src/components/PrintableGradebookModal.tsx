import React, { useState } from 'react';
import { Submission, UserProfile } from '../types/user';
import { soundManager } from '../utils/audio';
import { 
  Printer, 
  Download, 
  FileText, 
  X, 
  Award, 
  CheckCircle2, 
  ShieldCheck, 
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react';

interface PrintableGradebookModalProps {
  submissions: Submission[];
  currentUser: UserProfile;
  activeSubject: string;
  activeClass: string;
  onClose: () => void;
}

export const PrintableGradebookModal: React.FC<PrintableGradebookModalProps> = ({
  submissions,
  currentUser,
  activeSubject,
  activeClass,
  onClose,
}) => {
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [includeFeedback, setIncludeFeedback] = useState(true);
  const [includeKPI, setIncludeKPI] = useState(true);
  const [includeSignature, setIncludeSignature] = useState(true);

  const currentSubjectCode = activeSubject !== 'all' ? activeSubject : (currentUser.targetSubject || 'word');
  const subjectDisplayName = currentSubjectCode === 'word'
    ? 'MOS Word 365/2019 (MO-100)'
    : currentSubjectCode === 'excel'
    ? 'MOS Excel 365/2019 (MO-200)'
    : currentSubjectCode === 'powerpoint'
    ? 'MOS PowerPoint 365/2019 (MO-300)'
    : `MOS ${currentSubjectCode.toUpperCase()}`;

  // Filter submissions
  const filteredSubmissions = submissions.filter(s => {
    if (activeSubject !== 'all' && s.subject !== activeSubject) return false;
    if (activeClass !== 'all' && s.classRoom !== activeClass) return false;
    return true;
  });

  // Group by student
  const studentMap = new Map<string, {
    studentCode: string;
    studentName: string;
    classRoom: string;
    submissions: Submission[];
  }>();

  for (const sub of filteredSubmissions) {
    const key = sub.studentCode || sub.studentName;
    if (!studentMap.has(key)) {
      studentMap.set(key, {
        studentCode: sub.studentCode || 'N/A',
        studentName: sub.studentName,
        classRoom: sub.classRoom || 'N/A',
        submissions: [],
      });
    }
    studentMap.get(key)!.submissions.push(sub);
  }

  const studentList = Array.from(studentMap.values()).map(st => {
    const sList = st.submissions;
    const scores = sList.map(s => s.score);
    const highestScore = Math.max(...scores);
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / (scores.length || 1));
    const passed = highestScore >= 700;
    const sortedSubs = [...sList].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    const latestSub = sortedSubs[0];
    const latestFeedback = sortedSubs.find(s => !!s.teacherFeedback);

    let classification = 'Chưa Đạt';
    if (highestScore >= 950) classification = 'Xuất Sắc (Thủ Khoa)';
    else if (highestScore >= 900) classification = 'Xuất Sắc';
    else if (highestScore >= 800) classification = 'Giỏi';
    else if (highestScore >= 700) classification = 'Đạt Chuẩn Certiport';
    else if (highestScore >= 500) classification = 'Trung Bình';

    return {
      studentCode: st.studentCode,
      studentName: st.studentName,
      classRoom: st.classRoom,
      totalAttempts: sList.length,
      highestScore,
      avgScore,
      passed,
      classification,
      latestDate: latestSub ? new Date(latestSub.submittedAt).toLocaleDateString('vi-VN') : '',
      rating: latestFeedback?.teacherRating || 'none',
      feedback: latestFeedback?.teacherFeedback || ''
    };
  }).sort((a, b) => b.highestScore - a.highestScore);

  // KPIs
  const totalStudents = studentList.length;
  const passedCount = studentList.filter(s => s.passed).length;
  const passRate = totalStudents > 0 ? Math.round((passedCount / totalStudents) * 100) : 0;
  const avgScore = filteredSubmissions.length > 0
    ? Math.round(filteredSubmissions.reduce((a, b) => a + b.score, 0) / filteredSubmissions.length)
    : 0;
  const maxScore = filteredSubmissions.length > 0 ? Math.max(...filteredSubmissions.map(s => s.score)) : 0;

  const handlePrint = () => {
    soundManager.playClick();
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Print-specific style tag injected inside the component */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-gradebook-report, #printable-gradebook-report * {
            visibility: visible;
          }
          #printable-gradebook-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 10mm 12mm;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page {
            size: ${orientation === 'landscape' ? 'A4 landscape' : 'A4 portrait'};
            margin: 8mm 10mm;
          }
          .no-print-element {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-slate-100 rounded-2xl shadow-2xl border border-slate-300 max-w-6xl w-full max-h-[96vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* ========================================================
            MODAL ACTION BAR (Hidden on Print)
        ======================================================== */}
        <div className="no-print-element px-6 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md">
              <Printer className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Xem Trước Bản In & Xuất File PDF Chuẩn A4</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Chuẩn Văn Bản Báo Cáo
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Sử dụng lệnh In của trình duyệt (Ctrl+P) và chọn máy in hoặc mục "Save as PDF" (Lưu thành PDF).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Orientation Toggle */}
            <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700 text-xs">
              <button
                onClick={() => setOrientation('landscape')}
                className={`px-3 py-1 rounded font-bold transition-all ${
                  orientation === 'landscape' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Khổ Ngang (A4)
              </button>
              <button
                onClick={() => setOrientation('portrait')}
                className={`px-3 py-1 rounded font-bold transition-all ${
                  orientation === 'portrait' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Khổ Dọc (A4)
              </button>
            </div>

            {/* Print & Save PDF Button */}
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black transition-all shadow-md hover:shadow-lg flex items-center gap-2 ring-2 ring-emerald-400/40"
              title="Nhấn để mở hộp thoại in hoặc chọn Save as PDF để lưu file PDF chất lượng cao"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>IN / LƯU PDF NGAY</span>
            </button>

            {/* Close Button */}
            <button
              onClick={() => {
                soundManager.playClick();
                onClose();
              }}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors border border-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="no-print-element px-6 py-2.5 bg-slate-200/70 border-b border-slate-300 flex flex-wrap items-center justify-between text-xs text-slate-700 shrink-0">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-bold text-slate-600">Tùy biến hiển thị:</span>
            <label className="flex items-center gap-1.5 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={includeKPI}
                onChange={e => setIncludeKPI(e.target.checked)}
                className="rounded text-blue-600"
              />
              <span>Khối chỉ số KPI</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={includeFeedback}
                onChange={e => setIncludeFeedback(e.target.checked)}
                className="rounded text-blue-600"
              />
              <span>Cột nhận xét của GV</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={includeSignature}
                onChange={e => setIncludeSignature(e.target.checked)}
                className="rounded text-blue-600"
              />
              <span>Khu vực ký tên đóng dấu</span>
            </label>
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Mẹo: Trong hộp thoại in của trình duyệt, chọn <strong>Destination: Save as PDF</strong> để lưu file PDF.
          </div>
        </div>

        {/* ========================================================
            PRINTABLE DOCUMENT PREVIEW AREA (The Exact A4 Paper)
        ======================================================== */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex justify-center bg-slate-200/50">
          
          <div
            id="printable-gradebook-report"
            className={`bg-white text-slate-900 shadow-xl border border-slate-300 p-8 sm:p-12 transition-all ${
              orientation === 'landscape' ? 'w-full max-w-5xl' : 'w-full max-w-3xl'
            }`}
            style={{ minHeight: '800px' }}
          >
            {/* Header: State & Organization */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
              <div className="text-left space-y-0.5">
                <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  BỘ GIÁO DỤC VÀ ĐÀO TẠO · CERTIPORT TESTING CENTER
                </div>
                <div className="text-sm font-black text-slate-900 uppercase">
                  TRUNG TÂM KHẢO THÍ & ĐÀO TẠO MOS MASTER
                </div>
                <div className="text-[11px] text-slate-500">
                  Địa chỉ khảo thí chuẩn hóa quốc tế MO-100 / MO-200 / MO-300
                </div>
              </div>

              <div className="text-center space-y-0.5">
                <div className="text-xs font-black uppercase text-slate-900 tracking-wider">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </div>
                <div className="text-[11px] font-bold text-slate-800">
                  Độc lập - Tự do - Hạnh phúc
                </div>
                <div className="text-slate-400 text-[10px] tracking-widest">
                  ————————————
                </div>
              </div>
            </div>

            {/* Document Title Banner */}
            <div className="text-center space-y-1.5 mb-6">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
                BẢNG ĐIỂM TỔNG HỢP & BÁO CÁO KẾT QUẢ KHẢO THÍ HỌC VIÊN
              </h1>
              <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                CHỨNG CHỈ TIN HỌC VĂN PHÒNG QUỐC TẾ MICROSOFT OFFICE SPECIALIST
              </div>
              <div className="text-[11px] text-slate-500 italic">
                (Ban hành kèm theo quy chế đào tạo và khảo thí định kỳ)
              </div>
            </div>

            {/* Metadata Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs mb-6">
              <div>
                <span className="text-slate-500 text-[11px] block">Môn Khảo Thí:</span>
                <strong className="text-slate-900 font-bold uppercase">{subjectDisplayName}</strong>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Giảng Viên Phụ Trách:</span>
                <strong className="text-slate-900 font-bold">{currentUser.name}</strong>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Lớp Học Áp Dụng:</span>
                <strong className="text-slate-900 font-bold">{activeClass === 'all' ? 'Toàn bộ các lớp' : `Lớp ${activeClass}`}</strong>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Thời Điểm Lập Báo Cáo:</span>
                <strong className="text-slate-900 font-bold">{new Date().toLocaleString('vi-VN')}</strong>
              </div>
            </div>

            {/* KPI Cards (Optional on print) */}
            {includeKPI && (
              <div className="grid grid-cols-4 gap-3 mb-6 text-center text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Tổng Số Học Viên</div>
                  <div className="text-xl font-black text-slate-900 mt-0.5">{totalStudents}</div>
                  <div className="text-[10px] text-slate-400">Tham gia học & thi</div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-[10px] text-emerald-700 font-bold uppercase">Số Học Viên Đạt Chuẩn</div>
                  <div className="text-xl font-black text-emerald-600 mt-0.5">{passedCount}</div>
                  <div className="text-[10px] text-emerald-700 font-semibold">{passRate}% Đạt (&ge; 700đ)</div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-[10px] text-blue-700 font-bold uppercase">Điểm Trung Bình Toàn Môn</div>
                  <div className="text-xl font-black text-blue-700 mt-0.5">{avgScore} / 1000</div>
                  <div className="text-[10px] text-blue-600 font-semibold">Điểm Max: {maxScore}</div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-[10px] text-slate-700 font-bold uppercase">Tổng Lượt Nộp Khảo Thí</div>
                  <div className="text-xl font-black text-slate-900 mt-0.5">{filteredSubmissions.length}</div>
                  <div className="text-[10px] text-slate-500">Thi thử & thực hành</div>
                </div>
              </div>
            )}

            {/* Official Student Gradebook Table */}
            <div className="border border-slate-300 rounded-lg overflow-hidden mb-6">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-800 text-white font-bold border-b border-slate-300 text-center">
                    <th className="py-2.5 px-2 w-10 border-r border-slate-700">STT</th>
                    <th className="py-2.5 px-2.5 text-left border-r border-slate-700">Mã Sinh Viên</th>
                    <th className="py-2.5 px-3 text-left border-r border-slate-700">Họ Và Tên Học Viên</th>
                    <th className="py-2.5 px-2 border-r border-slate-700">Lớp</th>
                    <th className="py-2.5 px-2 border-r border-slate-700">Lượt Thi</th>
                    <th className="py-2.5 px-2 border-r border-slate-700">Điểm Max</th>
                    <th className="py-2.5 px-2 border-r border-slate-700">Điểm TB</th>
                    <th className="py-2.5 px-2.5 border-r border-slate-700">Kết Quả Chứng Chỉ</th>
                    <th className="py-2.5 px-2.5 border-r border-slate-700">Xếp Loại</th>
                    {includeFeedback && (
                      <th className="py-2.5 px-3 text-left">Đánh Giá & Nhận Xét Của GV</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {studentList.length === 0 ? (
                    <tr>
                      <td colSpan={includeFeedback ? 10 : 9} className="py-8 text-center text-slate-400">
                        Không có học viên nào trong danh sách.
                      </td>
                    </tr>
                  ) : (
                    studentList.map((st, idx) => (
                      <tr key={st.studentCode + idx} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                        <td className="py-2 px-2 text-center font-mono text-slate-500 border-r border-slate-200">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-2.5 font-mono font-bold text-slate-800 border-r border-slate-200">
                          {st.studentCode}
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-900 border-r border-slate-200">
                          {st.studentName}
                        </td>
                        <td className="py-2 px-2 text-center text-slate-600 border-r border-slate-200">
                          {st.classRoom}
                        </td>
                        <td className="py-2 px-2 text-center font-semibold border-r border-slate-200">
                          {st.totalAttempts}
                        </td>
                        <td className="py-2 px-2 text-center font-black text-slate-900 border-r border-slate-200">
                          {st.highestScore}
                        </td>
                        <td className="py-2 px-2 text-center font-bold text-slate-700 border-r border-slate-200">
                          {st.avgScore}
                        </td>
                        <td className="py-2 px-2.5 text-center border-r border-slate-200 font-bold">
                          {st.passed ? (
                            <span className="text-emerald-700">ĐẠT (PASS)</span>
                          ) : (
                            <span className="text-rose-700">CHƯA ĐẠT</span>
                          )}
                        </td>
                        <td className="py-2 px-2.5 text-center text-[11px] font-semibold text-slate-700 border-r border-slate-200">
                          {st.classification}
                        </td>
                        {includeFeedback && (
                          <td className="py-2 px-3 text-[11px] text-slate-600 max-w-[200px]">
                            {st.feedback ? (
                              <span>{st.feedback}</span>
                            ) : (
                              <span className="text-slate-400 italic">Đã đạt chuẩn bài thi</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Signature Area (Optional on print) */}
            {includeSignature && (
              <div className="grid grid-cols-2 pt-6 text-center text-xs mt-8 border-t border-slate-200">
                <div className="space-y-1">
                  <div className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">
                    NGƯỜI LẬP BÁO CÁO / GIẢNG VIÊN PHỤ TRÁCH
                  </div>
                  <div className="text-[10px] text-slate-400 italic">(Ký, ghi rõ họ tên)</div>
                  <div className="h-16 flex items-end justify-center font-bold text-sm text-slate-900">
                    {currentUser.name}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">
                    TRƯỞNG BAN KHẢO THÍ & ĐÀO TẠO MOS
                  </div>
                  <div className="text-[10px] text-slate-400 italic">(Ký, đóng dấu xác nhận)</div>
                  <div className="h-16 flex items-end justify-center font-bold text-sm text-slate-900">
                    TS. Hoàng Minh Trí
                  </div>
                </div>
              </div>
            )}

            {/* Footer Notice */}
            <div className="mt-8 pt-3 border-t border-slate-100 flex justify-between text-[10px] text-slate-400 italic">
              <span>Hệ thống khảo thí trực tuyến MOS Master</span>
              <span>Bảo mật nội bộ · In ngày {new Date().toLocaleDateString('vi-VN')}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
