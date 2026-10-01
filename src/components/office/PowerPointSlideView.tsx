import React from 'react';
import { Presentation, Layout, Play, Volume2 } from 'lucide-react';

export interface PowerPointSlideViewProps {
  slideTransition?: string;
  activeAnimation?: string;
  hasSmartArt?: boolean;
}

export const PowerPointSlideView: React.FC<PowerPointSlideViewProps> = ({
  slideTransition = 'Morph',
  activeAnimation,
  hasSmartArt,
}) => {
  return (
    <div className="w-full bg-[#333b48] p-4 sm:p-8 flex flex-col items-center select-none font-sans text-xs">
      {/* PPT Top Slide Workspace */}
      <div className="w-full max-w-[840px] flex gap-3">
        {/* Left Slide Thumbnails Column */}
        <div className="hidden sm:flex flex-col gap-2 w-28 shrink-0">
          <div className="p-1.5 bg-orange-950/40 border-2 border-[#d24726] rounded shadow-md cursor-pointer">
            <span className="text-[10px] text-orange-300 font-bold block mb-1">1</span>
            <div className="aspect-video bg-white rounded-xs p-1 flex flex-col justify-center items-center text-center">
              <span className="text-[8px] font-bold text-slate-800 leading-tight">MOS Certiport 2026</span>
            </div>
          </div>

          <div className="p-1.5 bg-slate-800/60 border border-slate-700 hover:border-slate-500 rounded cursor-pointer opacity-70 hover:opacity-100 transition-opacity">
            <span className="text-[10px] text-slate-400 font-bold block mb-1">2</span>
            <div className="aspect-video bg-white rounded-xs p-1 flex flex-col justify-center items-center text-center">
              <span className="text-[7px] text-slate-600">Nội Dung Thực Hành</span>
            </div>
          </div>
        </div>

        {/* Main 16:9 Presentation Canvas */}
        <div className="flex-1 bg-white rounded shadow-2xl border border-slate-400 aspect-video max-h-[460px] p-6 sm:p-10 flex flex-col justify-between relative overflow-hidden text-slate-800">
          {/* Transition badge if applied */}
          {slideTransition && (
            <div className="absolute top-3 right-4 bg-orange-100 text-orange-900 border border-orange-300 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 animate-in fade-in">
              <Play className="w-3 h-3 text-orange-600" />
              <span>Hiệu ứng Transition: {slideTransition}</span>
            </div>
          )}

          {/* Slide Header Title */}
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#d24726] tracking-tight uppercase border-b-2 border-orange-500 pb-2">
              KẾ HOẠCH KHẢO THÍ CHỨNG CHỈ MOS POWERPOINT
            </h1>
            <p className="text-xs text-slate-500 mt-1 italic font-medium">
              Chuyên đề: Thiết lập Slide Master, Bố cục trang chiếu và Hiệu ứng Morph 365
            </p>
          </div>

          {/* Slide Body Content */}
          <div className="space-y-3 my-auto">
            <div className="flex items-start gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[#d24726] mt-1.5 shrink-0" />
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                Ứng dụng hiệu ứng chuyển trang <strong>Morph Transition</strong> để tạo chuyển động biến hình mượt mà giữa các trang chiếu liên tiếp theo chuẩn Certiport MO-300.
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[#d24726] mt-1.5 shrink-0" />
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                Quản trị phân cấp Slide Master (Master Slide) giúp đồng bộ nhận diện logo, phông chữ tiêu đề và chân trang cho toàn bộ bản thuyết trình chỉ với một lần thao tác.
              </p>
            </div>

            {hasSmartArt && (
              <div className="grid grid-cols-3 gap-2 mt-4 p-2 bg-orange-50 rounded border border-orange-200">
                <div className="bg-[#d24726] text-white p-2 rounded text-center font-bold text-[10px]">
                  1. Chuẩn Bị
                </div>
                <div className="bg-orange-600 text-white p-2 rounded text-center font-bold text-[10px]">
                  2. Thực Hành
                </div>
                <div className="bg-emerald-600 text-white p-2 rounded text-center font-bold text-[10px]">
                  3. Đạt Chứng Chỉ
                </div>
              </div>
            )}
          </div>

          {/* Slide Footer */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
            <span>Microsoft Office Specialist (MOS PowerPoint 365)</span>
            <span className="font-bold">Trang chiếu 1 / 2</span>
          </div>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="w-full max-w-[840px] bg-[#d24726] text-white px-3 py-1 mt-2 text-[11px] flex items-center justify-between rounded shadow-xs">
        <div className="flex items-center gap-3">
          <span>Trang chiếu 1 trên 2</span>
          <span>•</span>
          <span>Tiếng Việt</span>
          <span>•</span>
          <span>Không có ghi chú diễn giả</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Tỷ lệ 16:9 Widescreen</span>
          <span>•</span>
          <span>66%</span>
        </div>
      </div>
    </div>
  );
};
