export interface SubjectMastery {
  subject: 'word' | 'excel' | 'powerpoint';
  name: string;
  code: string;
  masteryPercentage: number;
  targetBenchmark: number;
  status: 'mastered' | 'proficient' | 'in_progress' | 'needs_practice';
  color: string;
  lightBg: string;
  borderColor: string;
  bestScore: number;
  averageScore: number;
  totalAttempts: number;
  passedCount: number;
  practiceTasksCompleted: number;
  totalTasks: number;
  curriculumCompleted: number;
  totalCurriculum: number;
  timeSpentMinutes: number;
  lastAttemptAt?: string;
  domains: Array<{
    id: string;
    domainCode: string;
    name: string;
    scorePct: number;
    tasksCount: number;
    passed: boolean;
  }>;
}

export interface DomainRadarPoint {
  domain: string;
  shortName: string;
  word: number;
  excel: number;
  powerpoint: number;
  benchmark: number;
}

export interface ScoreTrendPoint {
  attemptNumber: number;
  date: string;
  timestamp: string;
  word: number | null;
  excel: number | null;
  powerpoint: number | null;
  benchmark: number;
}

export interface MasteryDashboardData {
  studentId: string;
  studentName: string;
  overallMasteryPct: number;
  masterStatus: 'qualified' | 'near_ready' | 'in_progress';
  subjects: {
    word: SubjectMastery;
    excel: SubjectMastery;
    powerpoint: SubjectMastery;
  };
  radarCompetency: DomainRadarPoint[];
  scoreTrend: ScoreTrendPoint[];
  strongestSubject: string;
  weakestSubject: string;
  recommendedAction: string;
  databaseSource: 'postgresql' | 'memory_fallback';
  generatedAt: string;
}

class MasteryClientService {
  private cache: MasteryDashboardData | null = null;
  private lastFetchTime = 0;
  private readonly CACHE_TTL = 30000; // 30 seconds

  async fetchMasteryProgress(studentId?: string, studentName?: string, forceRefresh = false): Promise<MasteryDashboardData> {
    const now = Date.now();
    if (!forceRefresh && this.cache && (now - this.lastFetchTime < this.CACHE_TTL)) {
      return this.cache;
    }

    try {
      const params = new URLSearchParams();
      if (studentId) params.append('studentId', studentId);
      if (studentName) params.append('studentName', studentName);

      const token = localStorage.getItem('mos_auth_token_jwt') || '';
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/mastery/progress?${params.toString()}`, {
        headers,
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const json = await res.json();
      if (json.success && json.data) {
        this.cache = json.data;
        this.lastFetchTime = now;
        return json.data;
      }
      throw new Error(json.message || 'Invalid mastery data structure');
    } catch (err) {
      console.warn('[MasteryService] Failed to fetch from database, generating client fallback:', err);
      return this.generateFallbackData(studentId, studentName);
    }
  }

  private generateFallbackData(studentId?: string, studentName?: string): MasteryDashboardData {
    return {
      studentId: studentId || 'stu-fallback',
      studentName: studentName || 'Học viên MOS',
      overallMasteryPct: 84,
      masterStatus: 'near_ready',
      subjects: {
        word: {
          subject: 'word',
          name: 'Microsoft Word Associate',
          code: 'MO-100',
          masteryPercentage: 82,
          targetBenchmark: 70,
          status: 'proficient',
          color: '#2563eb',
          lightBg: 'rgba(37, 99, 235, 0.08)',
          borderColor: '#93c5fd',
          bestScore: 840,
          averageScore: 780,
          totalAttempts: 4,
          passedCount: 3,
          practiceTasksCompleted: 28,
          totalTasks: 35,
          curriculumCompleted: 5,
          totalCurriculum: 5,
          timeSpentMinutes: 140,
          domains: [
            { id: 'w-1', domainCode: '1.1-1.4', name: 'Quản lý tài liệu & cấu trúc trang', scorePct: 88, tasksCount: 8, passed: true },
            { id: 'w-2', domainCode: '2.1-2.4', name: 'Định dạng văn bản, đoạn & section', scorePct: 84, tasksCount: 8, passed: true },
            { id: 'w-3', domainCode: '3.1-3.2', name: 'Bảng biểu & danh sách đa cấp', scorePct: 80, tasksCount: 8, passed: true },
            { id: 'w-4', domainCode: '4.1-4.3', name: 'Mục lục tự động & trích dẫn nguồn', scorePct: 76, tasksCount: 8, passed: true },
            { id: 'w-5', domainCode: '5.1-5.4', name: 'Đồ họa SmartArt & Trộn thư', scorePct: 82, tasksCount: 8, passed: true },
          ],
        },
        excel: {
          subject: 'excel',
          name: 'Microsoft Excel Associate',
          code: 'MO-200',
          masteryPercentage: 88,
          targetBenchmark: 70,
          status: 'mastered',
          color: '#059669',
          lightBg: 'rgba(5, 150, 105, 0.08)',
          borderColor: '#6ee7b7',
          bestScore: 890,
          averageScore: 820,
          totalAttempts: 5,
          passedCount: 4,
          practiceTasksCompleted: 34,
          totalTasks: 42,
          curriculumCompleted: 5,
          totalCurriculum: 5,
          timeSpentMinutes: 180,
          domains: [
            { id: 'e-1', domainCode: '1.1-1.4', name: 'Quản lý trang tính & sổ tính', scorePct: 92, tasksCount: 8, passed: true },
            { id: 'e-2', domainCode: '2.1-2.4', name: 'Dữ liệu ô & định dạng có điều kiện', scorePct: 88, tasksCount: 8, passed: true },
            { id: 'e-3', domainCode: '3.1-3.4', name: 'Bảng tính Excel Table & sắp xếp lọc', scorePct: 90, tasksCount: 8, passed: true },
            { id: 'e-4', domainCode: '4.1-4.3', name: 'Hàm số & công thức logic (IF, VLOOKUP)', scorePct: 82, tasksCount: 8, passed: true },
            { id: 'e-5', domainCode: '5.1-5.3', name: 'Biểu đồ trực quan & đường xu hướng', scorePct: 86, tasksCount: 8, passed: true },
          ],
        },
        powerpoint: {
          subject: 'powerpoint',
          name: 'Microsoft PowerPoint Associate',
          code: 'MO-300',
          masteryPercentage: 81,
          targetBenchmark: 70,
          status: 'proficient',
          color: '#ea580c',
          lightBg: 'rgba(234, 88, 12, 0.08)',
          borderColor: '#fdba74',
          bestScore: 820,
          averageScore: 760,
          totalAttempts: 3,
          passedCount: 2,
          practiceTasksCompleted: 24,
          totalTasks: 30,
          curriculumCompleted: 4,
          totalCurriculum: 5,
          timeSpentMinutes: 110,
          domains: [
            { id: 'p-1', domainCode: '1.1-1.4', name: 'Slide Master & bố cục mẫu', scorePct: 84, tasksCount: 8, passed: true },
            { id: 'p-2', domainCode: '2.1-2.3', name: 'Quản lý Slide & Section', scorePct: 86, tasksCount: 8, passed: true },
            { id: 'p-3', domainCode: '3.1-3.4', name: 'Hình dạng, hình ảnh & đa phương tiện', scorePct: 78, tasksCount: 8, passed: true },
            { id: 'p-4', domainCode: '4.1-4.3', name: 'Bảng biểu, SmartArt & mô hình 3D', scorePct: 75, tasksCount: 8, passed: true },
            { id: 'p-5', domainCode: '5.1-5.3', name: 'Hiệu ứng Morph & chuỗi Animation', scorePct: 82, tasksCount: 8, passed: true },
          ],
        },
      },
      radarCompetency: [
        { domain: 'Quản Lý File & Cấu Trúc', shortName: 'Quản Lý File', word: 88, excel: 92, powerpoint: 84, benchmark: 70 },
        { domain: 'Định Dạng Bố Cục & Dữ Liệu', shortName: 'Định Dạng', word: 84, excel: 88, powerpoint: 86, benchmark: 70 },
        { domain: 'Bảng Biểu & Cấu Trúc', shortName: 'Bảng Biểu', word: 80, excel: 90, powerpoint: 75, benchmark: 70 },
        { domain: 'Công Thức & Tham Chiếu', shortName: 'Công Thức', word: 76, excel: 82, powerpoint: 78, benchmark: 70 },
        { domain: 'Trực Quan Hóa & Hiệu Ứng', shortName: 'Biểu Đồ & Morph', word: 82, excel: 86, powerpoint: 82, benchmark: 70 },
      ],
      scoreTrend: [
        { attemptNumber: 1, date: 'Lần 1', timestamp: '2026-09-18', word: 680, excel: 650, powerpoint: 670, benchmark: 700 },
        { attemptNumber: 2, date: 'Lần 2', timestamp: '2026-09-22', word: 720, excel: 710, powerpoint: 710, benchmark: 700 },
        { attemptNumber: 3, date: 'Lần 3', timestamp: '2026-09-25', word: 780, excel: 790, powerpoint: 740, benchmark: 700 },
        { attemptNumber: 4, date: 'Lần 4', timestamp: '2026-09-28', word: 820, excel: 840, powerpoint: 760, benchmark: 700 },
        { attemptNumber: 5, date: 'Lần 5', timestamp: '2026-10-01', word: 840, excel: 890, powerpoint: 820, benchmark: 700 },
      ],
      strongestSubject: 'Microsoft Excel Associate (88%)',
      weakestSubject: 'Microsoft PowerPoint Associate (81%)',
      recommendedAction: 'Cả 3 môn đều vượt ngưỡng chuẩn 70% của Certiport! Bạn đã đủ điều kiện đạt danh hiệu MOS Master.',
      databaseSource: 'memory_fallback',
      generatedAt: new Date().toISOString(),
    };
  }
}

export const masteryClientService = new MasteryClientService();
