import React, { useState, useEffect } from 'react';
import { 
  Star, 
  MessageSquare, 
  X, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Monitor, 
  Laptop, 
  Smartphone, 
  Sparkles, 
  HelpCircle,
  Bug,
  ThumbsUp,
  Lightbulb
} from 'lucide-react';
import { useAuthStore } from '../utils/userStore';
import { feedbackClientService, FeedbackSubmission } from '../services/feedbackClientService';
import { soundManager } from '../utils/audio';
import confetti from 'canvas-confetti';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: 'bug_report' | 'screen_display' | 'ui_rating' | 'exam_question' | 'feature_request';
}

const CATEGORIES = [
  {
    id: 'screen_display',
    label: 'Khuất Máy / Lỗi Giao Diện',
    icon: Monitor,
    color: 'text-amber-600 bg-amber-50 border-amber-300 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300',
    desc: 'Bị che mất nút, giao diện tràn màn hình hoặc không vừa khung máy thi'
  },
  {
    id: 'bug_report',
    label: 'Báo Lỗi Hệ Thống / Đơ Lag',
    icon: Bug,
    color: 'text-rose-600 bg-rose-50 border-rose-300 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300',
    desc: 'Lỗi nộp bài, không tính điểm hoặc thao tác không phản hồi'
  },
  {
    id: 'ui_rating',
    label: 'Đánh Giá Trải Nghiệm Web',
    icon: ThumbsUp,
    color: 'text-blue-600 bg-blue-50 border-blue-300 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300',
    desc: 'Cảm nhận và xếp hạng độ hài lòng khi ôn thi trên MOS Master'
  },
  {
    id: 'feature_request',
    label: 'Góp Ý & Đề Xuất Mới',
    icon: Lightbulb,
    color: 'text-purple-600 bg-purple-50 border-purple-300 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-300',
    desc: 'Đóng góp ý tưởng thêm dạng bài tập, công cụ hoặc cải tiến mới'
  },
  {
    id: 'exam_question',
    label: 'Thắc Mắc Đề & Đáp Án',
    icon: HelpCircle,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300',
    desc: 'Hỏi đáp về câu hỏi trắc nghiệm, lệnh Ribbon hoặc chuẩn Certiport'
  }
] as const;

const RATING_LABELS: Record<number, string> = {
  1: 'Rất cần cải thiện (1/5)',
  2: 'Chưa hài lòng (2/5)',
  3: 'Bình thường (3/5)',
  4: 'Tốt & Dễ dùng (4/5)',
  5: 'Xuất sắc & Tuyệt vời! (5/5)'
};

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  defaultCategory = 'screen_display'
}) => {
  const { user } = useAuthStore();

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [category, setCategory] = useState<'bug_report' | 'screen_display' | 'ui_rating' | 'exam_question' | 'feature_request' | 'other'>(defaultCategory);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [name, setName] = useState(user.name || user.fullName || '');
  const [email, setEmail] = useState(user.email || '');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Auto-detect client viewport and hardware information
  const [deviceDetails, setDeviceDetails] = useState({
    viewport: '',
    screen: '',
    userAgent: '',
    pageUrl: '',
    isSmallScreen: false,
  });

  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      setErrorMessage('');
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const sw = window.screen.width;
      const sh = window.screen.height;

      setDeviceDetails({
        viewport: `${vw} x ${vh} px`,
        screen: `${sw} x ${sh} px (${window.devicePixelRatio || 1}x DPI)`,
        userAgent: navigator.userAgent,
        pageUrl: window.location.pathname + window.location.search,
        isSmallScreen: vw < 1280,
      });

      if (user.name) setName(user.name);
      if (user.email) setEmail(user.email);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMessage('Vui lòng nhập nội dung phản hồi hoặc mô tả lỗi bạn gặp phải.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const payload: FeedbackSubmission = {
        userId: user.id || 'guest',
        userName: name.trim() || 'Người dùng ẩn danh',
        userEmail: email.trim(),
        rating,
        category,
        title: title.trim() || (category === 'screen_display' ? 'Báo cáo khuất máy / lỗi giao diện' : 'Phản hồi từ học viên'),
        description: description.trim(),
        deviceInfo: navigator.userAgent.slice(0, 150),
        screenResolution: `Viewport: ${deviceDetails.viewport} | Screen: ${deviceDetails.screen}`,
        pageUrl: deviceDetails.pageUrl,
        priority,
      };

      const result = await feedbackClientService.submitFeedback(payload);

      if (!result.success) {
        throw new Error(result.error || 'Gửi thất bại');
      }

      setIsSuccess(true);
      soundManager.playCorrect();

      // Trigger celebratory confetti
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {
        // ignore if confetti blocked
      }

      // Reset fields
      setTimeout(() => {
        setTitle('');
        setDescription('');
      }, 500);

    } catch (err: any) {
      setErrorMessage(err.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-xs">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight leading-snug">
                  Đánh Giá Website & Báo Lỗi Cho Chủ Sở Hữu
                </h3>
              </div>
              <p className="text-xs text-blue-100/90 leading-tight">
                Phản hồi của bạn được gửi trực tiếp đến Ban Quản Trị & lưu vào CSDL / Google Sheets
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="p-1.5 rounded-xl hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success View */}
        {isSuccess ? (
          <div className="p-8 text-center flex-1 flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2 max-w-md">
              <h4 className="text-xl font-black text-slate-900 dark:text-white">
                Cảm Ơn Bạn Đã Gửi Đánh Giá & Góp Ý!
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Hệ thống đã tiếp nhận báo cáo của bạn cùng với thông số màn hình ({deviceDetails.viewport}). Chủ sở hữu sẽ kiểm tra và tối ưu giao diện sớm nhất!
              </p>
            </div>

            <div className="pt-4 flex items-center gap-3">
              <button
                onClick={() => setIsSuccess(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Gửi thêm ý kiến khác
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
              >
                Đóng
              </button>
            </div>
          </div>
        ) : (
          /* Form Content with Smooth Scroll */
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
            
            {/* Auto Device & Screen Info Notice */}
            <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/80 flex items-start gap-3 text-xs">
              <Laptop className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                  <span>Hệ thống tự động ghi nhận thông số máy của bạn:</span>
                  {deviceDetails.isSmallScreen && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-bold">
                      Màn hình nhỏ
                    </span>
                  )}
                </div>
                <div className="text-blue-700/90 dark:text-blue-400/90 mt-0.5 flex flex-wrap gap-x-3 gap-y-1">
                  <span>Khung nhìn: <strong className="text-blue-950 dark:text-blue-200">{deviceDetails.viewport}</strong></span>
                  <span>·</span>
                  <span>Màn hình: <strong className="text-blue-950 dark:text-blue-200">{deviceDetails.screen}</strong></span>
                  <span>·</span>
                  <span>Trang: <strong className="text-blue-950 dark:text-blue-200">{deviceDetails.pageUrl}</strong></span>
                </div>
                <div className="text-[11px] text-blue-600/80 dark:text-blue-400/80 mt-1">
                  * Thông tin này giúp kỹ sư tái hiện chính xác lỗi giao diện hoặc vị trí bị khuất nút trên máy bạn.
                </div>
              </div>
            </div>

            {/* 1. Star Rating Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                1. Đánh Giá Trải Nghiệm Chung Của Bạn
              </label>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 p-2 rounded-2xl border border-slate-200 dark:border-slate-700">
                  {[1, 2, 3, 4, 5].map((starValue) => {
                    const activeVal = hoverRating || rating;
                    const isFilled = starValue <= activeVal;

                    return (
                      <button
                        type="button"
                        key={starValue}
                        onClick={() => {
                          soundManager.playClick();
                          setRating(starValue);
                        }}
                        onMouseEnter={() => setHoverRating(starValue)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1.5 hover:scale-125 transition-transform cursor-pointer"
                        title={RATING_LABELS[starValue]}
                      >
                        <Star 
                          className={`w-6 h-6 transition-colors ${
                            isFilled 
                              ? 'text-amber-400 fill-amber-400 drop-shadow-xs' 
                              : 'text-slate-300 dark:text-slate-600'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 px-2 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 rounded-lg border border-amber-200 dark:border-amber-800">
                  {RATING_LABELS[hoverRating || rating]}
                </span>
              </div>
            </div>

            {/* 2. Category Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                2. Phân Loại Ý Kiến Hoặc Vấn Đề Gặp Phải
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = category === cat.id;

                  return (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => {
                        soundManager.playClick();
                        setCategory(cat.id);
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                        isSelected 
                          ? `${cat.color} ring-2 ring-blue-500/40 shadow-xs font-bold`
                          : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs font-bold">{cat.label}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-0.5 line-clamp-1">
                          {cat.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Title & Description */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tiêu Đề Tóm Tắt
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Bị khuất nút Nộp bài ở góc dưới khi mở trên laptop 14 inch..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mô Tả Chi Tiết Vấn Đề Hoặc Đóng Góp <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả cụ thể: Bạn đang làm bài thi nào? Thao tác gì thì bị lỗi? Vị trí nút hay giao diện bị khuất như thế nào? Mong muốn của bạn..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white resize-y"
                />
              </div>
            </div>

            {/* 4. Contact Details & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Họ Và Tên Của Bạn
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Học viên / Bạn đọc"
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Email (Để Nhận Phản Hồi)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Mức Độ Cần Khắc Phục
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                >
                  <option value="low">Thấp (Góp ý bình thường)</option>
                  <option value="normal">Bình thường</option>
                  <option value="high">Cao (Gây khó chịu khi làm bài)</option>
                  <option value="urgent">Khẩn cấp (Không thi được)</option>
                </select>
              </div>
            </div>

            {/* Error Message if any */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                Lưu ý: Mọi phản hồi đều được tôn trọng và kiểm duyệt kỹ lưỡng.
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Đang gửi phản hồi...' : 'Gửi Phản Hồi Cho Chủ Sở Hữu'}</span>
                </button>
              </div>
            </div>

          </form>
        )}
      </div>
    </div>
  );
};
