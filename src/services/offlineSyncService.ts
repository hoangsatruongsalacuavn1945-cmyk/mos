/**
 * Offline Sync Service
 * Manages Service Worker lifecycle, Cache Storage, and Offline Quiz/Materials Bundles
 */

export interface OfflinePackageMeta {
  subject: 'word' | 'excel' | 'powerpoint' | 'all';
  name: string;
  totalQuestions: number;
  totalLessons: number;
  sizeKb: number;
  downloadedAt: string;
  isAvailable: boolean;
}

export interface OfflineSyncStatus {
  isSupported: boolean;
  isRegistered: boolean;
  isOnline: boolean;
  activeCacheCount: number;
  downloadedPackages: Record<string, OfflinePackageMeta>;
  storageUsageMb: number;
}

class OfflineSyncService {
  private registration: ServiceWorkerRegistration | null = null;
  private listeners: Set<(status: OfflineSyncStatus) => void> = new Set();
  private isOnlineState = typeof navigator !== 'undefined' ? navigator.onLine : true;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnlineState = true;
        this.notifyListeners();
      });
      window.addEventListener('offline', () => {
        this.isOnlineState = false;
        this.notifyListeners();
      });
    }
  }

  /**
   * Register the Service Worker
   */
  async registerServiceWorker(): Promise<boolean> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.warn('[SW] Service Workers are not supported in this browser.');
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      console.log('[SW] Service Worker registered successfully with scope:', this.registration.scope);

      // Listen for updates
      this.registration.addEventListener('updatefound', () => {
        const installingWorker = this.registration?.installing;
        if (installingWorker) {
          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[SW] New version available! Ready for activation.');
            }
          });
        }
      });

      this.notifyListeners();
      return true;
    } catch (err) {
      console.warn('[SW] Service Worker registration failed (normal in restricted environments):', err);
      return false;
    }
  }

  /**
   * Check if online
   */
  isOnline(): boolean {
    return this.isOnlineState;
  }

  /**
   * Download and store complete quiz and study materials for offline use
   */
  async downloadOfflinePackage(
    subject: 'word' | 'excel' | 'powerpoint' | 'all',
    onProgress?: (pct: number, statusText: string) => void
  ): Promise<boolean> {
    try {
      onProgress?.(15, `Đang kết nối tới máy chủ để tải gói dữ liệu ${subject.toUpperCase()}...`);

      const res = await fetch(`/api/offline/bundle?subject=${subject}`);
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      onProgress?.(50, 'Đang phân tích cấu trúc câu hỏi, bài giảng và phím tắt...');
      const bundleData = await res.json();

      if (!bundleData.success) {
        throw new Error(bundleData.message || 'Không thể tải gói dữ liệu ngoại tuyến.');
      }

      onProgress?.(75, 'Đang lưu vào bộ nhớ Service Worker Cache API & Local Storage...');

      // 1. Cache in browser Cache Storage via Cache API if supported
      if ('caches' in window) {
        try {
          const quizCache = await caches.open('mos-offline-quizzes-v1.1.0');
          const cacheUrl = `/api/offline/bundle?subject=${subject}`;
          const responseToCache = new Response(JSON.stringify(bundleData), {
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              'X-MOS-Offline': 'true',
            },
          });
          await quizCache.put(cacheUrl, responseToCache);
        } catch (cErr) {
          console.warn('[SW] Cache Storage write skipped:', cErr);
        }
      }

      // 2. Also save to LocalStorage as resilient zero-latency instant fallback
      try {
        const storageKey = `mos_offline_pack_${subject}`;
        localStorage.setItem(storageKey, JSON.stringify(bundleData));

        // Save metadata
        const metaList = this.getStoredMeta();
        const sizeEstimate = Math.round(JSON.stringify(bundleData).length / 1024);
        metaList[subject] = {
          subject,
          name: subject === 'word' ? 'MOS Word MO-100' :
                subject === 'excel' ? 'MOS Excel MO-200' :
                subject === 'powerpoint' ? 'MOS PowerPoint MO-300' : 'Trọn bộ 3 Môn MOS',
          totalQuestions: bundleData.totalQuestions || 0,
          totalLessons: Object.keys(bundleData.materials || {}).length * 5,
          sizeKb: sizeEstimate,
          downloadedAt: new Date().toISOString(),
          isAvailable: true,
        };
        localStorage.setItem('mos_offline_meta', JSON.stringify(metaList));
      } catch (lsErr) {
        console.warn('[SW] LocalStorage save warning:', lsErr);
      }

      onProgress?.(100, `Hoàn tất! Đã tải về thành công gói ${subject.toUpperCase()} để học ngoại tuyến.`);
      this.notifyListeners();
      return true;
    } catch (err: any) {
      console.error('[SW] Failed to download offline package:', err);
      throw err;
    }
  }

  /**
   * Retrieve cached quiz questions for offline exam or practice
   */
  async getOfflineQuizQuestions(subject: 'word' | 'excel' | 'powerpoint' | 'all'): Promise<any[]> {
    // 1. Try Cache API first
    if ('caches' in window) {
      try {
        const quizCache = await caches.open('mos-offline-quizzes-v1.1.0');
        const match = await quizCache.match(`/api/offline/bundle?subject=${subject}`);
        if (match) {
          const json = await match.json();
          if (json.questions && json.questions.length > 0) {
            return json.questions;
          }
        }
      } catch (err) {
        // Fallback to local storage
      }
    }

    // 2. Fallback to LocalStorage
    try {
      const stored = localStorage.getItem(`mos_offline_pack_${subject}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.questions) return parsed.questions;
      }

      // Also check 'all' pack
      const storedAll = localStorage.getItem('mos_offline_pack_all');
      if (storedAll) {
        const parsedAll = JSON.parse(storedAll);
        if (parsedAll.questions) {
          if (subject === 'all') return parsedAll.questions;
          return parsedAll.questions.filter((q: any) => q.subject === subject);
        }
      }
    } catch (err) {
      console.warn('[SW] Failed to parse local offline quiz storage:', err);
    }

    return [];
  }

  /**
   * Retrieve cached study materials for offline review
   */
  async getOfflineStudyMaterials(subject: 'word' | 'excel' | 'powerpoint' | 'all'): Promise<any> {
    try {
      const stored = localStorage.getItem(`mos_offline_pack_${subject}`) || localStorage.getItem('mos_offline_pack_all');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.materials) {
          if (subject === 'all') return parsed.materials;
          return parsed.materials[subject] || null;
        }
      }
    } catch (err) {
      console.warn('[SW] Error retrieving offline materials:', err);
    }
    return null;
  }

  /**
   * Clear offline packages from Cache API and LocalStorage
   */
  async clearOfflinePackages(): Promise<void> {
    if ('caches' in window) {
      try {
        await caches.delete('mos-offline-quizzes-v1.1.0');
        await caches.delete('mos-study-materials-v1.1.0');
      } catch (err) {
        console.warn('[SW] Error deleting cache API:', err);
      }
    }

    try {
      ['word', 'excel', 'powerpoint', 'all'].forEach((sub) => {
        localStorage.removeItem(`mos_offline_pack_${sub}`);
      });
      localStorage.removeItem('mos_offline_meta');
    } catch (err) {
      console.warn('[SW] Error clearing local storage:', err);
    }

    this.notifyListeners();
  }

  /**
   * Get metadata of downloaded packages
   */
  getStoredMeta(): Record<string, OfflinePackageMeta> {
    try {
      const raw = localStorage.getItem('mos_offline_meta');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  /**
   * Calculate storage usage
   */
  calculateStorageUsageMb(): number {
    const meta = this.getStoredMeta();
    let totalKb = 0;
    Object.values(meta).forEach((m) => {
      totalKb += m.sizeKb || 0;
    });
    return parseFloat((totalKb / 1024).toFixed(2));
  }

  /**
   * Get full sync status
   */
  getStatus(): OfflineSyncStatus {
    const meta = this.getStoredMeta();
    return {
      isSupported: typeof window !== 'undefined' && 'serviceWorker' in navigator,
      isRegistered: Boolean(this.registration),
      isOnline: this.isOnlineState,
      activeCacheCount: Object.keys(meta).length,
      downloadedPackages: meta,
      storageUsageMb: this.calculateStorageUsageMb(),
    };
  }

  subscribe(listener: (status: OfflineSyncStatus) => void): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    const status = this.getStatus();
    this.listeners.forEach((listener) => {
      try {
        listener(status);
      } catch (err) {
        console.warn('Listener error in offlineSyncService:', err);
      }
    });
  }
}

export const offlineSyncService = new OfflineSyncService();
