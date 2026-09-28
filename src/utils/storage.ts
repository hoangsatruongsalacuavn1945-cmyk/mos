import { UserStats, ExamResult } from '../types/mos';

const STORAGE_KEY = 'mos_master_user_stats_v1';

const DEFAULT_STATS: UserStats = {
  totalAnswered: 0,
  totalCorrect: 0,
  streakDays: 1,
  bookmarkedQuestionIds: [],
  wrongQuestionIds: [],
  completedTaskIds: [],
  examHistory: [],
  lastActive: new Date().toISOString(),
};

export function loadUserStats(): UserStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STATS,
      ...parsed,
      bookmarkedQuestionIds: Array.isArray(parsed.bookmarkedQuestionIds) ? parsed.bookmarkedQuestionIds : [],
      wrongQuestionIds: Array.isArray(parsed.wrongQuestionIds) ? parsed.wrongQuestionIds : [],
      completedTaskIds: Array.isArray(parsed.completedTaskIds) ? parsed.completedTaskIds : [],
      examHistory: Array.isArray(parsed.examHistory) ? parsed.examHistory : [],
    };
  } catch {
    return DEFAULT_STATS;
  }
}

export function saveUserStats(stats: UserStats): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Error saving user stats', e);
  }
}

export function recordQuestionAnswer(questionId: string, isCorrect: boolean): UserStats {
  const stats = loadUserStats();
  stats.totalAnswered += 1;
  if (isCorrect) {
    stats.totalCorrect += 1;
    // Remove from wrong list if corrected
    stats.wrongQuestionIds = stats.wrongQuestionIds.filter(id => id !== questionId);
  } else {
    if (!stats.wrongQuestionIds.includes(questionId)) {
      stats.wrongQuestionIds.push(questionId);
    }
  }
  stats.lastActive = new Date().toISOString();
  saveUserStats(stats);
  return stats;
}

export function toggleBookmarkQuestion(questionId: string): { isBookmarked: boolean; stats: UserStats } {
  const stats = loadUserStats();
  const index = stats.bookmarkedQuestionIds.indexOf(questionId);
  let isBookmarked = false;
  if (index >= 0) {
    stats.bookmarkedQuestionIds.splice(index, 1);
    isBookmarked = false;
  } else {
    stats.bookmarkedQuestionIds.push(questionId);
    isBookmarked = true;
  }
  saveUserStats(stats);
  return { isBookmarked, stats };
}

export function recordCompletedTask(taskId: string): UserStats {
  const stats = loadUserStats();
  if (!stats.completedTaskIds.includes(taskId)) {
    stats.completedTaskIds.push(taskId);
    saveUserStats(stats);
  }
  return stats;
}

export function recordExamResult(result: ExamResult): UserStats {
  const stats = loadUserStats();
  stats.examHistory.unshift(result);
  saveUserStats(stats);
  return stats;
}

export function resetAllProgress(): UserStats {
  saveUserStats(DEFAULT_STATS);
  return DEFAULT_STATS;
}
