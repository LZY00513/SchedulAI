import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Table, Button, Typography, List, Calendar, Badge } from 'antd'
import { UserOutlined, TeamOutlined, BookOutlined, ScheduleOutlined } from '@ant-design/icons'

const { Title } = Typography

const AdminPage = () => {
  // 模拟数据
  const [loading, setLoading] = useState(true)
  const [statistics, setStatistics] = useState({
    studentCount: 0,
    teacherCount: 0,
    courseCount: 0,
    scheduledLessonCount: 0
  })
  
  // 模拟获取数据
  useEffect(() => {
    // 模拟API加载
    const timer = setTimeout(() => {
      setStatistics({
        studentCount: 152,
        teacherCount: 28,
        courseCount: 43,
        scheduledLessonCount: 210
      })
      setLoading(false)
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [])
  
  // 最近课程数据
  const recentLessons = [
    { id: 1, date: '2023-10-05', time: '14:00-15:30', course: '高级英语', teacher: '张老师', student: '李明' },
    { id: 2, date: '2023-10-05', time: '16:00-17:30', course: '数学辅导', teacher: '王老师', student: '赵小红' },
    { id: 3, date: '2023-10-06', time: '09:00-10:30', course: '钢琴初级', teacher: '刘老师', student: '王华' },
    { id: 4, date: '2023-10-06', time: '13:00-14:30', course: '物理辅导', teacher: '陈老师', student: '黄小明' },
    { id: 5, date: '2023-10-07', time: '11:00-12:30', course: '编程入门', teacher: '林老师', student: '张伟' }
  ]
  
  // 通知数据
  const notifications = [
    { id: 1, title: '系统更新通知', content: '系统将于今晚22:00-23:00进行更新维护，请提前做好安排。', time: '1小时前' },
    { id: 2, title: '新教师加入', content: '5位新教师已加入平台，请到教师管理页面进行查看。', time: '3小时前' },
    { id: 3, title: '学生反馈', content: '有10条新的学生反馈需要处理，请及时查看。', time: '昨天' },
    { id: 4, title: '课程调整提醒', content: '下周一的课程安排有变动，请查看排课页面。', time: '2天前' }
  ]
  
  // 日历数据
  const getCalendarData = (value) => {
    // 模拟一些有课程的日期
    const listData = [];
    switch (value.date()) {
      case 8:
        listData.push({ type: 'success', content: '3节课' });
        break;
      case 10:
        listData.push({ type: 'warning', content: '5节课' });
        break;
      case 15:
        listData.push({ type: 'error', content: '7节课' });
        break;
      default:
    }
    return listData;
  }
  
  const dateCellRender = (value) => {
    const listData = getCalendarData(value);
    return (
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {listData.map((item, index) => (
          <li key={index}>
            <Badge status={item.type} text={item.content} />
          </li>
        ))}
      </ul>
    );
  }
  
  // 表格列定义
  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
    },
    {
      title: '课程',
      dataIndex: 'course',
      key: 'course',
    },
    {
      title: '教师',
      dataIndex: 'teacher',
      key: 'teacher',
    },
    {
      title: '学生',
      dataIndex: 'student',
      key: 'student',
    },
    {
      title: '操作',
      key: 'action',
      render: () => <Button size="small" type="link">查看详情</Button>,
    },
  ]

  return (
    <div className="admin-dashboard">
      <Title level={2}>管理员仪表盘</Title>
      
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="学生总数"
              value={statistics.studentCount}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="教师总数"
              value={statistics.teacherCount}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="课程总数"
              value={statistics.courseCount}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="已排课程数"
              value={statistics.scheduledLessonCount}
              prefix={<ScheduleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>
      
      <Row gutter={16}>
        {/* 最近课程列表 */}
        <Col span={16} style={{ marginBottom: 24 }}>
          <Card 
            title="最近课程安排" 
            extra={<Button type="link">查看全部</Button>}
            style={{ height: '100%' }}
          >
            <Table 
              columns={columns} 
              dataSource={recentLessons} 
              pagination={false} 
              size="small"
              rowKey="id"
            />
          </Card>
        </Col>
        
        {/* 通知列表 */}
        <Col span={8} style={{ marginBottom: 24 }}>
          <Card 
            title="系统通知" 
            extra={<Button type="link">全部标为已读</Button>}
            style={{ height: '100%' }}
          >
            <List
              itemLayout="horizontal"
              dataSource={notifications}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={item.title}
                    description={item.content}
                  />
                  <div>{item.time}</div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
      
      {/* 日历视图 */}
      <Row>
        <Col span={24}>
          <Card title="课程日历">
            <Calendar dateCellRender={dateCellRender} fullscreen={false} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default AdminPage 