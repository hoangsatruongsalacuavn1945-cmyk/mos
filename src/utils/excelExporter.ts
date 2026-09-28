import XLSX from 'xlsx-js-style';
import { Submission, UserProfile } from '../types/user';
import { UserStats } from '../types/mos';

export interface ExcelExportOptions {
  subject: string;
  classRoomFilter?: string;
  teacher: UserProfile;
  includeSummarySheet?: boolean;
  includeStudentsSheet?: boolean;
  includeDomainsSheet?: boolean;
  includeRankingsSheet?: boolean;
  includeSubmissionsSheet?: boolean;
  statusFilter?: string;
  typeFilter?: string;
}

// -------------------------------------------------------------
// STYLING PALETTE & CONSTANTS FOR ONLINE GRADEBOOK THEME
// -------------------------------------------------------------
const BORDER_CELL = {
  top: { style: 'thin', color: { rgb: 'E2E8F0' } },
  bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
  left: { style: 'thin', color: { rgb: 'E2E8F0' } },
  right: { style: 'thin', color: { rgb: 'E2E8F0' } },
};

const BORDER_HEADER = {
  top: { style: 'thin', color: { rgb: '94A3B8' } },
  bottom: { style: 'medium', color: { rgb: '0F172A' } },
  left: { style: 'thin', color: { rgb: '94A3B8' } },
  right: { style: 'thin', color: { rgb: '94A3B8' } },
};

// Style Presets
const STYLE_TITLE_BANNER = {
  fill: { fgColor: { rgb: '064E3B' } }, // Deep Emerald Green
  font: { name: 'Segoe UI', sz: 14, bold: true, color: { rgb: 'FFFFFF' } },
  alignment: { horizontal: 'center', vertical: 'center' },
};

const STYLE_SUBTITLE_BANNER = {
  fill: { fgColor: { rgb: '047857' } },
  font: { name: 'Segoe UI', sz: 10, italic: true, color: { rgb: 'E6FFFA' } },
  alignment: { horizontal: 'center', vertical: 'center' },
};

const STYLE_SECTION_BAR = {
  fill: { fgColor: { rgb: '0F172A' } }, // Dark Slate 900
  font: { name: 'Segoe UI', sz: 11, bold: true, color: { rgb: 'F8FAFC' } },
  alignment: { horizontal: 'left', vertical: 'center', indent: 1 },
};

const STYLE_TABLE_HEADER = {
  fill: { fgColor: { rgb: '1E293B' } }, // Slate 800
  font: { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: BORDER_HEADER,
};

const STYLE_CELL_DEFAULT = {
  font: { name: 'Segoe UI', sz: 10, color: { rgb: '1E293B' } },
  alignment: { vertical: 'center' },
  border: BORDER_CELL,
};

const STYLE_CELL_ZEBRA = {
  fill: { fgColor: { rgb: 'F8FAFC' } },
  font: { name: 'Segoe UI', sz: 10, color: { rgb: '1E293B' } },
  alignment: { vertical: 'center' },
  border: BORDER_CELL,
};

const STYLE_CELL_CENTER = {
  ...STYLE_CELL_DEFAULT,
  alignment: { horizontal: 'center', vertical: 'center' },
};

const STYLE_CELL_CENTER_ZEBRA = {
  ...STYLE_CELL_ZEBRA,
  alignment: { horizontal: 'center', vertical: 'center' },
};

const STYLE_CELL_BOLD_CENTER = {
  ...STYLE_CELL_CENTER,
  font: { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: '0F172A' } },
};

const STYLE_CELL_PASS = {
  fill: { fgColor: { rgb: 'DCFCE7' } }, // Soft Green
  font: { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: '15803D' } },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: BORDER_CELL,
};

const STYLE_CELL_FAIL = {
  fill: { fgColor: { rgb: 'FEE2E2' } }, // Soft Red
  font: { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: 'B91C1C' } },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: BORDER_CELL,
};

const STYLE_CELL_EXCELLENT = {
  fill: { fgColor: { rgb: 'FEF3C7' } }, // Soft Gold
  font: { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: '92400E' } },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: BORDER_CELL,
};

const STYLE_KEY_COL = {
  fill: { fgColor: { rgb: 'F1F5F9' } },
  font: { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: '334155' } },
  alignment: { vertical: 'center' },
  border: BORDER_CELL,
};

const STYLE_VAL_COL = {
  font: { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: '0F172A' } },
  alignment: { vertical: 'center' },
  border: BORDER_CELL,
};

/**
 * Format an entire worksheet with cell styles, row heights, and borders
 */
function applySheetStyles(
  ws: XLSX.WorkSheet,
  rowCount: number,
  colCount: number
) {
  for (let r = 0; r < rowCount; r++) {
    for (let c = 0; c < colCount; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      if (!ws[cellRef]) {
        // create empty cell so borders and fills render consistently
        ws[cellRef] = { t: 's', v: '' };
      }
    }
  }
}

export function generateMOSExcelWorkbook(
  submissions: Submission[],
  options: ExcelExportOptions
): XLSX.WorkBook {
  const {
    subject,
    classRoomFilter,
    teacher,
    includeSummarySheet = true,
    includeStudentsSheet = true,
    includeDomainsSheet = true,
    includeRankingsSheet = true,
    includeSubmissionsSheet = true,
  } = options;

  // Filter submissions by subject if specified
  const subjectSubmissions = subject !== 'all'
    ? submissions.filter(s => s.subject === subject)
    : submissions;

  // Filter by class if specified
  const activeSubmissions = classRoomFilter && classRoomFilter !== 'all'
    ? subjectSubmissions.filter(s => s.classRoom === classRoomFilter)
    : subjectSubmissions;

  const currentSubjectCode = subject !== 'all' ? subject : (teacher.targetSubject || 'word');
  const subjectDisplayName = currentSubjectCode === 'word'
    ? 'MOS Word 365/2019 (MO-100)'
    : currentSubjectCode === 'excel'
    ? 'MOS Excel 365/2019 (MO-200)'
    : currentSubjectCode === 'powerpoint'
    ? 'MOS PowerPoint 365/2019 (MO-300)'
    : `MOS ${currentSubjectCode.toUpperCase()}`;

  // Group by student
  const studentMap = new Map<string, {
    studentCode: string;
    studentName: string;
    classRoom: string;
    submissions: Submission[];
  }>();

  for (const sub of activeSubmissions) {
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

  // Calculate per-student metrics
  const studentMetrics = Array.from(studentMap.values()).map(st => {
    const sList = st.submissions;
    const totalAttempts = sList.length;
    const mockCount = sList.filter(s => s.type === 'mock-exam').length;
    const practicalCount = sList.filter(s => s.type === 'practical').length;
    const quizCount = sList.filter(s => s.type === 'theory-quiz').length;

    const scores = sList.map(s => s.score);
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / (totalAttempts || 1));

    // Sort descending by date
    const sortedSubs = [...sList].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    const latestSub = sortedSubs[0];
    const firstSub = sortedSubs[sortedSubs.length - 1];

    const passed = highestScore >= 700;
    const totalMinutes = Math.round(sList.reduce((acc, s) => acc + (s.timeSpentSeconds || 0), 0) / 60);

    const reviewedCount = sList.filter(s => !!s.teacherFeedback).length;
    const latestFeedback = sortedSubs.find(s => !!s.teacherFeedback)?.teacherFeedback || '';
    const latestRating = sortedSubs.find(s => !!s.teacherFeedback)?.teacherRating || 'none';

    return {
      studentCode: st.studentCode,
      studentName: st.studentName,
      classRoom: st.classRoom,
      totalAttempts,
      mockCount,
      practicalCount,
      quizCount,
      highestScore,
      lowestScore,
      avgScore,
      latestScore: latestSub ? latestSub.score : 0,
      passed,
      totalTimeMinutes: totalMinutes,
      firstDate: firstSub ? new Date(firstSub.submittedAt).toLocaleDateString('vi-VN') : '',
      latestDate: latestSub ? new Date(latestSub.submittedAt).toLocaleString('vi-VN') : '',
      reviewedCount,
      latestRating,
      latestFeedback,
    };
  });

  // Calculate overall KPIs
  const totalStudents = studentMap.size;
  const passedStudentsCount = studentMetrics.filter(sm => sm.passed).length;
  const studentPassRate = totalStudents > 0 ? Math.round((passedStudentsCount / totalStudents) * 100) : 0;

  const totalSubsCount = activeSubmissions.length;
  const passedSubsCount = activeSubmissions.filter(s => s.passed).length;
  const subPassRate = totalSubsCount > 0 ? Math.round((passedSubsCount / totalSubsCount) * 100) : 0;

  const overallAvgScore = totalSubsCount > 0
    ? Math.round(activeSubmissions.reduce((a, b) => a + b.score, 0) / totalSubsCount)
    : 0;
  const maxScore = totalSubsCount > 0 ? Math.max(...activeSubmissions.map(s => s.score)) : 0;
  const minScore = totalSubsCount > 0 ? Math.min(...activeSubmissions.map(s => s.score)) : 0;
  const avgTimeMinutes = totalSubsCount > 0
    ? Math.round(activeSubmissions.reduce((a, b) => a + (b.timeSpentSeconds || 0), 0) / totalSubsCount / 60)
    : 0;

  const totalReviewed = activeSubmissions.filter(s => !!s.teacherFeedback).length;
  const totalPending = totalSubsCount - totalReviewed;

  // Domain breakdown
  const domainMap = new Map<string, { total: number; correct: number }>();
  for (const sub of activeSubmissions) {
    if (sub.domainScores) {
      for (const [dom, stat] of Object.entries(sub.domainScores)) {
        if (!domainMap.has(dom)) {
          domainMap.set(dom, { total: 0, correct: 0 });
        }
        const curr = domainMap.get(dom)!;
        curr.total += stat.total;
        curr.correct += stat.correct;
      }
    }
  }

  // Create Workbook
  const wb = XLSX.utils.book_new();

  // =============================================================
  // SHEET 1: TỔNG QUAN & CHỈ SỐ KPI (Styled Executive Dashboard)
  // =============================================================
  if (includeSummarySheet) {
    const summaryRows: any[][] = [
      ['BÁO CÁO TỔNG HỢP HIỆU SUẤT KHẢO THÍ HỌC VIÊN (MOS MASTER DASHBOARD)', '', '', ''],
      ['Hệ Thống Quản Lý Đào Tạo & Khảo Thí Chuẩn Quốc Tế Certiport', '', '', ''],
      ['', '', '', ''],
      ['📌 THÔNG TIN CHUNG BÁO CÁO & GIẢNG VIÊN', '', '', ''],
      ['Môn Khảo Thí:', subjectDisplayName, 'Mã Chuẩn Môn:', `MOS ${currentSubjectCode.toUpperCase()}`],
      ['Giảng Viên Phụ Trách:', teacher.name, 'Email Giảng Viên:', teacher.email],
      ['Thời Gian Xuất Báo Cáo:', new Date().toLocaleString('vi-VN'), 'Bộ Lọc Lớp Áp Dụng:', classRoomFilter && classRoomFilter !== 'all' ? `Lớp ${classRoomFilter}` : 'Toàn Bộ Các Lớp'],
      ['', '', '', ''],
      ['📊 BẢNG TỔNG HỢP CHỈ SỐ HIỆU SUẤT CHÍNH (KEY PERFORMANCE INDICATORS)', '', '', ''],
      ['Chỉ Số Đánh Giá', 'Kết Quả Thống Kê', 'Đơn Vị', 'Ghi Chú Đánh Giá'],
      ['Tổng số học viên tham gia học & thi', totalStudents, 'Học viên', 'Học viên đã nộp bài ít nhất 1 lần'],
      ['Số học viên đạt chuẩn Certiport (>= 700)', passedStudentsCount, 'Học viên', 'Đủ điều kiện nhận chứng chỉ quốc tế'],
      ['Tỉ lệ học viên đạt chứng chỉ (Student Pass Rate)', `${studentPassRate}%`, 'Tỉ lệ phần trăm', studentPassRate >= 70 ? 'Đạt chỉ tiêu khảo thí' : 'Cần tăng cường ôn tập'],
      ['Tổng số lượt nộp bài khảo thí', totalSubsCount, 'Lượt', 'Gồm cả thi thử và bài thực hành'],
      ['Tỉ lệ bài thi đạt chuẩn (Exam Pass Rate)', `${subPassRate}%`, 'Tỉ lệ phần trăm', 'Tính trên tổng số lượt thi'],
      ['Điểm trung bình toàn môn', overallAvgScore, 'Điểm / 1000', overallAvgScore >= 750 ? 'Khá - Giỏi' : 'Trung bình'],
      ['Điểm số cao nhất ghi nhận', maxScore, 'Điểm / 1000', 'Kỷ lục điểm số của môn'],
      ['Điểm số thấp nhất ghi nhận', minScore, 'Điểm / 1000', 'Điểm cần hỗ trợ phụ đạo'],
      ['Thời gian làm bài trung bình', avgTimeMinutes, 'Phút / bài thi', 'Thời gian chuẩn Certiport: 50 phút'],
      ['Số bài nộp đã được giảng viên nhận xét', totalReviewed, 'Bài', 'Đã gửi phản hồi đến học viên'],
      ['Số bài nộp đang chờ nhận xét', totalPending, 'Bài', 'Cần giảng viên đánh giá bổ sung']
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);

    // Merged Cells
    wsSummary['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // Title
      { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }, // Subtitle
      { s: { r: 3, c: 0 }, e: { r: 3, c: 3 } }, // Section 1 Bar
      { s: { r: 8, c: 0 }, e: { r: 8, c: 3 } }, // Section 2 Bar
    ];

    // Column widths
    wsSummary['!cols'] = [
      { wch: 42 },
      { wch: 28 },
      { wch: 20 },
      { wch: 40 }
    ];

    // Row heights
    wsSummary['!rows'] = [
      { hpt: 34 }, // R0
      { hpt: 20 }, // R1
      { hpt: 10 }, // R2
      { hpt: 26 }, // R3
      { hpt: 22 }, // R4
      { hpt: 22 }, // R5
      { hpt: 22 }, // R6
      { hpt: 10 }, // R7
      { hpt: 26 }, // R8
      { hpt: 26 }, // R9 Header
    ];

    // Apply styles to Sheet 1
    applySheetStyles(wsSummary, summaryRows.length, 4);

    // Title & Subtitle styling
    for (let c = 0; c < 4; c++) {
      const ref0 = XLSX.utils.encode_cell({ r: 0, c });
      const ref1 = XLSX.utils.encode_cell({ r: 1, c });
      if (wsSummary[ref0]) wsSummary[ref0].s = STYLE_TITLE_BANNER;
      if (wsSummary[ref1]) wsSummary[ref1].s = STYLE_SUBTITLE_BANNER;
    }

    // Section 1 Header
    for (let c = 0; c < 4; c++) {
      const ref = XLSX.utils.encode_cell({ r: 3, c });
      if (wsSummary[ref]) wsSummary[ref].s = STYLE_SECTION_BAR;
    }

    // Info grid (R4 - R6)
    for (let r = 4; r <= 6; r++) {
      const refA = XLSX.utils.encode_cell({ r, c: 0 });
      const refB = XLSX.utils.encode_cell({ r, c: 1 });
      const refC = XLSX.utils.encode_cell({ r, c: 2 });
      const refD = XLSX.utils.encode_cell({ r, c: 3 });
      if (wsSummary[refA]) wsSummary[refA].s = STYLE_KEY_COL;
      if (wsSummary[refB]) wsSummary[refB].s = STYLE_VAL_COL;
      if (wsSummary[refC]) wsSummary[refC].s = STYLE_KEY_COL;
      if (wsSummary[refD]) wsSummary[refD].s = STYLE_VAL_COL;
    }

    // Section 2 Header
    for (let c = 0; c < 4; c++) {
      const ref = XLSX.utils.encode_cell({ r: 8, c });
      if (wsSummary[ref]) wsSummary[ref].s = STYLE_SECTION_BAR;
    }

    // Table Header (R9)
    for (let c = 0; c < 4; c++) {
      const ref = XLSX.utils.encode_cell({ r: 9, c });
      if (wsSummary[ref]) wsSummary[ref].s = STYLE_TABLE_HEADER;
    }

    // Data rows (R10 - R20)
    for (let r = 10; r < summaryRows.length; r++) {
      const isZebra = r % 2 === 1;
      const baseStyle = isZebra ? STYLE_CELL_ZEBRA : STYLE_CELL_DEFAULT;

      const refA = XLSX.utils.encode_cell({ r, c: 0 });
      const refB = XLSX.utils.encode_cell({ r, c: 1 });
      const refC = XLSX.utils.encode_cell({ r, c: 2 });
      const refD = XLSX.utils.encode_cell({ r, c: 3 });

      if (wsSummary[refA]) wsSummary[refA].s = { ...baseStyle, font: { bold: true, name: 'Segoe UI', sz: 10 } };
      if (wsSummary[refB]) wsSummary[refB].s = { ...(isZebra ? STYLE_CELL_CENTER_ZEBRA : STYLE_CELL_CENTER), font: { bold: true, name: 'Segoe UI', sz: 11, color: { rgb: '0F172A' } } };
      if (wsSummary[refC]) wsSummary[refC].s = isZebra ? STYLE_CELL_CENTER_ZEBRA : STYLE_CELL_CENTER;
      if (wsSummary[refD]) wsSummary[refD].s = baseStyle;
    }

    XLSX.utils.book_append_sheet(wb, wsSummary, 'Tổng Quan & KPI');
  }

  // =============================================================
  // SHEET 2: SỔ ĐIỂM HỌC VIÊN TOÀN DIỆN (Online Gradebook Theme)
  // =============================================================
  if (includeStudentsSheet) {
    const headers = [
      'STT',
      'Mã Sinh Viên',
      'Họ Và Tên Học Viên',
      'Lớp Học',
      'Tổng Lượt Thi',
      'Số Bài Thi Thử',
      'Bài Thực Hành',
      'Bài Lý Thuyết',
      'Điểm Max (/1000)',
      'Điểm TB (/1000)',
      'Điểm Gần Nhất',
      'Trạng Thái Chứng Chỉ',
      'Tổng Giờ Ôn Luyện',
      'Ngày Bắt Đầu',
      'Lần Hoạt Động Cuối',
      'Số Lần Được GV Chấm',
      'Đánh Giá Của GV',
      'Lời Phê & Nhận Xét Của GV'
    ];

    const studentRows: any[][] = [
      ['SỔ ĐIỂM ĐIỆN TỬ HỌC VIÊN MOS (ONLINE LMS GRADEBOOK) - ' + subjectDisplayName.toUpperCase()],
      [`Thời gian xuất: ${new Date().toLocaleString('vi-VN')} · Giảng viên: ${teacher.name} (${teacher.email}) · Bộ lọc lớp: ${classRoomFilter || 'Tất cả'}`],
      [],
      headers
    ];

    studentMetrics.forEach((sm, idx) => {
      const ratingLabel = sm.latestRating === 'excellent' 
        ? 'Xuất Sắc 🌟' 
        : sm.latestRating === 'good' 
        ? 'Đạt Chuẩn 👍' 
        : sm.latestRating === 'needs-improvement' 
        ? 'Cần Cải Thiện ⚠️' 
        : 'Chưa Chấm';

      studentRows.push([
        idx + 1,
        sm.studentCode,
        sm.studentName,
        sm.classRoom,
        sm.totalAttempts,
        sm.mockCount,
        sm.practicalCount,
        sm.quizCount,
        sm.highestScore,
        sm.avgScore,
        sm.latestScore,
        sm.passed ? 'ĐẠT (PASS >= 700)' : 'CHƯA ĐẠT',
        `${(sm.totalTimeMinutes / 60).toFixed(1)} giờ`,
        sm.firstDate,
        sm.latestDate,
        sm.reviewedCount,
        ratingLabel,
        sm.latestFeedback || 'Chưa có lời nhận xét'
      ]);
    });

    const wsStudents = XLSX.utils.aoa_to_sheet(studentRows);

    // Merged Banner
    wsStudents['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } },
    ];

    wsStudents['!cols'] = [
      { wch: 6 },  // STT
      { wch: 16 }, // Mã SV
      { wch: 28 }, // Họ tên
      { wch: 14 }, // Lớp
      { wch: 15 }, // Tổng lượt
      { wch: 15 }, // Thi thử
      { wch: 15 }, // Thực hành
      { wch: 15 }, // Lý thuyết
      { wch: 18 }, // Điểm max
      { wch: 18 }, // Điểm TB
      { wch: 18 }, // Điểm gần nhất
      { wch: 24 }, // Trạng thái
      { wch: 18 }, // Tổng giờ ôn
      { wch: 16 }, // Ngày bắt đầu
      { wch: 22 }, // Lần cuối
      { wch: 20 }, // Số lần chấm
      { wch: 20 }, // Đánh giá GV
      { wch: 45 }  // Lời phê
    ];

    wsStudents['!rows'] = [
      { hpt: 32 }, // Title
      { hpt: 20 }, // Subtitle
      { hpt: 8 },  // Spacer
      { hpt: 28 }, // Header
    ];

    applySheetStyles(wsStudents, studentRows.length, headers.length);

    // Style Title & Subtitle
    for (let c = 0; c < headers.length; c++) {
      const ref0 = XLSX.utils.encode_cell({ r: 0, c });
      const ref1 = XLSX.utils.encode_cell({ r: 1, c });
      if (wsStudents[ref0]) wsStudents[ref0].s = STYLE_TITLE_BANNER;
      if (wsStudents[ref1]) wsStudents[ref1].s = STYLE_SUBTITLE_BANNER;
    }

    // Style Headers (R3)
    for (let c = 0; c < headers.length; c++) {
      const ref = XLSX.utils.encode_cell({ r: 3, c });
      if (wsStudents[ref]) wsStudents[ref].s = STYLE_TABLE_HEADER;
    }

    // Style Data rows
    for (let r = 4; r < studentRows.length; r++) {
      const isZebra = r % 2 === 1;
      const baseStyle = isZebra ? STYLE_CELL_ZEBRA : STYLE_CELL_DEFAULT;
      const centerStyle = isZebra ? STYLE_CELL_CENTER_ZEBRA : STYLE_CELL_CENTER;

      for (let c = 0; c < headers.length; c++) {
        const ref = XLSX.utils.encode_cell({ r, c });
        if (!wsStudents[ref]) continue;

        // Specific columns
        if (c === 0) wsStudents[ref].s = centerStyle; // STT
        else if (c === 1) wsStudents[ref].s = { ...centerStyle, font: { name: 'Segoe UI', bold: true, sz: 10 } }; // Mã SV
        else if (c === 2) wsStudents[ref].s = { ...baseStyle, font: { name: 'Segoe UI', bold: true, sz: 10, color: { rgb: '0F172A' } } }; // Tên
        else if (c === 3) wsStudents[ref].s = centerStyle; // Lớp
        else if (c >= 4 && c <= 7) wsStudents[ref].s = centerStyle; // Counts
        else if (c === 8) {
          // Điểm max
          const score = Number(wsStudents[ref].v);
          wsStudents[ref].s = score >= 900 
            ? STYLE_CELL_EXCELLENT 
            : { ...centerStyle, font: { name: 'Segoe UI', bold: true, sz: 11, color: { rgb: '047857' } } };
        }
        else if (c === 9 || c === 10) wsStudents[ref].s = { ...centerStyle, font: { bold: true, name: 'Segoe UI', sz: 10 } };
        else if (c === 11) {
          // Status
          const val = String(wsStudents[ref].v);
          wsStudents[ref].s = val.includes('PASS') ? STYLE_CELL_PASS : STYLE_CELL_FAIL;
        }
        else if (c === 16) {
          // Rating
          const val = String(wsStudents[ref].v);
          wsStudents[ref].s = val.includes('Xuất Sắc') ? STYLE_CELL_EXCELLENT : centerStyle;
        }
        else {
          wsStudents[ref].s = baseStyle;
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, wsStudents, 'Sổ Điểm Học Viên');
  }

  // =============================================================
  // SHEET 3: PHÂN TÍCH KỸ NĂNG DOMAIN
  // =============================================================
  if (includeDomainsSheet && domainMap.size > 0) {
    const domainHeaders = [
      'STT',
      'Lĩnh Vực / Nhóm Kỹ Năng Thi MOS',
      'Tổng Số Câu Đã Làm',
      'Số Câu Trả Lời Đúng',
      'Số Câu Trả Lời Sai',
      'Tỉ Lệ Thành Thạo (%)',
      'Đánh Giá Năng Lực',
      'Khuyến Nghị Ôn Tập'
    ];

    const domainRows: any[][] = [
      ['BẢNG PHÂN TÍCH NĂNG LỰC THEO TỪNG KỸ NĂNG CHUẨN CERTIPORT'],
      [`Môn: ${subjectDisplayName} · Thời điểm xuất: ${new Date().toLocaleString('vi-VN')}`],
      [],
      domainHeaders
    ];

    Array.from(domainMap.entries()).forEach(([domain, stats], idx) => {
      const rate = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
      let level = 'Cần Cải Thiện';
      if (rate >= 85) level = 'Rất Tốt (Master)';
      else if (rate >= 70) level = 'Đạt Chuẩn Certiport';
      else if (rate >= 50) level = 'Khá - Cần Luyện Thêm';

      domainRows.push([
        idx + 1,
        domain,
        stats.total,
        stats.correct,
        stats.total - stats.correct,
        `${rate}%`,
        level,
        rate >= 70 ? 'Duy trì phong độ giải đề' : 'Cần đọc lại chỉ dẫn Ribbon và thực hành lại'
      ]);
    });

    const wsDomains = XLSX.utils.aoa_to_sheet(domainRows);

    wsDomains['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: domainHeaders.length - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: domainHeaders.length - 1 } },
    ];

    wsDomains['!cols'] = [
      { wch: 6 },
      { wch: 38 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 20 },
      { wch: 24 },
      { wch: 42 }
    ];

    applySheetStyles(wsDomains, domainRows.length, domainHeaders.length);

    for (let c = 0; c < domainHeaders.length; c++) {
      const ref0 = XLSX.utils.encode_cell({ r: 0, c });
      const ref1 = XLSX.utils.encode_cell({ r: 1, c });
      if (wsDomains[ref0]) wsDomains[ref0].s = { ...STYLE_TITLE_BANNER, fill: { fgColor: { rgb: '312E81' } } }; // Deep Indigo
      if (wsDomains[ref1]) wsDomains[ref1].s = { ...STYLE_SUBTITLE_BANNER, fill: { fgColor: { rgb: '4338CA' } } };
      const refH = XLSX.utils.encode_cell({ r: 3, c });
      if (wsDomains[refH]) wsDomains[refH].s = { ...STYLE_TABLE_HEADER, fill: { fgColor: { rgb: '1E1B4B' } } };
    }

    for (let r = 4; r < domainRows.length; r++) {
      const isZebra = r % 2 === 1;
      const baseStyle = isZebra ? STYLE_CELL_ZEBRA : STYLE_CELL_DEFAULT;
      const centerStyle = isZebra ? STYLE_CELL_CENTER_ZEBRA : STYLE_CELL_CENTER;

      for (let c = 0; c < domainHeaders.length; c++) {
        const ref = XLSX.utils.encode_cell({ r, c });
        if (!wsDomains[ref]) continue;

        if (c === 0 || (c >= 2 && c <= 5)) wsDomains[ref].s = centerStyle;
        else if (c === 6) {
          const val = String(wsDomains[ref].v);
          wsDomains[ref].s = val.includes('Rất Tốt') || val.includes('Đạt Chuẩn') ? STYLE_CELL_PASS : centerStyle;
        } else {
          wsDomains[ref].s = baseStyle;
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, wsDomains, 'Phân Tích Kỹ Năng');
  }

  // =============================================================
  // SHEET 4: BẢNG XẾP HẠNG & VINH DANH (Podium & Honors Theme)
  // =============================================================
  if (includeRankingsSheet && studentMetrics.length > 0) {
    const rankHeaders = [
      'Thứ Hạng',
      'Mã Sinh Viên',
      'Họ Và Tên Học Viên',
      'Lớp Học',
      'Điểm Cao Nhất (/1000)',
      'Điểm Trung Bình (/1000)',
      'Xếp Loại Năng Lực',
      'Chứng Chỉ Certiport',
      'Tổng Lượt Thi & Thực Hành',
      'Tổng Giờ Ôn Tập',
      'Đánh Giá GV Mới Nhất'
    ];

    const rankedStudents = [...studentMetrics].sort((a, b) => {
      if (b.highestScore !== a.highestScore) return b.highestScore - a.highestScore;
      return b.avgScore - a.avgScore;
    });

    const rankRows: any[][] = [
      ['BẢNG VINH DANH & XẾP HẠNG THÀNH TÍCH HỌC VIÊN MOS TOP PERFORMERS'],
      [`Môn: ${subjectDisplayName} · Danh sách tôn vinh học viên xuất sắc và đạt chuẩn quốc tế`],
      [],
      rankHeaders
    ];

    rankedStudents.forEach((sm, idx) => {
      let medal = `#${idx + 1}`;
      if (idx === 0) medal = '🥇 Hạng 1 (Thủ Khoa)';
      else if (idx === 1) medal = '🥈 Hạng 2 (Á Khoa)';
      else if (idx === 2) medal = '🥉 Hạng 3';

      let classification = 'Chưa Đạt';
      if (sm.highestScore >= 950) classification = 'Xuất Sắc Đặc Biệt 🏆';
      else if (sm.highestScore >= 900) classification = 'Xuất Sắc ⭐';
      else if (sm.highestScore >= 800) classification = 'Giỏi ✨';
      else if (sm.highestScore >= 700) classification = 'Khá - Đạt Chuẩn 👍';
      else if (sm.highestScore >= 500) classification = 'Trung Bình';

      rankRows.push([
        medal,
        sm.studentCode,
        sm.studentName,
        sm.classRoom,
        sm.highestScore,
        sm.avgScore,
        classification,
        sm.passed ? 'ĐÃ ĐẠT (PASS)' : 'CHƯA ĐẠT',
        sm.totalAttempts,
        `${(sm.totalTimeMinutes / 60).toFixed(1)} giờ`,
        sm.latestRating === 'excellent' ? 'Xuất Sắc 🌟' : sm.latestRating === 'good' ? 'Tốt 👍' : 'Cần Cố Gắng'
      ]);
    });

    const wsRankings = XLSX.utils.aoa_to_sheet(rankRows);

    wsRankings['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: rankHeaders.length - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: rankHeaders.length - 1 } },
    ];

    wsRankings['!cols'] = [
      { wch: 22 },
      { wch: 16 },
      { wch: 28 },
      { wch: 14 },
      { wch: 22 },
      { wch: 22 },
      { wch: 24 },
      { wch: 20 },
      { wch: 24 },
      { wch: 18 },
      { wch: 22 }
    ];

    applySheetStyles(wsRankings, rankRows.length, rankHeaders.length);

    // Title Amber / Gold
    for (let c = 0; c < rankHeaders.length; c++) {
      const ref0 = XLSX.utils.encode_cell({ r: 0, c });
      const ref1 = XLSX.utils.encode_cell({ r: 1, c });
      if (wsRankings[ref0]) wsRankings[ref0].s = { ...STYLE_TITLE_BANNER, fill: { fgColor: { rgb: '78350F' } } }; // Dark Amber
      if (wsRankings[ref1]) wsRankings[ref1].s = { ...STYLE_SUBTITLE_BANNER, fill: { fgColor: { rgb: 'B45309' } } };
      const refH = XLSX.utils.encode_cell({ r: 3, c });
      if (wsRankings[refH]) wsRankings[refH].s = { ...STYLE_TABLE_HEADER, fill: { fgColor: { rgb: '451A03' } } };
    }

    for (let r = 4; r < rankRows.length; r++) {
      const isTop3 = r <= 6;
      const isZebra = r % 2 === 1;
      const baseStyle = isTop3 
        ? { ...STYLE_CELL_DEFAULT, fill: { fgColor: { rgb: 'FEF3C7' } } } 
        : (isZebra ? STYLE_CELL_ZEBRA : STYLE_CELL_DEFAULT);
      const centerStyle = isTop3 
        ? { ...STYLE_CELL_CENTER, fill: { fgColor: { rgb: 'FEF3C7' } } } 
        : (isZebra ? STYLE_CELL_CENTER_ZEBRA : STYLE_CELL_CENTER);

      for (let c = 0; c < rankHeaders.length; c++) {
        const ref = XLSX.utils.encode_cell({ r, c });
        if (!wsRankings[ref]) continue;

        if (c === 0) wsRankings[ref].s = { ...centerStyle, font: { name: 'Segoe UI', bold: true, sz: 10, color: { rgb: '92400E' } } };
        else if (c === 2) wsRankings[ref].s = { ...baseStyle, font: { name: 'Segoe UI', bold: true, sz: 10 } };
        else if (c === 4) wsRankings[ref].s = { ...centerStyle, font: { name: 'Segoe UI', bold: true, sz: 11, color: { rgb: '047857' } } };
        else if (c === 7) {
          const val = String(wsRankings[ref].v);
          wsRankings[ref].s = val.includes('PASS') ? STYLE_CELL_PASS : STYLE_CELL_FAIL;
        } else {
          wsRankings[ref].s = centerStyle;
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, wsRankings, 'Bảng Xếp Hạng Top');
  }

  // =============================================================
  // SHEET 5: NHẬT KÝ CHI TIẾT CÁC BÀI NỘP (Audit Log)
  // =============================================================
  if (includeSubmissionsSheet) {
    const subHeaders = [
      'STT',
      'Mã Lượt Nộp',
      'Mã Sinh Viên',
      'Họ Và Tên Học Viên',
      'Lớp Học',
      'Môn Thi',
      'Phân Loại Bài Thi',
      'Điểm Đạt Được',
      'Thang Điểm',
      'Kết Quả',
      'Thời Lượng (Phút)',
      'Thời Điểm Nộp Bài',
      'Đánh Giá GV',
      'Lời Phê Của Giảng Viên'
    ];

    const subRows: any[][] = [
      ['NHẬT KÝ CHI TIẾT LỊCH SỬ NỘP BÀI KHẢO THÍ HỌC VIÊN (SUBMISSION AUDIT LOG)'],
      [`Môn: ${subjectDisplayName} · Thời điểm xuất báo cáo: ${new Date().toLocaleString('vi-VN')}`],
      [],
      subHeaders
    ];

    activeSubmissions.forEach((s, idx) => {
      subRows.push([
        idx + 1,
        s.id,
        s.studentCode || 'N/A',
        s.studentName,
        s.classRoom || 'N/A',
        `MOS ${s.subject.toUpperCase()}`,
        s.type === 'mock-exam' ? 'Thi Thử Certiport (50p)' : s.type === 'practical' ? 'Dự Án Thực Hành' : 'Trắc Nghiệm Lý Thuyết',
        s.score,
        1000,
        s.passed ? 'ĐẠT (PASS)' : 'CHƯA ĐẠT (FAIL)',
        Math.round((s.timeSpentSeconds || 0) / 60),
        new Date(s.submittedAt).toLocaleString('vi-VN'),
        s.teacherRating === 'excellent' ? 'Xuất Sắc 🌟' : s.teacherRating === 'good' ? 'Đạt Chuẩn 👍' : s.teacherRating === 'needs-improvement' ? 'Cần Cải Thiện ⚠️' : 'Chưa Nhận Xét',
        s.teacherFeedback || ''
      ]);
    });

    const wsSubs = XLSX.utils.aoa_to_sheet(subRows);

    wsSubs['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: subHeaders.length - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: subHeaders.length - 1 } },
    ];

    wsSubs['!cols'] = [
      { wch: 6 },
      { wch: 14 },
      { wch: 16 },
      { wch: 26 },
      { wch: 14 },
      { wch: 14 },
      { wch: 24 },
      { wch: 14 },
      { wch: 12 },
      { wch: 18 },
      { wch: 18 },
      { wch: 22 },
      { wch: 20 },
      { wch: 45 }
    ];

    applySheetStyles(wsSubs, subRows.length, subHeaders.length);

    for (let c = 0; c < subHeaders.length; c++) {
      const ref0 = XLSX.utils.encode_cell({ r: 0, c });
      const ref1 = XLSX.utils.encode_cell({ r: 1, c });
      if (wsSubs[ref0]) wsSubs[ref0].s = STYLE_TITLE_BANNER;
      if (wsSubs[ref1]) wsSubs[ref1].s = STYLE_SUBTITLE_BANNER;
      const refH = XLSX.utils.encode_cell({ r: 3, c });
      if (wsSubs[refH]) wsSubs[refH].s = STYLE_TABLE_HEADER;
    }

    for (let r = 4; r < subRows.length; r++) {
      const isZebra = r % 2 === 1;
      const baseStyle = isZebra ? STYLE_CELL_ZEBRA : STYLE_CELL_DEFAULT;
      const centerStyle = isZebra ? STYLE_CELL_CENTER_ZEBRA : STYLE_CELL_CENTER;

      for (let c = 0; c < subHeaders.length; c++) {
        const ref = XLSX.utils.encode_cell({ r, c });
        if (!wsSubs[ref]) continue;

        if (c === 0 || c === 1 || c === 2 || c === 4 || c === 5 || c === 8 || c === 10 || c === 11) {
          wsSubs[ref].s = centerStyle;
        } else if (c === 3) {
          wsSubs[ref].s = { ...baseStyle, font: { name: 'Segoe UI', bold: true, sz: 10 } };
        } else if (c === 7) {
          // Điểm
          wsSubs[ref].s = { ...centerStyle, font: { name: 'Segoe UI', bold: true, sz: 10 } };
        } else if (c === 9) {
          const val = String(wsSubs[ref].v);
          wsSubs[ref].s = val.includes('PASS') ? STYLE_CELL_PASS : STYLE_CELL_FAIL;
        } else {
          wsSubs[ref].s = baseStyle;
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, wsSubs, 'Nhật Ký Nộp Bài');
  }

  return wb;
}

export function downloadMOSExcelFile(
  submissions: Submission[],
  options: ExcelExportOptions
): string {
  const wb = generateMOSExcelWorkbook(submissions, options);
  const currentSubjectCode = options.subject !== 'all' ? options.subject : (options.teacher.targetSubject || 'word');
  const dateStamp = new Date().toISOString().slice(0, 10);
  const filename = `MOS_${currentSubjectCode.toUpperCase()}_BaoCao_TongHop_${dateStamp}.xlsx`;

  XLSX.writeFile(wb, filename);
  return filename;
}

// =========================================================================
// MODERN CSV DATA FORMATTING LAYER WITH DISTINCT SECTIONS:
// 1. Student Info
// 2. Exam Attempts
// 3. Progress History & Teacher Feedback
// =========================================================================
export function generateModernSectionedCSVReport(
  submissions: Submission[],
  options: {
    subject: string;
    classRoomFilter?: string;
    teacher: UserProfile;
  }
): string {
  const { subject, classRoomFilter, teacher } = options;

  const subjectSubmissions = subject !== 'all'
    ? submissions.filter(s => s.subject === subject)
    : submissions;

  const activeSubmissions = classRoomFilter && classRoomFilter !== 'all'
    ? subjectSubmissions.filter(s => s.classRoom === classRoomFilter)
    : subjectSubmissions;

  const currentSubjectCode = subject !== 'all' ? subject : (teacher.targetSubject || 'word');
  const subjectDisplayName = currentSubjectCode === 'word'
    ? 'MOS Word 365/2019 (MO-100)'
    : currentSubjectCode === 'excel'
    ? 'MOS Excel 365/2019 (MO-200)'
    : currentSubjectCode === 'powerpoint'
    ? 'MOS PowerPoint 365/2019 (MO-300)'
    : `MOS ${currentSubjectCode.toUpperCase()}`;

  const escape = (val: string | number | undefined | null) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  // Group by student
  const studentMap = new Map<string, {
    studentCode: string;
    studentName: string;
    classRoom: string;
    submissions: Submission[];
  }>();

  for (const sub of activeSubmissions) {
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

  const studentMetrics = Array.from(studentMap.values()).map(st => {
    const sList = st.submissions;
    const totalAttempts = sList.length;
    const mockCount = sList.filter(s => s.type === 'mock-exam').length;
    const practicalCount = sList.filter(s => s.type === 'practical').length;
    const quizCount = sList.filter(s => s.type === 'theory-quiz').length;

    const scores = sList.map(s => s.score);
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / (totalAttempts || 1));

    const sortedSubs = [...sList].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    const latestSub = sortedSubs[0];
    const firstSub = sortedSubs[sortedSubs.length - 1];

    const passed = highestScore >= 700;
    const totalMinutes = Math.round(sList.reduce((acc, s) => acc + (s.timeSpentSeconds || 0), 0) / 60);

    const reviewedCount = sList.filter(s => !!s.teacherFeedback).length;
    const latestFeedback = sortedSubs.find(s => !!s.teacherFeedback)?.teacherFeedback || '';
    const latestRating = sortedSubs.find(s => !!s.teacherFeedback)?.teacherRating || 'none';

    return {
      studentCode: st.studentCode,
      studentName: st.studentName,
      classRoom: st.classRoom,
      totalAttempts,
      mockCount,
      practicalCount,
      quizCount,
      highestScore,
      lowestScore,
      avgScore,
      latestScore: latestSub ? latestSub.score : 0,
      passed,
      totalTimeMinutes: totalMinutes,
      firstDate: firstSub ? new Date(firstSub.submittedAt).toLocaleDateString('vi-VN') : '',
      latestDate: latestSub ? new Date(latestSub.submittedAt).toLocaleString('vi-VN') : '',
      reviewedCount,
      latestRating,
      latestFeedback,
    };
  });

  const lines: string[] = [];

  // Directive for Windows Excel to auto-split columns
  lines.push('sep=,');
  lines.push('========================================================================================================');
  lines.push(`BÁO CÁO KHẢO THÍ & ĐÀO TẠO CHUẨN QUỐC TẾ CERTIPORT (MOS MASTER ADVANCED REPORT)`);
  lines.push(`Hệ Thống Trích Xuất Dữ Liệu Sổ Điểm Điện Tử Đa Mục (Multi-Section Structured Report)`);
  lines.push('========================================================================================================');
  lines.push(`"Môn Khảo Thí:",${escape(subjectDisplayName)},"Mã Chuẩn Môn:",${escape(`MOS ${currentSubjectCode.toUpperCase()}`)}`);
  lines.push(`"Giảng Viên:",${escape(teacher.name)},"Email Liên Hệ:",${escape(teacher.email)}`);
  lines.push(`"Thời Gian Xuất:",${escape(new Date().toLocaleString('vi-VN'))},"Phạm Vi Lớp:",${escape(classRoomFilter && classRoomFilter !== 'all' ? `Lớp ${classRoomFilter}` : 'Toàn Bộ Các Lớp')}`);
  lines.push(`"Tổng Số Học Viên:",${studentMetrics.length},"Tổng Lượt Nộp Bài:",${activeSubmissions.length}`);
  lines.push('');

  // --------------------------------------------------------------------------------------------------------
  // SECTION 1: STUDENT INFO (THÔNG TIN HỌC VIÊN)
  // --------------------------------------------------------------------------------------------------------
  lines.push('########################################################################################################');
  lines.push('### MỤC 1: HỒ SƠ & THÔNG TIN HỌC VIÊN (SECTION 1: STUDENT INFO)');
  lines.push('########################################################################################################');
  lines.push('"STT","Mã Sinh Viên","Họ Và Tên Học Viên","Lớp Học","Môn Học Đăng Ký","Tổng Lượt Nộp","Ngày Bắt Đầu Học","Lần Cuối Hoạt Động","Trạng Thái Chứng Chỉ"');

  studentMetrics.forEach((sm, idx) => {
    lines.push([
      idx + 1,
      escape(sm.studentCode),
      escape(sm.studentName),
      escape(sm.classRoom),
      escape(`MOS ${currentSubjectCode.toUpperCase()}`),
      sm.totalAttempts,
      escape(sm.firstDate),
      escape(sm.latestDate),
      escape(sm.passed ? 'ĐÃ ĐẠT (PASS >= 700)' : 'CHƯA ĐẠT (IN PROGRESS)')
    ].join(','));
  });

  lines.push('');

  // --------------------------------------------------------------------------------------------------------
  // SECTION 2: EXAM ATTEMPTS (LỊCH SỬ KHẢO THÍ & CÁC LẦN NỘP BÀI CHI TIẾT)
  // --------------------------------------------------------------------------------------------------------
  lines.push('########################################################################################################');
  lines.push('### MỤC 2: LỊCH SỬ CÁC LẦN LÀM BÀI KHẢO THÍ CHI TIẾT (SECTION 2: EXAM ATTEMPTS)');
  lines.push('########################################################################################################');
  lines.push('"STT","Mã Lượt Nộp","Mã Sinh Viên","Họ Và Tên","Lớp","Môn Khảo Thí","Phân Loại Bài Thi","Điểm Đạt Được (/1000)","Kết Quả","Thời Lượng (Phút)","Thời Điểm Nộp Bài","Đánh Giá GV"');

  activeSubmissions.forEach((s, idx) => {
    const typeLabel = s.type === 'mock-exam' ? 'Thi Thử Certiport (50p)' : s.type === 'practical' ? 'Dự Án Thực Hành' : 'Trắc Nghiệm Lý Thuyết';
    const ratingLabel = s.teacherRating === 'excellent' ? 'Xuất Sắc 🌟' : s.teacherRating === 'good' ? 'Đạt Chuẩn 👍' : s.teacherRating === 'needs-improvement' ? 'Cần Cải Thiện ⚠️' : 'Chưa Nhận Xét';

    lines.push([
      idx + 1,
      escape(s.id),
      escape(s.studentCode || 'N/A'),
      escape(s.studentName),
      escape(s.classRoom || 'N/A'),
      escape(`MOS ${s.subject.toUpperCase()}`),
      escape(typeLabel),
      s.score,
      escape(s.passed ? 'ĐẠT (PASS)' : 'CHƯA ĐẠT (FAIL)'),
      Math.round((s.timeSpentSeconds || 0) / 60),
      escape(new Date(s.submittedAt).toLocaleString('vi-VN')),
      escape(ratingLabel)
    ].join(','));
  });

  lines.push('');

  // --------------------------------------------------------------------------------------------------------
  // SECTION 3: PROGRESS HISTORY & TEACHER FEEDBACK (TIẾN ĐỘ & ĐÁNH GIÁ GIẢNG VIÊN)
  // --------------------------------------------------------------------------------------------------------
  lines.push('########################################################################################################');
  lines.push('### MỤC 3: TIẾN ĐỘ TÍCH LŨY & ĐÁNH GIÁ CỦA GIẢNG VIÊN (SECTION 3: PROGRESS HISTORY & TEACHER FEEDBACK)');
  lines.push('########################################################################################################');
  lines.push('"STT","Mã Sinh Viên","Họ Và Tên","Lớp","Tổng Lượt Thi","Điểm Max (Kỷ Lục)","Điểm Trung Bình","Điểm Gần Nhất","Trạng Thái Chứng Chỉ","Tổng Thời Gian Ôn (Giờ)","Số Lần Được GV Chấm","Đánh Giá Của GV","Lời Phê & Nhận Xét Của GV"');

  studentMetrics.forEach((sm, idx) => {
    const ratingLabel = sm.latestRating === 'excellent' 
      ? 'Xuất Sắc 🌟' 
      : sm.latestRating === 'good' 
      ? 'Đạt Chuẩn 👍' 
      : sm.latestRating === 'needs-improvement' 
      ? 'Cần Cải Thiện ⚠️' 
      : 'Chưa Chấm';

    lines.push([
      idx + 1,
      escape(sm.studentCode),
      escape(sm.studentName),
      escape(sm.classRoom),
      sm.totalAttempts,
      sm.highestScore,
      sm.avgScore,
      sm.latestScore,
      escape(sm.passed ? 'ĐẠT (PASS >= 700)' : 'CHƯA ĐẠT (FAIL)'),
      `${(sm.totalTimeMinutes / 60).toFixed(1)}h`,
      sm.reviewedCount,
      escape(ratingLabel),
      escape(sm.latestFeedback || 'Chưa có lời nhận xét')
    ].join(','));
  });

  lines.push('========================================================================================================');
  lines.push('HẾT BÁO CÁO - MOS MASTER TRAINING & CERTIFICATION SYSTEM');
  lines.push('========================================================================================================');

  return '\uFEFF' + lines.join('\n');
}

export function downloadModernSectionedCSVReport(
  submissions: Submission[],
  options: {
    subject: string;
    classRoomFilter?: string;
    teacher: UserProfile;
  }
): string {
  const csvContent = generateModernSectionedCSVReport(submissions, options);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const currentSubjectCode = options.subject !== 'all' ? options.subject : (options.teacher.targetSubject || 'word');
  const dateStamp = new Date().toISOString().slice(0, 10);
  const filename = `MOS_${currentSubjectCode.toUpperCase()}_BaoCao_PhanMuc_${dateStamp}.csv`;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return filename;
}

/**
 * Xuất file Excel cá nhân cho học viên trong mục Hồ sơ năng lực (Analytics)
 */
export function downloadStudentProgressExcelFile(
  stats: UserStats,
  studentUser: UserProfile
): string {
  const wb = XLSX.utils.book_new();
  const dateStamp = new Date().toISOString().slice(0, 10);

  // SHEET 1: TỔNG QUAN TIẾN ĐỘ HỌC TẬP
  const totalAnswered = stats.totalAnswered || 0;
  const totalCorrect = stats.totalCorrect || 0;
  const accuracyRate = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
  const examHistory = stats.examHistory || [];
  const bestScore = examHistory.reduce((max, e) => Math.max(max, e.score), 0);
  const passedExams = examHistory.filter(e => e.passed).length;
  const completedTasks = (stats.completedTaskIds || []).length;
  const wrongCount = (stats.wrongQuestionIds || []).length;
  const bookmarkCount = (stats.bookmarkedQuestionIds || []).length;

  const summaryData: any[][] = [
    ['SỔ THEO DÕI TIẾN ĐỘ & NĂNG LỰC HỌC VIÊN MOS MASTER'],
    ['Hệ Thống Luyện Thi Chứng Chỉ Tin Học Quốc Tế Microsoft Office Specialist'],
    [],
    ['THÔNG TIN HỌC VIÊN'],
    ['Mã Học Viên:', studentUser.studentCode || 'N/A'],
    ['Họ Và Tên:', studentUser.name],
    ['Email:', studentUser.email],
    ['Lớp Học:', studentUser.classRoom || 'N/A'],
    ['Mục Tiêu Chứng Chỉ:', `MOS ${(studentUser.targetSubject || 'word').toUpperCase()}`],
    ['Chuỗi Ngày Học Liên Tục:', `${stats.streakDays || 1} ngày`],
    ['Lần Hoạt Động Gần Nhất:', stats.lastActive ? new Date(stats.lastActive).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN')],
    [],
    ['CÁC CHỈ SỐ NĂNG LỰC ĐẠT ĐƯỢC'],
    ['Chỉ Số', 'Giá Trị', 'Đơn Vị', 'Đánh Giá'],
    ['Tổng câu hỏi lý thuyết đã trả lời', totalAnswered, 'Câu', 'Tiến độ câu hỏi lý thuyết'],
    ['Số câu trả lời chính xác', totalCorrect, 'Câu', 'Tỉ lệ đúng: ' + accuracyRate + '%'],
    ['Tỉ lệ chính xác trung bình', `${accuracyRate}%`, 'Phần trăm', accuracyRate >= 70 ? 'Đạt chuẩn Certiport' : 'Cần cải thiện'],
    ['Số bài tập thực hành đã hoàn thành', completedTasks, 'Bài tập', 'Thực hành trên thanh Ribbon'],
    ['Điểm thi thử Certiport cao nhất', bestScore, 'Điểm / 1000', bestScore >= 700 ? 'ĐỦ ĐIỀU KIỆN ĐẠT CHỨNG CHỈ' : 'Chưa đạt 700'],
    ['Số lần thi thử đạt chuẩn (Pass)', passedExams, 'Lần', `Trên tổng ${examHistory.length} lần thi`],
    ['Số câu hỏi cần xem lại (sai gần nhất)', wrongCount, 'Câu', 'Nên làm lại trong phần Ôn tập câu sai'],
    ['Số câu đã gắn dấu sao (Bookmark)', bookmarkCount, 'Câu', 'Đã lưu để ghi nhớ']
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 38 }, { wch: 24 }, { wch: 18 }, { wch: 36 }];
  applySheetStyles(wsSummary, summaryData.length, 4);

  wsSummary['A1'].s = STYLE_TITLE_BANNER;
  wsSummary['A2'].s = STYLE_SUBTITLE_BANNER;
  wsSummary['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 3 } },
    { s: { r: 12, c: 0 }, e: { r: 12, c: 3 } },
  ];

  XLSX.utils.book_append_sheet(wb, wsSummary, 'Tổng Quan Năng Lực');

  // SHEET 2: LỊCH SỬ THI THỬ CERTIPORT
  if (examHistory.length > 0) {
    const examRows = examHistory.map((ex, idx) => ({
      'Lần Thi': idx + 1,
      'Môn Thi': `MOS ${ex.subject.toUpperCase()}`,
      'Điểm Đạt Được (/1000)': ex.score,
      'Kết Quả': ex.passed ? 'ĐẠT (PASS >= 700) 🏆' : 'CHƯA ĐẠT (FAIL)',
      'Thời Gian Hoàn Thành (Phút)': Math.round(ex.timeSpentSeconds / 60),
      'Số Câu Đúng': `${ex.correctCount} / ${ex.totalQuestions}`,
      'Tỉ Lệ Đúng': `${Math.round((ex.correctCount / ex.totalQuestions) * 100)}%`,
      'Ngày Giờ Thi': new Date(ex.date).toLocaleString('vi-VN')
    }));

    const wsExams = XLSX.utils.json_to_sheet(examRows);
    wsExams['!cols'] = [
      { wch: 10 },
      { wch: 16 },
      { wch: 22 },
      { wch: 24 },
      { wch: 26 },
      { wch: 16 },
      { wch: 16 },
      { wch: 22 }
    ];
    XLSX.utils.book_append_sheet(wb, wsExams, 'Lịch Sử Thi Thử');
  }

  // SHEET 3: DANH SÁCH CÂU SAI & ĐÁNH DẤU
  const reviewRows = [
    ...(stats.wrongQuestionIds || []).map((id, idx) => ({
      'STT': idx + 1,
      'Mã Câu Hỏi': id,
      'Phân Loại': 'Câu hỏi trả lời sai',
      'Trạng Thái': 'Cần luyện lại ngay',
      'Đề Xuất': 'Xem lại lý thuyết và làm lại trong mục Câu Sai'
    })),
    ...(stats.bookmarkedQuestionIds || []).map((id, idx) => ({
      'STT': idx + 1 + (stats.wrongQuestionIds || []).length,
      'Mã Câu Hỏi': id,
      'Phân Loại': 'Câu hỏi đánh dấu sao ⭐',
      'Trạng Thái': 'Cần lưu ý đặc biệt',
      'Đề Xuất': 'Đọc kỹ mẹo thi Certiport liên quan'
    }))
  ];

  if (reviewRows.length > 0) {
    const wsReviews = XLSX.utils.json_to_sheet(reviewRows);
    wsReviews['!cols'] = [
      { wch: 6 },
      { wch: 18 },
      { wch: 26 },
      { wch: 24 },
      { wch: 45 }
    ];
    XLSX.utils.book_append_sheet(wb, wsReviews, 'Câu Hỏi Cần Ôn Tập');
  }

  const filename = `MOS_SoTheoDoi_HocVien_${studentUser.studentCode || studentUser.name.replace(/\s+/g, '_')}_${dateStamp}.xlsx`;
  XLSX.writeFile(wb, filename);
  return filename;
}
