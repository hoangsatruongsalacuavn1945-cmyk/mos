import React, { useState } from 'react';
import { MessageSquarePlus, Star, Bug } from 'lucide-react';
import { FeedbackModal } from './FeedbackModal';
import { soundManager } from '../utils/audio';

export const FloatingFeedbackButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultCat, setDefaultCat] = useState<'bug_report' | 'screen_display' | 'ui_rating' | 'exam_question' | 'feature_request'>('screen_display');

  const handleOpen = (cat: 'bug_report' | 'screen_display' | 'ui_rating' | 'exam_question' | 'feature_request' = 'screen_display') => {
    soundManager.playClick();
    setDefaultCat(cat);
    setIsOpen(true);
  };

  return (
    <>
      {/* Floating launcher at bottom right */}
      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2 group">
        <button
          onClick={() => handleOpen('screen_display')}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-xs shadow-xl shadow-blue-500/25 transition-all hover:scale-105 active:scale-95 border border-white/20 cursor-pointer"
          title="Báo lỗi khuất máy / Đánh giá website cho chủ sở hữu"
        >
          <div className="relative">
            <MessageSquarePlus className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          </div>
          <span className="hidden sm:inline">Góp Ý & Báo Lỗi</span>
          <span className="inline-flex items-center gap-0.5 text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full font-bold">
            <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />
            <span>Đánh Giá Web</span>
          </span>
        </button>
      </div>

      {/* Modal */}
      <FeedbackModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        defaultCategory={defaultCat}
      />
    </>
  );
};
