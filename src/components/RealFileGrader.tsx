import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Award, 
  RefreshCw, 
  Layers, 
  FileCode, 
  ArrowRight,
  ShieldCheck,
  Send,
  HelpCircle
} from 'lucide-react';
import { UserProfile } from '../types/user';
import { sendSubmissionToTeacher } from '../utils/userStore';
import { soundManager } from '../utils/audio';

interface GraderTask {
  id: string;
  taskNumber: number;
  instruction: string;
  targetSheet: string;
  targetCell: string;
  expectedFormulaDesc: string;
  points: number;
  evaluate: (workbook: XLSX.WorkBook) => { passed: boolean; message: string; actualFormula?: string; actualValue?: any };
}

interface ProjectScenario {
  id: string;
  title: string;
  subject: 'excel' | 'word';
  description: string;
  totalPoints: number;
  createStarterWorkbook: () => XLSX.WorkBook;
  starterFileName: string;
  tasks: GraderTask[];
}

const MOS_PROJECTS: ProjectScenario[] = [
  {
    id: 'excel-proj-01',
    title: 'Dự Án 1: Bảng Kê Doanh Thu & Hàm Tính Toán Cơ Bản (SUM, AVERAGE, MAX)',
    subject: 'excel',
    description: 'Thực hành các kỹ năng MOS MO-200: Đổi tên trang tính, thiết lập công thức tính tổng SUM, trung bình AVERAGE và giá trị lớn nhất MAX.',
    starterFileName: 'MOS_Excel_Practice_Project_01.xlsx',
    totalPoints: 1000,
    createStarterWorkbook: () => {
      const wb = XLSX.utils.book_new();
      const wsData = [
        ['MÃ SP', 'TÊN SẢN PHẨM', 'SỐ LƯỢNG', 'ĐƠN GIÁ (VNĐ)', 'THÀNH TIỀN'],
        ['SP01', 'Màn hình Dell UltraSharp 24"', 15, 4500000, ''],
        ['SP02', 'Bàn phím cơ Logitech MX', 28, 2200000, ''],
        ['SP03', 'Chuột không dây Master 3S', 34, 1950000, ''],
        ['SP04', 'Tai nghe Sony WH-1000XM5', 12, 6900000, ''],
        ['SP05', 'Ổ cứng SSD Samsung 1TB', 40, 1800000, ''],
        ['SP06', 'Webcam Logitech Brio 4K', 18, 3500000, ''],
        ['', '', '', '', ''],
        ['', '', '', 'TỔNG DOANH THU:', ''],
        ['', '', '', 'DOANH THU TRUNG BÌNH:', ''],
        ['', '', '', 'DOANH THU CAO NHẤT:', ''],
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      return wb;
    },
    tasks: [
      {
        id: 't1',
        taskNumber: 1,
        instruction: 'Đổi tên trang tính "Sheet1" thành "DoanhThu_2026".',
        targetSheet: 'DoanhThu_2026',
        targetCell: 'N/A',
        expectedFormulaDesc: 'Tên sheet: DoanhThu_2026',
        points: 250,
        evaluate: (wb) => {
          const hasSheet = wb.SheetNames.includes('DoanhThu_2026');
          return {
            passed: hasSheet,
            message: hasSheet 
              ? 'Chính xác! Đã tìm thấy trang tính "DoanhThu_2026".' 
              : 'Chưa đạt! Tên trang tính vẫn là Sheet1 hoặc không đúng cú pháp "DoanhThu_2026".',
          };
        }
      },
      {
        id: 't2',
        taskNumber: 2,
        instruction: 'Tại ô E2, nhập công thức tính Thành tiền = Số lượng * Đơn giá (=C2*D2) và sao chép xuống các ô E3:E7.',
        targetSheet: 'DoanhThu_2026',
        targetCell: 'E2:E7',
        expectedFormulaDesc: '=C2*D2 hoặc =PRODUCT(C2,D2)',
        points: 250,
        evaluate: (wb) => {
          const sheetName = wb.SheetNames.includes('DoanhThu_2026') ? 'DoanhThu_2026' : wb.SheetNames[0];
          const ws = wb.Sheets[sheetName];
          if (!ws) return { passed: false, message: 'Không tìm thấy trang tính.' };

          const cellE2 = ws['E2'];
          if (!cellE2) return { passed: false, message: 'Ô E2 chưa có dữ liệu hoặc công thức.' };

          const formula = (cellE2.f || '').replace(/\s+/g, '').toUpperCase();
          const val = cellE2.v;
          const isFormulaCorrect = formula === '=C2*D2' || formula === '=D2*C2' || formula.includes('PRODUCT');
          const isValueCorrect = val === 67500000 || Number(val) === 67500000;

          return {
            passed: isFormulaCorrect || isValueCorrect,
            actualFormula: cellE2.f || 'Không có công thức (Nhập số tĩnh)',
            actualValue: cellE2.v,
            message: isFormulaCorrect 
              ? `Chính xác! Công thức [${cellE2.f}] cho kết quả ${cellE2.v?.toLocaleString()} VNĐ.` 
              : `Công thức ô E2 chưa chuẩn. Thực tế: [${cellE2.f || 'Trống'}]. Yêu cầu: =C2*D2`,
          };
        }
      },
      {
        id: 't3',
        taskNumber: 3,
        instruction: 'Tại ô E9, sử dụng hàm =SUM(E2:E7) để tính Tổng Doanh Thu của tất cả các sản phẩm.',
        targetSheet: 'DoanhThu_2026',
        targetCell: 'E9',
        expectedFormulaDesc: '=SUM(E2:E7)',
        points: 250,
        evaluate: (wb) => {
          const sheetName = wb.SheetNames.includes('DoanhThu_2026') ? 'DoanhThu_2026' : wb.SheetNames[0];
          const ws = wb.Sheets[sheetName];
          if (!ws) return { passed: false, message: 'Không tìm thấy trang tính.' };

          const cell = ws['E9'];
          if (!cell) return { passed: false, message: 'Ô E9 chưa có dữ liệu hoặc công thức.' };

          const formula = (cell.f || '').replace(/\s+/g, '').toUpperCase();
          const isSum = formula.includes('SUM(') && formula.includes('E2') && formula.includes('E7');

          return {
            passed: isSum || (cell.v && Number(cell.v) > 200000000),
            actualFormula: cell.f || 'Không dùng hàm SUM',
            actualValue: cell.v,
            message: isSum 
              ? `Chính xác! Hàm [${cell.f}] đã tính đúng tổng doanh thu.` 
              : `Chưa đúng! Thao tác MOS Certiport yêu cầu dùng hàm =SUM(E2:E7). Thực tế: [${cell.f || cell.v}]`,
          };
        }
      },
      {
        id: 't4',
        taskNumber: 4,
        instruction: 'Tại ô E10, sử dụng hàm =AVERAGE(E2:E7) để tính Doanh Thu Trung Bình.',
        targetSheet: 'DoanhThu_2026',
        targetCell: 'E10',
        expectedFormulaDesc: '=AVERAGE(E2:E7)',
        points: 250,
        evaluate: (wb) => {
          const sheetName = wb.SheetNames.includes('DoanhThu_2026') ? 'DoanhThu_2026' : wb.SheetNames[0];
          const ws = wb.Sheets[sheetName];
          if (!ws) return { passed: false, message: 'Không tìm thấy trang tính.' };

          const cell = ws['E10'];
          if (!cell) return { passed: false, message: 'Ô E10 chưa có dữ liệu hoặc công thức.' };

          const formula = (cell.f || '').replace(/\s+/g, '').toUpperCase();
          const isAvg = formula.includes('AVERAGE(') && formula.includes('E2') && formula.includes('E7');

          return {
            passed: isAvg,
            actualFormula: cell.f || 'Không có hàm AVERAGE',
            actualValue: cell.v,
            message: isAvg 
              ? `Chính xác! Hàm [${cell.f}] cho kết quả trung bình hợp lệ.` 
              : `Cần sử dụng hàm =AVERAGE(E2:E7). Đề bài thi MOS không chấm điểm nếu cộng thủ công rồi chia.`,
          };
        }
      },
    ]
  },
  {
    id: 'excel-proj-02',
    title: 'Dự Án 2: Bảng Lương & Tra Cứu VLOOKUP, Hàm Điều Kiện IF',
    subject: 'excel',
    description: 'Thực hành kỹ năng nâng cao MOS MO-200: Tra cứu mức thưởng bằng hàm VLOOKUP kết hợp khóa ô tuyệt đối ($) và xếp loại nhân sự bằng hàm IF.',
    starterFileName: 'MOS_Excel_Practice_Project_02_VLOOKUP.xlsx',
    totalPoints: 1000,
    createStarterWorkbook: () => {
      const wb = XLSX.utils.book_new();
      
      const salaryData = [
        ['MÃ NV', 'HỌ VÀ TÊN', 'CẤP BẬC', 'THƯỞNG CẤP BẬC', 'DOANH SỐ', 'ĐÁNH GIÁ KPI'],
        ['NV01', 'Nguyễn Văn An', 'A', '', 85000000, ''],
        ['NV02', 'Trần Thị Bình', 'B', '', 45000000, ''],
        ['NV03', 'Lê Hoàng Cường', 'A', '', 92000000, ''],
        ['NV04', 'Phạm Minh Dũng', 'C', '', 30000000, ''],
        ['NV05', 'Vũ Thu Giang', 'B', '', 62000000, ''],
      ];
      const salarySheet = XLSX.utils.aoa_to_sheet(salaryData);
      XLSX.utils.book_append_sheet(wb, salarySheet, 'BangLuong');

      const lookupData = [
        ['CẤP BẬC', 'MỨC THƯỞNG (VNĐ)'],
        ['A', 5000000],
        ['B', 3000000],
        ['C', 1500000],
      ];
      const lookupSheet = XLSX.utils.aoa_to_sheet(lookupData);
      XLSX.utils.book_append_sheet(wb, lookupSheet, 'MucThuong');

      return wb;
    },
    tasks: [
      {
        id: 'p2-t1',
        taskNumber: 1,
        instruction: 'Tại sheet "BangLuong", ô D2: Dùng hàm =VLOOKUP(C2, MucThuong!$A$2:$B$4, 2, FALSE) để tra cứu Mức thưởng theo Cấp bậc.',
        targetSheet: 'BangLuong',
        targetCell: 'D2',
        expectedFormulaDesc: '=VLOOKUP(C2, MucThuong!$A$2:$B$4, 2, FALSE)',
        points: 500,
        evaluate: (wb) => {
          const ws = wb.Sheets['BangLuong'];
          if (!ws) return { passed: false, message: 'Không tìm thấy sheet "BangLuong".' };

          const cell = ws['D2'];
          if (!cell) return { passed: false, message: 'Ô D2 chưa được điền công thức.' };

          const formula = (cell.f || '').replace(/\s+/g, '').toUpperCase();
          const isVlookup = formula.includes('VLOOKUP') && formula.includes('C2') && formula.includes('MUCTHUONG');

          return {
            passed: isVlookup,
            actualFormula: cell.f || 'Không có công thức VLOOKUP',
            actualValue: cell.v,
            message: isVlookup 
              ? `Xuất sắc! Hàm tra cứu [${cell.f}] đã được thiết lập đúng chuẩn tham chiếu.` 
              : `Chưa đúng! Thao tác thi MOS yêu cầu hàm VLOOKUP lấy giá trị từ sheet MucThuong. Thực tế: [${cell.f || cell.v}]`,
          };
        }
      },
      {
        id: 'p2-t2',
        taskNumber: 2,
        instruction: 'Tại sheet "BangLuong", ô F2: Dùng hàm =IF(E2>=50000000, "Đạt", "Chưa Đạt") để đánh giá KPI doanh số.',
        targetSheet: 'BangLuong',
        targetCell: 'F2',
        expectedFormulaDesc: '=IF(E2>=50000000, "Đạt", "Chưa Đạt")',
        points: 500,
        evaluate: (wb) => {
          const ws = wb.Sheets['BangLuong'];
          if (!ws) return { passed: false, message: 'Không tìm thấy sheet "BangLuong".' };

          const cell = ws['F2'];
          if (!cell) return { passed: false, message: 'Ô F2 chưa được điền công thức.' };

          const formula = (cell.f || '').replace(/\s+/g, '').toUpperCase();
          const isIf = formula.includes('IF(') && formula.includes('E2') && (formula.includes('50000000') || formula.includes('5E7'));

          return {
            passed: isIf || cell.v === 'Đạt',
            actualFormula: cell.f || 'Không có hàm IF',
            actualValue: cell.v,
            message: isIf 
              ? `Chính xác! Hàm điều kiện [${cell.f}] cho kết quả xếp loại "${cell.v}".` 
              : `Cần dùng hàm =IF(E2>=50000000, "Đạt", "Chưa Đạt") để tự động xếp loại.`,
          };
        }
      }
    ]
  }
];

interface RealFileGraderProps {
  currentUser: UserProfile;
  onStatsUpdate?: () => void;
}

export const RealFileGrader: React.FC<RealFileGraderProps> = ({ currentUser, onStatsUpdate }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('excel-proj-01');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [gradingResults, setGradingResults] = useState<{
    score: number;
    passed: boolean;
    taskBreakdown: Array<{
      taskId: string;
      taskNumber: number;
      instruction: string;
      passed: boolean;
      points: number;
      message: string;
      actualFormula?: string;
      actualValue?: any;
    }>;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [submittedToTeacher, setSubmittedToTeacher] = useState(false);

  const activeProject = MOS_PROJECTS.find(p => p.id === selectedProjectId) || MOS_PROJECTS[0];

  // Download Starter File
  const handleDownloadStarter = () => {
    soundManager.playClick();
    const wb = activeProject.createStarterWorkbook();
    XLSX.writeFile(wb, activeProject.starterFileName);
  };

  // Upload and Grade File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    soundManager.playClick();
    setIsProcessing(true);
    setUploadedFileName(file.name);
    setSubmittedToTeacher(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        // Important: Enable cellFormula and cellNF to inspect Excel formulas and number formats
        const wb = XLSX.read(data, { type: 'array', cellFormula: true, cellStyles: true, cellNF: true });

        const taskBreakdown = activeProject.tasks.map(task => {
          const evalResult = task.evaluate(wb);
          return {
            taskId: task.id,
            taskNumber: task.taskNumber,
            instruction: task.instruction,
            passed: evalResult.passed,
            points: evalResult.passed ? task.points : 0,
            message: evalResult.message,
            actualFormula: evalResult.actualFormula,
            actualValue: evalResult.actualValue,
          };
        });

        const totalEarned = taskBreakdown.reduce((sum, t) => sum + t.points, 0);
        const passed = totalEarned >= 700;

        if (passed) {
          soundManager.playCorrect();
        } else {
          soundManager.playWrong();
        }

        setGradingResults({
          score: totalEarned,
          passed,
          taskBreakdown,
        });
      } catch (err: any) {
        console.error('Error parsing file:', err);
        alert('Không thể đọc file bài làm. Vui lòng đảm bảo bạn tải lên file .xlsx chuẩn Microsoft Excel.');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Submit to Teacher Portal
  const handleSyncToTeacher = async () => {
    if (!gradingResults) return;
    soundManager.playClick();
    
    await sendSubmissionToTeacher({
      studentId: currentUser.id,
      studentName: currentUser.name,
      studentCode: currentUser.studentCode || 'HV-2026',
      classRoom: currentUser.classRoom || 'Lớp MOS-TinHoc01',
      subject: activeProject.subject,
      type: 'practical',
      score: gradingResults.score,
      passed: gradingResults.passed,
      timeSpentSeconds: 420,
      totalQuestions: activeProject.tasks.length,
      correctCount: gradingResults.taskBreakdown.filter(t => t.passed).length,
      teacherId: currentUser.assignedTeacherId || 't-excel-02',
      teacherName: currentUser.assignedTeacherName || 'ThS. Trần Thị Bích Mai',
    });

    setSubmittedToTeacher(true);
    soundManager.playCorrect();
    if (onStatsUpdate) onStatsUpdate();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Title & Badge */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-emerald-100 text-emerald-800">
                  Real File Grader Engine
                </span>
                <span className="text-xs text-slate-500 font-medium">· Tiêu chuẩn Certiport MOS</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 mt-0.5">
                Hệ Thống Chấm Điểm File Thực (.xlsx / .docx)
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Tải file đề bài mẫu về máy tính, thao tác trên Excel thật, rồi nộp file lên để hệ thống phân tích mã XML và công thức tự động.
              </p>
            </div>
          </div>

          {/* Project Selector */}
          <div className="flex items-center gap-2">
            <label htmlFor="project-select" className="text-xs font-semibold text-slate-600 shrink-0">Chọn bài thi:</label>
            <select
              id="project-select"
              value={selectedProjectId}
              onChange={(e) => {
                soundManager.playClick();
                setSelectedProjectId(e.target.value);
                setGradingResults(null);
                setUploadedFileName(null);
                setSubmittedToTeacher(false);
              }}
              className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {MOS_PROJECTS.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3-Step Workflow Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Step 1: Download Starter */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 mb-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">1</span>
              <span>BƯỚC 1: TẢI FILE ĐỀ BÀI</span>
            </div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">{activeProject.starterFileName}</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              File bảng tính mẫu đã được định sẵn cấu trúc cột. Bạn mở trên Microsoft Excel để thực hiện các yêu cầu thi.
            </p>
          </div>
          <button
            onClick={handleDownloadStarter}
            className="w-full py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-2xs"
          >
            <Download className="w-4 h-4" />
            <span>Tải File .XLSX Mẫu</span>
          </button>
        </div>

        {/* Step 2: Instruction Checklist */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-600 mb-2">
            <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs">2</span>
            <span>BƯỚC 2: YÊU CẦU CẦN LÀM</span>
          </div>
          <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
            {activeProject.tasks.map(t => (
              <div key={t.id} className="text-xs border-l-2 border-amber-400 pl-2 py-0.5">
                <span className="font-bold text-slate-800">Nhiệm vụ {t.taskNumber}:</span>
                <p className="text-slate-600 text-[11px] mt-0.5">{t.instruction}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Step 3: Upload & Automatic Grading */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 mb-2">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">3</span>
              <span>BƯỚC 3: NỘP BÀI CHẤM ĐIỂM</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              Sau khi lưu bài làm trên máy tính, hãy tải file lên để hệ thống phân tích cú pháp và công thức.
            </p>
          </div>
          
          <label className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>{isProcessing ? 'Đang Phân Tích...' : 'Tải File Bài Làm Lên'}</span>
            <input
              type="file"
              accept=".xlsx, .xls, .xlsm"
              onChange={handleFileUpload}
              disabled={isProcessing}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Grading Results Panel (Error Breakdown & Certiport Score) */}
      {gradingResults && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 animate-fadeIn">
          {/* Top Score Banner */}
          <div className={`p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            gradingResults.passed 
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' 
              : 'bg-rose-50/70 border-rose-200 text-rose-950'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${
                gradingResults.passed ? 'bg-emerald-600' : 'bg-rose-600'
              }`}>
                {gradingResults.passed ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {gradingResults.passed ? 'ĐẠT CHUẨN CERTIPORT' : 'CHƯA ĐẠT CHUẨN'}
                  </span>
                  <span className="text-xs text-slate-500">· File: {uploadedFileName}</span>
                </div>
                <div className="text-2xl font-black mt-0.5">
                  {gradingResults.score} / 1000 Điểm
                  <span className="text-xs font-normal text-slate-600 ml-2">(Điểm chuẩn: 700)</span>
                </div>
              </div>
            </div>

            {/* Sync to Teacher Button */}
            <div>
              <button
                onClick={handleSyncToTeacher}
                disabled={submittedToTeacher}
                className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs ${
                  submittedToTeacher 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submittedToTeacher ? 'Đã Đồng Bộ Lên Giáo Viên' : 'Gửi Kết Quả Cho Giáo Viên'}</span>
              </button>
            </div>
          </div>

          {/* Detailed Task-by-Task Error Breakdown */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-blue-600" />
              <span>Phân Tích Chi Tiết Từng Nhiệm Vụ (Error Breakdown)</span>
            </h3>

            <div className="space-y-3">
              {gradingResults.taskBreakdown.map((task) => (
                <div 
                  key={task.taskId}
                  className={`p-4 rounded-xl border text-xs transition-all ${
                    task.passed 
                      ? 'bg-slate-50/80 border-emerald-200' 
                      : 'bg-rose-50/40 border-rose-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5">
                        {task.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">
                          Nhiệm Vụ {task.taskNumber}: {task.instruction}
                        </div>
                        <div className="mt-1 text-slate-600">
                          {task.message}
                        </div>

                        {/* If failed or formula detected, show code box */}
                        {task.actualFormula && (
                          <div className="mt-2 p-2 bg-white rounded border border-slate-200 font-mono text-[11px] text-slate-700">
                            <div><span className="text-slate-400">Công thức tìm thấy:</span> <strong className="text-blue-600">{task.actualFormula}</strong></div>
                            {task.actualValue !== undefined && (
                              <div><span className="text-slate-400">Giá trị tính ra:</span> {String(task.actualValue)}</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                        task.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        +{task.points} / {MOS_PROJECTS.find(p => p.id === selectedProjectId)?.tasks.find(t => t.id === task.taskId)?.points} đ
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
