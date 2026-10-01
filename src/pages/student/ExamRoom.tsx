import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ExamRoomView } from '../../components/ExamRoomView';
import { useAuthStore } from '../../utils/userStore';
import { MOSSubject } from '../../types/mos';

export const ExamRoom: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();

  const rawSubject = searchParams.get('subject') as MOSSubject;
  const validSubject: MOSSubject = (rawSubject === 'word' || rawSubject === 'excel' || rawSubject === 'powerpoint')
    ? rawSubject
    : 'all';

  return (
    <div className="w-full">
      <ExamRoomView
        selectedSubject={validSubject}
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
