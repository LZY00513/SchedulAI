import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Layout,
  Menu,
  Typography,
  Avatar,
  Dropdown,
  Space,
  Breadcrumb,
  notification
} from 'antd';
import {
  DesktopOutlined,
  UserOutlined,
  TeamOutlined,
  BookOutlined,
  CalendarOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  HomeOutlined,
  ExperimentOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { authService } from '../../services';

const { Header, Content, Footer, Sider } = Layout;
const { Title } = Typography;

// Function to generate menu items
function getItem(label, key, icon, children) {
  return {
    key,
    icon,
    children,
    label,
  };
}

const menuItems = [
  getItem(<Link to="/dashboard">仪表盘</Link>, '/dashboard', <HomeOutlined />),
  getItem(<Link to="/students">学员管理</Link>, '/students', <UserOutlined />),
  getItem(<Link to="/teachers">教师管理</Link>, '/teachers', <TeamOutlined />),
  getItem(<Link to="/teacher-availability">教师时间</Link>, '/teacher-availability', <ExperimentOutlined />),
  getItem(<Link to="/student-availability">学生时间</Link>, '/student-availability', <ClockCircleOutlined />),
  getItem(<Link to="/courses">课程管理</Link>, '/courses', <BookOutlined />),
  getItem(<Link to="/schedule">排课管理</Link>, '/schedule', <CalendarOutlined />),
  getItem(<Link to="/reports">数据报表</Link>, '/reports', <BarChartOutlined />),
];

// Breadcrumb mapping
const breadcrumbNameMap = {
  '/dashboard': '仪表盘',
  '/students': '学员管理',
  '/teachers': '教师管理',
  '/teacher-availability': '教师可用时间管理',
  '/student-availability': '学生可用时间管理',
  '/courses': '课程管理',
  '/schedule': '排课管理',
  '/reports': '数据报表',
  // Add more mappings as needed
};

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  // 获取当前用户信息
  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
  }, []);

  // 初始化通知配置
  useEffect(() => {
    // 配置通知组件，确保在此布局中能正常显示
    notification.config({
      placement: 'topRight',
      duration: 3,
      maxCount: 5,
      zIndex: 9999, // 使用非常高的z-index确保通知显示在顶层
    });
    
    console.log('管理员布局中的通知配置已初始化');
  }, []);

  // Determine selected keys based on current path
  const selectedKeys = [location.pathname];

  // 处理登出
  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="profile">
        <UserOutlined /> 个人中心
      </Menu.Item>
      <Menu.Item key="settings">
         <SettingOutlined /> 账号设置
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" onClick={handleLogout}>
        <LogoutOutlined /> 退出登录
      </Menu.Item>
    </Menu>
  );

  // Generate Breadcrumb items
  const pathSnippets = location.pathname.split('/').filter(i => i);
  const breadcrumbItems = [
    <Breadcrumb.Item key="home">
      <Link to="/"><HomeOutlined /></Link>
    </Breadcrumb.Item>,
  ].concat(
    pathSnippets.map((_, index) => {
      const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
      const isLast = index === pathSnippets.length - 1;
      const name = breadcrumbNameMap[url] || url.substring(url.lastIndexOf('/') + 1);
      return isLast ? (
        <Breadcrumb.Item key={url}>{name}</Breadcrumb.Item>
      ) : (
        <Breadcrumb.Item key={url}>
          <Link to={url}>{name}</Link>
        </Breadcrumb.Item>
      );
    })
  );


  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
        <div style={{ height: '32px', margin: '16px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <Title level={4} style={{ color: 'white', margin: 0, fontSize: collapsed? '10px' : '16px', transition: 'font-size 0.2s' }}>SchedulAI</Title>
        </div>
        <Menu theme="dark" selectedKeys={selectedKeys} mode="inline" items={menuItems} />
      </Sider>
      <Layout className="site-layout">
        <Header style={{ padding: '0 16px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <Breadcrumb style={{ margin: '0' }}>
              {breadcrumbItems}
            </Breadcrumb>
           <Dropdown overlay={userMenu} placement="bottomRight">
              <a onClick={e => e.preventDefault()} style={{ display: 'flex', alignItems: 'center' }}>
                 <Avatar style={{ backgroundColor: '#87d068' }} icon={<UserOutlined />} />
                 <span style={{ marginLeft: 8 }}>{currentUser?.name || 'User'}</span>
              </a>
           </Dropdown>
        </Header>
        <Content style={{ margin: '16px' }}>
          <div style={{ padding: 24, minHeight: 360, background: '#fff', borderRadius: '8px' }}>
            {/* Outlet renders the matched child route component */}
            <Outlet /> 
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>SchedulAI ©{new Date().getFullYear()} Created by YourTeam</Footer>
      </Layout>
    </Layout>
  );
};

export default MainLayout; 