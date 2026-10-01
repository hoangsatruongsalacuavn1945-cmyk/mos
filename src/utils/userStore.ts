import { create } from 'zustand';
import { UserProfile, TeacherProfile, Submission, IUser, UserRole } from '../types/user';

export const AUTH_TOKEN_KEY = 'mos_auth_token_jwt';

export function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? (localStorage.getItem(AUTH_TOKEN_KEY) || '') : '';
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const DEFAULT_GUEST: IUser = {
  name: 'Khách',
  email: 'guest@student.edu.vn',
  role: 'guest',
};

export const DEFAULT_TEACHERS: TeacherProfile[] = [
  {
    id: 't-word-01',
    name: 'ThS. Nguyễn Tuấn Anh',
    email: 'tuananh.mosword@edu.vn',
    subject: 'word',
    title: 'Trưởng Bộ Môn MOS Word (MO-100)',
    department: 'Khoa Tin học Ứng dụng & Khảo thí Quốc tế',
    phone: '1900.6868 (Ext: 101)',
    avatarBg: 'bg-blue-600',
  },
  {
    id: 't-excel-02',
    name: 'ThS. Trần Thị Bích Mai',
    email: 'bichmai.mosexcel@edu.vn',
    subject: 'excel',
    title: 'Chuyên Gia Huấn Luyện MOS Excel (MO-200)',
    department: 'Bộ môn Phân tích Dữ liệu & Bảng tính',
    phone: '1900.6868 (Ext: 102)',
    avatarBg: 'bg-emerald-600',
  },
  {
    id: 't-ppt-03',
    name: 'ThS. Lê Hoàng Nam',
    email: 'hoangnam.mosppt@edu.vn',
    subject: 'powerpoint',
    title: 'Giảng Viên Chuyên Sâu MOS PowerPoint (MO-300)',
    department: 'Bộ môn Thiết kế Đa phương tiện & Thuyết trình',
    phone: '1900.6868 (Ext: 103)',
    avatarBg: 'bg-orange-600',
  },
  {
    id: 't-all-04',
    name: 'TS. Phạm Minh Đức',
    email: 'minhduc.mosmaster@edu.vn',
    subject: 'all',
    title: 'Giám Đốc Trung Tâm Khảo Thí MOS Master',
    department: 'Hội đồng Khảo thí Certiport Việt Nam',
    phone: '1900.6868 (Ext: 104)',
    avatarBg: 'bg-indigo-700',
  },
];

const USER_STORAGE_KEY = 'mos_current_user_profile_v2';
const SUBMISSIONS_STORAGE_KEY = 'mos_local_submissions_cache_v2';
const TEACHERS_STORAGE_KEY = 'mos_teachers_list_v2';

export const OWNER_PROFILE: UserProfile = {
  id: 'owner-master-root',
  name: 'Quản Trị Viên Hệ Thống (Master Admin)',
  email: 'admin@mosmaster.edu.vn',
  role: 'admin',
  targetSubject: 'all',
  assignedTeacherId: '',
  assignedTeacherName: 'Toàn Quyền Quản Trị Hệ Thống',
  assignedTeacherEmail: 'admin@mosmaster.edu.vn',
  createdAt: new Date().toISOString(),
};

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

export function getTeachers(): TeacherProfile[] {
  try {
    const raw = localStorage.getItem(TEACHERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(TEACHERS_STORAGE_KEY, JSON.stringify(DEFAULT_TEACHERS));
      return DEFAULT_TEACHERS;
    }
    const list = JSON.parse(raw);
    return Array.isArray(list) && list.length > 0 ? list : DEFAULT_TEACHERS;
  } catch {
    return DEFAULT_TEACHERS;
  }
}

export function saveTeachers(teachers: TeacherProfile[]): void {
  try {
    localStorage.setItem(TEACHERS_STORAGE_KEY, JSON.stringify(teachers));
  } catch (e) {
    console.error('Error saving teachers list:', e);
  }
}

export function addTeacher(teacherData: Omit<TeacherProfile, 'id'>): TeacherProfile {
  const teachers = getTeachers();
  const newTeacher: TeacherProfile = {
    ...teacherData,
    id: 't-custom-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    createdAt: new Date().toISOString(),
    activeStudentsCount: 0,
  };
  teachers.unshift(newTeacher);
  saveTeachers(teachers);

  // Sync to backend if possible
  fetch('/api/teachers', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(newTeacher),
  }).catch((err) => console.warn('Sync teacher error:', err));

  return newTeacher;
}

export function deleteTeacher(teacherId: string): boolean {
  const teachers = getTeachers();
  const filtered = teachers.filter(t => t.id !== teacherId);
  if (filtered.length === teachers.length) return false;
  saveTeachers(filtered);

  // Sync to backend
  fetch(`/api/teachers/${teacherId}`, { 
    method: 'DELETE',
    headers: getAuthHeaders(),
  }).catch((err) => console.warn('Delete teacher error:', err));
  return true;
}

export function updateTeacher(teacherId: string, updates: Partial<TeacherProfile>): TeacherProfile | null {
  const teachers = getTeachers();
  const index = teachers.findIndex(t => t.id === teacherId);
  if (index === -1) return null;
  teachers[index] = { ...teachers[index], ...updates };
  saveTeachers(teachers);

  // Sync to backend
  fetch(`/api/teachers/${teacherId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(teachers[index]),
  }).catch((err) => console.warn('Update teacher error:', err));

  return teachers[index];
}

// Initial state loader: defaults to 'guest' role
const getInitialAuthState = () => {
  const token = typeof window !== 'undefined' 
    ? (localStorage.getItem(AUTH_TOKEN_KEY) || '') 
    : '';

  try {
    const rawUser = typeof window !== 'undefined' ? localStorage.getItem(USER_STORAGE_KEY) : null;
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      if (parsed && parsed.role) {
        const role: UserRole = parsed.role;
        const fullName = parsed.fullName || parsed.name || (role === 'guest' ? 'Khách' : 'Người dùng');
        return {
          role,
          fullName,
          token,
          user: {
            ...parsed,
            role,
            fullName,
            name: fullName,
          } as IUser,
        };
      }
    }
  } catch (e) {
    console.warn('Failed to parse cached auth state:', e);
  }

  // Initializing with 'guest' by default as explicitly requested
  const guestUser: IUser = {
    id: 'guest',
    name: 'Khách',
    fullName: 'Khách',
    email: 'guest@student.edu.vn',
    role: 'guest',
  };

  return {
    role: 'guest' as UserRole,
    fullName: 'Khách',
    token: '',
    user: guestUser,
  };
};

export interface AuthState {
  role: UserRole;
  fullName: string;
  token: string;
  user: IUser;
  login: (userData: any, token?: string) => void;
  logout: () => void;
  setUser: (userData: Partial<IUser>) => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const initial = getInitialAuthState();
  return {
    role: initial.role,
    fullName: initial.fullName,
    token: initial.token,
    user: initial.user,

    login: (userData: any, token?: string) => {
      const role: UserRole = userData.role || 'student';
      const fullName = userData.fullName || userData.name || 'Người dùng';
      const authToken = token || userData.token || '';

      const updatedUser: IUser = {
        ...userData,
        role,
        fullName,
        name: fullName,
      };

      try {
        if (authToken) {
          localStorage.setItem(AUTH_TOKEN_KEY, authToken);
          // Clean legacy keys
          localStorage.removeItem('mos_jwt_token');
          localStorage.removeItem('accessToken');
        }
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      } catch (e) {
        console.error('Error persisting auth state:', e);
      }

      set({
        role,
        fullName,
        token: authToken,
        user: updatedUser,
      });

      // Automatically trigger Google Sheets synchronization upon sign-in
      if (role !== 'guest' && updatedUser.email) {
        import('../services/googleSheetsService').then(({ appendUserLoginToSheet }) => {
          appendUserLoginToSheet({
            uid: updatedUser.id || (updatedUser as any)._id || 'user-id',
            name: fullName,
            email: updatedUser.email || '',
            role: role,
            provider: authToken?.startsWith('ya29.') ? 'Google Sign-In (OAuth)' : 'Tài khoản hệ thống',
          }).catch((err) => console.warn('Automatic Google Sheets login sync:', err));
        }).catch(() => {});

        import('../services/userProfileSheetSyncService').then(({ syncCurrentSessionUserProfile }) => {
          syncCurrentSessionUserProfile({
            uid: updatedUser.id || (updatedUser as any)._id || 'user-id',
            displayName: fullName,
            email: updatedUser.email || '',
            role: role,
          }, { promptIfMissing: false }).catch((err) => console.warn('Automatic profile sync deferred:', err));
        }).catch(() => {});
      }
    },

    logout: () => {
      const guestUser: IUser = {
        id: 'guest',
        name: 'Khách',
        fullName: 'Khách',
        email: 'guest@student.edu.vn',
        role: 'guest',
      };

      try {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem('mos_jwt_token');
        localStorage.removeItem('accessToken');
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(guestUser));
      } catch (e) {
        console.error('Error clearing auth state:', e);
      }

      set({
        role: 'guest',
        fullName: 'Khách',
        token: '',
        user: guestUser,
      });
    },

    setUser: (userData: Partial<IUser>) => {
      set((state) => {
        const fullName = userData.fullName || userData.name || state.fullName;
        const role = userData.role || state.role;
        const updatedUser: IUser = {
          ...state.user,
          ...userData,
          fullName,
          name: fullName,
          role,
        };

        try {
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
        } catch {}

        return {
          user: updatedUser,
          role,
          fullName,
        };
      });
    },
  };
});

// Legacy helpers & store facade to guarantee backward compatibility
export const authStore = {
  getUser: (): IUser => useAuthStore.getState().user,
  getToken: (): string => useAuthStore.getState().token,
  login: (userData: any, token?: string) => useAuthStore.getState().login(userData, token),
  logout: () => useAuthStore.getState().logout(),
  subscribe: (fn: () => void) => useAuthStore.subscribe(fn),
};

export function getCurrentUser(): UserProfile {
  return useAuthStore.getState().user as UserProfile;
}

export function saveCurrentUser(user: UserProfile): void {
  useAuthStore.getState().setUser(user);
}

// Find appropriate teacher for a specific subject
export function getTeacherForSubject(subject: string): TeacherProfile {
  const teachers = getTeachers();
  const norm = subject.toLowerCase();
  const match = teachers.find(t => t.subject === norm);
  return match || teachers[0] || DEFAULT_TEACHERS[0];
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
      headers: getAuthHeaders(),
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

    const res = await fetch(`/api/submissions?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
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
      headers: getAuthHeaders(),
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
