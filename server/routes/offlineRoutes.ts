import { Router, Request, Response, NextFunction } from 'express';
import { THEORY_QUESTIONS } from '../../src/data/theoryQuestions.ts';

const router = Router();

// Subject study guides and ribbon references
const SUBJECT_STUDY_MATERIALS = {
  word: {
    subject: 'word',
    code: 'MO-100',
    title: 'Microsoft Word Associate 2019/365',
    totalLessons: 5,
    lessons: [
      {
        id: 'w-lesson-1',
        domainCode: '1.1-1.4',
        title: 'Quản Lý Tài Liệu & Cấu Trúc Trang',
        keyConcepts: ['Page Setup', 'Margins', 'Watermark', 'Page Color', 'Headers & Footers'],
        ribbonPaths: [
          'Layout > Margins > Custom Margins',
          'Design > Page Background > Watermark > Custom Watermark',
          'Insert > Header & Footer > Page Number > Bottom of Page',
        ],
        examTips: 'Đề thi thường yêu cầu đặt lề Mirrored Margins hoặc chỉ hiển thị Header ở trang thứ hai (Different First Page).',
      },
      {
        id: 'w-lesson-2',
        domainCode: '2.1-2.4',
        title: 'Định Dạng Đoạn Văn, Văn Bản & Section',
        keyConcepts: ['Line Spacing', 'Paragraph Spacing', 'Section Breaks (Next Page/Continuous)', 'Hyphenation'],
        ribbonPaths: [
          'Home > Paragraph Dialog Box Launcher > Spacing: Exactly 1.15',
          'Layout > Page Setup > Breaks > Next Page',
          'Layout > Page Setup > Hyphenation > Automatic',
        ],
        examTips: 'Lưu ý phân biệt Section Break Next Page (tách trang và cho phép đổi hướng giấy Ngang/Dọc) và Continuous.',
      },
      {
        id: 'w-lesson-3',
        domainCode: '3.1-3.2',
        title: 'Bảng Biểu & Danh Sách Đa Cấp',
        keyConcepts: ['Convert Text to Table', 'Repeat Header Rows', 'Sort Table', 'Multilevel List'],
        ribbonPaths: [
          'Insert > Tables > Table > Convert Text to Table',
          'Table Design > Table Style Options > Header Row',
          'Table Layout > Data > Repeat Header Rows',
        ],
        examTips: 'Kỹ năng Repeat Header Rows luôn xuất hiện trong các bài thi có bảng dài hơn 1 trang.',
      },
      {
        id: 'w-lesson-4',
        domainCode: '4.1-4.3',
        title: 'Mục Lục Tự Động & Trích Dẫn Nguồn (Citations)',
        keyConcepts: ['Table of Contents (Automatic Table 2)', 'Insert Footnote', 'Insert Citation (APA Style)', 'Bibliography'],
        ribbonPaths: [
          'References > Table of Contents > Automatic Table 2',
          'References > Footnotes > Insert Footnote (Ctrl+Alt+F)',
          'References > Citations & Bibliography > Style: APA',
        ],
        examTips: 'Luôn gán Heading 1, Heading 2 cho tiêu đề trước khi chèn Table of Contents.',
      },
      {
        id: 'w-lesson-5',
        domainCode: '5.1-5.4',
        title: 'Đồ Họa, SmartArt & Trộn Thư (Mail Merge)',
        keyConcepts: ['SmartArt Hierarchy', 'Alt Text', 'Wrap Text: Tight/Square', 'Mail Merge Letters'],
        ribbonPaths: [
          'Insert > Illustrations > SmartArt > Hierarchy > Organization Chart',
          'Picture Format > Accessibility > Alt Text',
          'Mailings > Start Mail Merge > Letters > Select Recipients',
        ],
        examTips: 'Quy tắc Certiport: Luôn điền Alt Text vào ô Description (không chỉ tiêu đề Title).',
      },
    ],
  },
  excel: {
    subject: 'excel',
    code: 'MO-200',
    title: 'Microsoft Excel Associate 2019/365',
    totalLessons: 5,
    lessons: [
      {
        id: 'e-lesson-1',
        domainCode: '1.1-1.4',
        title: 'Quản Lý Trang Tính & Vùng In (Print Area)',
        keyConcepts: ['Freeze Panes', 'Print Titles', 'Set Print Area', 'Unhide Sheet', 'Tab Color'],
        ribbonPaths: [
          'View > Window > Freeze Panes > Freeze Top Row',
          'Page Layout > Page Setup > Print Titles > Rows to repeat at top',
          'Page Layout > Page Setup > Print Area > Set Print Area',
        ],
        examTips: 'Trong đề thi, câu hỏi Freeze Panes yêu cầu đứng ở đúng ô giao cắt trước khi ấn Freeze Panes.',
      },
      {
        id: 'e-lesson-2',
        domainCode: '2.1-2.4',
        title: 'Dữ Liệu Ô, Dải Ô & Định Dạng Có Điều Kiện',
        keyConcepts: ['Name Range', 'Conditional Formatting (Highlight Cells, Top 10%)', 'Flash Fill', 'Paste Special Transpose'],
        ribbonPaths: [
          'Formulas > Defined Names > Define Name',
          'Home > Styles > Conditional Formatting > Highlight Cells Rules',
          'Home > Editing > Fill > Flash Fill (Ctrl+E)',
        ],
        examTips: 'Đặt tên Name Range không được chứa khoảng trắng hoặc ký tự đặc biệt.',
      },
      {
        id: 'e-lesson-3',
        domainCode: '3.1-3.4',
        title: 'Bảng Tính Excel Table & Sắp Xếp / Bộ Lọc',
        keyConcepts: ['Format as Table', 'Total Row', 'Convert to Range', 'Sort Multi-level', 'Remove Duplicates'],
        ribbonPaths: [
          'Insert > Tables > Table (Ctrl+T)',
          'Table Design > Table Style Options > Total Row',
          'Table Design > Tools > Convert to Range',
        ],
        examTips: 'Total Row cho phép chọn hàm tính toán (SUM, AVERAGE, COUNT) ngay tại mũi tên góc ô mà không cần viết công thức thủ công.',
      },
      {
        id: 'e-lesson-4',
        domainCode: '4.1-4.3',
        title: 'Hàm Số & Công Thức Logic Quan Trọng',
        keyConcepts: ['SUM, AVERAGE, COUNT, MAX, MIN', 'IF đơn & IF lồng', 'VLOOKUP / XLOOKUP', 'COUNTIF / SUMIF', 'CONCAT, UPPER, LOWER, PROPER'],
        ribbonPaths: [
          'Formulas > Function Library > Logical > IF',
          'Formulas > Function Library > Lookup & Reference > VLOOKUP',
          'Formulas > Function Library > Text > PROPER',
        ],
        examTips: 'Quy tắc VLOOKUP: Cột chứa giá trị dò tìm bắt buộc phải là cột đầu tiên (index 1) của bảng tham chiếu range_lookup.',
      },
      {
        id: 'e-lesson-5',
        domainCode: '5.1-5.3',
        title: 'Biểu Đồ Trực Quan & Đường Xu Hướng (Trendline)',
        keyConcepts: ['Clustered Column', 'Line with Markers', 'Move Chart to New Sheet', 'Add Trendline', 'Switch Row/Column'],
        ribbonPaths: [
          'Insert > Charts > Insert Column or Bar Chart > Clustered Column',
          'Chart Design > Location > Move Chart > New sheet',
          'Chart Design > Chart Layouts > Add Chart Element > Trendline > Linear',
        ],
        examTips: 'Khi đề thi yêu cầu đặt tên sheet mới cho biểu đồ, nhập chính xác từng chữ cái (có phân biệt hoa/thường).',
      },
    ],
  },
  powerpoint: {
    subject: 'powerpoint',
    code: 'MO-300',
    title: 'Microsoft PowerPoint Associate 2019/365',
    totalLessons: 5,
    lessons: [
      {
        id: 'p-lesson-1',
        domainCode: '1.1-1.4',
        title: 'Slide Master & Bố Cục Bản Trình Chiếu Mẫu',
        keyConcepts: ['Slide Master View', 'Insert Layout', 'Slide Size (Standard 4:3 vs Widescreen 16:9)', 'Handout Master'],
        ribbonPaths: [
          'View > Master Views > Slide Master',
          'Slide Master > Master Layout > Insert Layout',
          'Design > Customize > Slide Size > Standard (4:3)',
        ],
        examTips: 'Khi chỉnh sửa ở Slide Master trên cùng (Master lớn), tất cả các layout con bên dưới sẽ tự động kế thừa.',
      },
      {
        id: 'p-lesson-2',
        domainCode: '2.1-2.3',
        title: 'Quản Lý Slide, Section & Thu Phóng (Zoom)',
        keyConcepts: ['Add Section', 'Reuse Slides', 'Slide Zoom', 'Summary Zoom', 'Hide Slide'],
        ribbonPaths: [
          'Home > Slides > Section > Add Section',
          'Home > Slides > New Slide > Reuse Slides',
          'Insert > Links > Zoom > Summary Zoom',
        ],
        examTips: 'Tính năng Reuse Slides giúp nhập các trang thuyết trình từ file PPTX khác mà vẫn giữ nguyên giao diện gốc.',
      },
      {
        id: 'p-lesson-3',
        domainCode: '3.1-3.4',
        title: 'Hình Khối, Đa Phương Tiện & Đồ Họa 3D',
        keyConcepts: ['Merge Shapes (Union, Combine, Fragment)', 'Insert Video / Audio', 'Trim Video', '3D Models Animations'],
        ribbonPaths: [
          'Shape Format > Insert Shapes > Merge Shapes > Fragment',
          'Insert > Media > Video > Video on My PC',
          'Playback > Editing > Trim Video',
        ],
        examTips: 'Để hợp nhất Merge Shapes, cần chọn ít nhất 2 hình dạng cùng lúc bằng cách giữ phím Shift.',
      },
      {
        id: 'p-lesson-4',
        domainCode: '4.1-4.3',
        title: 'Bảng Biểu, Biểu Đồ & SmartArt Danh Sách',
        keyConcepts: ['Insert SmartArt Cycle / Process', 'Convert Text to SmartArt', 'Chart Layout', 'Table Styles'],
        ribbonPaths: [
          'Insert > Illustrations > SmartArt > Process',
          'Home > Paragraph > Convert to SmartArt',
          'Chart Design > Chart Layouts > Quick Layout',
        ],
        examTips: 'Có thể chuyển đổi nhanh một danh sách dấu đầu dòng (Bullet list) thành SmartArt bằng nút Convert to SmartArt trên tab Home.',
      },
      {
        id: 'p-lesson-5',
        domainCode: '5.1-5.3',
        title: 'Hiệu Ứng Chuyển Trang Morph & Animation Nâng Cao',
        keyConcepts: ['Morph Transition', 'Animation Pane', 'Effect Options', 'Trigger Animation', 'Set Up Slide Show (Kiosk)'],
        ribbonPaths: [
          'Transitions > Transition to This Slide > Morph',
          'Animations > Advanced Animation > Animation Pane',
          'Slide Show > Set Up > Set Up Slide Show > Browsed at a kiosk (full screen)',
        ],
        examTips: 'Hiệu ứng Morph yêu cầu nhân bản (Duplicate) slide và di chuyển đối tượng để tạo hoạt ảnh mượt mà.',
      },
    ],
  },
};

/**
 * GET /api/offline/bundle
 * Delivers comprehensive pre-packaged questions and materials for offline storage
 */
router.get('/bundle', (req: Request, res: Response, next: NextFunction) => {
  try {
    const subject = (req.query.subject as string) || 'all';

    // 1. Filter Questions
    let questions = [...THEORY_QUESTIONS];
    if (subject && subject !== 'all') {
      questions = questions.filter(q => q.subject === subject);
    }

    // 2. Filter Study Materials
    let materials: Record<string, any> = {};
    if (subject === 'all') {
      materials = SUBJECT_STUDY_MATERIALS;
    } else if (SUBJECT_STUDY_MATERIALS[subject as keyof typeof SUBJECT_STUDY_MATERIALS]) {
      materials[subject] = SUBJECT_STUDY_MATERIALS[subject as keyof typeof SUBJECT_STUDY_MATERIALS];
    }

    // 3. Return complete offline study package
    return res.json({
      success: true,
      subject,
      version: '2026.1',
      totalQuestions: questions.length,
      questions,
      materials,
      downloadedAt: new Date().toISOString(),
      offlineReady: true,
      message: 'Gói dữ liệu ôn tập ngoại tuyến đã sẵn sàng để lưu vào bộ nhớ đệm thiết bị.',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/offline/materials
 * Specific endpoint for study notes and ribbon cheatsheets
 */
router.get('/materials', (req: Request, res: Response) => {
  const subject = (req.query.subject as string) || 'all';
  if (subject !== 'all' && SUBJECT_STUDY_MATERIALS[subject as keyof typeof SUBJECT_STUDY_MATERIALS]) {
    return res.json({
      success: true,
      data: SUBJECT_STUDY_MATERIALS[subject as keyof typeof SUBJECT_STUDY_MATERIALS],
    });
  }
  return res.json({
    success: true,
    data: SUBJECT_STUDY_MATERIALS,
  });
});

export default router;
