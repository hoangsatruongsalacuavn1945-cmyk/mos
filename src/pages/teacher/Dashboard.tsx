import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TeacherPortal } from '../../components/TeacherPortal';
import { useAuthStore } from '../../utils/userStore';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  return (
    <div className="w-full">
      <TeacherPortal
        currentUser={user}
        onSwitchToStudentView={() => navigate('/')}
      />
    </div>
  );
};

export default Dashboard;
