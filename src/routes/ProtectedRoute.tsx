import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../utils/userStore';

interface Props {
  allowedRoles: Array<'teacher' | 'admin'>;
}

/**
 * Safely parses and verifies JWT expiry and role from token string
 */
function getVerifiedTokenRole(): string | null {
  try {
    const token = localStorage.getItem('mos_auth_token_jwt') || localStorage.getItem('mos_jwt_token');
    if (!token || typeof token !== 'string') return null;

    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1]));
    if (!payload || typeof payload !== 'object') return null;

    // Check expiration (exp is in seconds)
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }

    return payload.role || null;
  } catch {
    return null;
  }
}

export const ProtectedRoute: React.FC<Props> = ({ allowedRoles }) => {
  const { role, user } = useAuthStore();
  const location = useLocation();

  const storeRole = role || user?.role || 'guest';
  const tokenRole = getVerifiedTokenRole();

  // If token is missing, expired, or doesn't match a privileged role, redirect to login
  if (!tokenRole || (tokenRole !== storeRole && storeRole !== 'admin')) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Nếu người dùng là học sinh hoặc khách -> Đá về trang đăng nhập dành riêng cho GV/Admin
  if (tokenRole === 'guest' || tokenRole === 'student') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Nếu đã đăng nhập nhưng không đủ quyền (VD: Teacher cố vào trang Admin)
  if (!allowedRoles.includes(tokenRole as 'teacher' | 'admin')) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Nếu hợp lệ, cho phép render các Component con (Outlet)
  return <Outlet />;
};

export default ProtectedRoute;
