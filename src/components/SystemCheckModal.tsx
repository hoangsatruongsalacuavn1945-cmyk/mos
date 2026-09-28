import React, { useState, useEffect } from 'react';
import { 
  Monitor, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Wifi, 
  Volume2, 
  Maximize2, 
  ShieldCheck, 
  X,
  Laptop
} from 'lucide-react';
import { soundManager } from '../utils/audio';

interface SystemCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CheckItem {
  id: string;
  name: string;
  category: 'hardware' | 'network' | 'browser';
  status: 'passed' | 'warning' | 'failed' | 'checking';
  detail: string;
  recommendation?: string;
}

export const SystemCheckModal: React.FC<SystemCheckModalProps> = ({ isOpen, onClose }) => {
  const [checks, setChecks] = useState<CheckItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  const runAllChecks = async () => {
    setIsRunning(true);
    soundManager.playClick();

    const items: CheckItem[] = [];

    // 1. Screen Resolution
    const width = window.screen.width;
    const height = window.screen.height;
    const isResolutionOk = width >= 1280 && height >= 720;
    items.push({
      id: 'resolution',
      name: 'Độ Phân Giải Màn Hình',
      category: 'hardware',
      status: isResolutionOk ? 'passed' : 'warning',
      detail: `${width} x ${height} (Chuẩn Certiport tối thiểu: 1280x720)`,
      recommendation: isResolutionOk ? undefined : 'Nên sử dụng màn hình máy tính có độ phân giải từ Full HD (1920x1080) để hiển thị đầy đủ thanh Ribbon.',
    });

    // 2. Fullscreen Support
    const canFullscreen = !!(document.fullscreenEnabled || (document as any).webkitFullscreenEnabled);
    items.push({
      id: 'fullscreen',
      name: 'Tính Năng Khóa Toàn Màn Hình (Fullscreen API)',
      category: 'browser',
      status: canFullscreen ? 'passed' : 'failed',
      detail: canFullscreen ? 'Trình duyệt hỗ trợ khóa Fullscreen Lockdown' : 'Không hỗ trợ Fullscreen Lockdown',
      recommendation: canFullscreen ? undefined : 'Vui lòng cập nhật Chrome hoặc Edge phiên bản mới nhất.',
    });

    // 3. LocalStorage & Offline Cache
    let storageOk = false;
    try {
      localStorage.setItem('__test_key__', '1');
      localStorage.removeItem('__test_key__');
      storageOk = true;
    } catch {
      storageOk = false;
    }
    items.push({
      id: 'storage',
      name: 'Bộ Nhớ Đệm Trình Duyệt (Auto-Save Cache)',
      category: 'browser',
      status: storageOk ? 'passed' : 'failed',
      detail: storageOk ? 'Khả dụng (Hỗ trợ tự động sao lưu bài thi chống mất điện)' : 'Bị chặn (Đang bật chế độ Private/Ẩn danh quá nghiêm ngặt)',
    });

    // 4. Network Latency & Server Connection
    const startTime = performance.now();
    try {
      const res = await fetch('/api/leaderboard?subject=all', { cache: 'no-store' });
      const endTime = performance.now();
      const ping = Math.round(endTime - startTime);
      setLatencyMs(ping);
      const isPingGood = ping < 350;
      items.push({
        id: 'network',
        name: 'Độ Trễ Máy Chủ Khảo Thí (Network Ping)',
        category: 'network',
        status: isPingGood ? 'passed' : 'warning',
        detail: `${ping} ms (${isPingGood ? 'Rất mượt mà' : 'Hơi chậm'})`,
        recommendation: isPingGood ? undefined : 'Kiểm tra lại kết nối Wifi hoặc chuyển sang mạng dây LAN nếu có thể.',
      });
    } catch {
      items.push({
        id: 'network',
        name: 'Độ Trễ Máy Chủ Khảo Thí (Network Ping)',
        category: 'network',
        status: 'failed',
        detail: 'Không thể kết nối tới máy chủ',
        recommendation: 'Vui lòng kiểm tra lại kết nối Internet.',
      });
    }

    // 5. Audio Context (Sound Effects & Warnings)
    const audioOk = typeof window.AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined';
    items.push({
      id: 'audio',
      name: 'Âm Thanh & Cảnh Báo Phòng Thi',
      category: 'hardware',
      status: audioOk ? 'passed' : 'warning',
      detail: audioOk ? 'Bộ xử lý âm thanh Web Audio API hoạt động' : 'Không tìm thấy bộ xử lý âm thanh',
    });

    setChecks(items);
    setIsRunning(false);
  };

  useEffect(() => {
    if (isOpen) {
      runAllChecks();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const passedCount = checks.filter(c => c.status === 'passed').length;
  const isAllReady = passedCount === checks.length && checks.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Kiểm Tra Độ Tương Thích Phòng Thi (System Check)</h2>
              <p className="text-xs text-slate-400">Đánh giá cấu hình phần cứng, mạng và trình duyệt trước giờ thi</p>
            </div>
          </div>
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status summary banner */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isAllReady ? (
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>100% SẴN SÀNG VÀO THI MOS CHUẨN CERTIPORT</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <span>{passedCount}/{checks.length} TIÊU CHÍ ĐẠT YÊU CẦU</span>
                </div>
              )}
            </div>
            <button
              onClick={runAllChecks}
              disabled={isRunning}
              className="text-xs font-semibold px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              <span>Kiểm Tra Lại</span>
            </button>
          </div>
        </div>

        {/* Checklist List */}
        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          {checks.map(item => (
            <div key={item.id} className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs flex items-start gap-3">
              <div className="mt-0.5">
                {item.status === 'passed' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                {item.status === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                {item.status === 'failed' && <XCircle className="w-5 h-5 text-rose-600" />}
              </div>
              <div className="flex-1 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span>{item.name}</span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    item.status === 'passed' ? 'bg-emerald-100 text-emerald-800' :
                    item.status === 'warning' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {item.status === 'passed' ? 'ĐẠT' : item.status === 'warning' ? 'LƯU Ý' : 'KHÔNG ĐẠT'}
                  </span>
                </div>
                <div className="text-slate-600 mt-1">{item.detail}</div>
                {item.recommendation && (
                  <div className="text-amber-700 bg-amber-50 p-2 rounded mt-1.5 border border-amber-200 text-[11px]">
                    💡 <strong>Khuyến nghị:</strong> {item.recommendation}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Hệ thống Certiport Test Engine 2026 Compatible
          </div>
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
          >
            Đã Hiểu & Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
