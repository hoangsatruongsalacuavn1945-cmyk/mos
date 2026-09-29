import React from 'react';
import { useNavigate } from 'react-router-dom';
import { OwnerPortal } from '../../components/OwnerPortal';
import { useAuthStore } from '../../utils/userStore';

export const SystemConfig: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  return (
    <div className="w-full">
      <OwnerPortal
        currentUser={user}
        onSwitchToStudentView={() => navigate('/')}
        onSwitchToTeacherView={() => navigate('/teacher/dashboard')}
      />
    </div>
  );
};

export default SystemConfig;
