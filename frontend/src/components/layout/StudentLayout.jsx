import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, Space, Typography, message, Breadcrumb, Badge, notification, Popover, Empty } from 'antd';
import { 
  MenuFoldOutlined, 
  MenuUnfoldOutlined, 
  UserOutlined, 
  LogoutOutlined,
  DashboardOutlined,
  BookOutlined,
  CalendarOutlined,
  BellOutlined,
  SettingOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { authService, lessonService } from '../../services';
import dayjs from 'dayjs';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const StudentLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);
  const [tomorrowLessons, setTomorrowLessons] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      // 获取课程数据
      fetchStudentLessons(user);
    } else {
      navigate('/login');
    }
  }, [navigate]);
  
  // 获取课程数据
  const fetchStudentLessons = async (user) => {
    try {
      setLoading(true);
      const studentId = user.studentId || user.id;
      const lessonsData = await lessonService.getStudentLessons(studentId);
      
      if (Array.isArray(lessonsData)) {
        setLessons(lessonsData);
        // 检测明天的课程
        const tomorrow = dayjs().add(1, 'day').startOf('day');
        const tomorrowEnd = tomorrow.endOf('day');
        
        const tomorrowCourses = lessonsData.filter(lesson => {
          const lessonTime = dayjs(lesson.startDateTime);
          return lessonTime.isAfter(tomorrow) && 
                lessonTime.isBefore(tomorrowEnd) && 
                lesson.status === 'SCHEDULED';
        }).sort((a, b) => dayjs(a.startDateTime).diff(dayjs(b.startDateTime)));
        
        setTomorrowLessons(tomorrowCourses);
        setNotificationCount(tomorrowCourses.length);
        
        // 如果有明天的课程，显示通知
        if (tomorrowCourses.length > 0 && !localStorage.getItem(`notification_shown_${tomorrow.format('YYYY-MM-DD')}`)) {
          showTomorrowLessonsNotification(tomorrowCourses);
          // 记录今天已经显示过通知
          localStorage.setItem(`notification_shown_${tomorrow.format('YYYY-MM-DD')}`, 'true');
        }
      }
    } catch (error) {
      console.error('获取课程数据失败:', error);
      message.error('获取课程数据失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 显示明天课程通知
  const showTomorrowLessonsNotification = (courses) => {
    notification.info({
      message: `明天有 ${courses.length} 节课`,
      description: (
        <div>
          <p>请提前做好准备：</p>
          {courses.slice(0, 2).map((lesson, index) => (
            <p key={index}>
              <ClockCircleOutlined style={{ marginRight: 8 }} />
              {dayjs(lesson.startDateTime).format('HH:mm')} - {lesson.courseName}
            </p>
          ))}
          {courses.length > 2 && <p>...还有 {courses.length - 2} 节课</p>}
          <Button 
            type="primary" 
            size="small" 
            style={{ marginTop: 8 }}
            onClick={() => navigate('/student/schedule')}
          >
            查看详情
          </Button>
        </div>
      ),
      placement: 'topRight',
      duration: 0
    });
  };
  
  // 初始化通知配置
  useEffect(() => {
    // 配置通知组件，确保在此布局中能正常显示
    notification.config({
      placement: 'topRight',
      duration: 4,
      maxCount: 5,
      zIndex: 9999, // 使用非常高的z-index确保通知显示在顶层
    });
    
    console.log('学生布局中的通知配置已初始化');
  }, []);
  
  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login');
    } catch (error) {
      console.error('登出失败:', error);
      message.error('登出失败，请重试');
    }
  };
  
  // 侧边栏菜单项
  const menuItems = [
    {
      key: '/student/dashboard',
      icon: <DashboardOutlined />,
      label: '学习主页',
    },
    {
      key: '/student/book-lesson',
      icon: <BookOutlined />,
      label: '预约课程',
    },
    {
      key: '/student/schedule',
      icon: <CalendarOutlined />,
      label: '我的课表',
    },
    {
      key: '/student/settings',
      icon: <SettingOutlined />,
      label: '个人设置',
    }
  ];
  
  // 用户下拉菜单
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
      onClick: () => navigate('/student/profile')
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ];
  
  // 面包屑配置
  const breadcrumbNameMap = {
    '/student': '学生中心',
    '/student/dashboard': '学习主页',
    '/student/book-lesson': '预约课程',
    '/student/schedule': '我的课表',
    '/student/settings': '个人设置',
    '/student/profile': '个人信息'
  };
  
  const breadcrumbItems = () => {
    const pathSnippets = location.pathname.split('/').filter(i => i);
    const extraBreadcrumbItems = pathSnippets.map((_, index) => {
      const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
      return {
        key: url,
        title: <Link to={url}>{breadcrumbNameMap[url] || pathSnippets[index]}</Link>,
      };
    });
    
    const breadcrumbItems = [
      {
        key: '/',
        title: <Link to="/">首页</Link>,
      },
    ].concat(extraBreadcrumbItems);
    
    return breadcrumbItems;
  };
  
  // 通知内容
  const notificationContent = (
    <div style={{ maxWidth: 300 }}>
      <div style={{ borderBottom: '1px solid #f0f0f0', padding: '8px 0', marginBottom: 8 }}>
        <Text strong>课程提醒</Text>
      </div>
      {tomorrowLessons.length > 0 ? (
        <>
          {tomorrowLessons.map((lesson, index) => (
            <div key={index} style={{ 
              padding: '8px 0', 
              borderBottom: index < tomorrowLessons.length - 1 ? '1px solid #f0f0f0' : 'none' 
            }}>
              <p style={{ margin: 0 }}>
                <Text strong>
                  {dayjs(lesson.startDateTime).format('HH:mm')} - {dayjs(lesson.endDateTime).format('HH:mm')}
                </Text>
              </p>
              <p style={{ margin: '4px 0 0 0' }}>
                {lesson.courseName} ({lesson.teacherName})
              </p>
              <p style={{ margin: '4px 0 0 0', color: '#8c8c8c' }}>
                地点: {lesson.location || '待定'}
              </p>
            </div>
          ))}
          <div style={{ marginTop: 12 }}>
            <Button 
              type="primary" 
              size="small" 
              block
              onClick={() => navigate('/student/schedule')}
            >
              查看所有课程
            </Button>
          </div>
        </>
      ) : (
        <Empty description="暂无明天的课程安排" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </div>
  );
  
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        breakpoint="lg"
        collapsedWidth="80"
        width={220}
        style={{ 
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0
        }}
      >
        <div className="logo" style={{ 
          height: '64px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          margin: '16px 0'
        }}>
          {collapsed ? (
            <Avatar size="large" style={{ backgroundColor: '#1890ff' }}>S</Avatar>
          ) : (
            <Title level={4} style={{ color: '#fff', margin: 0 }}>
              学生课程系统
            </Title>
          )}
        </div>
        
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems.map(item => ({
            key: item.key,
            icon: item.icon,
            label: <Link to={item.key}>{item.label}</Link>
          }))}
        />
      </Sider>
      
      <Layout style={{ marginLeft: collapsed ? 80 : 220, transition: 'all 0.2s' }}>
        <Header style={{ 
          padding: '0 16px', 
          background: '#fff',
          boxShadow: '0 1px 4px rgba(0, 21, 41, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 64, height: 64 }}
            />
            
            <Breadcrumb items={breadcrumbItems()} />
          </div>
          
          <div>
            <Space size={16}>
              <Popover 
                content={notificationContent} 
                title={null}
                trigger="click"
                placement="bottomRight"
                arrow={{ pointAtCenter: true }}
              >
                <Badge count={notificationCount} overflowCount={99}>
                  <Button
                    shape="circle"
                    icon={<BellOutlined />}
                  />
                </Badge>
              </Popover>
              
              <Dropdown
                menu={{ items: userMenuItems }}
                placement="bottomRight"
                arrow={{ pointAtCenter: true }}
              >
                <Space style={{ cursor: 'pointer' }}>
                  <Avatar icon={<UserOutlined />} />
                  {!collapsed && (
                    <Text>{currentUser?.name || '学生用户'}</Text>
                  )}
                </Space>
              </Dropdown>
            </Space>
          </div>
        </Header>
        
        <Content style={{ 
          margin: '24px 16px', 
          padding: 24, 
          minHeight: 280, 
          background: '#fff',
          borderRadius: '4px'
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default StudentLayout; 