/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header, NavTab } from './components/Header';
import { TheoryQuiz } from './components/TheoryQuiz';
import { PracticalSimulator } from './components/PracticalSimulator';
import { MockExamModal } from './components/MockExamModal';
import { ShortcutsGuide } from './components/ShortcutsGuide';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { AITutorChat } from './components/AITutorChat';
import { AIPracticeGenerator } from './components/AIPracticeGenerator';
import { PersonalizedRoadmap } from './components/PersonalizedRoadmap';
import { SupervisorReportModal } from './components/SupervisorReportModal';
import { TeacherPortal } from './components/TeacherPortal';
import { AuthModal } from './components/AuthModal';
import { MOSCertificateModal } from './components/MOSCertificateModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { MOSSubject, UserStats } from './types/mos';
import { UserProfile } from './types/user';
import { loadUserStats } from './utils/storage';
import { getCurrentUser } from './utils/userStore';
import { soundManager } from './utils/audio';
import { 
  Award, 
  BookOpen, 
  Monitor, 
  Keyboard, 
  BarChart2, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  ChevronRight, 
  Bot, 
  Mail, 
  Trophy,
  GraduationCap
} from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('theory');
  const [selectedSubject, setSelectedSubject] = useState<MOSSubject>('all');
  const [stats, setStats] = useState<UserStats>(loadUserStats());
  const [currentUser, setCurrentUser] = useState<UserProfile>(getCurrentUser());
  
  // Modals state
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLeaderboardModalOpen, setIsLeaderboardModalOpen] = useState(false);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [certificateInfo, setCertificateInfo] = useState<{ subject: string; score: number }>({
    subject: 'excel',
    score: 850,
  });
  const [isAudioMuted, setIsAudioMuted] = useState(soundManager.getMuted());

  // Sync stats when storage updates
  const refreshStats = () => {
    setStats(loadUserStats());
  };

  useEffect(() => {
    refreshStats();
  }, []);

  const handleNavigateToQuizWithFilter = (_filter: 'bookmarked' | 'wrong') => {
    setCurrentTab('theory');
  };

  const handleOpenCertificate = (sub?: string, score?: number) => {
    const passedExam = stats.examHistory.find(e => e.passed);
    setCertificateInfo({
      subject: sub || (passedExam?.subject === 'mixed' ? 'excel' : passedExam?.subject) || (selectedSubject === 'all' ? 'excel' : selectedSubject),
      score: score || passedExam?.score || 850,
    });
    setIsCertificateModalOpen(true);
  };

  const isTeacher = currentUser.role === 'teacher';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top 3-Zone Navigation Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={tab => {
          soundManager.playClick();
          if (tab === 'mock-exam') {
            setIsExamModalOpen(true);
          } else {
            setCurrentTab(tab);
          }
        }}
        selectedSubject={selectedSubject}
        onSelectSubject={sub => {
          soundManager.playClick();
          setSelectedSubject(sub);
        }}
        onOpenReport={() => {
          soundManager.playClick();
          setIsReportModalOpen(true);
        }}
        currentUser={currentUser}
        onOpenAuthModal={() => {
          soundManager.playClick();
          setIsAuthModalOpen(true);
        }}
        onOpenLeaderboard={() => {
          soundManager.playClick();
          setIsLeaderboardModalOpen(true);
        }}
        onOpenCertificate={() => handleOpenCertificate()}
        isAudioMuted={isAudioMuted}
        onToggleAudio={() => {
          const next = soundManager.toggleMute();
          setIsAudioMuted(next);
        }}
      />

      {/* Hero Quick Banner */}
      <div className="bg-white border-b border-slate-200 py-3.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-xs ${
              isTeacher ? 'bg-emerald-600' : 'bg-blue-600'
            }`}>
              {isTeacher ? <ShieldCheck className="w-5 h-5" /> : <GraduationCap className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <span>Hệ Thống Luyện Thi Chứng Chỉ Quốc Tế MOS 365 / 2019</span>
                <span aria-hidden="true">·</span>
                <span className="text-blue-600">Chuẩn IIG & Certiport</span>
                {isTeacher && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="px-1.5 py-0.2 text-[10px] bg-emerald-100 text-emerald-800 font-bold rounded">
                      Chế độ Giáo Viên
                    </span>
                  </>
                )}
              </div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900">
                {currentTab === 'teacher-portal'
                  ? `Cổng Quản Lý Bài Nộp & Chấm Điểm Bộ Môn: MOS ${currentUser.targetSubject?.toUpperCase() || 'EXCEL'}`
                  : selectedSubject === 'word'
                  ? 'MOS Word Associate (MO-100) - Ôn Luyện Toàn Diện'
                  : selectedSubject === 'excel'
                  ? 'MOS Excel Associate (MO-200) - Làm Chủ Bảng Tính & Hàm'
                  : selectedSubject === 'powerpoint'
                  ? 'MOS PowerPoint Associate (MO-300) - Thiết Kế & Hiệu Ứng'
                  : 'MOS Master - Nền Tảng Ôn Tập Word, Excel, PowerPoint'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Quick Switch to Teacher Portal */}
            <button
              onClick={() => {
                soundManager.playClick();
                setCurrentTab(currentTab === 'teacher-portal' ? 'theory' : 'teacher-portal');
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 border shadow-2xs ${
                currentTab === 'teacher-portal'
                  ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{currentTab === 'teacher-portal' ? 'Quay Lại Góc Học Viên' : 'Vào Cổng Giáo Viên'}</span>
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                setIsReportModalOpen(true);
              }}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
              title="Gửi báo cáo tiến độ học tập và điểm thi cho giáo viên phụ trách"
            >
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              <span>Báo Cáo Giáo Viên</span>
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                setIsExamModalOpen(true);
              }}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Vào Thi Thử 50 Phút</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      <main className="flex-1">
        {currentTab === 'teacher-portal' && (
          <TeacherPortal
            currentUser={currentUser}
            onSwitchToStudentView={() => setCurrentTab('theory')}
          />
        )}

        {currentTab === 'theory' && (
          <TheoryQuiz
            selectedSubject={selectedSubject}
            bookmarkedIds={stats.bookmarkedQuestionIds}
            wrongIds={stats.wrongQuestionIds}
            onStatsUpdate={refreshStats}
          />
        )}

        {currentTab === 'practical' && (
          <PracticalSimulator
            selectedSubject={selectedSubject}
            completedTaskIds={stats.completedTaskIds}
            onStatsUpdate={refreshStats}
          />
        )}

        {currentTab === 'roadmap' && (
          <PersonalizedRoadmap
            stats={stats}
            onNavigateTab={tab => {
              if (tab === 'mock-exam') {
                setIsExamModalOpen(true);
              } else {
                setCurrentTab(tab);
              }
            }}
            onSelectSubject={sub => setSelectedSubject(sub)}
          />
        )}

        {currentTab === 'ai-tutor' && (
          <AITutorChat selectedSubject={selectedSubject} />
        )}

        {currentTab === 'ai-practice' && (
          <AIPracticeGenerator selectedSubject={selectedSubject} />
        )}

        {currentTab === 'shortcuts' && (
          <ShortcutsGuide selectedSubject={selectedSubject} />
        )}

        {currentTab === 'analytics' && (
          <AnalyticsDashboard
            stats={stats}
            onStatsUpdate={refreshStats}
            onNavigateToQuiz={handleNavigateToQuizWithFilter}
            onNavigateToRoadmap={() => setCurrentTab('roadmap')}
            onOpenReport={() => setIsReportModalOpen(true)}
            onOpenCertificate={() => handleOpenCertificate()}
          />
        )}
      </main>

      {/* 50-Minute Certiport Mock Exam Modal */}
      {isExamModalOpen && (
        <MockExamModal
          selectedSubject={selectedSubject}
          onClose={() => setIsExamModalOpen(false)}
          onStatsUpdate={refreshStats}
          onOpenCertificate={(sub, score) => {
            setIsExamModalOpen(false);
            handleOpenCertificate(sub, score);
          }}
        />
      )}

      {/* Supervisor Progress Report Modal */}
      {isReportModalOpen && (
        <SupervisorReportModal
          stats={stats}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}

      {/* Auth & Switch Role Modal */}
      <AuthModal
        currentUser={currentUser}
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onUserChanged={user => {
          setCurrentUser(user);
          if (user.role === 'teacher') {
            setCurrentTab('teacher-portal');
          }
        }}
      />

      {/* Official MOS Completion Certificate Modal */}
      <MOSCertificateModal
        user={currentUser}
        subject={certificateInfo.subject}
        score={certificateInfo.score}
        isOpen={isCertificateModalOpen}
        onClose={() => setIsCertificateModalOpen(false)}
      />

      {/* Leaderboard Modal */}
      <LeaderboardModal
        isOpen={isLeaderboardModalOpen}
        onClose={() => setIsLeaderboardModalOpen(false)}
      />

      {/* Modern Clean Footer adhering to frontend design guidelines */}
      <footer className="bg-white border-t border-slate-200 py-8 px-4 sm:px-6 mt-12 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">MOS Master Platform</span>
            <span aria-hidden="true">·</span>
            <span>Chương trình ôn tập & kết nối khảo thí quốc tế</span>
            <span aria-hidden="true">·</span>
            <span>Phiên bản 2026</span>
          </div>

          <div className="flex items-center gap-4 text-slate-600">
            <span>Giảng viên bộ môn: <strong className="text-slate-800">{currentUser.assignedTeacherName}</strong></span>
            <span aria-hidden="true">·</span>
            <span>Thang điểm 1000 · Điểm đạt 700</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
