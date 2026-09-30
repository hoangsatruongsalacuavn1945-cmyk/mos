import * as XLSX from 'xlsx';

export interface WorkerTaskEvaluation {
  taskId: string;
  taskNumber: number;
  instruction: string;
  passed: boolean;
  points: number;
  message: string;
  actualFormula?: string;
  actualValue?: any;
}

export interface WorkerGradingResult {
  score: number;
  passed: boolean;
  taskBreakdown: WorkerTaskEvaluation[];
}

self.onmessage = (event: MessageEvent<{ fileBuffer: ArrayBuffer; projectId: string }>) => {
  const { fileBuffer, projectId } = event.data;

  try {
    self.postMessage({ type: 'STATUS', stage: 'parsing', progress: 30, message: 'Đang giải mã bảng tính Excel trong luồng nền (Web Worker)...' });

    const data = new Uint8Array(fileBuffer);
    const wb = XLSX.read(data, { type: 'array', cellFormula: true, cellStyles: true, cellNF: true });

    self.postMessage({ type: 'STATUS', stage: 'evaluating', progress: 65, message: 'Đang phân tích các công thức, hàm và cấu trúc trang tính...' });

    const taskBreakdown: WorkerTaskEvaluation[] = [];

    if (projectId === 'excel-proj-01') {
      // Task 1: Sheet name DoanhThu_2026
      const hasSheet = wb.SheetNames.includes('DoanhThu_2026');
      taskBreakdown.push({
        taskId: 't1',
        taskNumber: 1,
        instruction: 'Đổi tên trang tính "Sheet1" thành "DoanhThu_2026".',
        passed: hasSheet,
        points: hasSheet ? 250 : 0,
        message: hasSheet 
          ? 'Chính xác! Đã tìm thấy trang tính "DoanhThu_2026".' 
          : 'Chưa đạt! Tên trang tính vẫn là Sheet1 hoặc không đúng cú pháp "DoanhThu_2026".',
      });

      const sheetName = hasSheet ? 'DoanhThu_2026' : wb.SheetNames[0];
      const ws = wb.Sheets[sheetName] || {};

      // Task 2: E2 = C2 * D2
      const cellE2 = ws['E2'];
      if (!cellE2) {
        taskBreakdown.push({
          taskId: 't2',
          taskNumber: 2,
          instruction: 'Tại ô E2, nhập công thức tính Thành tiền = Số lượng * Đơn giá (=C2*D2) và sao chép xuống các ô E3:E7.',
          passed: false,
          points: 0,
          message: 'Ô E2 chưa có dữ liệu hoặc công thức.',
        });
      } else {
        const formula = (cellE2.f || '').replace(/\s+/g, '').toUpperCase();
        const val = cellE2.v;
        const isFormulaCorrect = formula === '=C2*D2' || formula === '=D2*C2' || formula.includes('PRODUCT');
        const isValueCorrect = val === 67500000 || Number(val) === 67500000;
        const passed = isFormulaCorrect || isValueCorrect;

        taskBreakdown.push({
          taskId: 't2',
          taskNumber: 2,
          instruction: 'Tại ô E2, nhập công thức tính Thành tiền = Số lượng * Đơn giá (=C2*D2) và sao chép xuống các ô E3:E7.',
          passed,
          points: passed ? 250 : 0,
          actualFormula: cellE2.f || 'Không có công thức (Nhập số tĩnh)',
          actualValue: cellE2.v,
          message: isFormulaCorrect 
            ? `Chính xác! Công thức [${cellE2.f}] cho kết quả ${cellE2.v?.toLocaleString()} VNĐ.` 
            : `Công thức ô E2 chưa chuẩn. Thực tế: [${cellE2.f || 'Trống'}]. Yêu cầu: =C2*D2`,
        });
      }

      // Task 3: SUM(E2:E7) in E9
      const cellE9 = ws['E9'];
      if (!cellE9) {
        taskBreakdown.push({
          taskId: 't3',
          taskNumber: 3,
          instruction: 'Tại ô E9, sử dụng hàm =SUM(E2:E7) để tính Tổng Doanh Thu của tất cả các sản phẩm.',
          passed: false,
          points: 0,
          message: 'Ô E9 chưa có dữ liệu hoặc công thức.',
        });
      } else {
        const formula = (cellE9.f || '').replace(/\s+/g, '').toUpperCase();
        const isSum = formula.includes('SUM(') && formula.includes('E2') && formula.includes('E7');
        const passed = isSum || cellE9.v === 252900000;

        taskBreakdown.push({
          taskId: 't3',
          taskNumber: 3,
          instruction: 'Tại ô E9, sử dụng hàm =SUM(E2:E7) để tính Tổng Doanh Thu của tất cả các sản phẩm.',
          passed,
          points: passed ? 250 : 0,
          actualFormula: cellE9.f || 'Không có công thức SUM',
          actualValue: cellE9.v,
          message: isSum 
            ? `Chính xác! Đã sử dụng hàm tính tổng [${cellE9.f}] với kết quả ${cellE9.v?.toLocaleString()} VNĐ.` 
            : `Chưa đạt chuẩn Certiport. Cần sử dụng hàm =SUM(E2:E7) tại ô E9 thay vì phép cộng đơn lẻ.`,
        });
      }

      // Task 4: AVERAGE in E10, MAX in E11
      const cellE10 = ws['E10'];
      const cellE11 = ws['E11'];
      const f10 = (cellE10?.f || '').replace(/\s+/g, '').toUpperCase();
      const f11 = (cellE11?.f || '').replace(/\s+/g, '').toUpperCase();
      const hasAvg = f10.includes('AVERAGE(') && f10.includes('E2') && f10.includes('E7');
      const hasMax = f11.includes('MAX(') && f11.includes('E2') && f11.includes('E7');
      const passed4 = (hasAvg && hasMax) || (cellE10?.v && cellE11?.v);

      taskBreakdown.push({
        taskId: 't4',
        taskNumber: 4,
        instruction: 'Tại ô E10 và E11: Thiết lập hàm tính Trung bình =AVERAGE(E2:E7) và Cao nhất =MAX(E2:E7).',
        passed: passed4,
        points: passed4 ? 250 : 0,
        actualFormula: `E10: ${cellE10?.f || 'Trống'} | E11: ${cellE11?.f || 'Trống'}`,
        actualValue: `Avg: ${cellE10?.v} | Max: ${cellE11?.v}`,
        message: passed4 
          ? `Xuất sắc! Cả hai hàm AVERAGE và MAX đều được áp dụng chuẩn xác trên vùng dữ liệu E2:E7.` 
          : `Cần hoàn thiện cả 2 hàm: =AVERAGE(E2:E7) tại ô E10 và =MAX(E2:E7) tại ô E11.`,
      });
    } else {
      // Default project 2 (BangLuong / VLOOKUP & IF)
      const hasBangLuong = wb.SheetNames.includes('BangLuong');
      const ws = wb.Sheets['BangLuong'] || wb.Sheets[wb.SheetNames[0]] || {};

      const cellD2 = ws['D2'];
      const formulaD2 = (cellD2?.f || '').replace(/\s+/g, '').toUpperCase();
      const isVlookup = formulaD2.includes('VLOOKUP(') || formulaD2.includes('XLOOKUP(');

      taskBreakdown.push({
        taskId: 'p2-t1',
        taskNumber: 1,
        instruction: 'Tại sheet "BangLuong", ô D2: Dùng hàm =VLOOKUP(...) tra cứu Hệ số lương từ bảng tham chiếu.',
        passed: isVlookup || !!cellD2?.v,
        points: (isVlookup || !!cellD2?.v) ? 500 : 0,
        actualFormula: cellD2?.f || 'Không tìm thấy hàm tra cứu',
        actualValue: cellD2?.v,
        message: isVlookup 
          ? `Chính xác! Đã dùng công thức [${cellD2?.f}] để tra cứu hệ số.` 
          : `Yêu cầu sử dụng hàm VLOOKUP hoặc XLOOKUP tại ô D2.`,
      });

      const cellF2 = ws['F2'];
      const formulaF2 = (cellF2?.f || '').replace(/\s+/g, '').toUpperCase();
      const isIf = formulaF2.includes('IF(');

      taskBreakdown.push({
        taskId: 'p2-t2',
        taskNumber: 2,
        instruction: 'Tại sheet "BangLuong", ô F2: Dùng hàm =IF(E2>=50000000, "Đạt", "Chưa Đạt") để đánh giá KPI doanh số.',
        passed: isIf || cellF2?.v === 'Đạt',
        points: (isIf || cellF2?.v === 'Đạt') ? 500 : 0,
        actualFormula: cellF2?.f || 'Không có hàm IF',
        actualValue: cellF2?.v,
        message: isIf 
          ? `Chính xác! Hàm điều kiện [${cellF2?.f}] cho kết quả xếp loại "${cellF2?.v}".` 
          : `Cần dùng hàm =IF(E2>=50000000, "Đạt", "Chưa Đạt") để tự động xếp loại.`,
      });
    }

    const totalEarned = taskBreakdown.reduce((sum, t) => sum + t.points, 0);
    const passed = totalEarned >= 700;

    self.postMessage({
      type: 'RESULT',
      result: {
        score: totalEarned,
        passed,
        taskBreakdown,
      },
    });
  } catch (error: any) {
    self.postMessage({
      type: 'ERROR',
      error: error.message || 'Lỗi khi phân tích tệp bảng tính',
    });
  }
};
