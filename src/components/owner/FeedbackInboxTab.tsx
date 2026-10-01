import React, { useState, useEffect } from 'react';
import { 
  feedbackClientService, 
  FeedbackReportItem, 
  FeedbackStats 
} from '../../services/feedbackClientService';
import { soundManager } from '../../utils/audio';
import { 
  Star, 
  Bug, 
  Monitor, 
  ThumbsUp, 
  Lightbulb, 
  HelpCircle, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Trash2, 
  ExternalLink, 
  FileSpreadsheet, 
  RefreshCw,
  Laptop,
  Check,
  ChevronDown
} from 'lucide-react';
import { getMasterGoogleSheetUrl } from '../../services/googleSheetsService';
import { useGoogleSheetsStore } from '../../utils/googleSheetsStore';

const CATEGORY_MAP: Record<string, { label: string; icon: any; color: string }> = {
  screen_display: {
    label: 'Khuất Máy / Lỗi Giao Diện',
    icon: Monitor,
    color: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  bug_report: {
    label: 'Lỗi Hệ Thống / Đơ Lag',
    icon: Bug,
    color: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  },
  ui_rating: {
    label: 'Đánh Giá Website',
    icon: ThumbsUp,
    color: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  },
  feature_request: {
    label: 'Góp Ý Tính Năng',
    icon: Lightbulb,
    color: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  },
  exam_question: {
    label: 'Thắc Mắc Đề Thi',
    icon: HelpCircle,
    color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  },
  other: {
    label: 'Khác',
    icon: HelpCircle,
    color: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
  },
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: 'Chờ xử lý', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  reviewing: { label: 'Đang kiểm tra', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  resolved: { label: 'Đã khắc phục', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  dismissed: { label: 'Đã đóng', color: 'bg-slate-500/20 text-slate-400 border-slate-600' },
};

export const FeedbackInboxTab: React.FC = () => {
  const [items, setItems] = useState<FeedbackReportItem[]>([]);
  const [stats, setStats] = useState<FeedbackStats>({
    total: 0,
    avgRating: 5,
    pendingCount: 0,
    resolvedCount: 0,
    bugsCount: 0,
    screenDisplayCount: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [list, statsData] = await Promise.all([
        feedbackClientService.getFeedbackList({
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          search: searchQuery.trim() || undefined,
        }),
        feedbackClientService.getFeedbackStats(),
      ]);
      setItems(list);
      setStats(statsData);
    } catch (err) {
      console.warn('Error loading feedback in owner portal:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [categoryFilter, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleUpdateStatus = async (
    id: string, 
    newStatus: 'pending' | 'reviewing' | 'resolved' | 'dismissed',
    notes?: string
  ) => {
    soundManager.playClick();
    const success = await feedbackClientService.updateStatus(id, newStatus, notes);
    if (success) {
      soundManager.playCorrect();
      setActionSuccess('Cập nhật trạng thái thành công!');
      setTimeout(() => setActionSuccess(null), 3000);
      loadData();
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa phản hồi này?')) return;
    soundManager.playClick();
    const success = await feedbackClientService.deleteFeedback(id);
    if (success) {
      setActionSuccess('Đã xóa phản hồi.');
      setTimeout(() => setActionSuccess(null), 3000);
      loadData();
    }
  };

  const handleSaveNotes = async (id: string) => {
    await handleUpdateStatus(id, items.find(i => i.id === id)?.status || 'pending', tempNotes);
    setEditingNotesId(null);
  };

  return (
    <div className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Tổng Phản Hồi & Đánh Giá</div>
          <div className="text-2xl font-black text-amber-400 mt-1 flex items-baseline gap-2">
            <span>{stats.total}</span>
            <span className="text-xs font-normal text-slate-400">lượt gửi</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Điểm Đánh Giá Trung Bình</div>
          <div className="text-2xl font-black text-amber-300 mt-1 flex items-center gap-1.5">
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            <span>{stats.avgRating || 5.0}</span>
            <span className="text-xs font-normal text-slate-400">/ 5.0</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Báo Cáo Khuất Máy & Lỗi Giao Diện</div>
          <div className="text-2xl font-black text-rose-400 mt-1 flex items-baseline gap-2">
            <span>{stats.screenDisplayCount}</span>
            <span className="text-xs font-normal text-rose-300/70">cần tối ưu màn nhỏ</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Chờ Xử Lý / Đang Kiểm Tra</div>
          <div className="text-2xl font-black text-indigo-400 mt-1 flex items-baseline gap-2">
            <span>{stats.pendingCount}</span>
            <span className="text-xs font-normal text-indigo-300/70">chưa hoàn tất</span>
          </div>
        </div>
      </div>

      {/* Action Notification */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Control Bar: Filters, Search & Google Sheets Export */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tiêu đề, mô tả lỗi, tên học viên..."
            className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          />
        </form>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 font-semibold focus:outline-hidden"
          >
            <option value="all">Tất cả phân loại</option>
            <option value="screen_display">Khuất máy / Giao diện</option>
            <option value="bug_report">Lỗi hệ thống / Đơ lag</option>
            <option value="ui_rating">Đánh giá website</option>
            <option value="feature_request">Góp ý tính năng</option>
            <option value="exam_question">Thắc mắc đề thi</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 font-semibold focus:outline-hidden"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ xử lý</option>
            <option value="reviewing">Đang kiểm tra</option>
            <option value="resolved">Đã khắc phục</option>
            <option value="dismissed">Đã đóng</option>
          </select>

          <button
            onClick={() => {
              soundManager.playClick();
              loadData();
            }}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors cursor-pointer"
            title="Tải lại dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <a
            href={useGoogleSheetsStore.getState().spreadsheetUrl || getMasterGoogleSheetUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            title="Mở Google Sheets xem tab 'Phản Hồi & Đánh Giá Web'"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mở Sheet Phản Hồi</span>
            <ExternalLink className="w-3 h-3 text-emerald-400" />
          </a>
        </div>
      </div>

      {/* List of Feedback Cards */}
      {items.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <ThumbsUp className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-white">Chưa có phản hồi nào phù hợp bộ lọc</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Học viên và bạn đọc có thể gửi phản hồi, đánh giá sao hoặc báo lỗi khuất máy bất cứ lúc nào thông qua nút nổi ở góc phải màn hình.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const catInfo = CATEGORY_MAP[item.category] || CATEGORY_MAP.other;
            const CatIcon = catInfo.icon;
            const statusInfo = STATUS_MAP[item.status] || STATUS_MAP.pending;
            const isEditing = editingNotesId === item.id;

            return (
              <div 
                key={item.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-all shadow-sm space-y-3.5"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Star Rating Badge */}
                    <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-xl text-amber-300 font-bold text-xs">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{item.rating}/5</span>
                    </div>

                    {/* Category */}
                    <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${catInfo.color}`}>
                      <CatIcon className="w-3.5 h-3.5" />
                      <span>{catInfo.label}</span>
                    </span>

                    {/* Priority */}
                    {item.priority === 'urgent' && (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-red-500/20 text-red-300 border border-red-500/40">
                        Khẩn Cấp
                      </span>
                    )}
                    {item.priority === 'high' && (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        Ưu Tiên Cao
                      </span>
                    )}

                    {/* Status Badge */}
                    <span className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* Submission Time & Author */}
                  <div className="text-right text-xs text-slate-400">
                    <span className="text-slate-300 font-semibold">{item.userName || 'Ẩn danh'}</span>
                    {item.userEmail && (
                      <span className="text-slate-400 text-[11px] block">{item.userEmail}</span>
                    )}
                    <span className="text-[10px] text-slate-500">
                      {new Date(item.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                </div>

                {/* Title & Body */}
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white tracking-tight">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {item.description}
                  </p>
                </div>

                {/* Device & Screen Specs (Crucial for screen obstruction bugs) */}
                <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl text-xs text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                  <div className="flex items-center gap-1 text-slate-300 font-medium">
                    <Laptop className="w-3.5 h-3.5 text-blue-400" />
                    <span>Màn hình / Khung nhìn:</span>
                    <strong className="text-amber-300">{item.screenResolution || '1920x1080'}</strong>
                  </div>
                  {item.pageUrl && (
                    <div className="text-slate-400">
                      Trang: <span className="font-mono text-slate-300">{item.pageUrl}</span>
                    </div>
                  )}
                  {item.deviceInfo && (
                    <div className="text-[11px] text-slate-500 truncate max-w-md">
                      Môi trường: {item.deviceInfo}
                    </div>
                  )}
                </div>

                {/* Admin Notes Section */}
                <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={tempNotes}
                          onChange={(e) => setTempNotes(e.target.value)}
                          placeholder="Nhập ghi chú xử lý của bạn cho phản hồi này..."
                          className="flex-1 px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
                        />
                        <button
                          onClick={() => handleSaveNotes(item.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Lưu</span>
                        </button>
                        <button
                          onClick={() => setEditingNotesId(null)}
                          className="px-3 py-1.5 bg-slate-800 text-slate-400 text-xs rounded-lg"
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <div 
                        onClick={() => {
                          setEditingNotesId(item.id);
                          setTempNotes(item.adminNotes || '');
                        }}
                        className="text-xs text-slate-400 cursor-pointer hover:text-slate-200 flex items-center gap-1.5"
                        title="Bấm để chỉnh sửa ghi chú nội bộ"
                      >
                        <span className="font-semibold text-slate-500">Ghi chú xử lý:</span>
                        <span className={item.adminNotes ? 'text-amber-300' : 'text-slate-600 italic'}>
                          {item.adminNotes || 'Chưa có ghi chú. Bấm vào đây để thêm...'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions: Change Status & Delete */}
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={item.status}
                      onChange={(e) => handleUpdateStatus(item.id, e.target.value as any)}
                      className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-slate-200 focus:outline-hidden"
                    >
                      <option value="pending">Chờ xử lý</option>
                      <option value="reviewing">Đang kiểm tra</option>
                      <option value="resolved">✓ Đã khắc phục</option>
                      <option value="dismissed">Bỏ qua / Đóng</option>
                    </select>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Xóa phản hồi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
