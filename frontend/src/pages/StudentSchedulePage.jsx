import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Calendar, 
  Badge, 
  Card, 
  Spin, 
  Empty, 
  Modal, 
  Descriptions, 
  message,
  Tag,
  Button
} from 'antd';
import { CalendarOutlined, ClockCircleOutlined, EnvironmentOutlined, UserOutlined } from '@ant-design/icons';
import { lessonService, authService } from '../services';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

// 格式化日期时间
const formatDateTime = (dateTime) => {
  return dayjs(dateTime).format('YYYY-MM-DD HH:mm');
};

// 格式化日期
const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD');
};

// 格式化时间
const formatTime = (time) => {
  return dayjs(time).format('HH:mm');
};

const StudentSchedulePage = () => {
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // 获取学生课程数据
  useEffect(() => {
    const fetchLessons = async () => {
      try {
        setLoading(true);
        const user = authService.getCurrentUser();
        
        if (!user || !user.studentId) {
          throw new Error('未找到学生信息');
        }
        
        const studentId = user.studentId || user.id;
        const lessonsData = await lessonService.getStudentLessons(studentId);
        setLessons(lessonsData || []);
      } catch (error) {
        console.error('获取课程数据失败:', error);
        message.error('无法获取您的课程数据');
        setLessons([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLessons();
  }, []);

  // 获取日历单元格数据
  const getCalendarCellData = (date) => {
    const formattedDate = formatDate(date);
    
    // 过滤出当天的课程
    const dayLessons = lessons.filter(lesson => {
      const lessonDate = formatDate(lesson.startDateTime);
      return lessonDate === formattedDate;
    });
    
    return dayLessons;
  };

  // 日历单元格渲染
  const dateCellRender = (date) => {
    const dayLessons = getCalendarCellData(date);
    
    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {dayLessons.map((lesson) => (
          <li key={lesson.id} style={{ margin: '3px 0' }}>
            <Badge 
              status={
                lesson.status === 'COMPLETED' ? 'success' : 
                lesson.status === 'SCHEDULED' ? 'processing' : 
                lesson.status === 'CANCELLED' ? 'error' : 'default'
              } 
              text={
                <a 
                  onClick={() => handleLessonClick(lesson)}
                  style={{ fontSize: '12px' }}
                >
                  {formatTime(lesson.startDateTime)} {lesson.courseName}
                </a>
              }
            />
          </li>
        ))}
      </ul>
    );
  };

  // 处理课程点击事件
  const handleLessonClick = (lesson) => {
    setSelectedLesson(lesson);
    setModalVisible(true);
  };

  // 关闭详情模态框
  const handleCloseModal = () => {
    setModalVisible(false);
  };

  // 渲染状态标签
  const renderStatusTag = (status) => {
    switch(status) {
      case 'SCHEDULED':
        return <Tag color="blue">已排课</Tag>;
      case 'COMPLETED':
        return <Tag color="green">已完成</Tag>;
      case 'CANCELLED':
      case 'CANCELLED_BY_STUDENT':
      case 'CANCELLED_BY_TEACHER':
        return <Tag color="red">已取消</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin size="large" tip="正在加载课程数据..." />
      </div>
    );
  }

  return (
    <div className="student-schedule-page">
      <Title level={2}>我的课表</Title>
      
      <Card>
        {lessons.length > 0 ? (
          <Calendar 
            dateCellRender={dateCellRender}
            mode="month"
          />
        ) : (
          <Empty 
            description="您还没有预约任何课程" 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" href="/student/book-lesson">立即预约课程</Button>
          </Empty>
        )}
      </Card>

      {/* 课程详情模态框 */}
      {selectedLesson && (
        <Modal
          title="课程详情"
          open={modalVisible}
          onCancel={handleCloseModal}
          footer={[
            <Button key="close" onClick={handleCloseModal}>
              关闭
            </Button>
          ]}
        >
          <Descriptions bordered column={1}>
            <Descriptions.Item label="课程名称">{selectedLesson.courseName}</Descriptions.Item>
            <Descriptions.Item label="教师">
              <UserOutlined /> {selectedLesson.teacherName}
            </Descriptions.Item>
            <Descriptions.Item label="日期">
              <CalendarOutlined /> {formatDate(selectedLesson.startDateTime)}
            </Descriptions.Item>
            <Descriptions.Item label="时间">
              <ClockCircleOutlined /> {formatTime(selectedLesson.startDateTime)} - {formatTime(selectedLesson.endDateTime)}
            </Descriptions.Item>
            <Descriptions.Item label="地点">
              <EnvironmentOutlined /> {selectedLesson.location || '未指定'}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              {renderStatusTag(selectedLesson.status)}
            </Descriptions.Item>
            {selectedLesson.notes && (
              <Descriptions.Item label="备注">
                {selectedLesson.notes}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Modal>
      )}
    </div>
  );
};

export default StudentSchedulePage; 