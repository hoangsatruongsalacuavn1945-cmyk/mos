import React from 'react';

export interface WordDocumentViewProps {
  margins: 'normal' | 'narrow' | 'moderate' | 'wide';
  orientation: 'portrait' | 'landscape';
  lineSpacing: string;
  styleHeading: string;
  watermark?: string;
  hasTable?: boolean;
  selectedParagraph?: number;
}

export const WordDocumentView: React.FC<WordDocumentViewProps> = ({
  margins,
  orientation,
  lineSpacing,
  styleHeading,
  watermark,
  hasTable,
  selectedParagraph = 2,
}) => {
  // Compute padding based on margin setting
  const getMarginPadding = () => {
    switch (margins) {
      case 'narrow':
        return 'px-6 py-6'; // 0.5 inch
      case 'wide':
        return 'px-16 py-12'; // 2 inch
      case 'moderate':
        return 'px-8 py-8'; // 0.75 inch
      case 'normal':
      default:
        return 'px-12 py-10'; // 1.0 inch
    }
  };

  const getLineSpacingClass = () => {
    switch (lineSpacing) {
      case '1.5':
      case '1.5 lines':
        return 'leading-loose';
      case '2.0':
        return 'leading-[2.5]';
      case '1.0':
      default:
        return 'leading-relaxed';
    }
  };

  return (
    <div className="w-full bg-[#e6e8eb] p-4 sm:p-8 flex flex-col items-center overflow-auto select-text font-serif">
      {/* Top Word Ruler with inch increments */}
      <div className="w-full max-w-[760px] h-5 bg-[#f3f4f6] border border-slate-300 rounded-t flex items-center px-4 text-[9px] text-slate-500 font-mono justify-between mb-1 shadow-2xs">
        <span>| 0</span>
        <span>| 1</span>
        <span>| 2</span>
        <span>| 3</span>
        <span>| 4</span>
        <span>| 5</span>
        <span>| 6</span>
        <span>| 7</span>
        <span className="text-[10px] text-blue-700 font-sans font-bold">
          [Thước Lề: {margins.toUpperCase()} · {margins === 'narrow' ? '0.5 inch (1.27 cm)' : '1.0 inch (2.54 cm)'}]
        </span>
      </div>

      {/* Main A4 Document Sheet */}
      <div
        className={`bg-white shadow-2xl border border-slate-300 rounded-xs transition-all duration-300 relative text-slate-800 ${
          orientation === 'landscape' ? 'max-w-[900px] min-h-[500px]' : 'max-w-[760px] min-h-[640px]'
        } w-full ${getMarginPadding()}`}
      >
        {/* Watermark Overlay if applied */}
        {watermark && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-0">
            <span className="text-6xl sm:text-7xl font-black text-slate-200/60 -rotate-45 select-none tracking-widest uppercase font-sans">
              {watermark}
            </span>
          </div>
        )}

        {/* Real Document Content */}
        <div className={`relative z-10 space-y-4 ${getLineSpacingClass()}`}>
          {/* Document Header */}
          <div className="border-b border-slate-200 pb-3 mb-4 font-sans text-center">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM — ĐỘC LẬP - TỰ DO - HẠNH PHÚC
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 mt-2 uppercase tracking-wide">
              BÁO CÁO KẾT QUẢ ĐÀO TẠO & KHẢO THÍ CHỨNG CHỈ MOS 2026
            </h1>
            <div className="text-xs text-slate-500 mt-1 italic">
              Tiêu chuẩn kỹ năng số Microsoft Office Specialist (MO-100 / MO-200 / MO-300)
            </div>
          </div>

          {/* Heading 1 */}
          <h2
            className={`font-sans tracking-tight transition-colors ${
              styleHeading === 'Heading 1'
                ? 'text-base font-bold text-[#185abd] border-b-2 border-blue-500 pb-1 mt-4'
                : 'text-sm font-bold text-slate-800 mt-3'
            }`}
          >
            I. MỤC TIÊU VÀ QUY CHUẨN THIẾT LẬP TRANG VĂN BẢN
          </h2>

          {/* Paragraph 1 */}
          <p className="text-xs sm:text-[13px] text-justify text-slate-700 indent-6">
            Nhằm đáp ứng yêu cầu khắt khe của hội đồng khảo thí quốc tế Certiport và nâng cao kỹ năng xử lý văn bản thực tế, học viên cần nắm vững quy trình điều chỉnh bố cục trang in (Page Setup), quản lý khoảng cách lề (Margins), tạo bảng biểu và áp dụng phong cách định dạng tiêu đề (Styles Heading) theo đúng quy chuẩn chính thức.
          </p>

          {/* Target Paragraph 2 (Highlighted for Question 1) */}
          <div
            className={`p-3 rounded transition-all text-xs sm:text-[13px] text-justify ${
              selectedParagraph === 2
                ? 'bg-blue-50/60 border-l-4 border-blue-600 shadow-2xs'
                : 'text-slate-700'
            }`}
          >
            <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wide font-sans mb-1 flex items-center gap-1.5">
              <span>Đoạn văn bản số 2 (Target Paragraph):</span>
              {margins === 'narrow' && (
                <span className="bg-emerald-600 text-white px-1.5 py-0.2 rounded font-black text-[9px]">
                  ✓ NARROW MARGINS ĐÃ ÁP DỤNG
                </span>
              )}
            </div>
            <p className="indent-6 text-slate-800">
              Đối với các báo cáo dự án chuyên sâu, thiết lập lề hẹp <strong>"Narrow"</strong> (khoảng cách trên, dưới, trái, phải đều là <strong>0.5 inch / 1.27 cm</strong>) giúp tận dụng tối đa diện tích hiển thị, gia tăng mật độ chữ viết và bảo đảm toàn bộ nội dung được gom gọn trên một trang in ấn một cách khoa học và trang nhã.
            </p>
          </div>

          {/* Paragraph 3 */}
          <p className="text-xs sm:text-[13px] text-justify text-slate-700 indent-6">
            Học viên tiếp tục thực hiện các thao tác trên thanh Ribbon theo chỉ dẫn của đề bài: chọn đúng Thẻ (Tab), Nhóm lệnh (Group) và Công cụ tương ứng để được chấm điểm tự động chính xác.
          </p>

          {/* Real Word Table if enabled */}
          {hasTable && (
            <div className="mt-4 border border-blue-400 rounded-xs overflow-hidden shadow-xs font-sans text-xs">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#185abd] text-white font-bold text-[11px]">
                    <th className="p-2 border border-blue-500 text-left">Mã Phân Hệ</th>
                    <th className="p-2 border border-blue-500 text-left">Kỹ Năng Đánh Giá</th>
                    <th className="p-2 border border-blue-500 text-center">Thời Lượng</th>
                    <th className="p-2 border border-blue-500 text-center">Điểm Đạt</th>
                  </tr>
                </thead>
                <tbody className="text-[11px] divide-y divide-slate-200">
                  <tr className="bg-white">
                    <td className="p-2 font-mono font-bold text-blue-700">MO-100</td>
                    <td className="p-2">Microsoft Word 365 Core</td>
                    <td className="p-2 text-center">50 phút</td>
                    <td className="p-2 text-center font-bold text-emerald-600">700 / 1000</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="p-2 font-mono font-bold text-emerald-700">MO-200</td>
                    <td className="p-2">Microsoft Excel 365 Core</td>
                    <td className="p-2 text-center">50 phút</td>
                    <td className="p-2 text-center font-bold text-emerald-600">700 / 1000</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Real Word Page Footer */}
        <div className="mt-12 pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-sans">
          <span>Tài liệu thực hành MOS Master Certiport 2026</span>
          <span>Trang 1 / 1</span>
        </div>
      </div>

      {/* Bottom Word Status Bar */}
      <div className="w-full max-w-[760px] bg-[#185abd] text-white px-3 py-1 mt-1 text-[11px] font-sans flex items-center justify-between rounded-b shadow-xs">
        <div className="flex items-center gap-3">
          <span>Trang 1 trên 1</span>
          <span>•</span>
          <span>284 từ</span>
          <span>•</span>
          <span>Tiếng Việt</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Bố trí in ấn (Print Layout)</span>
          <span>•</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
};
