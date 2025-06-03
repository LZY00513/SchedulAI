import React, { useState } from 'react'
import { Layout, Menu, theme, Button, Avatar } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  DashboardOutlined,
  TeamOutlined,
  BookOutlined,
  ScheduleOutlined,
  LogoutOutlined
} from '@ant-design/icons'

const { Header, Sider, Content } = Layout

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  // 定义侧边菜单项
  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '仪表盘',
      onClick: () => navigate('/')
    },
    {
      key: '/students',
      icon: <UserOutlined />,
      label: '学生管理',
      onClick: () => navigate('/students')
    },
    {
      key: '/teachers',
      icon: <TeamOutlined />,
      label: '教师管理',
      onClick: () => navigate('/teachers')
    },
    {
      key: '/courses',
      icon: <BookOutlined />,
      label: '课程管理',
      onClick: () => navigate('/courses')
    },
    {
      key: '/schedule',
      icon: <ScheduleOutlined />,
      label: '课程安排',
      onClick: () => navigate('/schedule')
    }
  ]

  // 获取当前路径以设置选中菜单
  const selectedKey = location.pathname === '/' ? '/' : `/${location.pathname.split('/')[1]}`

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark">
        <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'white', fontWeight: 'bold' }}>SchedulAI</span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: 0,
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          <div style={{ marginRight: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar icon={<UserOutlined />} />
            <span>管理员</span>
            <Button 
              icon={<LogoutOutlined />} 
              type="text" 
              danger
              onClick={() => console.log('退出登录')}
            >
              退出
            </Button>
          </div>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            minHeight: 280,
            overflow: 'auto'
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default AdminLayout 