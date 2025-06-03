import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Row, 
  Col, 
  Card, 
  Statistic, 
  Calendar, 
  Badge, 
  Button, 
  Table, 
  Tag, 
  Spin,
  Empty,
  Tabs,
  Alert,
  message,
  notification
} from 'antd';
import { 
  ClockCircleOutlined, 
  CheckCircleOutlined, 
  BookOutlined, 
  CalendarOutlined,
  PlusOutlined,
  NotificationOutlined,
  BellOutlined
} from '@ant-design/icons';
import { lessonService, authService, enrollmentService } from '../services';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const StudentDashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [stats, setStats] = useState({
    completedLessons: 0,
    upcomingLessons: 0,
    totalCourses: 0
  });

  // 获取当前登录的学生信息
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentStudent(user);
    }
    
    fetchStudentData();
  }, []);
  
  // 检测明天的课程并显示通知
  useEffect(() => {
    // 只有在lessons加载完成后才执行
    if (!loading && lessons.length > 0) {
      checkTomorrowLessons();
    }
  }, [loading, lessons]);
  
  // 检查明天的课程并发送通知
  const checkTomorrowLessons = () => {
    // 获取明天的日期范围（00:00:00 - 23:59:59）
    const tomorrow = dayjs().add(1, 'day').startOf('day');
    const tomorrowEnd = tomorrow.endOf('day');
    
    // 过滤出明天的课程
    const tomorrowLessons = lessons.filter(lesson => {
      const lessonTime = dayjs(lesson.startDateTime);
      return lessonTime.isAfter(tomorrow) && 
             lessonTime.isBefore(tomorrowEnd) && 
             lesson.status === 'SCHEDULED';
    });
    
    console.log('明天的课程:', tomorrowLessons);
    
    // 如果有明天的课程，且当天未显示过通知，才显示通知
    if (tomorrowLessons.length > 0 && !localStorage.getItem(`notification_shown_${tomorrow.format('YYYY-MM-DD')}`)) {
      // 按时间排序
      tomorrowLessons.sort((a, b) => 
        dayjs(a.startDateTime).diff(dayjs(b.startDateTime))
      );
      
      // 构建通知内容
      const notificationTitle = `您明天有 ${tomorrowLessons.length} 节课`;
      
      let notificationContent = tomorrowLessons.map(lesson => 
        `${dayjs(lesson.startDateTime).format('HH:mm')} - ${dayjs(lesson.endDateTime).format('HH:mm')} ${lesson.courseName} (${lesson.teacherName})`
      ).join('\n');
      
      // 显示通知
      notification.info({
        message: notificationTitle,
        description: (
          <div>
            <p>明天的课程安排：</p>
            {tomorrowLessons.map((lesson, index) => (
              <p key={index}>
                <strong>{dayjs(lesson.startDateTime).format('HH:mm')} - {dayjs(lesson.endDateTime).format('HH:mm')}</strong>
                <br />
                {lesson.courseName} (教师: {lesson.teacherName})
                <br />
                地点: {lesson.location || '待定'}
              </p>
            ))}
          </div>
        ),
        icon: <BellOutlined style={{ color: '#1890ff' }} />,
        duration: 0, // 不自动关闭
        placement: 'topRight',
        style: {
          width: 400
        }
      });
      
      // 记录已显示通知
      localStorage.setItem(`notification_shown_${tomorrow.format('YYYY-MM-DD')}`, 'true');
    }
  };
  
  // 获取学生数据
  const fetchStudentData = async () => {
    try {
      setLoading(true);
      
      // 获取当前用户信息
      const user = authService.getCurrentUser();
      if (!user || !user.id) {
        throw new Error('未找到学生信息');
      }

      // 使用studentId而不是userId来获取学生课程数据
      const studentId = user.studentId || user.id; // 向后兼容：如果没有studentId则尝试使用id
      console.log('尝试获取学生数据，学生ID:', studentId);
      
      try {
        // 并行获取数据
        const [lessonsData, enrollmentsData] = await Promise.all([
          lessonService.getStudentLessons(studentId),
          enrollmentService.getAllEnrollments({ studentId: studentId })
        ]);
        
        // 设置课程和选课数据
        setLessons(lessonsData || []);
        setEnrollments(enrollmentsData || []);
        
        // 计算统计数据
        setStats({
          completedLessons: lessonsData.filter(lesson => lesson.status === 'COMPLETED').length,
          upcomingLessons: lessonsData.filter(lesson => lesson.status === 'SCHEDULED').length,
          totalCourses: enrollmentsData.length
        });
      } catch (apiError) {
        console.error('API请求失败:', apiError);
        // 设置空数组，避免渲染错误
        setLessons([]);
        setEnrollments([]);
        setStats({
          completedLessons: 0,
          upcomingLessons: 0,
          totalCourses: 0
        });
        
        // 显示友好的错误信息，但不中断页面加载
        message.error('无法获取课程数据，请稍后再试');
      }
    } catch (error) {
      console.error('获取学生数据失败:', error);
      // 设置空数据，确保页面可以正常显示
      setLessons([]);
      setEnrollments([]);
      message.error('获取学生信息失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // 格式化日期和时间
  const formatDateTime = (dateTime) => {
    return dayjs(dateTime).format('YYYY-MM-DD HH:mm');
  };
  
  // 格式化日期
  const formatDate = (date) => {
    return dayjs(date).format('YYYY-MM-DD');
  };
  
  // 格式化时间段
  const formatTimeRange = (startTime, endTime) => {
    return `${dayjs(startTime).format('HH:mm')} - ${dayjs(endTime).format('HH:mm')}`;
  };
  
  // 日历课程单元格渲染
  const dateCellRender = (value) => {
    const date = value.format('YYYY-MM-DD');
    
    // 找出当天的课程
    const dailyLessons = lessons.filter(lesson => 
      dayjs(lesson.startDateTime).format('YYYY-MM-DD') === date
    );
    
    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {dailyLessons.map(lesson => (
          <li key={lesson.id} style={{ marginBottom: '2px' }}>
            <Badge 
              status={
                lesson.status === 'SCHEDULED' ? 'processing' :
                lesson.status === 'COMPLETED' ? 'success' :
                'default'
              } 
              text={`${dayjs(lesson.startDateTime).format('HH:mm')} ${lesson.courseName}`}
            />
          </li>
        ))}
      </ul>
    );
  };
  
  // 最近课程列表列配置
  const upcomingLessonsColumns = [
    {
      title: '日期',
      dataIndex: 'startDateTime',
      key: 'date',
      render: text => formatDate(text)
    },
    {
      title: '时间',
      dataIndex: 'startDateTime',
      key: 'time',
      render: (text, record) => formatTimeRange(record.startDateTime, record.endDateTime)
    },
    {
      title: '课程',
      dataIndex: 'courseName',
      key: 'courseName'
    },
    {
      title: '教师',
      dataIndex: 'teacherName',
      key: 'teacherName'
    },
    {
      title: '地点',
      dataIndex: 'location',
      key: 'location'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: status => (
        <Tag color={
          status === 'SCHEDULED' ? 'blue' :
          status === 'COMPLETED' ? 'green' :
          status === 'CANCELED' ? 'red' : 'default'
        }>
          {
            status === 'SCHEDULED' ? '已排课' :
            status === 'COMPLETED' ? '已完成' :
            status === 'CANCELED' ? '已取消' : status
          }
        </Tag>
      )
    }
  ];
  
  // 我的课程列表列配置
  const myCourseColumns = [
    {
      title: '课程名称',
      dataIndex: 'courseName',
      key: 'courseName'
    },
    {
      title: '教师',
      dataIndex: 'teacherName',
      key: 'teacherName'
    },
    {
      title: '科目',
      dataIndex: 'subject',
      key: 'subject'
    },
    {
      title: '开始日期',
      dataIndex: 'startDate',
      key: 'startDate',
      render: text => text ? formatDate(text) : '-'
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Link to="/student/book-lesson">
          <Button type="primary" size="small">
            预约课程
          </Button>
        </Link>
      )
    }
  ];
  
  // 获取明天的课程
  const getTomorrowLessons = () => {
    const tomorrow = dayjs().add(1, 'day').startOf('day');
    const tomorrowEnd = tomorrow.endOf('day');
    
    return lessons
      .filter(lesson => {
        const lessonTime = dayjs(lesson.startDateTime);
        return lessonTime.isAfter(tomorrow) && 
               lessonTime.isBefore(tomorrowEnd) && 
               lesson.status === 'SCHEDULED';
      })
      .sort((a, b) => dayjs(a.startDateTime).diff(dayjs(b.startDateTime)));
  };
  
  // 过滤最近的课程（未来7天）
  const getUpcomingLessons = () => {
    const today = dayjs().startOf('day');
    const nextWeek = today.add(7, 'day');
    
    return lessons
      .filter(lesson => {
        const lessonDate = dayjs(lesson.startDateTime);
        return lessonDate.isAfter(today) && lessonDate.isBefore(nextWeek) && lesson.status === 'SCHEDULED';
      })
      .sort((a, b) => dayjs(a.startDateTime).diff(dayjs(b.startDateTime)));
  };
  
  return (
    <div className="student-dashboard-page">
      <Title level={2}>学生仪表盘</Title>
      
      {loading ? (
        <div style={{ textAlign: 'center', margin: '50px 0' }}>
          <Spin size="large" tip="正在加载数据..." />
        </div>
      ) : (
        <>
          {/* 欢迎信息 */}
          <Card style={{ marginBottom: 16 }}>
            <Row gutter={16} align="middle">
              <Col flex="auto">
                <Title level={4}>欢迎回来，{currentStudent?.name || '同学'}</Title>
                <Text type="secondary">这里是您的个人学习中心，您可以查看课程安排、预约新课程和跟踪学习进度。</Text>
              </Col>
              <Col>
                <Link to="/student/book-lesson">
                  <Button type="primary" icon={<PlusOutlined />}>
                    预约新课程
                  </Button>
                </Link>
              </Col>
            </Row>
          </Card>
          
          {/* 课程提醒通知组件 */}
          {getTomorrowLessons().length > 0 && (
            <Card 
              style={{ marginBottom: 16, borderLeft: '4px solid #1890ff' }}
              title={
                <div>
                  <BellOutlined style={{ color: '#1890ff', marginRight: 8 }} />
                  明日课程提醒
                </div>
              }
            >
              {getTomorrowLessons().map((lesson, index) => (
                <Alert
                  key={index}
                  message={
                    <strong>
                      {dayjs(lesson.startDateTime).format('HH:mm')} - {dayjs(lesson.endDateTime).format('HH:mm')} 
                      {' '}{lesson.courseName}
                    </strong>
                  }
                  description={
                    <div>
                      <div>教师: {lesson.teacherName}</div>
                      <div>地点: {lesson.location || '待定'}</div>
                    </div>
                  }
                  type="info"
                  showIcon
                  style={{ marginBottom: index < getTomorrowLessons().length - 1 ? 8 : 0 }}
                />
              ))}
            </Card>
          )}
          
          {/* 统计卡片 */}
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic 
                  title="已完成课程"
                  value={stats.completedLessons}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic 
                  title="待上课程"
                  value={stats.upcomingLessons}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic 
                  title="已选课程"
                  value={stats.totalCourses}
                  prefix={<BookOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>
          
          {/* 主要内容区域 */}
          <Tabs defaultActiveKey="schedule">
            <TabPane 
              tab={<span><CalendarOutlined />我的课表</span>}
              key="schedule"
            >
              <Card>
                <Calendar dateCellRender={dateCellRender} />
              </Card>
            </TabPane>
            
            <TabPane 
              tab={<span><ClockCircleOutlined />近期课程</span>}
              key="upcoming"
            >
              <Card>
                {getUpcomingLessons().length > 0 ? (
                  <Table 
                    dataSource={getUpcomingLessons()}
                    columns={upcomingLessonsColumns}
                    rowKey="id"
                    pagination={false}
                  />
                ) : (
                  <Empty description="未来7天内没有待上课程" />
                )}
                
                {getUpcomingLessons().length > 0 && (
                  <Alert
                    message="提醒"
                    description="请准时参加课程，如需取消或调整，请提前联系教师。"
                    type="info"
                    showIcon
                    style={{ marginTop: 16 }}
                  />
                )}
              </Card>
            </TabPane>
            
            <TabPane 
              tab={<span><BookOutlined />我的课程</span>}
              key="courses"
            >
              <Card>
                {enrollments.length > 0 ? (
                  <Table 
                    dataSource={enrollments}
                    columns={myCourseColumns}
                    rowKey="id"
                    pagination={{ pageSize: 5 }}
                  />
                ) : (
                  <Empty description="您还没有选择任何课程">
                    <Link to="/student/book-lesson">
                      <Button type="primary">立即选课</Button>
                    </Link>
                  </Empty>
                )}
              </Card>
            </TabPane>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default StudentDashboardPage; 