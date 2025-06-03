import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, notification, App as AntdApp } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import MainLayout from './components/layout/MainLayout';
import StudentLayout from './components/layout/StudentLayout';
import LoginPage from './pages/LoginPage';
import StudentLoginPage from './pages/StudentLoginPage';
import StudentRegistrationPage from './pages/StudentRegistrationPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import StudentDashboardPage from './pages/StudentDashboardPage';
import StudentBookLessonPage from './pages/StudentBookLessonPage';
import StudentSchedulePage from './pages/StudentSchedulePage';
import StudentPage from './pages/StudentPage';
import TeacherPage from './pages/TeacherPage';
import CoursePage from './pages/CoursePage';
import SchedulePage from './pages/SchedulePage';
import ReportPage from './pages/ReportPage';
import TeacherAvailabilityPage from './pages/TeacherAvailabilityPage';
import StudentAvailabilityPage from './pages/StudentAvailabilityPage';
import StudentSettingPage from './pages/StudentSettingPage';
import { authService } from './services';
import './App.css'
import TestNotificationPage from './pages/TestNotificationPage';

// 检查用户是否已登录
const isAuthenticated = () => {
  return authService.isAuthenticated();
};

// 获取当前用户角色
const getUserRole = () => {
  const user = authService.getCurrentUser();
  return user ? user.role : null;
};

// 管理员路由保护
const AdminRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  
  const role = getUserRole();
  if (role !== 'ADMIN') {
    return <Navigate to="/student/login" replace />;
  }
  
  return children;
};

// 学生路由保护
const StudentRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/student/login" replace />;
  }
  
  const role = getUserRole();
  if (role !== 'STUDENT') {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// 全局通知API
export const openNotification = (type, message, description) => {
  notification[type]({
    message,
    description,
    placement: 'topRight',
    duration: 4,
    style: {
      zIndex: 10000
    }
  });
};

function App() {
  // 初始化全局通知配置
  useEffect(() => {
    notification.config({
      placement: 'topRight',
      maxCount: 5,
      duration: 3,
      rtl: false
    });
    
    // 添加notification样式
    const style = document.createElement('style');
    style.innerHTML = `
      .ant-notification {
        z-index: 1100 !important;
      }
      .ant-notification-notice {
        background: #fff;
        border-radius: 4px;
        box-shadow: 0 3px 6px -4px rgba(0,0,0,.12), 0 6px 16px 0 rgba(0,0,0,.08), 0 9px 28px 8px rgba(0,0,0,.05);
      }
    `;
    document.head.appendChild(style);
  }, []);

  return (
    <ConfigProvider locale={zhCN}>
      <AntdApp>
        <Router>
          <Routes>
            {/* 添加测试通知页面路由 */}
            <Route path="/test-notification" element={<TestNotificationPage />} />
            
            {/* 管理员登录路由 */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* 学生路由 */}
            <Route path="/student/login" element={<StudentLoginPage />} />
            <Route path="/register" element={<StudentRegistrationPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route 
              path="/student" 
              element={
                <StudentRoute>
                  <StudentLayout />
                </StudentRoute>
              }
            >
              <Route index element={<Navigate to="/student/dashboard" replace />} />
              <Route path="dashboard" element={<StudentDashboardPage />} />
              <Route path="book-lesson" element={<StudentBookLessonPage />} />
              <Route path="schedule" element={<StudentSchedulePage />} />
              <Route path="settings" element={<StudentSettingPage />} />
              <Route path="profile" element={<StudentSettingPage />} />
            </Route>
            
            {/* 管理员路由 */}
            <Route 
              path="/" 
              element={
                <AdminRoute>
                  <MainLayout />
                </AdminRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} /> 
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="students" element={<StudentPage />} />
              <Route path="teachers" element={<TeacherPage />} />
              <Route path="teacher-availability" element={<TeacherAvailabilityPage />} />
              <Route path="student-availability" element={<StudentAvailabilityPage />} />
              <Route path="courses" element={<CoursePage />} />
              <Route path="schedule" element={<SchedulePage />} />
              <Route path="reports" element={<ReportPage />} />
            </Route>
          </Routes>
        </Router>
      </AntdApp>
    </ConfigProvider>
  )
}

export default App
