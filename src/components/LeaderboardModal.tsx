import React from 'react';
import { Leaderboard } from './Leaderboard';
import { MOSSubjectTrack } from '../utils/userProgressStore';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction?: (action: 'study' | 'exam', subject?: MOSSubjectTrack) => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  onSelectAction,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="my-auto w-full max-w-4xl">
        <Leaderboard 
          isModal={true} 
          onClose={onClose} 
          onSelectAction={(action, subject) => {
            onClose();
            if (onSelectAction) {
              onSelectAction(action, subject);
            }
          }}
        />
      </div>
    </div>
  );
};

export default LeaderboardModal;
