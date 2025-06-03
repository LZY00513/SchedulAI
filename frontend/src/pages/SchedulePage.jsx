import React, { useState, useEffect } from 'react'
import { 
  Calendar, 
  Card, 
  Button, 
  Select, 
  Tag, 
  Typography, 
  Modal, 
  Form, 
  DatePicker, 
  TimePicker, 
  Input, 
  message, 
  Popconfirm,
  Badge,
  Row,
  Col,
  Table,
  Drawer,
  Descriptions,
  Space,
  Divider,
  Tabs,
  Empty,
  Radio,
  Alert,
  Tooltip,
  Popover,
  Statistic
} from 'antd'
import { 
  PlusOutlined, 
  CalendarOutlined, 
  UnorderedListOutlined, 
  EditOutlined, 
  DeleteOutlined,
  EyeOutlined,
  UserOutlined,
  TeamOutlined,
  BookOutlined,
  ClockCircleOutlined,
  ExperimentOutlined,
  BellOutlined,
  CheckOutlined,
  CloseOutlined,
  RobotOutlined,
  InfoCircleOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'

// Import services
import { 
  studentService, 
  teacherService, 
  courseService, 
  lessonService, 
  enrollmentService,
  schedulingService,
  authService
} from '../services'

const { Title } = Typography
const { Option } = Select
const { TextArea } = Input
const { TabPane } = Tabs

// 格式化时间
const formatTime = (time) => {
  // Ensure time is valid before formatting
  return time && dayjs(time).isValid() ? dayjs(time).format('HH:mm') : '--:--'
}

// 获取下周的日期范围
const getNextWeekDateRange = () => {
  const today = dayjs();
  const nextWeekStart = today.add(1, 'week').startOf('week');
  const nextWeekEnd = nextWeekStart.add(6, 'day');
  return [nextWeekStart, nextWeekEnd];
};

const SchedulePage = () => {
  // 状态管理
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState('calendar') // 'calendar' 或 'list'
  const [lessons, setLessons] = useState([]) // Raw lessons from API
  const [processedLessons, setProcessedLessons] = useState([]) // Lessons processed for display
  const [filteredLessons, setFilteredLessons] = useState([]) // Processed lessons after filtering
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [currentLesson, setCurrentLesson] = useState(null) // Holds raw lesson DTO for editing
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [dailyLessons, setDailyLessons] = useState([]) // Processed daily lessons for drawer
  const [form] = Form.useForm()
  const [suggestedSlots, setSuggestedSlots] = useState([]) // State for suggested slots
  const [isSuggestionLoading, setIsSuggestionLoading] = useState(false) // Loading state for suggestions
  const [nextWeekDateRange] = useState(getNextWeekDateRange());
  const [calendarActiveDate, setCalendarActiveDate] = useState(nextWeekDateRange[0]);

  // 筛选条件
  const [filters, setFilters] = useState({
    studentId: 'all', // Changed keys to match API/DTO more closely
    teacherId: 'all',
    courseId: 'all',
    status: 'all',
    timeRange: 'next-week' // 新增时间范围筛选，默认为下周
  })

  // 获取学生、教师和课程的列表
  const [students, setStudents] = useState([])
  const [teachers, setTeachers] = useState([])
  const [courses, setCourses] = useState([])
  const [enrollments, setEnrollments] = useState([]) // State for enrollments

  // 初始检查登录状态
  useEffect(() => {
    const isLoggedIn = authService.isAuthenticated('ADMIN');
    console.log('管理员登录状态:', isLoggedIn);
    
    if (!isLoggedIn) {
      message.warning('您尚未登录或登录已过期，某些功能可能受限');
    }
  }, []);

  // 获取基础数据
  useEffect(() => {
    fetchAllInitialData()
  }, [])

  // 处理和筛选课程
  useEffect(() => {
    processAndFilterLessons()
    // Depend on enrollments as well now
  }, [filters, lessons, students, teachers, courses, enrollments])

  // 获取所有初始数据
  const fetchAllInitialData = async () => {
    setLoading(true)
    try {
      // Add enrollmentService.getAllEnrollments() to the Promise.all
      const [studentsData, teachersData, coursesData, lessonsData, enrollmentsData] = await Promise.all([
        studentService.getAllStudents(),
        teacherService.getAllTeachers(),
        courseService.getAllCourses(),
        lessonService.getAllLessons(), // Fetch all lessons
        enrollmentService.getAllEnrollments() // Fetch all enrollments
      ])
      setStudents(studentsData || [])
      setTeachers(teachersData || [])
      setCourses(coursesData || [])
      setLessons(lessonsData || []) // Store raw lesson DTOs
      setEnrollments(enrollmentsData || []) // Store enrollments
    } catch (error) {
      message.error('获取初始数据失败')
      console.error('获取初始数据失败:', error)
      // Set empty arrays on failure
      setStudents([])
      setTeachers([])
      setCourses([])
      setLessons([])
      setEnrollments([]) // Set empty on failure
    } finally {
      setLoading(false)
    }
  }

  // 加工课程数据并应用筛选
  const processAndFilterLessons = () => {
    // 打印原始课程数据
    console.log('原始课程数据:', lessons);
    
    // 1. Process raw lessons
    const processed = lessons.map(lesson => {
        // Find the corresponding enrollment using lesson.enrollmentId
        const enrollment = enrollments.find(e => e.id === lesson.enrollmentId);
        
        console.log(`处理课程 ID:${lesson.id}, 状态:${lesson.status}, 开始时间:${lesson.startDateTime}, 结束时间:${lesson.endDateTime}`);
        
        // Get details directly from the (now richer) EnrollmentDTO
        const studentName = enrollment ? enrollment.studentName : `(Student ID: ${lesson.studentId})`; // Use IDs from lesson DTO as fallback
        const teacherName = enrollment ? enrollment.teacherName : `(Teacher ID: ${lesson.teacherId})`;
        const courseName = enrollment ? enrollment.courseName : `(Course ID: ${lesson.courseId})`;
        // IDs are already present in the lesson DTO itself from the backend
        const studentId = lesson.studentId;
        const teacherId = lesson.teacherId;
        const courseId = lesson.courseId;

        // 如果数据无效，尝试生成默认日期和时间
        let start = dayjs(lesson.startDateTime);
        let end = dayjs(lesson.endDateTime);
        
        if (!start.isValid() || !end.isValid()) {
          console.log(`课程 ${lesson.id} 日期无效，使用今天作为默认日期`);
          // 设置默认时间为今天的9:00-10:30
          start = dayjs().hour(9).minute(0).second(0);
          end = dayjs().hour(10).minute(30).second(0);
        }
        
        // 确保课程有状态
        const status = lesson.status || 'SCHEDULED';
        
        return {
          ...lesson, // Keep original DTO fields: id, enrollmentId, startDateTime, ..., location, notes, studentId, teacherId, courseId
          studentName, // Use name found via enrollment
          teacherName, // Use name found via enrollment
          courseName,  // Use name found via enrollment
          date: start.format('YYYY-MM-DD'),
          startTime: start.format('HH:mm'),
          endTime: end.format('HH:mm'),
          status: status // 使用处理后的状态
        };
    });
    
    console.log('处理后的课程数据:', processed);
    
    setProcessedLessons(processed);

    // 2. Apply filters (logic remains the same)
    let filtered = [...processed];
    if (filters.studentId !== 'all') {
      filtered = filtered.filter(lesson => lesson.studentId === parseInt(filters.studentId));
    }
    if (filters.teacherId !== 'all') {
      filtered = filtered.filter(lesson => lesson.teacherId === parseInt(filters.teacherId));
    }
    if (filters.courseId !== 'all') {
      filtered = filtered.filter(lesson => lesson.courseId === parseInt(filters.courseId));
    }
    if (filters.status !== 'all') {
      filtered = filtered.filter(lesson => lesson.status === filters.status);
    }
    
    // 新增按时间范围筛选
    if (filters.timeRange === 'next-week') {
      const nextWeekStart = nextWeekDateRange[0].format('YYYY-MM-DD');
      const nextWeekEnd = nextWeekDateRange[1].format('YYYY-MM-DD');
      filtered = filtered.filter(lesson => 
        lesson.date >= nextWeekStart && lesson.date <= nextWeekEnd
      );
    }
    
    setFilteredLessons(filtered);
  };

  // 处理筛选条件变化
  const handleFilterChange = (filterType, value) => {
    setFilters({
      ...filters,
      [filterType]: value
    })
  }
  
  // 展示每日课程列表
  const showDailyLessons = (value) => {
    const formattedDate = value.format('YYYY-MM-DD')
    // Filter from the already processed and filtered list for the calendar view
    const daily = filteredLessons.filter(lesson => lesson.date === formattedDate)
    
    setSelectedDate(value)
    setDailyLessons(daily) // Store processed lessons for the drawer
    setDrawerVisible(true)
  }

  // 弹窗处理
  const showAddModal = () => {
    setCurrentLesson(null)
    form.resetFields()
    
    // 默认选择下周的某一天（例如周一）
    form.setFieldsValue({
      date: nextWeekDateRange[0], // 下周一
      timeRange: [dayjs().hour(9).minute(0), dayjs().hour(10).minute(0)] // 默认9:00-10:00
    })
    
    setIsModalVisible(true)
  }

  const showEditModal = (lesson) => { // Accepts processed lesson from UI
    const rawLesson = lessons.find(l => l.id === lesson.id);
    if (!rawLesson) {
        message.error("Cannot find original lesson data.");
        return;
    }
    setCurrentLesson(rawLesson); 

    // Use the processed lesson's IDs for form pre-fill
    form.setFieldsValue({
      studentId: lesson.studentId,
      teacherId: lesson.teacherId, 
      courseId: lesson.courseId,
      location: rawLesson.location, // Get from raw DTO
      date: dayjs(rawLesson.startDateTime), // Use raw DTO for date/time
      timeRange: [
        dayjs(rawLesson.startDateTime),
        dayjs(rawLesson.endDateTime)
      ],
      status: rawLesson.status,
      notes: rawLesson.notes // Get from raw DTO
    });
    setIsModalVisible(true);
  }

  const handleModalCancel = () => {
    setIsModalVisible(false)
  }

  const handleDrawerClose = () => {
    setDrawerVisible(false)
    setSelectedDate(null)
    setDailyLessons([])
  }

  const handleModalOk = async () => {
    console.log("handleModalOk triggered");
    try {
      console.log("Validating form...");
      const values = await form.validateFields();
      console.log("Form values validated:", values);
      
      // 1. Find Enrollment ID
      console.log("Finding enrollment...");
      console.log("Current Enrollments State:", enrollments);
      const foundEnrollment = enrollments.find(e => 
          String(e.studentId) === String(values.studentId) && 
          String(e.teacherId) === String(values.teacherId) && 
          String(e.courseId) === String(values.courseId)
      );
      console.log("Found Enrollment:", foundEnrollment);

      if (!foundEnrollment) {
          // Find names for better error message
          const studentName = students.find(s => String(s.id) === String(values.studentId))?.name || `ID ${values.studentId}`;
          const teacherName = teachers.find(t => String(t.id) === String(values.teacherId))?.name || `ID ${values.teacherId}`;
          const courseName = courses.find(c => String(c.id) === String(values.courseId))?.name || `ID ${values.courseId}`;
          message.error(`找不到学生 '${studentName}' 与教师 '${teacherName}' 针对课程 '${courseName}' 的有效选课记录。请先完成选课。`);
          console.error("Enrollment not found for combination:", values);
          return;
      }
      const enrollmentId = foundEnrollment.id;
      console.log("Enrollment ID found:", enrollmentId);

      // 2. Prepare Lesson DTO
      console.log("Preparing lesson DTO...");
      const startDateTime = values.date.hour(values.timeRange[0].hour()).minute(values.timeRange[0].minute()).second(0).toISOString();
      const endDateTime = values.date.hour(values.timeRange[1].hour()).minute(values.timeRange[1].minute()).second(0).toISOString();
      
      // Ensure status is uppercase for backend enum deserialization
      const statusValue = currentLesson ? values.status : 'SCHEDULED';
      const statusUpperCase = statusValue.toUpperCase(); 

      const lessonData = {
          enrollmentId: enrollmentId,
          startDateTime: startDateTime,
          endDateTime: endDateTime,
          location: values.location,
          notes: values.notes,
          status: statusUpperCase // Send uppercase status string
      };
      console.log("Lesson DTO prepared:", lessonData);

      // 3. Call Service
      console.log("Calling lesson service...");
      setLoading(true);
      if (currentLesson) {
        console.log(`Updating lesson ID: ${currentLesson.id}`);
        await lessonService.updateLesson(currentLesson.id, lessonData);
        console.log("Lesson update API call finished.");
        message.success('课程安排更新成功！');
      } else {
        console.log("Creating new lesson...");
        await lessonService.createLesson(lessonData);
        console.log("Lesson create API call finished.");
        message.success('课程安排添加成功！');
      }
      
      // 4. Clean up and refresh
      console.log("Closing modal and refreshing data...");
      setIsModalVisible(false);
      setCurrentLesson(null);
      await fetchAllInitialData(); // Refresh all data
      console.log("Data refresh finished.");

    } catch (error) {
      console.error('保存课程安排失败:', error); 
      // Enhanced error logging
      if (error.response) {
        // Request made and server responded
        console.error("Backend Error Data:", error.response.data);
        console.error("Backend Error Status:", error.response.status);
        console.error("Backend Error Headers:", error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.error("No response received:", error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Request Setup Error:", error.message);
      }
      const errorMsg = error.response?.data?.message || error.response?.data || error.message || '操作失败，请重试。';
       if (error.response?.status === 409) { 
            // 状态码409表示资源冲突，在排课系统中可能是以下几种情况：
            // 1. 教师在指定时间已有其他课程安排
            // 2. 学生在指定时间已有其他课程安排
            // 3. 教室在指定时间段已被占用
            // 4. 该时间段超出了教师或学生的可用时间范围
            
            // 显示更具体的错误信息，帮助用户理解冲突原因
            const conflictType = error.response?.data?.conflictType || '';
            let conflictMsg = errorMsg;
            
            // 根据冲突类型提供更具体的错误信息
            if (conflictType === 'TEACHER_CONFLICT') {
              conflictMsg = `教师在所选时间段已有其他课程安排。${errorMsg}`;
            } else if (conflictType === 'STUDENT_CONFLICT') {
              conflictMsg = `学生在所选时间段已有其他课程安排。${errorMsg}`;
            } else if (conflictType === 'LOCATION_CONFLICT') {
              conflictMsg = `所选教室在该时间段已被占用。${errorMsg}`;
            } else if (conflictType === 'AVAILABILITY_CONFLICT') {
              conflictMsg = `所选时间不在教师或学生的可用时间范围内。${errorMsg}`;
            }
            
            // 显示错误消息
            message.error(`排课冲突：${conflictMsg}`);
            
            // 同时显示更详细的Modal提示，帮助用户解决问题
            Modal.error({
              title: '排课时间冲突',
              content: (
                <div>
                  <p><strong>检测到时间冲突：</strong>{conflictMsg}</p>
                  <Divider />
                  <p><strong>解决建议：</strong></p>
                  <ul>
                    <li>尝试选择其他时间段</li>
                    <li>查看教师和学生的可用性日历</li>
                    <li>使用系统推荐的可用时间段</li>
                    <li>如果是重复性课程，可以考虑调整单次课程时间</li>
                  </ul>
                </div>
              ),
              okText: '我知道了'
            });
       } else {
            message.error(`操作失败: ${errorMsg}`);
       }
    } finally {
        console.log("handleModalOk finished executing.");
        setLoading(false);
    }
  }

  const handleDelete = async (lessonId) => {
    setLoading(true);
    try {
      await lessonService.deleteLesson(lessonId);
      message.success('课程安排删除成功！');
      await fetchAllInitialData(); // Refresh data
    } catch (error) {
      console.error(`删除课程安排 (ID: ${lessonId}) 失败:`, error);
      const errorMsg = error.response?.data || error.message || '删除失败，请重试。';
      message.error(`删除失败: ${errorMsg}`);
    } finally {
        setLoading(false);
    }
  }
  
  const handleStatusChange = async (lessonId, status) => {
    setLoading(true);
    try {
      // 确保状态为大写（与后端枚举匹配）
      const upperStatus = status.toUpperCase();
      console.log(`尝试更新课程(ID: ${lessonId})状态为 ${upperStatus}`);
      
      // 先乐观更新UI，让用户立即看到反馈
      const optimisticUpdatedLessons = lessons.map(lesson => 
        lesson.id === lessonId ? { ...lesson, status: upperStatus } : lesson
      );
      setLessons(optimisticUpdatedLessons);
      
      // 调用后端API更新状态
      const result = await lessonService.updateStatus(lessonId, upperStatus);
      console.log('状态更新结果:', result);
      
      message.success(`课程状态已更新为 "${getStatusText(upperStatus)}"！`);
      
      // 成功后完全刷新数据
      await fetchAllInitialData();
      
    } catch (error) {
      console.error(`更新课程 (ID: ${lessonId}) 状态失败:`, error);
      
      if (error.isPermissionError) {
        // 权限错误
        message.error({
          content: '权限不足，无法修改课程状态',
          duration: 5
        });
        
        // 显示更详细的提示
        Modal.error({
          title: '权限错误',
          content: (
            <div>
              <p>您没有权限执行此操作。可能的原因：</p>
              <ul>
                <li>您的账号没有管理员权限</li>
                <li>您的登录会话已过期</li>
                <li>您尝试修改的课程需要特殊权限</li>
              </ul>
              <p>建议操作：</p>
              <ul>
                <li>尝试重新登录</li>
                <li>联系系统管理员获取权限</li>
              </ul>
            </div>
          ),
          okText: '我知道了'
        });
      } else {
        // 一般错误处理
        const errorMsg = error.message || '状态更新失败，请重试';
        message.error(`状态更新失败: ${errorMsg}`);
      }
      
      // 回滚乐观更新
      await fetchAllInitialData();
    } finally {
      setLoading(false);
    }
  };

  // 获取状态文本，处理N/A情况
  const getStatusText = (status) => {
    if (!status) {
      return '未设置';
    }
    
    // 尝试转换为大写并匹配
    const upperStatus = String(status).toUpperCase();
    
    switch (upperStatus) {
      case 'SCHEDULED':
        return '已排课';
      case 'IN_PROGRESS':
        return '进行中';
      case 'COMPLETED':
        return '已完成';
      case 'CANCELLED_BY_TEACHER':
        return '教师取消';
      case 'CANCELLED_BY_STUDENT':
        return '学生取消';
      case 'CANCELLED':
        return '已取消';
      case 'NO_SHOW':
        return '学生未到';
      case 'PENDING_PAYMENT':
        return '待支付';
      default:
        return '已排课'; // 默认显示为已排课
    }
  };

  // 获取状态标签颜色，处理N/A情况
  const getStatusColor = (status) => {
    if (!status) {
      return 'blue'; // 默认蓝色（已排课）
    }
    
    // 尝试转换为大写并匹配
    const upperStatus = String(status).toUpperCase();
    
    switch (upperStatus) {
      case 'SCHEDULED':
        return 'blue';
      case 'IN_PROGRESS':
        return 'processing';
      case 'COMPLETED':
        return 'green';
      case 'CANCELLED':
      case 'CANCELLED_BY_TEACHER':
      case 'CANCELLED_BY_STUDENT':
        return 'red';
      case 'NO_SHOW':
        return 'orange';
      case 'PENDING_PAYMENT':
        return 'gold';
      default:
        return 'blue'; // 默认蓝色（已排课）
    }
  };
  
  // 日历数据渲染
  const getCalendarData = (value) => {
    const date = value.format('YYYY-MM-DD')
    return filteredLessons.filter(lesson => lesson.date === date)
  }
  
  const dateCellRender = (value) => {
    const listData = getCalendarData(value)
    
    return (
      <ul className="events" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {listData.map(item => {
          // 确保课程有状态值
          const status = item.status || 'SCHEDULED';
          const statusUpper = status.toUpperCase();
          
          // 基于状态确定徽标显示类型
          let badgeStatus = 'processing';
          if (statusUpper === 'COMPLETED') badgeStatus = 'success';
          else if (statusUpper.includes('CANCEL') || statusUpper === 'NO_SHOW') badgeStatus = 'error';
          
          return (
            <li key={item.id} style={{ whiteSpace: 'nowrap', overflow: 'hidden', fontSize: '12px' }}>
              <Badge
                status={badgeStatus}
                text={`${formatTime(item.startTime)}-${formatTime(item.endTime)} ${item.studentName}(${item.courseName}) ${getStatusText(status)}`}
              />
            </li>
          );
        })}
      </ul>
    )
  }

  // 课程列表展示的列定义
  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => new Date(a.date) - new Date(b.date)
    },
    {
      title: '时间',
      key: 'time',
      render: (_, record) => `${record.startTime}-${record.endTime}`,
      sorter: (a, b) => a.startTime.localeCompare(b.startTime)
    },
    {
      title: '学生',
      dataIndex: 'studentName',
      key: 'studentName',
      render: (text) => <span><UserOutlined /> {text}</span>
    },
    {
      title: '教师',
      dataIndex: 'teacherName',
      key: 'teacherName',
      render: (text) => <span><TeamOutlined /> {text}</span>
    },
    {
      title: '课程',
      dataIndex: 'courseName',
      key: 'courseName',
      render: (text) => <span><BookOutlined /> {text}</span>
    },
    {
      title: '上课地点',
      dataIndex: 'location',
      key: 'location'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
      filters: [
        { text: '已排课', value: 'SCHEDULED' },
        { text: '已完成', value: 'COMPLETED' },
        { text: '已取消', value: 'CANCELLED' }
      ],
      onFilter: (value, record) => record.status === value
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small" split={<Divider type="vertical" />}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => showEditModal(record)}>
            编辑
          </Button>
          <Tag color={getStatusColor(record.status || 'SCHEDULED')}>
            {getStatusText(record.status || 'SCHEDULED')}
          </Tag>
          <Popconfirm
            title="确定要删除此课程安排吗?"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  // 创建冲突帮助内容组件
  const ConflictHelpContent = () => (
    <div style={{ maxWidth: 400 }}>
      <h3>排课冲突类型说明</h3>
      <Divider style={{ margin: '8px 0' }} />
      
      <p><strong>教师冲突 (TEACHER_CONFLICT):</strong></p>
      <ul>
        <li>教师在所选时间段内已有其他课程安排</li>
        <li>所选时间不在教师的可用时间范围内</li>
        <li><strong>解决方法:</strong> 在教师的可用时间内选择其他时段</li>
      </ul>
      
      <p><strong>学生冲突 (STUDENT_CONFLICT):</strong></p>
      <ul>
        <li>学生在所选时间段内已有其他课程安排</li>
        <li>所选时间不在学生的可用时间范围内</li>
        <li><strong>解决方法:</strong> 在学生的可用时间内选择其他时段</li>
      </ul>
      
      <p><strong>教室冲突 (LOCATION_CONFLICT):</strong></p>
      <ul>
        <li>所选教室在该时间段已被占用</li>
        <li><strong>解决方法:</strong> 选择其他教室或其他时段</li>
      </ul>
      
      <p><strong>可用性冲突 (AVAILABILITY_CONFLICT):</strong></p>
      <ul>
        <li>所选时间超出了教师或学生的可用时间设置</li>
        <li><strong>解决方法:</strong> 先在师生可用时间管理页面更新可用时间</li>
      </ul>
      
      <Divider style={{ margin: '8px 0' }} />
      <div><strong>提示:</strong> 使用系统的"获取推荐时间段"功能可以自动避免大多数冲突</div>
    </div>
  );

  return (
    <div className="schedule-management">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={2}>课程安排</Title>
        <div>
          <Button.Group style={{ marginRight: 16 }}>
            <Button
              type={viewMode === 'calendar' ? 'primary' : 'default'}
              icon={<CalendarOutlined />}
              onClick={() => setViewMode('calendar')}
            >
              日历视图
            </Button>
            <Button
              type={viewMode === 'list' ? 'primary' : 'default'}
              icon={<UnorderedListOutlined />}
              onClick={() => setViewMode('list')}
            >
              列表视图
            </Button>
          </Button.Group>
          <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>
            添加课程安排
          </Button>
        </div>
      </div>
      
      <Card bordered={false}>
        {/* 筛选区域 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={5}>
            <Select
              style={{ width: '100%' }}
              placeholder="选择学生"
              value={filters.studentId}
              onChange={(value) => handleFilterChange('studentId', value)}
            >
              <Option value="all">所有学生</Option>
              {students.map(student => (
                <Option key={student.id} value={student.id}>
                  {student.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={5}>
            <Select
              style={{ width: '100%' }}
              placeholder="选择教师"
              value={filters.teacherId}
              onChange={(value) => handleFilterChange('teacherId', value)}
            >
              <Option value="all">所有教师</Option>
              {teachers.map(teacher => (
                <Option key={teacher.id} value={teacher.id}>
                  {teacher.name} ({teacher.subject})
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={5}>
            <Select
              style={{ width: '100%' }}
              placeholder="选择课程"
              value={filters.courseId}
              onChange={(value) => handleFilterChange('courseId', value)}
            >
              <Option value="all">所有课程</Option>
              {courses.map(course => (
                <Option key={course.id} value={course.id}>
                  {course.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={5}>
            <Select
              style={{ width: '100%' }}
              placeholder="选择状态"
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
            >
              <Option value="all">所有状态</Option>
              <Option value="SCHEDULED">已排课</Option>
              <Option value="COMPLETED">已完成</Option>
              <Option value="CANCELLED">已取消</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Radio.Group 
              value={filters.timeRange}
              onChange={(e) => handleFilterChange('timeRange', e.target.value)}
              buttonStyle="solid"
            >
              <Radio.Button value="all">所有时间</Radio.Button>
              <Radio.Button value="next-week">下周</Radio.Button>
            </Radio.Group>
          </Col>
          <Col span={4}>
            <Popover 
              content={<ConflictHelpContent />}
              title="排课冲突帮助"
              trigger="click"
              placement="rightTop"
              overlayStyle={{ maxWidth: 500 }}
            >
              <Button 
                type="text" 
                icon={<QuestionCircleOutlined />}
                style={{ marginLeft: 8 }}
              >
                冲突帮助
              </Button>
            </Popover>
          </Col>
        </Row>
        
        {/* 提示下周日期范围 */}
        {filters.timeRange === 'next-week' && (
          <Alert
            message="下周排课时间"
            description={`当前显示 ${nextWeekDateRange[0].format('YYYY-MM-DD')} 至 ${nextWeekDateRange[1].format('YYYY-MM-DD')} 期间的课程安排`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        
        {/* 数据统计区域 */}
        <div style={{ marginBottom: 16 }}>
          {loading ? (
            <Alert message="正在加载数据..." type="info" showIcon />
          ) : filteredLessons.length > 0 ? (
            <Row gutter={16}>
              <Col>
                <Statistic title="总课程数" value={filteredLessons.length} />
              </Col>
              <Col>
                <Statistic 
                  title="已完成" 
                  value={filteredLessons.filter(lesson => lesson.status === 'COMPLETED').length} 
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col>
                <Statistic 
                  title="进行中" 
                  value={filteredLessons.filter(lesson => lesson.status === 'IN_PROGRESS').length}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col>
                <Statistic 
                  title="已取消" 
                  value={filteredLessons.filter(lesson => lesson.status === 'CANCELLED').length}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Col>
              <Col>
                <Tooltip title="点击查看常见排课冲突及解决方法">
                  <InfoCircleOutlined style={{ marginLeft: 8 }} />
                </Tooltip>
              </Col>
            </Row>
          ) : (
            <Empty description="没有符合条件的课程安排" />
          )}
        </div>
        
        {/* 视图内容 */}
        {viewMode === 'calendar' ? (
          <Calendar
            dateCellRender={dateCellRender}
            onSelect={showDailyLessons}
            loading={loading}
            value={calendarActiveDate}
            onPanelChange={(date) => setCalendarActiveDate(date)}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredLessons}
            rowKey="id"
            loading={loading}
            pagination={{
              defaultPageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
              showTotal: (total) => `共 ${total} 条记录`
            }}
          />
        )}
      </Card>
      
      {/* 每日课程抽屉 */}
      <Drawer
        title={selectedDate ? `${selectedDate.format('YYYY-MM-DD')} 课程安排` : '每日课程安排'}
        placement="right"
        onClose={handleDrawerClose}
        open={drawerVisible}
        width={600}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>
            添加
          </Button>
        }
      >
        {dailyLessons.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <ClockCircleOutlined style={{ fontSize: 48, color: '#ccc' }} />
            <p>当日暂无课程安排</p>
          </div>
        ) : (
          <Tabs type="card">
            {dailyLessons.map(lesson => (
              <TabPane
                tab={
                  <span>
                    {`${lesson.startTime}-${lesson.endTime}`}
                    <Tag 
                      color={getStatusColor(lesson.status)} 
                      style={{ marginLeft: 8 }}
                    >
                      {getStatusText(lesson.status)}
                    </Tag>
                  </span>
                }
                key={lesson.id}
              >
                <Descriptions bordered column={1}>
                  <Descriptions.Item label="学生">
                    <UserOutlined style={{ marginRight: 8 }} />{lesson.studentName}
                  </Descriptions.Item>
                  <Descriptions.Item label="教师">
                    <TeamOutlined style={{ marginRight: 8 }} />{lesson.teacherName}
                  </Descriptions.Item>
                  <Descriptions.Item label="课程">
                    <BookOutlined style={{ marginRight: 8 }} />{lesson.courseName}
                  </Descriptions.Item>
                  <Descriptions.Item label="时间">
                    {`${lesson.date} ${lesson.startTime}-${lesson.endTime}`}
                  </Descriptions.Item>
                  <Descriptions.Item label="地点">{lesson.location}</Descriptions.Item>
                  <Descriptions.Item label="备注">{lesson.notes || '无'}</Descriptions.Item>
                  <Descriptions.Item label="操作">
                    <Space>
                      <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => showEditModal(lesson)}>
                        编辑
                      </Button>
                      <Tag color={getStatusColor(lesson.status || 'SCHEDULED')}>
                        {getStatusText(lesson.status || 'SCHEDULED')}
                      </Tag>
                      <Popconfirm
                        title="确定要删除此课程安排吗?"
                        onConfirm={() => handleDelete(lesson.id)}
                        okText="确定"
                        cancelText="取消"
                      >
                        <Button type="primary" size="small" danger icon={<DeleteOutlined />}>
                          删除
                        </Button>
                      </Popconfirm>
                    </Space>
                  </Descriptions.Item>
                </Descriptions>
              </TabPane>
            ))}
          </Tabs>
        )}
      </Drawer>
      
      {/* 添加/编辑课程表单 */}
      <Modal
        title={currentLesson ? '编辑课程安排' : '添加课程安排'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        maskClosable={false}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          name="scheduleForm"
        >
          <Alert
            message="下周排课时间"
            description={`系统推荐在 ${nextWeekDateRange[0].format('YYYY-MM-DD')} 至 ${nextWeekDateRange[1].format('YYYY-MM-DD')} 期间安排课程`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="studentId"
                label="学生"
                rules={[{ required: true, message: '请选择学生' }]}
              >
                <Select placeholder="请选择学生">
                  {students.map(student => (
                    <Option key={student.id} value={student.id}>
                      {student.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="teacherId"
                label="教师"
                rules={[{ required: true, message: '请选择教师' }]}
              >
                <Select placeholder="请选择教师">
                  {teachers.map(teacher => (
                    <Option key={teacher.id} value={teacher.id}>
                      {teacher.name} ({teacher.subject})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="courseId"
                label="课程"
                rules={[{ required: true, message: '请选择课程' }]}
              >
                <Select placeholder="请选择课程">
                  {courses.map(course => (
                    <Option key={course.id} value={course.id}>
                      {course.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="location"
                label="上课地点"
                rules={[{ required: true, message: '请输入上课地点' }]}
              >
                <Input placeholder="请输入上课地点" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="date"
                label="上课日期"
                rules={[{ required: true, message: '请选择上课日期' }]}
                extra="推荐选择下周日期"
              >
                <DatePicker 
                  style={{ width: '100%' }} 
                  format="YYYY-MM-DD"
                  disabledDate={(current) => {
                    // 禁用过去的日期
                    if (current && current < dayjs().startOf('day')) {
                      return true;
                    }
                    return false;
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="timeRange"
                label="上课时间"
                rules={[{ required: true, message: '请选择上课时间' }]}
              >
                <TimePicker.RangePicker 
                  style={{ width: '100%' }} 
                  format="HH:mm"
                  minuteStep={15}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Suggestion Button and Display Area */}
          <Row gutter={16} style={{ marginBottom: '16px' }}>
            <Col span={24}>
                <Space>
                    <Button 
                        type="primary"
                        icon={<RobotOutlined />} 
                        loading={isSuggestionLoading}
                        onClick={() => {
                            // 获取表单数据
                            const studentId = form.getFieldValue('studentId');
                            const teacherId = form.getFieldValue('teacherId');
                            const courseId = form.getFieldValue('courseId');
                            
                            // 验证必要字段
                            if (!studentId || !teacherId || !courseId) {
                                message.warning('请先选择学生、教师和课程');
                                return;
                            }
                            
                            // 查找对应的选课记录
                            const enrollment = enrollments.find(e => 
                                String(e.studentId) === String(studentId) && 
                                String(e.teacherId) === String(teacherId) && 
                                String(e.courseId) === String(courseId)
                            );
                            
                            if (!enrollment) {
                                message.error('找不到匹配的选课记录，请确认学生已报名此课程');
                                return;
                            }
                            
                            // 使用AI排课API获取建议
                            setIsSuggestionLoading(true);
                            schedulingService.suggestLessonTimes(
                                studentId,
                                teacherId,
                                enrollment.id,
                                90 // 默认90分钟课程
                            ).then(suggestions => {
                                console.log("AI排课建议:", suggestions);
                                setSuggestedSlots(suggestions || []);
                                if(suggestions && suggestions.length > 0) {
                                    message.success(`AI成功推荐了${suggestions.length}个最佳上课时间`);
                                } else {
                                    message.info('未找到合适的时间，请手动选择或调整条件');
                                }
                            }).catch(error => {
                                console.error("获取AI排课建议失败:", error);
                                message.error("AI排课失败: " + (error.message || '请稍后重试'));
                                
                                // 如果AI排课失败，尝试使用测试数据
                                schedulingService.getTestSuggestions(
                                    studentId,
                                    teacherId,
                                    courseId,
                                    enrollment.id
                                ).then(testData => {
                                    console.log("使用测试数据:", testData);
                                    setSuggestedSlots(testData || []);
                                    if(testData && testData.length > 0) {
                                        message.success(`获取到${testData.length}个备选时间建议`);
                                    }
                                }).catch(err => {
                                    console.error("获取测试数据也失败:", err);
                                });
                            }).finally(() => {
                                setIsSuggestionLoading(false);
                            });
                        }}
                    >
                        AI智能排课
                    </Button>
                    <Button 
                        icon={<ExperimentOutlined />} 
                        onClick={() => {
                            // 使用测试API端点获取测试数据
                            setIsSuggestionLoading(true);
                            schedulingService.getTestSuggestions(
                                form.getFieldValue('studentId'),
                                form.getFieldValue('teacherId'),
                                form.getFieldValue('courseId')
                            ).then(testData => {
                                console.log("接收到测试建议:", testData);
                                setSuggestedSlots(testData || []);
                                if(testData && testData.length > 0) {
                                    message.success(`获取到${testData.length}个测试时间建议`);
                                }
                            }).catch(error => {
                                console.error("获取测试建议失败:", error);
                                message.error("获取测试建议失败");
                            }).finally(() => {
                                setIsSuggestionLoading(false);
                            });
                        }}
                    >
                        使用测试数据
                    </Button>
                </Space>
            </Col>
          </Row>

          {/* 建议时间显示区域 */}
          {isSuggestionLoading ? (
              <div style={{ textAlign: 'center', padding: '20px 0', marginBottom: '16px', background: '#f5f5f5', borderRadius: '4px' }}>
                  <div>正在生成排课建议...</div>
              </div>
          ) : suggestedSlots && suggestedSlots.length > 0 ? (
              <Card size="small" title="AI推荐时间段" style={{ marginBottom: '16px' }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                      {suggestedSlots.map((slot, index) => (
                           <Button 
                              key={index} 
                              type={index === 0 ? "primary" : "dashed"}
                              block
                              onClick={() => {
                                form.setFieldsValue({
                                    date: dayjs(slot.startDateTime || slot.startTime),
                                    timeRange: [dayjs(slot.startDateTime || slot.startTime), dayjs(slot.endDateTime || slot.endTime)]
                                });
                                message.success(`已应用推荐时间: ${dayjs(slot.startDateTime || slot.startTime).format('YYYY-MM-DD HH:mm')} - ${dayjs(slot.endDateTime || slot.endTime).format('HH:mm')}`);
                                // 保留推荐，但高亮已选择的
                              }}
                           >
                               {dayjs(slot.startDateTime || slot.startTime).format('YYYY-MM-DD HH:mm')} - {dayjs(slot.endDateTime || slot.endTime).format('HH:mm')}
                               {slot.notes && <div style={{ fontSize: '12px', color: '#666' }}>{slot.notes}</div>}
                               {slot.matchScore && <div style={{ fontSize: '12px', color: '#1890ff' }}>匹配度: {Math.round(slot.matchScore * 100)}%</div>}
                               {index === 0 && <Tag color="green" style={{ marginLeft: 8 }}>最佳推荐</Tag>}
                           </Button>
                      ))}
                  </Space>
              </Card>
          ) : (
              <div style={{ textAlign: 'center', padding: '10px', marginBottom: '16px', background: '#f5f5f5', borderRadius: '4px' }}>
                  <span>点击"AI智能排课"获取最佳时间建议</span>
              </div>
          )}
          
          {currentLesson && (
            <Form.Item
              name="status"
              label="课程状态"
              rules={[{ required: true, message: '请选择课程状态' }]}
            >
              <Select>
                <Option value="SCHEDULED">已排课</Option>
                <Option value="COMPLETED">已完成</Option>
                <Option value="CANCELLED_BY_TEACHER">教师取消</Option>
                <Option value="CANCELLED_BY_STUDENT">学生取消</Option>
                <Option value="NO_SHOW">学生未到</Option>
              </Select>
            </Form.Item>
          )}
          
          <Form.Item
            name="notes"
            label="备注"
          >
            <TextArea rows={4} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default SchedulePage 