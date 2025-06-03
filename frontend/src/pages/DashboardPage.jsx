import React, { useState, useEffect } from 'react';
import { Typography, Row, Col, Card, Statistic, Table, List, Avatar, Spin, Empty, Divider } from 'antd';
import { 
  UserOutlined, 
  ReadOutlined, 
  ClockCircleOutlined, 
  CheckCircleOutlined,
  TeamOutlined,
  CalendarOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { lessonService, studentService, teacherService, reportService } from '../services';
import dayjs from 'dayjs';

const { Title } = Typography;

// 简单的格式化函数
const formatDateTime = (dateTime) => {
  if (!dateTime) return '-';
  return dayjs(dateTime).format('YYYY-MM-DD HH:mm');
};

const DashboardPage = () => {
  // 状态管理
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalCourses: 0,
    completedLessons: 0,
    upcomingLessons: 0,
  });
  const [recentLessons, setRecentLessons] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [coursePopularity, setCoursePopularity] = useState([]);

  // 颜色配置
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28BFC', '#FF6B6B'];

  // 加载所有数据
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // 获取统计数据
        const studentsPromise = studentService.getAllStudents();
        const teachersPromise = teacherService.getAllTeachers();
        const lessonsPromise = lessonService.getAllLessons();
        const monthlyPromise = reportService.getMonthlyLessonsReport(dayjs().year());
        const popularityPromise = reportService.getCoursePopularityReport();
        
        // 等待所有请求完成
        const [students, teachers, lessons, monthlyReport, popularityReport] = await Promise.allSettled([
          studentsPromise, teachersPromise, lessonsPromise, monthlyPromise, popularityPromise
        ]);
        
        // 处理统计数据
        setStats({
          totalStudents: students.status === 'fulfilled' ? students.value.length : 0,
          totalTeachers: teachers.status === 'fulfilled' ? teachers.value.length : 0,
          totalCourses: 0, // 这个可以从课程服务获取或从选课记录中计算
          completedLessons: lessons.status === 'fulfilled' 
            ? lessons.value.filter(l => l.status === 'COMPLETED').length 
            : 0,
          upcomingLessons: lessons.status === 'fulfilled' 
            ? lessons.value.filter(l => l.status === 'SCHEDULED').length 
            : 0,
        });
        
        // 最近课程（过去或即将进行的）
        if (lessons.status === 'fulfilled') {
          const sortedLessons = [...lessons.value].sort((a, b) => 
            dayjs(b.startDateTime).diff(dayjs(a.startDateTime))
          );
          setRecentLessons(sortedLessons.slice(0, 5));
        }
        
        // 月度课时数据
        if (monthlyReport.status === 'fulfilled') {
          setMonthlyData(monthlyReport.value || generateSampleMonthlyData());
        } else {
          setMonthlyData(generateSampleMonthlyData());
        }
        
        // 课程受欢迎度数据
        if (popularityReport.status === 'fulfilled') {
          setCoursePopularity(popularityReport.value || generateSamplePopularityData());
        } else {
          setCoursePopularity(generateSamplePopularityData());
        }
        
      } catch (error) {
        console.error('加载仪表盘数据失败:', error);
        // 使用样本数据作为备份
        setMonthlyData(generateSampleMonthlyData());
        setCoursePopularity(generateSamplePopularityData());
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  // 生成样本月度数据（当API不可用时）
  const generateSampleMonthlyData = () => {
    const months = ['一月', '二月', '三月', '四月', '五月', '六月', 
                   '七月', '八月', '九月', '十月', '十一月', '十二月'];
    return months.map((month, index) => ({
      name: month,
      计划课程: Math.floor(Math.random() * 50) + 10,
      完成课程: Math.floor(Math.random() * 30) + 5,
    }));
  };
  
  // 生成样本课程受欢迎度数据（当API不可用时）
  const generateSamplePopularityData = () => {
    const courses = ['数学', '英语', '物理', '化学', '生物', '历史'];
    return courses.map((name) => ({
      name,
      value: Math.floor(Math.random() * 30) + 5,
    }));
  };

  // 课程列表列配置
  const lessonColumns = [
    {
      title: '时间',
      dataIndex: 'startDateTime',
      key: 'startDateTime',
      render: text => formatDateTime(text),
    },
    {
      title: '学生',
      dataIndex: 'studentName',
      key: 'studentName',
    },
    {
      title: '教师',
      dataIndex: 'teacherName',
      key: 'teacherName',
    },
    {
      title: '课程',
      dataIndex: 'courseName',
      key: 'courseName',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap = {
          'SCHEDULED': '已安排',
          'COMPLETED': '已完成',
          'CANCELLED': '已取消',
        };
        return statusMap[status] || status;
      },
    },
  ];

  return (
    <div className="dashboard-page">
      <Title level={2}>仪表盘</Title>
      
      {loading ? (
        <div style={{ textAlign: 'center', margin: '50px 0' }}>
          <Spin size="large" tip="正在加载仪表盘数据..." />
        </div>
      ) : (
        <>
          {/* 统计卡片 */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card>
                <Statistic 
                  title="学生总数" 
                  value={stats.totalStudents} 
                  prefix={<UserOutlined />} 
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card>
                <Statistic 
                  title="教师总数" 
                  value={stats.totalTeachers} 
                  prefix={<TeamOutlined />} 
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card>
                <Statistic 
                  title="已完成课程" 
                  value={stats.completedLessons} 
                  prefix={<CheckCircleOutlined />} 
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card>
                <Statistic 
                  title="待上课程" 
                  value={stats.upcomingLessons} 
                  prefix={<CalendarOutlined />} 
                />
              </Card>
            </Col>
          </Row>
          
          <Divider />
          
          {/* 图表区域 */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card title="月度课程统计" className="chart-card">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="计划课程" fill="#8884d8" />
                    <Bar dataKey="完成课程" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="课程受欢迎度" className="chart-card">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={coursePopularity}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {coursePopularity.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
          
          <Divider />
          
          {/* 最近课程 */}
          <Card title="最近课程" className="recent-lessons-card">
            {recentLessons.length > 0 ? (
              <Table 
                dataSource={recentLessons} 
                columns={lessonColumns} 
                rowKey="id"
                pagination={false}
              />
            ) : (
              <Empty description="暂无课程记录" />
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default DashboardPage; 