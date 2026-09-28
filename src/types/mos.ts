export type MOSSubject = 'all' | 'word' | 'excel' | 'powerpoint';

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export type QuestionType = 'multiple-choice' | 'step-order' | 'practical-action';

export interface MOSDomain {
  id: string;
  subject: 'word' | 'excel' | 'powerpoint';
  code: string;
  name: string; // e.g. "Quản lý tài liệu và thiết lập trang"
  description: string;
}

export interface Question {
  id: string;
  subject: 'word' | 'excel' | 'powerpoint';
  domainId: string;
  domainName: string;
  difficulty: QuestionDifficulty;
  type: QuestionType;
  title: string;
  scenario?: string; // Tình huống đề bài
  options: {
    id: string;
    text: string;
  }[];
  correctAnswer: string; // option id or comma separated ids
  explanation: string; // Giải thích chi tiết
  officialRibbonPath: string; // e.g. "Layout > Page Setup > Margins > Narrow"
  shortcutTip?: string;
  points: number;
}

export interface PracticalTask {
  id: string;
  taskNumber: number;
  instruction: string;
  targetTab: 'Home' | 'Insert' | 'Page Layout' | 'Layout' | 'Data' | 'Formulas' | 'References' | 'Design' | 'Transitions' | 'Animations' | 'Review' | 'View';
  targetCommand: string;
  expectedParam?: string;
  hint: string;
  completed: boolean;
  markedForReview: boolean;
}

export interface PracticalProject {
  id: string;
  title: string;
  subject: 'word' | 'excel' | 'powerpoint';
  description: string;
  fileName: string;
  tasks: PracticalTask[];
  // Initial interactive state for the simulator
  initialData: {
    sheetName?: string;
    rows?: Array<Array<string | number>>;
    docTitle?: string;
    docParagraphs?: string[];
    margins?: 'normal' | 'narrow' | 'wide';
    lineSpacing?: number;
    slideTitle?: string;
    slideSubtitle?: string;
    slideCount?: number;
    transition?: string;
  };
}

export interface ShortcutItem {
  id: string;
  subject: 'common' | 'word' | 'excel' | 'powerpoint';
  category: string;
  keys: string;
  action: string;
  description: string;
  frequency: 'Rất hay gặp' | 'Thường gặp' | 'Mẹo nâng cao';
}

export interface ExamResult {
  id: string;
  date: string;
  subject: 'word' | 'excel' | 'powerpoint' | 'mixed';
  score: number; // 0 - 1000
  passed: boolean;
  timeSpentSeconds: number;
  totalQuestions: number;
  correctCount: number;
  domainScores: Record<string, { total: number; correct: number }>;
}

export interface UserStats {
  totalAnswered: number;
  totalCorrect: number;
  streakDays: number;
  bookmarkedQuestionIds: string[];
  wrongQuestionIds: string[];
  completedTaskIds: string[];
  examHistory: ExamResult[];
  lastActive: string;
}
