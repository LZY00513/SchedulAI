import React, { useState, useEffect } from 'react';
import {
    Table,
    Button,
    Modal,
    Typography,
    Spin,
    message,
    Tag,
    Space,
    Card
} from 'antd';
import { FileTextOutlined, ExperimentOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

// Import services
import { lessonService, reportService } from '../services'; // Ensure reportService is imported

const { Title, Paragraph, Text } = Typography;

// Helper to format date and time
const formatDateTime = (dateTime) => {
    return dateTime ? dayjs(dateTime).format('YYYY-MM-DD HH:mm') : 'N/A';
};

const ReportPage = () => {
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [reportContent, setReportContent] = useState('');
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [generatingReport, setGeneratingReport] = useState(false);

    // Fetch lessons on mount
    useEffect(() => {
        fetchLessons();
    }, []);

    const fetchLessons = async () => {
        setLoading(true);
        try {
            // Fetch all lessons, filtering will happen in the table dataSource
            // Or, ideally, backend provides an endpoint for completed lessons
            const allLessons = await lessonService.getAllLessons(); 
            
            // Process lessons to include necessary info (student/teacher/course names)
            // This part might need adjustment based on how lessonService returns data
            // Assuming getAllLessons returns lessons with populated DTOs or requires enrichment
            const processedLessons = allLessons.map(lesson => ({
                ...lesson,
                // Assuming lesson DTO has these fields directly now after previous updates
                studentName: lesson.studentName || `(ID: ${lesson.studentId})`,
                teacherName: lesson.teacherName || `(ID: ${lesson.teacherId})`,
                courseName: lesson.courseName || `(ID: ${lesson.courseId})`,
            }));
            setLessons(processedLessons || []);

        } catch (error) {
            message.error('获取课程列表失败');
            setLessons([]);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateReport = async (lesson) => {
        setSelectedLesson(lesson);
        setGeneratingReport(true);
        setReportContent(''); // Clear previous report
        setIsModalVisible(true);

        try {
            // 先获取课程的学生评价信息
            let studentFeedbackInfo = "";
            try {
                const feedbackResponse = await reportService.getLessonFeedback(lesson.id);
                if (feedbackResponse && feedbackResponse.hasFeedback) {
                    studentFeedbackInfo = `学生自评：${feedbackResponse.studentName} 给出 ${feedbackResponse.rating} 星评价\n${feedbackResponse.content}\n\n`;
                }
            } catch (feedbackError) {
                console.warn("Failed to fetch student feedback:", feedbackError);
                // 继续生成报告，不让获取评价失败影响整体功能
            }
            
            // 生成AI评价报告
            const response = await reportService.generateLessonReport(lesson.id);
            
            // 处理响应
            if (response && response.reportContent) {
                // 如果有学生评价，将其添加到报告开头
                if (studentFeedbackInfo) {
                    setReportContent(`${studentFeedbackInfo}AI评价报告：\n${response.reportContent}`);
                } else {
                    setReportContent(response.reportContent);
                }
            } else {
                // Handle cases where AI might return empty or backend indicates failure differently
                setReportContent('无法生成报告内容，请稍后重试。');
                message.error('AI 服务未能生成有效的报告内容。');
            }
           
        } catch (error) {
            console.error("Report generation error:", error);
            // Attempt to display error message from backend response body
            const errorMsg = error.response?.data || error.message || '生成报告时发生未知错误。';
            setReportContent(`生成报告失败: ${errorMsg}`);
            message.error(`生成报告失败: ${errorMsg}`);
        } finally {
            setGeneratingReport(false);
        }
    };

    const handleModalClose = () => {
        setIsModalVisible(false);
        setReportContent('');
        setSelectedLesson(null);
    };

    // Filter completed lessons for the table
    const completedLessons = lessons.filter(lesson => lesson.status === 'COMPLETED');

    const columns = [
        {
            title: '完成日期',
            dataIndex: 'endDateTime',
            key: 'date',
            render: (text) => formatDateTime(text),
            sorter: (a, b) => dayjs(a.endDateTime).unix() - dayjs(b.endDateTime).unix(),
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
            title: '教师笔记',
            dataIndex: 'notes',
            key: 'notes',
            ellipsis: true, // Truncate long notes
            render: (text) => text || '-',
        },
        {
            title: '操作',
            key: 'action',
            render: (_, record) => (
                <Button
                    icon={<ExperimentOutlined />}
                    onClick={() => handleGenerateReport(record)}
                    disabled={generatingReport && selectedLesson?.id === record.id} // Disable while generating for this lesson
                    loading={generatingReport && selectedLesson?.id === record.id}
                >
                    生成AI评价
                </Button>
            ),
        },
    ];

    return (
        <div className="report-page">
            <Title level={2}>课程评价报告</Title>
            <Card bordered={false}>
                 <Paragraph>
                    在此页面，您可以为已完成的课程生成 AI 学习评价。
                    AI 将根据课程基本信息和教师在课程记录中添加的笔记来生成评价。
                    <br/>
                    <b>新功能</b>：现在系统会同时考虑学生的自我评价反馈（如果有），使生成的报告更加全面和客观。
                 </Paragraph>
                <Table
                    columns={columns}
                    dataSource={completedLessons} 
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        defaultPageSize: 10,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50'],
                        showTotal: (total) => `共 ${total} 条已完成课程`,
                    }}
                />
            </Card>

            <Modal
                title={selectedLesson ? `课程评价 - ${selectedLesson.courseName} (${selectedLesson.studentName}, ${formatDateTime(selectedLesson.endDateTime)})` : '课程评价'}
                open={isModalVisible}
                onCancel={handleModalClose}
                footer={[
                    <Button key="close" onClick={handleModalClose}>
                        关闭
                    </Button>,
                ]}
                width={600}
            >
                {generatingReport ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <Spin size="large" tip="正在生成评价报告，请稍候..." />
                    </div>
                ) : (
                    // Use Typography for better text rendering and potential markdown support later
                    <Typography>
                        <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{reportContent}</Paragraph>
                    </Typography>
                )}
            </Modal>
        </div>
    );
};

export default ReportPage; 