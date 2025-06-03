import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Rate,
  Card,
  Typography,
  message,
  Spin,
  Tag,
  Space,
  Empty
} from 'antd';
import { StarOutlined, CommentOutlined, CheckCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

// Import services
import { lessonService, feedbackService, authService } from '../services';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

// Helper to format date and time
const formatDateTime = (dateTime) => {
  return dateTime ? dayjs(dateTime).format('YYYY-MM-DD HH:mm') : 'N/A';
};

const StudentFeedbackPage = () => {
  // 状态
  const [completedLessons, setCompletedLessons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [feedbacks, setFeedbacks] = useState({}); // 存储已有的评价，使用lessonId作为key
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);

  // 获取当前学生信息和已完成的课程
  useEffect(() => {
    const fetchCurrentStudent = async () => {
      try {
        const user = authService.getCurrentUser();
        if (!user) {
          message.error('无法获取当前用户信息，请重新登录');
          return;
        }
        setCurrentStudent(user);
        await fetchCompletedLessons(user.studentId);
      } catch (error) {
        console.error('获取当前学生信息失败:', error);
        message.error('获取学生信息失败');
      }
    };

    fetchCurrentStudent();
  }, []);

  // 获取已完成的课程
  const fetchCompletedLessons = async (studentId) => {
    setLoading(true);
    try {
      const lessons = await lessonService.getStudentLessons(studentId);
      // 过滤出已完成的课程
      const completed = lessons.filter(lesson => lesson.status === 'COMPLETED');
      setCompletedLessons(completed);
      
      // 获取这些课程的评价
      await fetchFeedbacks(studentId, completed);
    } catch (error) {
      console.error('获取已完成课程失败:', error);
      message.error('获取课程列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取学生对课程的评价
  const fetchFeedbacks = async (studentId, lessons) => {
    setLoadingFeedbacks(true);
    try {
      const feedbacksData = await feedbackService.getStudentFeedbacks(studentId);
      
      // 将评价组织成以lessonId为键的对象
      const feedbackMap = {};
      feedbacksData.forEach(feedback => {
        feedbackMap[feedback.lessonId] = feedback;
      });
      
      setFeedbacks(feedbackMap);
    } catch (error) {
      console.error('获取评价数据失败:', error);
      message.error('获取评价数据失败');
    } finally {
      setLoadingFeedbacks(false);
    }
  };

  // 打开评价弹窗
  const handleOpenFeedbackModal = (lesson) => {
    setSelectedLesson(lesson);
    
    // 检查是否已有评价，如果有则填充表单
    const existingFeedback = feedbacks[lesson.id];
    if (existingFeedback) {
      form.setFieldsValue({
        rating: existingFeedback.rating,
        content: existingFeedback.content
      });
    } else {
      form.resetFields();
    }
    
    setIsModalVisible(true);
  };

  // 提交评价
  const handleSubmitFeedback = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      
      // 准备评价数据
      const feedbackData = {
        lessonId: selectedLesson.id,
        studentId: currentStudent.studentId,
        rating: values.rating,
        content: values.content
      };
      
      // 提交到服务器
      await feedbackService.createOrUpdateFeedback(feedbackData);
      
      // 更新本地状态
      const updatedFeedbacks = { ...feedbacks };
      updatedFeedbacks[selectedLesson.id] = {
        ...feedbackData,
        id: feedbacks[selectedLesson.id]?.id,
        studentName: currentStudent.name,
        courseName: selectedLesson.courseName,
        teacherName: selectedLesson.teacherName,
        lessonDate: selectedLesson.startDateTime,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setFeedbacks(updatedFeedbacks);
      
      // 成功提示
      message.success('评价提交成功！');
      setIsModalVisible(false);
    } catch (error) {
      console.error('提交评价失败:', error);
      message.error('提交评价失败: ' + (error.response?.data?.error || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  // 渲染评价状态
  const renderFeedbackStatus = (lessonId) => {
    const hasFeedback = feedbacks[lessonId];
    if (hasFeedback) {
      return (
        <Tag icon={<CheckCircleOutlined />} color="success">
          已评价 ({hasFeedback.rating}星)
        </Tag>
      );
    }
    return (
      <Tag color="warning">未评价</Tag>
    );
  };

  // 表格列定义
  const columns = [
    {
      title: '日期',
      dataIndex: 'startDateTime',
      key: 'date',
      render: (text) => formatDateTime(text),
      sorter: (a, b) => dayjs(a.startDateTime).unix() - dayjs(b.startDateTime).unix(),
      defaultSortOrder: 'descend'
    },
    {
      title: '课程',
      dataIndex: 'courseName',
      key: 'courseName',
    },
    {
      title: '教师',
      dataIndex: 'teacherName',
      key: 'teacherName',
    },
    {
      title: '教师笔记',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true, // 长文本省略
      render: (text) => text || '-',
    },
    {
      title: '状态',
      key: 'feedbackStatus',
      render: (_, record) => renderFeedbackStatus(record.id),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<StarOutlined />}
          onClick={() => handleOpenFeedbackModal(record)}
        >
          {feedbacks[record.id] ? '修改评价' : '添加评价'}
        </Button>
      ),
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <CommentOutlined /> 课程评价
      </Title>
      
      <Paragraph>
        在这里，您可以对已完成的课程进行评价，分享您的学习体验和感受。
        您的评价将帮助我们了解教学质量并不断改进课程体验。
      </Paragraph>
      
      <Card>
        {loading || loadingFeedbacks ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin tip="加载中..." />
          </div>
        ) : completedLessons.length === 0 ? (
          <Empty description="暂无已完成的课程可以评价" />
        ) : (
          <Table
            columns={columns}
            dataSource={completedLessons}
            rowKey="id"
            pagination={{
              defaultPageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
              showTotal: (total) => `共 ${total} 条记录`,
            }}
          />
        )}
      </Card>
      
      <Modal
        title="课程评价"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={handleSubmitFeedback}
        okText="提交评价"
        cancelText="取消"
        confirmLoading={submitting}
      >
        {selectedLesson && (
          <div style={{ marginBottom: '20px' }}>
            <p><strong>课程：</strong>{selectedLesson.courseName}</p>
            <p><strong>教师：</strong>{selectedLesson.teacherName}</p>
            <p><strong>时间：</strong>{formatDateTime(selectedLesson.startDateTime)}</p>
          </div>
        )}
        
        <Form form={form} layout="vertical">
          <Form.Item
            name="rating"
            label="评分"
            rules={[{ required: true, message: '请给课程评分' }]}
          >
            <Rate />
          </Form.Item>
          
          <Form.Item
            name="content"
            label="评价内容"
            rules={[{ required: true, message: '请输入评价内容' }]}
          >
            <TextArea rows={4} placeholder="请分享您对课程的感受、意见或建议..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default StudentFeedbackPage; 