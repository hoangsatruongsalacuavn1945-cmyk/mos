import React, { useState, useEffect } from 'react';
import { soundManager } from '../utils/audio';
import { Trophy, Medal, Award, Flame, X, Sparkles, Clock, School } from 'lucide-react';

interface LeaderboardItem {
  rank: number;
  studentName: string;
  studentCode: string;
  classRoom: string;
  subject: string;
  score: number;
  timeSpentSeconds: number;
  submittedAt: string;
}

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<'all' | 'word' | 'excel' | 'powerpoint'>('all');
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/leaderboard?subject=${selectedSubject}`);
        if (res.ok) {
          const data = await res.json();
          setLeaderboard(data.leaderboard || []);
        }
      } catch (err) {
        console.warn('Error fetching leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [isOpen, selectedSubject]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white font-bold shadow-xs">
              <Trophy className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-1.5">
                <span>Bảng Vàng Thành Tích MOS Master</span>
                <Flame className="w-4 h-4 text-orange-200" />
              </h2>
              <p className="text-xs text-amber-100">Vinh danh các thí sinh đạt điểm cao nhất theo chuẩn Certiport</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-black/20 hover:bg-black/30 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                soundManager.playClick();
                setSelectedSubject('all');
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                selectedSubject === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200'
              }`}
            >
              Toàn Bộ Môn
            </button>
            <button
              onClick={() => {
                soundManager.playClick();
                setSelectedSubject('word');
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                selectedSubject === 'word'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200'
              }`}
            >
              MOS Word
            </button>
            <button
              onClick={() => {
                soundManager.playClick();
                setSelectedSubject('excel');
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                selectedSubject === 'excel'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200'
              }`}
            >
              MOS Excel
            </button>
            <button
              onClick={() => {
                soundManager.playClick();
                setSelectedSubject('powerpoint');
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                selectedSubject === 'powerpoint'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200'
              }`}
            >
              MOS PowerPoint
            </button>
          </div>
        </div>

        {/* List Content */}
        <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">Đang tải bảng xếp hạng...</div>
          ) : leaderboard.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Chưa có dữ liệu thí sinh trong môn này.
            </div>
          ) : (
            <div className="space-y-2.5">
              {leaderboard.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                    idx === 0
                      ? 'bg-linear-to-r from-amber-50 to-amber-100/50 border-amber-300 shadow-xs'
                      : idx === 1
                      ? 'bg-linear-to-r from-slate-50 to-slate-100 border-slate-300'
                      : idx === 2
                      ? 'bg-linear-to-r from-orange-50 to-orange-100/50 border-orange-200'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    {/* Rank badge */}
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0">
                      {idx === 0 ? (
                        <span className="text-xl">🥇</span>
                      ) : idx === 1 ? (
                        <span className="text-xl">🥈</span>
                      ) : idx === 2 ? (
                        <span className="text-xl">🥉</span>
                      ) : (
                        <span className="text-slate-500 font-bold text-xs">{idx + 1}</span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">{item.studentName}</span>
                        <span className="px-1.5 py-0.5 text-[9px] font-bold rounded uppercase bg-slate-100 text-slate-600">
                          MOS {item.subject}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>{item.classRoom}</span>
                        <span>·</span>
                        <span>Mã SV: {item.studentCode}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-black text-base sm:text-lg text-slate-900">
                      {item.score} <span className="text-xs font-normal text-slate-400">/ 1000</span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center justify-end gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{Math.round(item.timeSpentSeconds / 60)} phút</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
