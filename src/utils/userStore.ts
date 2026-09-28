import { UserProfile, TeacherProfile, Submission } from '../types/user';

export const DEFAULT_TEACHERS: TeacherProfile[] = [
  {
    id: 't-word-01',
    name: 'ThS. Nguyễn Tuấn Anh',
    email: 'tuananh.mosword@edu.vn',
    subject: 'word',
    title: 'Trưởng Bộ Môn MOS Word (MO-100)',
    department: 'Khoa Tin học Ứng dụng & Khảo thí Quốc tế',
    phone: '0912.345.678',
    avatarBg: 'bg-blue-600',
  },
  {
    id: 't-excel-02',
    name: 'ThS. Trần Thị Bích Mai',
    email: 'bichmai.mosexcel@edu.vn',
    subject: 'excel',
    title: 'Chuyên Gia Huấn Luyện MOS Excel (MO-200)',
    department: 'Bộ môn Phân tích Dữ liệu & Bảng tính',
    phone: '0988.765.432',
    avatarBg: 'bg-emerald-600',
  },
  {
    id: 't-ppt-03',
    name: 'ThS. Lê Hoàng Nam',
    email: 'hoangnam.mosppt@edu.vn',
    subject: 'powerpoint',
    title: 'Giảng Viên Chuyên Sâu MOS PowerPoint (MO-300)',
    department: 'Bộ môn Thiết kế Đa phương tiện & Thuyết trình',
    phone: '0933.112.233',
    avatarBg: 'bg-orange-600',
  },
  {
    id: 't-all-04',
    name: 'TS. Phạm Minh Đức',
    email: 'minhduc.mosmaster@edu.vn',
    subject: 'all',
    title: 'Giám Đốc Trung Tâm Khảo Thí MOS Master',
    department: 'Hội đồng Khảo thí Certiport Việt Nam',
    phone: '0903.999.888',
    avatarBg: 'bg-indigo-700',
  },
];

const USER_STORAGE_KEY = 'mos_current_user_profile_v2';
const SUBMISSIONS_STORAGE_KEY = 'mos_local_submissions_cache_v2';

export const DEFAULT_STUDENT: UserProfile = {
  id: 'stu-user-default',
  name: 'Nguyễn Hoàng Sơn',
  email: 'hoangson.k24@student.edu.vn',
  role: 'student',
  studentCode: 'K24-CNTT-089',
  classRoom: 'Lớp MOS-TinHoc01',
  targetSubject: 'all',
  assignedTeacherId: 't-excel-02',
  assignedTeacherName: 'ThS. Trần Thị Bích Mai',
  assignedTeacherEmail: 'bichmai.mosexcel@edu.vn',
  createdAt: new Date().toISOString(),
};

export function getCurrentUser(): UserProfile {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) {
      saveCurrentUser(DEFAULT_STUDENT);
      return DEFAULT_STUDENT;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_STUDENT;
  }
}

export function saveCurrentUser(user: UserProfile): void {
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch (e) {
    console.error('Error saving current user:', e);
  }
}

// Find appropriate teacher for a specific subject
export function getTeacherForSubject(subject: string): TeacherProfile {
  const norm = subject.toLowerCase();
  const match = DEFAULT_TEACHERS.find(t => t.subject === norm);
  return match || DEFAULT_TEACHERS[0];
}

// Auto-submit exam/practice result to backend API and local store
export async function sendSubmissionToTeacher(submission: Omit<Submission, 'id' | 'submittedAt' | 'status'>): Promise<Submission> {
  const fullSubmission: Submission = {
    ...submission,
    id: 'sub-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    submittedAt: new Date().toISOString(),
    status: 'pending',
  };

  // 1. Save to local fallback cache
  try {
    const raw = localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
    const list: Submission[] = raw ? JSON.parse(raw) : [];
    list.unshift(fullSubmission);
    localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(list.slice(0, 50)));
  } catch (e) {
    console.warn('Could not cache submission locally:', e);
  }

  // 2. Send to backend server
  try {
    const res = await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullSubmission),
    });
    if (res.ok) {
      const data = await res.json();
      return data.submission || fullSubmission;
    }
  } catch (err) {
    console.warn('Backend submissions API error, stored locally:', err);
  }

  return fullSubmission;
}

// Fetch submissions (for student or teacher)
export async function fetchSubmissions(filter?: { teacherId?: string; studentId?: string; subject?: string }): Promise<Submission[]> {
  try {
    const params = new URLSearchParams();
    if (filter?.teacherId) params.append('teacherId', filter.teacherId);
    if (filter?.studentId) params.append('studentId', filter.studentId);
    if (filter?.subject && filter.subject !== 'all') params.append('subject', filter.subject);

    const res = await fetch(`/api/submissions?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.submissions)) {
        return data.submissions;
      }
    }
  } catch (e) {
    console.warn('Error fetching submissions from server, fallback to local:', e);
  }

  // Fallback to local cache
  try {
    const raw = localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
    let list: Submission[] = raw ? JSON.parse(raw) : [];
    if (filter?.teacherId) list = list.filter(s => s.teacherId === filter.teacherId);
    if (filter?.studentId) list = list.filter(s => s.studentId === filter.studentId);
    if (filter?.subject && filter.subject !== 'all') list = list.filter(s => s.subject === filter.subject);
    return list;
  } catch {
    return [];
  }
}

// Teacher submits feedback for a submission
export async function submitTeacherFeedback(
  submissionId: string, 
  feedback: string, 
  rating?: 'excellent' | 'good' | 'needs-improvement'
): Promise<boolean> {
  try {
    const res = await fetch(`/api/submissions/${submissionId}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback, rating }),
    });
    if (res.ok) {
      // Also update local cache
      const raw = localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
      if (raw) {
        const list: Submission[] = JSON.parse(raw);
        const item = list.find(s => s.id === submissionId);
        if (item) {
          item.teacherFeedback = feedback;
          item.teacherFeedbackAt = new Date().toISOString();
          item.teacherRating = rating;
          item.status = 'reviewed';
          localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(list));
        }
      }
      return true;
    }
  } catch (e) {
    console.warn('Error saving feedback to server:', e);
  }

  // Fallback to local
  try {
    const raw = localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
    if (raw) {
      const list: Submission[] = JSON.parse(raw);
      const item = list.find(s => s.id === submissionId);
      if (item) {
        item.teacherFeedback = feedback;
        item.teacherFeedbackAt = new Date().toISOString();
        item.teacherRating = rating;
        item.status = 'reviewed';
        localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(list));
        return true;
      }
    }
  } catch {}
  return false;
}
