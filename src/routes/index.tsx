import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import StudentLayout from '../layouts/StudentLayout';
import AdminLayout from '../layouts/AdminLayout';
import ProtectedRoute from './ProtectedRoute';

// Public Student Pages
import Home from '../pages/student/Home';
import ExamRoom from '../pages/student/ExamRoom';
import Result from '../pages/student/Result';
import Profile from '../pages/student/Profile';
import StudentProgressDashboardLayout from '../components/dashboard/StudentProgressDashboardLayout';

// Auth Pages
import Login from '../pages/auth/Login';
import StudentRegister from '../pages/auth/StudentRegister';
import Unauthorized from '../pages/auth/Unauthorized';

// Teacher Pages
import TeacherDashboard from '../pages/teacher/Dashboard';
import TeacherGradebook from '../pages/teacher/Gradebook';

// Admin / Owner Pages
import AdminConfig from '../pages/admin/SystemConfig';
import UserManagement from '../pages/admin/UserManagement';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* PUBLIC ROUTES - HỌC SINH VÀ KHÁCH VÀO TỰ DO */}
      <Route path="/tien-do" element={<StudentProgressDashboardLayout />} />
      <Route path="/progress" element={<StudentProgressDashboardLayout />} />

      <Route element={<StudentLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/courses" element={<Home />} />
        <Route path="/khoa-hoc" element={<Home />} />
        <Route path="/thi-thu" element={<ExamRoom />} />
        <Route path="/practice-tests" element={<ExamRoom />} />
        <Route path="/ket-qua" element={<Result />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/ho-so" element={<Profile />} />
        <Route path="/dashboard" element={<StudentProgressDashboardLayout />} />
        {/* Đăng ký học viên và Đăng nhập bảo mật cho cán bộ */}
        <Route path="/register" element={<StudentRegister />} />
        <Route path="/dang-ky" element={<StudentRegister />} />
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
      </Route>

      {/* PROTECTED ROUTES - GIÁO VIÊN VÀ ADMIN (YÊU CẦU ĐĂNG NHẬP) */}
      <Route element={<ProtectedRoute allowedRoles={['teacher', 'admin']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/gradebook" element={<TeacherGradebook />} />
        </Route>
      </Route>

      {/* PROTECTED ROUTES - CHỈ DÀNH CHO ADMIN (CHỦ SỞ HỮU) */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/config" element={<AdminConfig />} />
          <Route path="/admin/users" element={<UserManagement />} />
        </Route>
      </Route>

      {/* CATCH ALL - CHUYỂN HƯỚNG VỀ TRANG CHỦ */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
