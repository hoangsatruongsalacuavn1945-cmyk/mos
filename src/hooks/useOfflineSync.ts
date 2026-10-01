import { useState, useEffect } from 'react';
import { offlineSyncService, OfflineSyncStatus } from '../services/offlineSyncService';

export function useOfflineSync() {
  const [status, setStatus] = useState<OfflineSyncStatus>(offlineSyncService.getStatus());
  const [downloadingSubject, setDownloadingSubject] = useState<string | null>(null);
  const [progressPct, setProgressPct] = useState(0);
  const [progressText, setProgressText] = useState('');

  useEffect(() => {
    // Automatically register service worker on mount
    offlineSyncService.registerServiceWorker();

    const unsubscribe = offlineSyncService.subscribe((newStatus) => {
      setStatus(newStatus);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const downloadPackage = async (subject: 'word' | 'excel' | 'powerpoint' | 'all') => {
    setDownloadingSubject(subject);
    setProgressPct(0);
    setProgressText('Đang khởi tạo kết nối ngoại tuyến...');

    try {
      await offlineSyncService.downloadOfflinePackage(subject, (pct, text) => {
        setProgressPct(pct);
        setProgressText(text);
      });
      return true;
    } catch (err) {
      console.error('Failed to download offline package:', err);
      return false;
    } finally {
      setTimeout(() => {
        setDownloadingSubject(null);
        setProgressPct(0);
        setProgressText('');
      }, 1200);
    }
  };

  const clearAllOfflineData = async () => {
    await offlineSyncService.clearOfflinePackages();
  };

  return {
    status,
    isOnline: status.isOnline,
    downloadingSubject,
    progressPct,
    progressText,
    downloadPackage,
    clearAllOfflineData,
  };
}
