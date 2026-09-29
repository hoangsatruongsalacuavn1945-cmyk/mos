import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ExamRoomView } from '../../components/ExamRoomView';
import { useAuthStore } from '../../utils/userStore';

export const ExamRoom: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  return (
    <div className="w-full">
      <ExamRoomView
        selectedSubject="all"
        currentUser={user}
        onExit={() => navigate('/')}
        onOpenCertificate={(sub, score) => {
          navigate(`/ket-qua?subject=${sub}&score=${score}`);
        }}
      />
    </div>
  );
};

export default ExamRoom;
