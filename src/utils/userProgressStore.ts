import { create } from 'zustand';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export type MOSSubjectTrack = 'word' | 'excel' | 'powerpoint';

export interface LessonItem {
  id: string;
  subject: MOSSubjectTrack;
  title: string;
  description: string;
  estimatedMinutes: number;
  domainCode: string;
  order: number;
}

// Standard curriculum lessons for all 3 learning paths
export const CURRICULUM_LESSONS: Record<MOSSubjectTrack, LessonItem[]> = {
  word: [
    {
      id: 'word-101',
      subject: 'word',
      title: 'Quản trị tài liệu & Cấu trúc trang (Page Setup)',
      description: 'Thiết lập lề Narrow/Moderate, ngắt trang (Page Break), ngắt đoạn (Section Break) và Headers/Footers.',
      estimatedMinutes: 25,
      domainCode: 'MO-100.1',
      order: 1,
    },
    {
      id: 'word-102',
      subject: 'word',
      title: 'Định dạng văn bản & Quản lý Styles tự động',
      description: 'Áp dụng Heading 1-3, tạo style tùy biến, thụt lề First Line Indent và giãn dòng 1.15 lines.',
      estimatedMinutes: 30,
      domainCode: 'MO-100.2',
      order: 2,
    },
    {
      id: 'word-103',
      subject: 'word',
      title: 'Bảng biểu (Tables) & Danh sách đa cấp',
      description: 'Chuyển văn bản thành bảng, lặp lại tiêu đề Repeat Header Rows, công thức bảng và Multilevel List.',
      estimatedMinutes: 35,
      domainCode: 'MO-100.3',
      order: 3,
    },
    {
      id: 'word-104',
      subject: 'word',
      title: 'Mục lục tự động (TOC) & Tài liệu tham khảo',
      description: 'Chèn Table of Contents tự động, trích dẫn nguồn APA/IEEE, chú thích cuối trang (Footnotes) & Captions.',
      estimatedMinutes: 30,
      domainCode: 'MO-100.4',
      order: 4,
    },
    {
      id: 'word-105',
      subject: 'word',
      title: 'Đồ họa SmartArt, Hình ảnh & Trộn thư (Mail Merge)',
      description: 'Định dạng Text Wrapping, SmartArt Process/Hierarchy, Alt Text và gửi thư hàng loạt với Mail Merge.',
      estimatedMinutes: 40,
      domainCode: 'MO-100.5',
      order: 5,
    },
  ],
  excel: [
    {
      id: 'excel-201',
      subject: 'excel',
      title: 'Quản lý Worksheets & Thiết lập in ấn',
      description: 'Đổi tên sheet, màu tab, cố định dòng/cột (Freeze Panes), Print Titles và Inspect Document.',
      estimatedMinutes: 25,
      domainCode: 'MO-200.1',
      order: 1,
    },
    {
      id: 'excel-202',
      subject: 'excel',
      title: 'Định dạng có điều kiện & Quản lý vùng ô (Ranges)',
      description: 'Conditional Formatting (Highlight Rules, Data Bars), đặt tên vùng (Name Ranges) và Data Validation.',
      estimatedMinutes: 35,
      domainCode: 'MO-200.2',
      order: 2,
    },
    {
      id: 'excel-203',
      subject: 'excel',
      title: 'Bảng dữ liệu (Excel Table) & Sắp xếp, Bộ lọc',
      description: 'Tạo Table Style, cấu trúc tham chiếu [@[Column]], Total Row và Advanced Filter nhiều tiêu chí.',
      estimatedMinutes: 30,
      domainCode: 'MO-200.3',
      order: 3,
    },
    {
      id: 'excel-204',
      subject: 'excel',
      title: 'Hàm tính toán & Logic: XLOOKUP, VLOOKUP, IF, SUMIFS',
      description: 'Thành thạo hàm tra cứu, điều kiện lồng nhau (Nested IF), COUNTIFS, AVERAGEIFS và xử lý lỗi IFERROR.',
      estimatedMinutes: 45,
      domainCode: 'MO-200.4',
      order: 4,
    },
    {
      id: 'excel-205',
      subject: 'excel',
      title: 'Trực quan hóa Biểu đồ (Charts) & Sparklines',
      description: 'Tạo Clustered Column, Dual Axis Combo Chart, chèn Sparklines thu nhỏ trong ô và Trendline dự báo.',
      estimatedMinutes: 35,
      domainCode: 'MO-200.5',
      order: 5,
    },
  ],
  powerpoint: [
    {
      id: 'ppt-301',
      subject: 'powerpoint',
      title: 'Thiết kế Slide Master & Bố cục trình chiếu',
      description: 'Tùy chỉnh Slide Master, tạo Layout riêng, định dạng Background Styles và định dạng số trang slide.',
      estimatedMinutes: 30,
      domainCode: 'MO-300.1',
      order: 1,
    },
    {
      id: 'ppt-302',
      subject: 'powerpoint',
      title: 'Chèn & Biên tập Hình ảnh, Shapes & Mô hình 3D',
      description: 'Cắt ghép hình ảnh (Crop to Shape), căn chỉnh Align/Distribute, phối màu Shape và hiệu ứng đổ bóng.',
      estimatedMinutes: 25,
      domainCode: 'MO-300.2',
      order: 2,
    },
    {
      id: 'ppt-303',
      subject: 'powerpoint',
      title: 'Trực quan thông tin với SmartArt, Tables & Charts',
      description: 'Chuyển danh sách bullet thành SmartArt, nhúng bảng tính Excel và định dạng biểu đồ thuyết trình.',
      estimatedMinutes: 30,
      domainCode: 'MO-300.3',
      order: 3,
    },
    {
      id: 'ppt-304',
      subject: 'powerpoint',
      title: 'Hiệu ứng chuyển slide Morph & Hoạt họa Animations',
      description: 'Làm chủ chuyển tiếp Morph mượt mà, Animation Entrance/Emphasis/Exit, Animation Pane và Trigger.',
      estimatedMinutes: 40,
      domainCode: 'MO-300.4',
      order: 4,
    },
    {
      id: 'ppt-305',
      subject: 'powerpoint',
      title: 'Kỹ thuật Trình chiếu Chuyên nghiệp & Xuất bản',
      description: 'Thiết lập Set Up Slide Show, Presenter View, Rehearse Timings và xuất file video MP4 chất lượng cao.',
      estimatedMinutes: 30,
      domainCode: 'MO-300.5',
      order: 5,
    },
  ],
};

export interface QuizScoreRecord {
  id: string;
  date: string;
  score: number;
  total: number;
  percentage: number;
  domainId?: string;
  domainName?: string;
}

export interface SubjectProgress {
  subject: MOSSubjectTrack;
  completedLessons: string[];
  quizScores: QuizScoreRecord[];
  highestScore: number;
  lastStudiedAt?: string;
}

export interface UserProgressData {
  word: SubjectProgress;
  excel: SubjectProgress;
  powerpoint: SubjectProgress;
  updatedAt?: string;
}

const STORAGE_KEY = 'mos_user_learning_progress_v1';

const createDefaultSubjectProgress = (subject: MOSSubjectTrack): SubjectProgress => ({
  subject,
  completedLessons: [],
  quizScores: [],
  highestScore: 0,
});

const getInitialProgressData = (): UserProgressData => {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          word: parsed.word || createDefaultSubjectProgress('word'),
          excel: parsed.excel || createDefaultSubjectProgress('excel'),
          powerpoint: parsed.powerpoint || createDefaultSubjectProgress('powerpoint'),
          updatedAt: parsed.updatedAt || new Date().toISOString(),
        };
      }
    } catch (e) {
      console.warn('Failed to parse cached user progress:', e);
    }
  }

  return {
    word: createDefaultSubjectProgress('word'),
    excel: createDefaultSubjectProgress('excel'),
    powerpoint: createDefaultSubjectProgress('powerpoint'),
    updatedAt: new Date().toISOString(),
  };
};

const saveToLocalStorage = (data: UserProgressData) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Error saving progress to localStorage:', e);
    }
  }
};

export interface UserProgressStore extends UserProgressData {
  isLoading: boolean;
  lastSyncedAt?: string;

  // Lesson actions
  completeLesson: (subject: MOSSubjectTrack, lessonId: string) => Promise<void>;
  uncompleteLesson: (subject: MOSSubjectTrack, lessonId: string) => Promise<void>;
  isLessonCompleted: (subject: MOSSubjectTrack, lessonId: string) => boolean;

  // Quiz score actions
  recordQuizScore: (
    subject: MOSSubjectTrack,
    result: { score: number; total: number; percentage?: number; domainId?: string; domainName?: string }
  ) => Promise<QuizScoreRecord>;

  // Metrics and statistics
  getSubjectStats: (subject: MOSSubjectTrack) => {
    completedCount: number;
    totalLessons: number;
    completionPercentage: number;
    highestScore: number;
    averageQuizPercentage: number;
    quizzesTaken: number;
  };
  getTotalCompletedLessonsCount: () => number;
  getMasterProgressPercentage: () => number;

  // Reset actions
  resetSubjectProgress: (subject: MOSSubjectTrack) => Promise<void>;
  resetAllProgress: () => Promise<void>;

  // Firebase Firestore cloud persistence
  syncWithFirestore: (userId?: string) => Promise<void>;
  loadFromFirestore: (userId: string) => Promise<void>;
}

export const useUserProgressStore = create<UserProgressStore>((set, get) => {
  const initial = getInitialProgressData();

  return {
    word: initial.word,
    excel: initial.excel,
    powerpoint: initial.powerpoint,
    updatedAt: initial.updatedAt,
    isLoading: false,
    lastSyncedAt: undefined,

    completeLesson: async (subject: MOSSubjectTrack, lessonId: string) => {
      const now = new Date().toISOString();
      set((state) => {
        const subData = state[subject];
        if (subData.completedLessons.includes(lessonId)) {
          return state;
        }

        const updatedSubject: SubjectProgress = {
          ...subData,
          completedLessons: [...subData.completedLessons, lessonId],
          lastStudiedAt: now,
        };

        const updatedData: UserProgressData = {
          word: subject === 'word' ? updatedSubject : state.word,
          excel: subject === 'excel' ? updatedSubject : state.excel,
          powerpoint: subject === 'powerpoint' ? updatedSubject : state.powerpoint,
          updatedAt: now,
        };

        saveToLocalStorage(updatedData);

        return {
          ...updatedData,
        };
      });

      // Background cloud sync
      get().syncWithFirestore().catch(() => {});
    },

    uncompleteLesson: async (subject: MOSSubjectTrack, lessonId: string) => {
      const now = new Date().toISOString();
      set((state) => {
        const subData = state[subject];
        const updatedSubject: SubjectProgress = {
          ...subData,
          completedLessons: subData.completedLessons.filter((id) => id !== lessonId),
          lastStudiedAt: now,
        };

        const updatedData: UserProgressData = {
          word: subject === 'word' ? updatedSubject : state.word,
          excel: subject === 'excel' ? updatedSubject : state.excel,
          powerpoint: subject === 'powerpoint' ? updatedSubject : state.powerpoint,
          updatedAt: now,
        };

        saveToLocalStorage(updatedData);

        return {
          ...updatedData,
        };
      });

      get().syncWithFirestore().catch(() => {});
    },

    isLessonCompleted: (subject: MOSSubjectTrack, lessonId: string) => {
      return get()[subject].completedLessons.includes(lessonId);
    },

    recordQuizScore: async (subject: MOSSubjectTrack, result) => {
      const now = new Date().toISOString();
      const pct = typeof result.percentage === 'number' 
        ? Math.round(result.percentage) 
        : Math.round((result.score / Math.max(1, result.total)) * 100);

      const record: QuizScoreRecord = {
        id: `quiz_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        date: now,
        score: result.score,
        total: result.total,
        percentage: pct,
        domainId: result.domainId,
        domainName: result.domainName,
      };

      set((state) => {
        const subData = state[subject];
        const newScores = [record, ...subData.quizScores].slice(0, 50); // Keep last 50
        const newHighest = Math.max(subData.highestScore, pct);

        const updatedSubject: SubjectProgress = {
          ...subData,
          quizScores: newScores,
          highestScore: newHighest,
          lastStudiedAt: now,
        };

        const updatedData: UserProgressData = {
          word: subject === 'word' ? updatedSubject : state.word,
          excel: subject === 'excel' ? updatedSubject : state.excel,
          powerpoint: subject === 'powerpoint' ? updatedSubject : state.powerpoint,
          updatedAt: now,
        };

        saveToLocalStorage(updatedData);

        return {
          ...updatedData,
        };
      });

      // Background sync to Firestore
      get().syncWithFirestore().catch(() => {});

      return record;
    },

    getSubjectStats: (subject: MOSSubjectTrack) => {
      const state = get();
      const subData = state[subject];
      const totalLessons = CURRICULUM_LESSONS[subject].length;
      const completedCount = subData.completedLessons.length;
      const completionPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

      const scores = subData.quizScores;
      const averageQuizPercentage = scores.length > 0 
        ? Math.round(scores.reduce((sum, s) => sum + s.percentage, 0) / scores.length) 
        : 0;

      return {
        completedCount,
        totalLessons,
        completionPercentage,
        highestScore: subData.highestScore,
        averageQuizPercentage,
        quizzesTaken: scores.length,
      };
    },

    getTotalCompletedLessonsCount: () => {
      const state = get();
      return (
        state.word.completedLessons.length +
        state.excel.completedLessons.length +
        state.powerpoint.completedLessons.length
      );
    },

    getMasterProgressPercentage: () => {
      const state = get();
      const totalPossible = 
        CURRICULUM_LESSONS.word.length + 
        CURRICULUM_LESSONS.excel.length + 
        CURRICULUM_LESSONS.powerpoint.length;
      const totalCompleted = 
        state.word.completedLessons.length + 
        state.excel.completedLessons.length + 
        state.powerpoint.completedLessons.length;

      return totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
    },

    resetSubjectProgress: async (subject: MOSSubjectTrack) => {
      const now = new Date().toISOString();
      set((state) => {
        const cleared = createDefaultSubjectProgress(subject);
        const updatedData: UserProgressData = {
          word: subject === 'word' ? cleared : state.word,
          excel: subject === 'excel' ? cleared : state.excel,
          powerpoint: subject === 'powerpoint' ? cleared : state.powerpoint,
          updatedAt: now,
        };
        saveToLocalStorage(updatedData);
        return { ...updatedData };
      });
      get().syncWithFirestore().catch(() => {});
    },

    resetAllProgress: async () => {
      const now = new Date().toISOString();
      const cleared: UserProgressData = {
        word: createDefaultSubjectProgress('word'),
        excel: createDefaultSubjectProgress('excel'),
        powerpoint: createDefaultSubjectProgress('powerpoint'),
        updatedAt: now,
      };
      saveToLocalStorage(cleared);
      set({ ...cleared });
      get().syncWithFirestore().catch(() => {});
    },

    syncWithFirestore: async (customUserId?: string) => {
      try {
        // Resolve active user id
        let userId = customUserId;
        if (!userId && typeof window !== 'undefined') {
          const userRaw = localStorage.getItem('mos_current_user');
          if (userRaw) {
            const parsed = JSON.parse(userRaw);
            userId = parsed.id || parsed.uid || parsed.email;
          }
        }

        if (!userId || userId === 'guest') {
          return; // Skip syncing guest or unauthenticated user
        }

        const state = get();
        const docRef = doc(db, 'user_progress', userId);
        const payload = {
          userId,
          word: state.word,
          excel: state.excel,
          powerpoint: state.powerpoint,
          updatedAt: new Date().toISOString(),
        };

        await setDoc(docRef, payload, { merge: true });
        set({ lastSyncedAt: new Date().toISOString() });
      } catch (error) {
        console.warn('Firestore progress sync deferred:', error);
      }
    },

    loadFromFirestore: async (userId: string) => {
      if (!userId || userId === 'guest') return;
      try {
        set({ isLoading: true });
        const docRef = doc(db, 'user_progress', userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const merged: UserProgressData = {
            word: data.word || createDefaultSubjectProgress('word'),
            excel: data.excel || createDefaultSubjectProgress('excel'),
            powerpoint: data.powerpoint || createDefaultSubjectProgress('powerpoint'),
            updatedAt: data.updatedAt || new Date().toISOString(),
          };
          saveToLocalStorage(merged);
          set({
            word: merged.word,
            excel: merged.excel,
            powerpoint: merged.powerpoint,
            updatedAt: merged.updatedAt,
            lastSyncedAt: new Date().toISOString(),
            isLoading: false,
          });
        } else {
          set({ isLoading: false });
        }
      } catch (error) {
        console.warn('Failed to load progress from Firestore:', error);
        set({ isLoading: false });
      }
    },
  };
});

// Alias export to fulfill user requests naming variations
export const useProgressStore = useUserProgressStore;
export default useUserProgressStore;
