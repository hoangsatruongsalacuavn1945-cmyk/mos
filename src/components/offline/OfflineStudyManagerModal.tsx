import React, { useState } from 'react';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { soundManager } from '../../utils/audio';
import {
  Wifi,
  WifiOff,
  Download,
  CheckCircle2,
  HardDrive,
  Trash2,
  BookOpen,
  FileSpreadsheet,
  FileText,
  Presentation,
  Play,
  X,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Layers,
  ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface OfflineStudyManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartExam?: (subject: 'word' | 'excel' | 'powerpoint') => void;
}

export const OfflineStudyManagerModal: React.FC<OfflineStudyManagerModalProps> = ({
  isOpen,
  onClose,
  onStartExam,
}) => {
  const navigate = useNavigate();
  const {
    status,
    isOnline,
    downloadingSubject,
    progressPct,
    progressText,
    downloadPackage,
    clearAllOfflineData,
  } = useOfflineSync();

  const [confirmClear, setConfirmClear] = useState(false);

  if (!isOpen) return null;

  const packagesConfig = [
    {
      id: 'word',
      subject: 'word' as const,
      code: 'MO-100',
      title: 'Bộ Đề & Bài Giảng Word Associate',
      description: '50 câu hỏi trắc nghiệm & mô phỏng, 5 bài giảng lý thuyết chuẩn, đường dẫn Ribbon chính thức.',
      icon: FileText,
      color: 'blue',
      badgeBg: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
      btnBg: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
    {
      id: 'excel',
      subject: 'excel' as const,
      code: 'MO-200',
      title: 'Bộ Đề & Bài Giảng Excel Associate',
      description: '50 câu hỏi phân tích, bài tập hàm logic (IF, VLOOKUP), định dạng có điều kiện và bảng Table.',
      icon: FileSpreadsheet,
      color: 'emerald',
      badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
      btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
    {
      id: 'powerpoint',
      subject: 'powerpoint' as const,
      code: 'MO-300',
      title: 'Bộ Đề & Bài Giảng PowerPoint Associate',
      description: '40 câu hỏi trắc nghiệm Slide Master, hiệu ứng chuyển tiếp Morph, Animation Pane và mô hình 3D.',
      icon: Presentation,
      color: 'orange',
      badgeBg: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
      btnBg: 'bg-orange-600 hover:bg-orange-700 text-white',
    },
  ];

  const handleDownload = async (sub: 'word' | 'excel' | 'powerpoint' | 'all') => {
    soundManager.playClick();
    const success = await downloadPackage(sub);
    if (success) {
      soundManager.playCorrect();
    }
  };

  const handleLaunchPractice = (subject: 'word' | 'excel' | 'powerpoint') => {
    soundManager.playClick();
    onClose();
    if (onStartExam) {
      onStartExam(subject);
    } else {
      navigate(`/thi-thu?subject=${subject}`);
    }
  };

  const handleClear = async () => {
    soundManager.playClick();
    await clearAllOfflineData();
    setConfirmClear(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/40 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shrink-0">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Trung Tâm Học Ngoại Tuyến (Offline Study Center)
                </h3>
                {isOnline ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                    <Wifi className="w-3 h-3" />
                    <span>Đang Có Mạng</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1 animate-pulse">
                    <WifiOff className="w-3 h-3" />
                    <span>Đang Ngoại Tuyến</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Tải trước bộ đề trắc nghiệm và tài liệu học để luyện tập khi không có Internet qua Service Worker Cache.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Storage Bar & Quick Actions */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="space-y-1">
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                Bộ nhớ ngoại tuyến đã dùng: <strong className="text-slate-800 dark:text-slate-200 font-mono">{status.storageUsageMb} MB</strong> ({status.activeCacheCount} gói môn học)
              </span>
              <div className="w-40 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(5, status.storageUsageMb * 15))}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownload('all')}
              disabled={Boolean(downloadingSubject)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải Trọn Bộ 3 Môn</span>
            </button>

            {status.activeCacheCount > 0 && (
              confirmClear ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleClear}
                    className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-[11px] cursor-pointer"
                  >
                    Xác Nhận Xóa
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="px-2 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg text-[11px] cursor-pointer"
                  >
                    Hủy
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmClear(true)}
                  className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  title="Xóa dữ liệu bộ nhớ đệm"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )
            )}
          </div>
        </div>

        {/* Download Progress Indicator */}
        {downloadingSubject && (
          <div className="px-5 py-3 bg-indigo-50 dark:bg-indigo-950/40 border-b border-indigo-200 dark:border-indigo-800 text-xs text-indigo-950 dark:text-indigo-200 space-y-1.5">
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                <span>{progressText}</span>
              </span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400">{progressPct}%</span>
            </div>
            <div className="w-full bg-indigo-200 dark:bg-indigo-900 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Subject Packages List */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {packagesConfig.map((pkg) => {
            const isDownloaded = Boolean(
              status.downloadedPackages[pkg.id]?.isAvailable ||
              status.downloadedPackages['all']?.isAvailable
            );
            const isDownloading = downloadingSubject === pkg.id || downloadingSubject === 'all';
            const Icon = pkg.icon;

            return (
              <div
                key={pkg.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${pkg.badgeBg}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {pkg.title}
                      </h4>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {pkg.code}
                      </span>
                      {isDownloaded && (
                        <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Đã Tải Về Máy</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {pkg.description}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  {isDownloaded ? (
                    <>
                      <button
                        onClick={() => handleLaunchPractice(pkg.subject)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Học Ngoại Tuyến</span>
                      </button>

                      <button
                        onClick={() => handleDownload(pkg.subject)}
                        disabled={isDownloading}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Tải lại bản cập nhật mới nhất"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isDownloading ? 'animate-spin' : ''}`} />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleDownload(pkg.subject)}
                      disabled={isDownloading}
                      className={`px-3 py-1.5 ${pkg.btnBg} text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50`}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isDownloading ? 'Đang Tải...' : 'Tải Về Máy'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Dữ liệu được lưu trữ an toàn trong Service Worker Cache. Bài làm ngoại tuyến sẽ tự động đồng bộ khi có kết nối trở lại.</span>
          </div>

          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="px-3 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
