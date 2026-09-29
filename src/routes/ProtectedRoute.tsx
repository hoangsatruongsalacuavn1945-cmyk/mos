import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../utils/userStore';

interface Props {
  allowedRoles: Array<'teacher' | 'admin'>;
}

export const ProtectedRoute: React.FC<Props> = ({ allowedRoles }) => {
  const { user } = useAuthStore();
  const location = useLocation();

  // Nếu người dùng là học sinh hoặc khách -> Đá về trang đăng nhập dành riêng cho GV/Admin
  if (user.role === 'guest' || user.role === 'student') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Nếu đã đăng nhập nhưng không đủ quyền (VD: Teacher cố vào trang Admin)
  if (!allowedRoles.includes(user.role as 'teacher' | 'admin')) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Nếu hợp lệ, cho phép render các Component con (Outlet)
  return <Outlet />;
};

export default ProtectedRoute;
