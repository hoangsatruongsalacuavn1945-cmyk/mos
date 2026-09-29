import { create } from 'zustand';

export type Language = 'vi' | 'en';

interface TranslationDictionary {
  [key: string]: {
    vi: string;
    en: string;
  };
}

export const TRANSLATIONS: TranslationDictionary = {
  // Navigation & Branding
  platformTitle: {
    vi: 'MOS Master 365',
    en: 'MOS Master 365',
  },
  certiportStandard: {
    vi: 'Chuẩn Quốc Tế Certiport',
    en: 'Certiport Standard',
  },
  navTraining: {
    vi: 'Luyện Thi MOS',
    en: 'MOS Training',
  },
  navMockExam: {
    vi: 'Phòng Thi Thử 50P',
    en: '50-Min Mock Exam',
  },
  navResults: {
    vi: 'Bảng Điểm & Chứng Chỉ',
    en: 'Scorecard & Certs',
  },
  navLeaderboard: {
    vi: 'Bảng Xếp Hạng',
    en: 'Leaderboard',
  },
  navHub: {
    vi: 'Trung Tâm Học Tập (Hub)',
    en: 'Learning Hub',
  },
  navProgress: {
    vi: 'Biểu Đồ Tiến Độ (Recharts)',
    en: 'Progress Charts',
  },
  navQuizEngine: {
    vi: 'Khảo Thí Quiz Engine',
    en: 'Quiz Engine',
  },
  navTheory: {
    vi: 'Trắc Nghiệm Lý Thuyết',
    en: 'Theory Quiz',
  },
  navPractical: {
    vi: 'Thao Tác Thực Hành',
    en: 'Practical Projects',
  },
  navFileGrader: {
    vi: 'Chấm File Tự Động',
    en: 'Auto File Grader',
  },
  navRoadmap: {
    vi: 'Lộ Trình Cá Nhân Hóa',
    en: 'Personal Roadmap',
  },
  navAiTutor: {
    vi: 'Gia Sư AI Trợ Giảng',
    en: 'AI Tutor Chat',
  },
  navAiPractice: {
    vi: 'AI Tạo Đề Tùy Biến',
    en: 'AI Practice Generator',
  },
  navShortcuts: {
    vi: 'Phím Tắt Vàng',
    en: 'MOS Shortcuts',
  },
  navAnalytics: {
    vi: 'Phân Tích Năng Lực',
    en: 'Skill Analytics',
  },

  // Auth & Roles
  login: {
    vi: 'Đăng Nhập',
    en: 'Log In',
  },
  register: {
    vi: 'Đăng Ký',
    en: 'Register',
  },
  logout: {
    vi: 'Đăng Xuất',
    en: 'Log Out',
  },
  officerPortal: {
    vi: 'Cổng Cán Bộ',
    en: 'Staff Portal',
  },
  teacherPortal: {
    vi: 'Cổng Giáo Viên',
    en: 'Teacher Portal',
  },
  ownerPortal: {
    vi: 'Cổng Chủ Sở Hữu',
    en: 'Owner Portal',
  },
  student: {
    vi: 'Học Viên',
    en: 'Student',
  },
  teacher: {
    vi: 'Giảng Viên',
    en: 'Teacher',
  },
  owner: {
    vi: 'Chủ Sở Hữu',
    en: 'Owner / Admin',
  },

  // Theme & Language
  themeLight: {
    vi: 'Chế độ Sáng',
    en: 'Light Mode',
  },
  themeDark: {
    vi: 'Chế độ Tối',
    en: 'Dark Mode',
  },
  themeAuto: {
    vi: 'Tự động (Hệ thống)',
    en: 'Auto (System)',
  },
  langVietnamese: {
    vi: 'Tiếng Việt',
    en: 'Vietnamese',
  },
  langEnglish: {
    vi: 'Tiếng Anh',
    en: 'English',
  },

  // Common Actions
  soundOn: {
    vi: 'Bật âm thanh hiệu ứng',
    en: 'Turn Sound On',
  },
  soundOff: {
    vi: 'Tắt âm thanh',
    en: 'Mute Sound',
  },
  systemCheck: {
    vi: 'Kiểm Tra Máy Thi',
    en: 'Exam System Check',
  },
  leaderboardModal: {
    vi: 'Bảng Vàng',
    en: 'Leaderboard',
  },
  allSubjects: {
    vi: 'Tất cả các môn',
    en: 'All Subjects',
  },
  passStandard: {
    vi: 'Chuẩn Certiport: ≥ 700 / 1000 điểm để cấp chứng chỉ',
    en: 'Certiport Standard: ≥ 700 / 1000 points to certify',
  },
};

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
}

const LANG_STORAGE_KEY = 'mos_selected_language';

const initialLang: Language = (typeof window !== 'undefined'
  ? (localStorage.getItem(LANG_STORAGE_KEY) as Language) || 'vi'
  : 'vi');

export const useLanguageStore = create<LanguageState>((set, get) => ({
  language: initialLang,

  setLanguage: (lang: Language) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    }
    set({ language: lang });
  },

  toggleLanguage: () => {
    const next = get().language === 'vi' ? 'en' : 'vi';
    get().setLanguage(next);
  },

  t: (key: string, fallback?: string) => {
    const lang = get().language;
    if (TRANSLATIONS[key] && TRANSLATIONS[key][lang]) {
      return TRANSLATIONS[key][lang];
    }
    return fallback || key;
  },
}));
