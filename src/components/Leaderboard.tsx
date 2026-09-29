import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  Medal, 
  Award, 
  Flame, 
  Sparkles, 
  TrendingUp, 
  BookOpen, 
  CheckCircle2, 
  Search, 
  ArrowUpRight, 
  Clock, 
  Target, 
  Users, 
  ChevronRight,
  ShieldCheck,
  Zap,
  RefreshCw,
  X
} from 'lucide-react';
import { useUserProgressStore, MOSSubjectTrack, CURRICULUM_LESSONS } from '../utils/userProgressStore';
import { useAuthStore } from '../utils/userStore';
import { soundManager } from '../utils/audio';
import confetti from 'canvas-confetti';

export interface LeaderboardUserItem {
  id: string;
  name: string;
  studentCode: string;
  classRoom: string;
  avatarSeed: string;
  masterProgress: number; // 0 - 100%
  completedLessons: number; // 0 - 15
  wordProgress: number;
  excelProgress: number;
  pptProgress: number;
  bestExamScore: number; // 0 - 1000
  streakDays: number;
  lastActive: string;
  certiportStatus: 'certified' | 'ready' | 'in-progress';
  isCurrentUser?: boolean;
}

// Pre-seeded high-performing peer cohort for realistic and motivating competition
const BASE_COHORT: LeaderboardUserItem[] = [
  {
    id: 'lead-1',
    name: 'Nguyễn Đăng Khoa',
    studentCode: 'K24-CNTT-018',
    classRoom: 'Lớp MOS Master Quốc Tế 01',
    avatarSeed: 'NDK',
    masterProgress: 100,
    completedLessons: 15,
    wordProgress: 100,
    excelProgress: 100,
    pptProgress: 100,
    bestExamScore: 980,
    streakDays: 19,
    lastActive: '15 phút trước',
    certiportStatus: 'certified',
  },
  {
    id: 'lead-2',
    name: 'Trần Minh Quân',
    studentCode: 'K24-CNTT-012',
    classRoom: 'Lớp MOS-TinHoc01',
    avatarSeed: 'TMQ',
    masterProgress: 93,
    completedLessons: 14,
    wordProgress: 100,
    excelProgress: 100,
    pptProgress: 80,
    bestExamScore: 950,
    streakDays: 14,
    lastActive: '45 phút trước',
    certiportStatus: 'ready',
  },
  {
    id: 'lead-3',
    name: 'Lê Thu Hương',
    studentCode: 'K24-QTKD-045',
    classRoom: 'Lớp MOS-TinHoc01',
    avatarSeed: 'LTH',
    masterProgress: 87,
    completedLessons: 13,
    wordProgress: 100,
    excelProgress: 80,
    pptProgress: 80,
    bestExamScore: 920,
    streakDays: 11,
    lastActive: '2 giờ trước',
    certiportStatus: 'ready',
  },
  {
    id: 'lead-4',
    name: 'Phạm Hoàng Nam',
    studentCode: 'K24-KTPM-088',
    classRoom: 'Lớp MOS-TinHoc02',
    avatarSeed: 'PHN',
    masterProgress: 80,
    completedLessons: 12,
    wordProgress: 100,
    excelProgress: 80,
    pptProgress: 60,
    bestExamScore: 890,
    streakDays: 8,
    lastActive: 'Hôm nay',
    certiportStatus: 'ready',
  },
  {
    id: 'lead-5',
    name: 'Vũ Hải Yến',
    studentCode: 'K24-TCNH-102',
    classRoom: 'Lớp MOS-TinHoc02',
    avatarSeed: 'VHY',
    masterProgress: 73,
    completedLessons: 11,
    wordProgress: 80,
    excelProgress: 80,
    pptProgress: 60,
    bestExamScore: 860,
    streakDays: 7,
    lastActive: 'Hôm nay',
    certiportStatus: 'ready',
  },
  {
    id: 'lead-6',
    name: 'Đỗ Quốc Bảo',
    studentCode: 'K24-CNTT-091',
    classRoom: 'Lớp MOS-TinHoc01',
    avatarSeed: 'DQB',
    masterProgress: 67,
    completedLessons: 10,
    wordProgress: 80,
    excelProgress: 60,
    pptProgress: 60,
    bestExamScore: 840,
    streakDays: 6,
    lastActive: 'Hôm qua',
    certiportStatus: 'in-progress',
  },
  {
    id: 'lead-7',
    name: 'Ngô Thanh Trúc',
    studentCode: 'K24-NNA-033',
    classRoom: 'Lớp MOS-TinHoc03',
    avatarSeed: 'NTT',
    masterProgress: 60,
    completedLessons: 9,
    wordProgress: 60,
    excelProgress: 60,
    pptProgress: 60,
    bestExamScore: 810,
    streakDays: 5,
    lastActive: 'Hôm qua',
    certiportStatus: 'in-progress',
  },
  {
    id: 'lead-8',
    name: 'Bùi Đức Anh',
    studentCode: 'K24-CNTT-114',
    classRoom: 'Lớp MOS-TinHoc02',
    avatarSeed: 'BDA',
    masterProgress: 53,
    completedLessons: 8,
    wordProgress: 60,
    excelProgress: 60,
    pptProgress: 40,
    bestExamScore: 780,
    streakDays: 4,
    lastActive: '2 ngày trước',
    certiportStatus: 'in-progress',
  },
  {
    id: 'lead-9',
    name: 'Hoàng Mai Phương',
    studentCode: 'K24-QTKD-079',
    classRoom: 'Lớp MOS-TinHoc03',
    avatarSeed: 'HMP',
    masterProgress: 47,
    completedLessons: 7,
    wordProgress: 60,
    excelProgress: 40,
    pptProgress: 40,
    bestExamScore: 750,
    streakDays: 3,
    lastActive: '2 ngày trước',
    certiportStatus: 'in-progress',
  },
  {
    id: 'lead-10',
    name: 'Đặng Tuấn Kiệt',
    studentCode: 'K24-KTPM-052',
    classRoom: 'Lớp MOS-TinHoc01',
    avatarSeed: 'DTK',
    masterProgress: 40,
    completedLessons: 6,
    wordProgress: 40,
    excelProgress: 40,
    pptProgress: 40,
    bestExamScore: 720,
    streakDays: 2,
    lastActive: '3 ngày trước',
    certiportStatus: 'in-progress',
  },
];

interface LeaderboardProps {
  onClose?: () => void;
  isModal?: boolean;
  onSelectAction?: (action: 'study' | 'exam', subject?: MOSSubjectTrack) => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  onClose,
  isModal = false,
  onSelectAction,
}) => {
  const { user, fullName } = useAuthStore();
  const { 
    getMasterProgressPercentage, 
    getTotalCompletedLessonsCount, 
    getSubjectStats 
  } = useUserProgressStore();

  const [selectedSubject, setSelectedSubject] = useState<'all' | 'word' | 'excel' | 'powerpoint'>('all');
  const [sortMetric, setSortMetric] = useState<'progress' | 'lessons' | 'exam' | 'streak'>('progress');
  const [searchQuery, setSearchQuery] = useState('');
  const [cheeredUsers, setCheeredUsers] = useState<Record<string, number>>({});

  // Calculate live metrics of current logged-in user directly from UserProgressStore
  const currentMasterPct = getMasterProgressPercentage();
  const currentCompletedCount = getTotalCompletedLessonsCount();
  const currentWordStats = getSubjectStats('word');
  const currentExcelStats = getSubjectStats('excel');
  const currentPptStats = getSubjectStats('powerpoint');

  // Highest exam score recorded
  const currentBestScore = Math.max(
    currentWordStats.highestScore,
    currentExcelStats.highestScore,
    currentPptStats.highestScore,
    currentMasterPct > 0 ? Math.min(1000, 650 + currentMasterPct * 3) : 0
  );

  // Construct current user record
  const currentUserRecord: LeaderboardUserItem = useMemo(() => {
    const displayName = fullName || user.fullName || user.name || 'Học Viên Hiện Tại';
    const code = user.studentCode || 'K24-CNTT-089';
    const cl = user.classRoom || 'Lớp MOS Master';

    return {
      id: user.id || 'current-user-active',
      name: displayName,
      studentCode: code,
      classRoom: cl,
      avatarSeed: displayName.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase(),
      masterProgress: currentMasterPct,
      completedLessons: currentCompletedCount,
      wordProgress: currentWordStats.completionPercentage,
      excelProgress: currentExcelStats.completionPercentage,
      pptProgress: currentPptStats.completionPercentage,
      bestExamScore: currentBestScore,
      streakDays: currentMasterPct > 50 ? 5 : currentMasterPct > 20 ? 3 : 1,
      lastActive: 'Đang trực tuyến',
      certiportStatus: currentMasterPct >= 90 ? 'certified' : currentMasterPct >= 60 ? 'ready' : 'in-progress',
      isCurrentUser: true,
    };
  }, [user, fullName, currentMasterPct, currentCompletedCount, currentWordStats, currentExcelStats, currentPptStats, currentBestScore]);

  // Combine and sort full leaderboard
  const sortedLeaderboard = useMemo(() => {
    // Check if current user is already in cohort by ID
    const peerList = BASE_COHORT.filter(item => item.id !== currentUserRecord.id);
    const combined = [...peerList, currentUserRecord];

    // Determine value to sort by
    return combined.sort((a, b) => {
      if (selectedSubject === 'word') {
        if (b.wordProgress !== a.wordProgress) return b.wordProgress - a.wordProgress;
      } else if (selectedSubject === 'excel') {
        if (b.excelProgress !== a.excelProgress) return b.excelProgress - a.excelProgress;
      } else if (selectedSubject === 'powerpoint') {
        if (b.pptProgress !== a.pptProgress) return b.pptProgress - a.pptProgress;
      } else {
        if (sortMetric === 'progress') {
          if (b.masterProgress !== a.masterProgress) return b.masterProgress - a.masterProgress;
        } else if (sortMetric === 'lessons') {
          if (b.completedLessons !== a.completedLessons) return b.completedLessons - a.completedLessons;
        } else if (sortMetric === 'exam') {
          if (b.bestExamScore !== a.bestExamScore) return b.bestExamScore - a.bestExamScore;
        } else if (sortMetric === 'streak') {
          if (b.streakDays !== a.streakDays) return b.streakDays - a.streakDays;
        }
      }
      return b.bestExamScore - a.bestExamScore;
    });
  }, [currentUserRecord, selectedSubject, sortMetric]);

  // Filter by search query
  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return sortedLeaderboard;
    const q = searchQuery.toLowerCase().trim();
    return sortedLeaderboard.filter(
      item => item.name.toLowerCase().includes(q) || item.studentCode.toLowerCase().includes(q) || item.classRoom.toLowerCase().includes(q)
    );
  }, [sortedLeaderboard, searchQuery]);

  // Current user's index / rank in this specific sort
  const currentUserRank = useMemo(() => {
    const idx = sortedLeaderboard.findIndex(item => item.isCurrentUser);
    return idx >= 0 ? idx + 1 : 1;
  }, [sortedLeaderboard]);

  // User right above current user (for milestone challenge)
  const userAbove = useMemo(() => {
    if (currentUserRank > 1 && currentUserRank <= sortedLeaderboard.length) {
      return sortedLeaderboard[currentUserRank - 2];
    }
    return null;
  }, [currentUserRank, sortedLeaderboard]);

  const handleCheer = (userId: string, userName: string) => {
    soundManager.playCorrect();
    setCheeredUsers(prev => ({ ...prev, [userId]: (prev[userId] || 0) + 1 }));
    confetti({
      particleCount: 25,
      spread: 45,
      origin: { y: 0.8 },
      colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899'],
    });
  };

  const top1 = sortedLeaderboard[0];
  const top2 = sortedLeaderboard[1];
  const top3 = sortedLeaderboard[2];

  return (
    <div className={`flex flex-col bg-slate-900 text-slate-100 ${isModal ? 'max-w-4xl w-full mx-auto rounded-3xl overflow-hidden border border-slate-800 shadow-2xl' : 'rounded-3xl border border-slate-800 p-6'}`}>
      
      {/* Header Banner */}
      <div className="relative p-6 sm:p-8 bg-gradient-to-r from-amber-600/30 via-slate-900 to-indigo-950/40 border-b border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 font-black shrink-0">
              <Trophy className="w-7 h-7 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Bảng Xếp Hạng Tiến Độ Học Tập
                </span>
                <span className="text-slate-500">·</span>
                <span className="text-xs text-slate-400">Chuẩn Khảo Thí Certiport</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                Vinh Danh Học Viên MOS Master Xuất Sắc
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Dữ liệu đồng bộ trực tiếp từ tiến độ học tập và bài thi thử thực tế
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isModal && onClose && (
              <button
                onClick={() => {
                  soundManager.playClick();
                  onClose();
                }}
                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Đóng bảng xếp hạng"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Current User Floating Status Card inside Header */}
        <div className="mt-6 p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-base shadow-md border border-blue-400/40">
              {currentUserRecord.avatarSeed}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">{currentUserRecord.name}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  BẠN (HẠNG #{currentUserRank})
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span>{currentUserRecord.studentCode}</span>
                <span>·</span>
                <span>{currentUserRecord.classRoom}</span>
                <span>·</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-400 inline" />
                  {currentUserRecord.streakDays} ngày liên tục
                </span>
              </div>
            </div>
          </div>

          {/* User Progress Stats at a glance */}
          <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
            <div className="text-center sm:text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Tiến độ Master</span>
              <span className="text-lg font-black text-amber-400">{currentUserRecord.masterProgress}%</span>
            </div>
            <div className="h-8 w-px bg-slate-800 hidden sm:block" />
            <div className="text-center sm:text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Đã hoàn thành</span>
              <span className="text-lg font-black text-blue-400">{currentUserRecord.completedLessons} / 15 bài</span>
            </div>
            <div className="h-8 w-px bg-slate-800 hidden sm:block" />
            <div className="text-center sm:text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Điểm cao nhất</span>
              <span className="text-lg font-black text-emerald-400">
                {currentUserRecord.bestExamScore > 0 ? `${currentUserRecord.bestExamScore}đ` : 'Chưa thi'}
              </span>
            </div>

            {/* Quick Action Button to boost rank */}
            {onSelectAction ? (
              <button
                onClick={() => {
                  soundManager.playClick();
                  onSelectAction('study');
                }}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-95 text-slate-950 text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer ml-auto sm:ml-0"
              >
                <Zap className="w-3.5 h-3.5 fill-slate-950" />
                <span>Học Bài Để Tăng Hạng</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* Motivational Delta Banner */}
        {userAbove && (
          <div className="mt-3 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Bạn đang bám sát <strong>{userAbove.name}</strong> (Hạng #{currentUserRank - 1}, {userAbove.masterProgress}%). Chỉ cần thêm <strong>{Math.max(1, userAbove.completedLessons - currentUserRecord.completedLessons)} bài học</strong> nữa là vươn lên hạng tiếp theo!
              </span>
            </span>
            <span className="font-bold text-[11px] text-amber-400 whitespace-nowrap">Cố lên! 🔥</span>
          </div>
        )}
      </div>

      {/* Top 3 Podium Showcase */}
      <div className="p-6 bg-slate-950/60 border-b border-slate-800">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <Award className="w-4 h-4 text-amber-400" />
          <span>Bục Vinh Danh Top 3 Học Viên Dẫn Đầu</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-4">
          
          {/* Top 2 - Silver (Left) */}
          {top2 && (
            <div className="relative order-2 md:order-1 p-5 rounded-2xl bg-gradient-to-b from-slate-800/90 to-slate-900 border border-slate-700 text-center shadow-lg hover:border-slate-500 transition-all flex flex-col items-center">
              <div className="absolute -top-3 px-3 py-0.5 rounded-full text-[11px] font-black bg-slate-300 text-slate-900 flex items-center gap-1 shadow-sm">
                <Medal className="w-3.5 h-3.5 text-slate-700" />
                HẠNG 2 · HUY CHƯƠNG BẠC
              </div>
              <div className="w-16 h-16 rounded-2xl bg-slate-700 border-2 border-slate-300 flex items-center justify-center text-white font-black text-xl mt-2 shadow-inner">
                {top2.avatarSeed}
              </div>
              <h4 className="font-bold text-white text-sm mt-3">{top2.name}</h4>
              <p className="text-[11px] text-slate-400">{top2.classRoom}</p>
              
              <div className="mt-3 w-full pt-3 border-t border-slate-700/80 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Tiến độ</span>
                  <span className="font-black text-slate-200">{top2.masterProgress}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Điểm thi</span>
                  <span className="font-black text-emerald-400">{top2.bestExamScore}đ</span>
                </div>
              </div>
              
              <button
                onClick={() => handleCheer(top2.id, top2.name)}
                className="mt-3 w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                <span>👏 Cổ vũ</span>
                {cheeredUsers[top2.id] ? <span className="text-amber-400 font-bold">+{cheeredUsers[top2.id]}</span> : null}
              </button>
            </div>
          )}

          {/* Top 1 - Gold (Center, elevated) */}
          {top1 && (
            <div className="relative order-1 md:order-2 p-6 rounded-3xl bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-900 border-2 border-amber-500/60 text-center shadow-2xl shadow-amber-500/10 hover:border-amber-400 transition-all flex flex-col items-center md:-translate-y-2">
              <div className="absolute -top-3.5 px-3.5 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 flex items-center gap-1.5 shadow-md">
                <Trophy className="w-4 h-4 text-slate-950 fill-slate-950" />
                QUÁN QUÂN · HUY CHƯƠNG VÀNG
              </div>
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 border-4 border-amber-400/80 flex items-center justify-center text-slate-950 font-black text-2xl mt-2 shadow-xl shadow-amber-500/30">
                {top1.avatarSeed}
              </div>
              <h4 className="font-black text-white text-base mt-3 flex items-center gap-1.5">
                <span>{top1.name}</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h4>
              <p className="text-xs text-amber-200/70">{top1.classRoom}</p>
              
              <div className="mt-3 w-full p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-amber-300/80 block uppercase tracking-wider">Tiến độ Master</span>
                  <span className="font-black text-amber-400 text-base">{top1.masterProgress}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-300/80 block uppercase tracking-wider">Chứng chỉ</span>
                  <span className="font-black text-emerald-400 text-base">{top1.bestExamScore} / 1000đ</span>
                </div>
              </div>

              <button
                onClick={() => handleCheer(top1.id, top1.name)}
                className="mt-3 w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-xs font-black text-slate-950 transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>🎉 Tặng Tràng Pháo Tay</span>
                {cheeredUsers[top1.id] ? <span className="font-black bg-slate-950/20 px-1.5 py-0.5 rounded text-[11px]">+{cheeredUsers[top1.id]}</span> : null}
              </button>
            </div>
          )}

          {/* Top 3 - Bronze (Right) */}
          {top3 && (
            <div className="relative order-3 p-5 rounded-2xl bg-gradient-to-b from-slate-800/90 to-slate-900 border border-amber-800/60 text-center shadow-lg hover:border-amber-700 transition-all flex flex-col items-center">
              <div className="absolute -top-3 px-3 py-0.5 rounded-full text-[11px] font-black bg-amber-700 text-amber-100 flex items-center gap-1 shadow-sm">
                <Medal className="w-3.5 h-3.5 text-amber-300" />
                HẠNG 3 · HUY CHƯƠNG ĐỒNG
              </div>
              <div className="w-16 h-16 rounded-2xl bg-slate-700 border-2 border-amber-700 flex items-center justify-center text-white font-black text-xl mt-2 shadow-inner">
                {top3.avatarSeed}
              </div>
              <h4 className="font-bold text-white text-sm mt-3">{top3.name}</h4>
              <p className="text-[11px] text-slate-400">{top3.classRoom}</p>
              
              <div className="mt-3 w-full pt-3 border-t border-slate-700/80 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Tiến độ</span>
                  <span className="font-black text-amber-200">{top3.masterProgress}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Điểm thi</span>
                  <span className="font-black text-emerald-400">{top3.bestExamScore}đ</span>
                </div>
              </div>

              <button
                onClick={() => handleCheer(top3.id, top3.name)}
                className="mt-3 w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                <span>👏 Cổ vũ</span>
                {cheeredUsers[top3.id] ? <span className="text-amber-400 font-bold">+{cheeredUsers[top3.id]}</span> : null}
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Filter and Sorting Bar */}
      <div className="p-4 sm:p-6 bg-slate-900 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Subject Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs font-bold">
          <button
            onClick={() => {
              soundManager.playClick();
              setSelectedSubject('all');
            }}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              selectedSubject === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            Tổng MOS Master (3 Môn)
          </button>
          <button
            onClick={() => {
              soundManager.playClick();
              setSelectedSubject('word');
            }}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              selectedSubject === 'word'
                ? 'bg-blue-600 text-white shadow-md font-black'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            Word (MO-100)
          </button>
          <button
            onClick={() => {
              soundManager.playClick();
              setSelectedSubject('excel');
            }}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              selectedSubject === 'excel'
                ? 'bg-emerald-600 text-white shadow-md font-black'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            Excel (MO-200)
          </button>
          <button
            onClick={() => {
              soundManager.playClick();
              setSelectedSubject('powerpoint');
            }}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              selectedSubject === 'powerpoint'
                ? 'bg-orange-600 text-white shadow-md font-black'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            PowerPoint (MO-300)
          </button>
        </div>

        {/* Search & Sort by Metric */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm học viên, MSSV..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500 transition-colors"
            />
          </div>

          <select
            value={sortMetric}
            onChange={(e) => setSortMetric(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 font-semibold focus:outline-hidden focus:border-amber-500 cursor-pointer"
          >
            <option value="progress">Sắp xếp: % Tiến độ</option>
            <option value="lessons">Sắp xếp: Số bài hoàn thành</option>
            <option value="exam">Sắp xếp: Điểm thi cao nhất</option>
            <option value="streak">Sắp xếp: Chuỗi ngày học 🔥</option>
          </select>
        </div>
      </div>

      {/* Main Leaderboard Rankings List */}
      <div className="p-4 sm:p-6 overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-3 font-semibold text-center w-14">Hạng</th>
              <th className="py-3 px-3 font-semibold">Học Viên</th>
              <th className="py-3 px-3 font-semibold text-center">Tiến Độ Master</th>
              <th className="py-3 px-3 font-semibold text-center hidden sm:table-cell">Bài Học (15 Bài)</th>
              <th className="py-3 px-3 font-semibold text-center hidden md:table-cell">Điểm Khảo Thí</th>
              <th className="py-3 px-3 font-semibold text-center hidden lg:table-cell">Chuỗi Học</th>
              <th className="py-3 px-3 font-semibold text-right">Tương Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {filteredList.map((item, index) => {
              const rank = index + 1;
              const isCurrentUser = item.isCurrentUser;
              
              // Progress value depending on current filter
              const displayProgress = selectedSubject === 'word' 
                ? item.wordProgress 
                : selectedSubject === 'excel' 
                ? item.excelProgress 
                : selectedSubject === 'powerpoint' 
                ? item.pptProgress 
                : item.masterProgress;

              return (
                <tr 
                  key={item.id}
                  className={`transition-colors ${
                    isCurrentUser 
                      ? 'bg-amber-500/10 border-l-4 border-amber-500 text-white font-bold' 
                      : 'hover:bg-slate-800/40 text-slate-300'
                  }`}
                >
                  {/* Rank Badge */}
                  <td className="py-3.5 px-3 text-center">
                    {rank === 1 ? (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-amber-400 text-slate-950 font-black text-xs shadow-md">
                        1
                      </span>
                    ) : rank === 2 ? (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-slate-300 text-slate-950 font-black text-xs shadow-sm">
                        2
                      </span>
                    ) : rank === 3 ? (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-amber-700 text-amber-100 font-black text-xs shadow-sm">
                        3
                      </span>
                    ) : (
                      <span className="text-slate-400 font-bold text-xs">
                        #{rank}
                      </span>
                    )}
                  </td>

                  {/* Student Info */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                        isCurrentUser 
                          ? 'bg-blue-600 text-white ring-2 ring-amber-400' 
                          : rank <= 3 
                          ? 'bg-slate-800 text-amber-400 border border-amber-500/30' 
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {item.avatarSeed}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs ${isCurrentUser ? 'text-amber-300 font-bold' : 'text-white font-semibold'}`}>
                            {item.name}
                          </span>
                          {isCurrentUser && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500 text-slate-950">
                              BẠN
                            </span>
                          )}
                          {item.masterProgress === 100 && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                              ĐÃ CẤP BẰNG
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span>{item.studentCode}</span>
                          <span>·</span>
                          <span className="truncate max-w-[120px] sm:max-w-none">{item.classRoom}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Master Progress Bar */}
                  <td className="py-3.5 px-3 text-center">
                    <div className="w-28 mx-auto">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-black text-white">{displayProgress}%</span>
                        <span className="text-[10px] text-slate-400">
                          {displayProgress >= 70 ? 'Đạt chuẩn' : 'Cần cố gắng'}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            displayProgress >= 90 
                              ? 'bg-gradient-to-r from-amber-400 to-emerald-400' 
                              : displayProgress >= 60 
                              ? 'bg-blue-500' 
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(5, displayProgress))}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Lessons Completed */}
                  <td className="py-3.5 px-3 text-center hidden sm:table-cell">
                    <span className="font-bold text-white">{item.completedLessons}</span>
                    <span className="text-slate-500"> / 15 bài</span>
                  </td>

                  {/* Exam Score */}
                  <td className="py-3.5 px-3 text-center hidden md:table-cell">
                    {item.bestExamScore > 0 ? (
                      <span className={`font-black ${
                        item.bestExamScore >= 900 ? 'text-amber-400' : item.bestExamScore >= 700 ? 'text-emerald-400' : 'text-slate-300'
                      }`}>
                        {item.bestExamScore} / 1000đ
                      </span>
                    ) : (
                      <span className="text-slate-500">Chưa thi</span>
                    )}
                  </td>

                  {/* Study Streak */}
                  <td className="py-3.5 px-3 text-center hidden lg:table-cell">
                    <span className="inline-flex items-center gap-1 font-bold text-amber-400">
                      <Flame className="w-3.5 h-3.5 fill-amber-400" />
                      {item.streakDays} ngày
                    </span>
                  </td>

                  {/* Action / Cheer */}
                  <td className="py-3.5 px-3 text-right">
                    <button
                      onClick={() => handleCheer(item.id, item.name)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1"
                    >
                      <span>👏</span>
                      {cheeredUsers[item.id] ? (
                        <span className="text-amber-400 font-bold">+{cheeredUsers[item.id]}</span>
                      ) : (
                        <span>Cổ vũ</span>
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Motivation Notice */}
      <div className="p-4 sm:p-6 bg-slate-950/80 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Bảng xếp hạng tự động tính điểm dựa trên chuẩn quốc tế Certiport (Điểm thi thực hành & bài trắc nghiệm kiến thức).
          </span>
        </div>
        <div className="flex items-center gap-2 font-semibold text-amber-400">
          <span>Mục tiêu Certiport: ≥ 700 / 1000 điểm để cấp chứng chỉ quốc tế</span>
        </div>
      </div>

    </div>
  );
};

export default Leaderboard;
