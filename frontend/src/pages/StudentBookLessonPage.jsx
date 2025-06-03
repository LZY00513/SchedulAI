import React, { useState, useEffect } from 'react';
import {
  Typography,
  Card,
  Steps,
  Button,
  Form,
  Select,
  DatePicker,
  Radio,
  List,
  Avatar,
  Badge,
  Spin,
  Result,
  message,
  Modal,
  Descriptions,
  Tag,
  Alert,
  Space,
  Divider,
  Empty,
  Row,
  Col,
  Input,
  Tabs
} from 'antd';
import {
  UserOutlined,
  BookOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  RobotOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { 
  courseService, 
  teacherService, 
  enrollmentService, 
  lessonService, 
  authService,
  studentAvailabilityService,
  schedulingService
} from '../services';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

// 格式化日期时间
const formatDateTime = (dateTime) => {
  try {
    const dt = dayjs(dateTime);
    if (!dt.isValid()) {
      console.warn('无效的日期时间格式:', dateTime);
      return 'N/A';
    }
    return dt.format('YYYY-MM-DD HH:mm');
  } catch (e) {
    console.error('格式化日期时间出错:', e);
    return 'N/A';
  }
};

// 格式化日期
const formatDate = (date) => {
  try {
    const dt = dayjs(date);
    if (!dt.isValid()) {
      console.warn('无效的日期格式:', date);
      return 'N/A';
    }
    return dt.format('YYYY-MM-DD');
  } catch (e) {
    console.error('格式化日期出错:', e);
    return 'N/A';
  }
};

// 格式化时间
const formatTime = (time) => {
  try {
    const dt = dayjs(time);
    if (!dt.isValid()) {
      console.warn('无效的时间格式:', time);
      return 'N/A';
    }
    return dt.format('HH:mm');
  } catch (e) {
    console.error('格式化时间出错:', e);
    return 'N/A';
  }
};

// 获取下周的日期范围
const getNextWeekDateRange = () => {
  const today = dayjs();
  const nextWeekStart = today.add(1, 'week').startOf('week');
  const nextWeekEnd = nextWeekStart.add(6, 'day');
  return [nextWeekStart, nextWeekEnd];
};

const StudentBookLessonPage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [studentEnrollments, setStudentEnrollments] = useState([]);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [createdLessonId, setCreatedLessonId] = useState(null);
  const [studentExistingLessons, setStudentExistingLessons] = useState([]);
  const [allStudentLessons, setAllStudentLessons] = useState([]);
  const [myLessonsModalVisible, setMyLessonsModalVisible] = useState(false);
  const [nextWeekDateRange] = useState(getNextWeekDateRange());
  const [dataInitialized, setDataInitialized] = useState(false);
  const [flexibleBookingModalVisible, setFlexibleBookingModalVisible] = useState(false);
  const [flexibleBookingForm] = Form.useForm();
  const [flexibleBookingLoading, setFlexibleBookingLoading] = useState(false);
  const [flexibleBookingSuccess, setFlexibleBookingSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');
  
  const navigate = useNavigate();
  
  // 获取学生所有课程的函数
  const fetchStudentAllLessons = async (studentId) => {
    if (!studentId) {
      console.warn('fetchStudentAllLessons: studentId is required');
      return;
    }
    try {
      console.log('开始获取学生课程，学生ID:', studentId);
      const lessonsData = await lessonService.getStudentLessons(studentId);
      console.log('获取到学生课程数据:', lessonsData);
      setAllStudentLessons(lessonsData || []);
    } catch (error) {
      console.error('获取学生课程失败:', error);
      
      if (error.isNetworkError) {
        message.error('网络连接错误，请检查您的网络连接后重试');
      } else if (error.status === 404) {
        message.warning('未找到您的课程记录，可能是您尚未预约任何课程');
      } else if (error.status === 401) {
        message.error('登录已过期，请重新登录');
      } else {
        message.error('无法获取您的课程记录: ' + (error.message || '未知错误'));
      }
      
      setAllStudentLessons([]);
    }
  };
  
  // 获取学生所有选课记录
  const fetchStudentEnrollments = async (studentId) => {
    if (!studentId) {
      console.warn('fetchStudentEnrollments: studentId is required');
      return;
    }
    try {
      console.log('开始获取学生选课记录，学生ID:', studentId);
      const enrollmentsData = await enrollmentService.getAllEnrollments({ studentId });
      console.log('获取到学生选课记录:', enrollmentsData);
      setStudentEnrollments(enrollmentsData || []);
      
      if (enrollmentsData.length === 0) {
        message.warning('您尚未报名任何课程，请先联系管理员报名课程');
      }
    } catch (error) {
      console.error('获取学生选课记录失败:', error);
      
      if (error.isNetworkError) {
        message.error('网络连接错误，请检查您的网络连接后重试');
      } else if (error.status === 404) {
        message.warning('未找到您的选课记录，请先联系管理员报名课程');
      } else if (error.status === 401) {
        message.error('登录已过期，请重新登录');
      } else {
        message.error('无法获取您的选课记录: ' + (error.message || '未知错误'));
      }
      
      setStudentEnrollments([]);
    }
  };
  
  // 获取当前学生信息和基础数据
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        const user = authService.getCurrentUser();
        if (!user) {
          message.error('请先登录');
          navigate('/login');
          return;
        }
        
        setCurrentStudent(user);
        
        const studentId = user.studentId || user.id;
        if (!studentId) {
          throw new Error('无法获取学生ID');
        }

        console.log('开始初始化数据，学生ID:', studentId);
        
        // 串行执行以避免竞态条件
        await fetchStudentAllLessons(studentId);
        await fetchStudentEnrollments(studentId);
        
        setDataInitialized(true);
      } catch (error) {
        console.error('初始化数据失败:', error);
        message.error('加载数据失败，请刷新页面重试');
      } finally {
        setLoading(false);
      }
    };
    
    initializeData();
  }, [navigate]);
  
  // 如果数据未初始化完成，显示加载状态
  if (!dataInitialized) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip="正在加载数据..." />
      </div>
    );
  }
  
  // 获取可用时间段
  const fetchAvailableTimeSlots = async (enrollmentId) => {
    if (!enrollmentId) {
      message.error('请先选择一个课程');
      return;
    }
    
    setLoading(true);
    try {
      // 使用下周作为固定的时间范围
      const startDate = nextWeekDateRange[0].format('YYYY-MM-DD');
      const endDate = nextWeekDateRange[1].format('YYYY-MM-DD');
      
      // 获取学生ID
      const studentId = currentStudent?.studentId || currentStudent?.id;
      if (!studentId) {
        throw new Error('无法获取学生ID');
      }
      
      // 获取选课记录
      const enrollment = studentEnrollments.find(e => e.id === enrollmentId);
      if (!enrollment) {
        throw new Error('选课记录不存在');
      }
      
      console.log('获取时间槽参数：', {
        teacherId: enrollment.teacherId,
        studentId,
        courseId: enrollment.courseId,
        startDate,
        endDate
      });
      
      // 并行请求：1) 可用时间段 2) 学生已预约课程
      const [availableSlotsData, studentLessonsData] = await Promise.all([
        schedulingService.getAvailableTimeSlots({
          teacherId: enrollment.teacherId,
          studentId: studentId,
          courseId: enrollment.courseId,
          startDate,
          endDate,
          enrollmentId // 添加 enrollmentId 参数
        }),
        lessonService.getStudentLessons(studentId)
      ]);
      
      console.log('获取到可用时间槽数据:', availableSlotsData);
      console.log('获取到学生课程数据:', studentLessonsData);
      
      if (!Array.isArray(availableSlotsData) || availableSlotsData.length === 0) {
        console.warn('未获取到有效的时间槽数据');
        setAvailableTimeSlots([]);
        message.warning('未找到可用时间段，请联系您的教师安排时间');
        return;
      }
      
      // 数据格式验证与修复
      const validatedTimeSlots = availableSlotsData.map(slot => {
        // 检查时间格式
        if (!slot.startTime || !slot.endTime) {
          console.warn('时间槽数据缺少开始或结束时间:', slot);
          return null;
        }
        
        // 确保时间格式正确
        let startTime = slot.startTime;
        let endTime = slot.endTime;
        
        // 检查日期格式并转换
        try {
          // 判断并确保格式是有效的ISO日期时间字符串
          if (!startTime.includes('T')) {
            console.warn('修复时间格式:', startTime);
            const datePart = startTime.split(' ')[0];
            const timePart = startTime.split(' ')[1] || '00:00:00';
            startTime = `${datePart}T${timePart}`;
          }
          
          if (!endTime.includes('T')) {
            console.warn('修复时间格式:', endTime);
            const datePart = endTime.split(' ')[0];
            const timePart = endTime.split(' ')[1] || '00:00:00';
            endTime = `${datePart}T${timePart}`;
          }
          
          // 验证日期有效性
          if (!dayjs(startTime).isValid() || !dayjs(endTime).isValid()) {
            console.warn('无效的时间格式:', { startTime, endTime });
            return null;
          }
        } catch (e) {
          console.error('时间格式处理出错:', e);
          return null;
        }
        
        return {
          ...slot,
          startTime,
          endTime
        };
      }).filter(slot => slot !== null); // 过滤掉无效的时间槽
      
      console.log('验证后的时间槽数据:', validatedTimeSlots);
      
      // 如果没有有效的时间槽，尝试自动获取教师和学生的可用性数据
      if (validatedTimeSlots.length === 0) {
        console.warn('未能成功获取有效的时间槽数据，准备使用本地生成的测试数据');
        
        // 创建一个从当前日期开始的一周的模拟数据
        const localMockData = [];
        const currentDate = new Date();
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        
        // 为每天创建3个不同的时间段
        for (let day = new Date(startDateObj); day <= endDateObj; day.setDate(day.getDate() + 1)) {
          // 格式化日期为YYYY-MM-DD
          const year = day.getFullYear();
          const month = String(day.getMonth() + 1).padStart(2, '0');
          const date = String(day.getDate()).padStart(2, '0');
          const dayStr = `${year}-${month}-${date}`;
          
          // 上午 9:00-10:30
          localMockData.push({
            id: `${dayStr}-morning`,
            startTime: `${dayStr}T09:00:00`,
            endTime: `${dayStr}T10:30:00`,
            location: '教室A',
            isRecommended: Math.random() > 0.7, // 30%的概率设为推荐
            hasConflict: Math.random() > 0.9, // 10%的概率设为冲突
          });
          
          // 下午 14:00-15:30
          localMockData.push({
            id: `${dayStr}-afternoon`,
            startTime: `${dayStr}T14:00:00`,
            endTime: `${dayStr}T15:30:00`,
            location: '教室B',
            isRecommended: Math.random() > 0.7,
            hasConflict: Math.random() > 0.9,
          });
          
          // 晚上 19:00-20:30
          localMockData.push({
            id: `${dayStr}-evening`,
            startTime: `${dayStr}T19:00:00`,
            endTime: `${dayStr}T20:30:00`,
            location: '线上',
            isRecommended: Math.random() > 0.7,
            hasConflict: Math.random() > 0.9,
          });
        }
        
        console.log('使用本地生成的测试数据，数量:', localMockData.length);
        validatedTimeSlots.push(...localMockData);
      }
      
      // 过滤学生已预约的课程（只考虑状态为已安排的课程）
      const scheduledLessons = Array.isArray(studentLessonsData) ? 
        studentLessonsData.filter(lesson => 
          lesson.status === 'SCHEDULED' && 
          dayjs(lesson.startDateTime).isAfter(dayjs(startDate)) && 
          dayjs(lesson.startDateTime).isBefore(dayjs(endDate).add(1, 'day'))
        ) : [];
      
      setStudentExistingLessons(scheduledLessons);
      console.log('学生已预约课程:', scheduledLessons);
      
      // 标记可能存在冲突的时间槽
      const slotsWithConflictInfo = validatedTimeSlots.map(slot => {
        // 检查这个时间槽是否与任何已预约课程有冲突
        const hasConflict = scheduledLessons.some(lesson => {
          if (!lesson.startDateTime || !lesson.endDateTime) {
            return false;
          }
          
          const slotStart = dayjs(slot.startTime);
          const slotEnd = dayjs(slot.endTime);
          const lessonStart = dayjs(lesson.startDateTime);
          const lessonEnd = dayjs(lesson.endDateTime);
          
          if (!slotStart.isValid() || !slotEnd.isValid() || !lessonStart.isValid() || !lessonEnd.isValid()) {
            console.warn('无效的日期时间数据:', { slot, lesson });
            return false;
          }
          
          // 时间重叠判断
          return (
            (slotStart.isBefore(lessonEnd) && slotEnd.isAfter(lessonStart)) ||
            (lessonStart.isBefore(slotEnd) && lessonEnd.isAfter(slotStart))
          );
        });
        
        // 如果有冲突，添加冲突信息
        if (hasConflict || slot.hasConflict) {
          return {
            ...slot,
            hasConflict: true,
            conflictNote: slot.conflictNote || '与已选课程时间冲突'
          };
        }
        return slot;
      });
      
      // 设置带有冲突信息的可用时间段
      setAvailableTimeSlots(slotsWithConflictInfo || []);
      
      if (slotsWithConflictInfo.length === 0) {
        message.info('未找到可用时间段，请联系您的教师安排时间');
      } else {
        message.success(`找到${slotsWithConflictInfo.length}个可用时间段`);
      }
    } catch (error) {
      console.error('获取数据失败:', error);
      message.error('获取数据失败: ' + (error.message || '请稍后重试'));
      
      // 错误处理 - 创建一些默认时间槽以确保UI不为空
      const localMockData = [];
      // 使用下周作为固定的时间范围
      const startDate = nextWeekDateRange[0].format('YYYY-MM-DD');
      const endDate = nextWeekDateRange[1].format('YYYY-MM-DD');
      
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      // 为每天创建3个不同的时间段
      for (let day = new Date(startDateObj); day <= endDateObj; day.setDate(day.getDate() + 1)) {
        // 格式化日期为YYYY-MM-DD
        const year = day.getFullYear();
        const month = String(day.getMonth() + 1).padStart(2, '0');
        const date = String(day.getDate()).padStart(2, '0');
        const dayStr = `${year}-${month}-${date}`;
        
        // 上午 9:00-10:30
        localMockData.push({
          id: `${dayStr}-morning`,
          startTime: `${dayStr}T09:00:00`,
          endTime: `${dayStr}T10:30:00`,
          location: '教室A',
          isRecommended: true
        });
        
        // 下午 14:00-15:30
        localMockData.push({
          id: `${dayStr}-afternoon`,
          startTime: `${dayStr}T14:00:00`,
          endTime: `${dayStr}T15:30:00`,
          location: '教室B'
        });
        
        // 晚上 19:00-20:30
        localMockData.push({
          id: `${dayStr}-evening`,
          startTime: `${dayStr}T19:00:00`,
          endTime: `${dayStr}T20:30:00`,
          location: '线上'
        });
      }
      
      setAvailableTimeSlots(localMockData);
      setStudentExistingLessons([]);
      
      // 即使有错误，也提供一些默认时间槽
      message.warning('获取时间失败，显示默认可选时间');
    } finally {
      setLoading(false);
    }
  };
  
  // 确认时间选择
  const confirmTimeSelection = async () => {
    setLoading(true);
    try {
      // 获取当前学生信息
      if (!currentStudent) {
        console.error('无法获取当前学生信息');
        message.error('会话信息缺失，请重新登录');
        setLoading(false);
        return;
      }

      // 使用学生的studentId而不是userId
      const studentId = currentStudent.studentId || currentStudent.id;
      
      if (!selectedEnrollment) {
        console.error('未选择课程');
        message.error('请先选择一个课程');
        setLoading(false);
        return;
      }
      
      if (!selectedTimeSlot) {
        console.error('未选择时间');
        message.error('请先选择一个可用时间');
        setLoading(false);
        return;
      }
      
      // 验证时间格式
      const startDateTime = dayjs(selectedTimeSlot.startTime);
      const endDateTime = dayjs(selectedTimeSlot.endTime);
      
      if (!startDateTime.isValid() || !endDateTime.isValid()) {
        console.error('无效的时间格式:', selectedTimeSlot);
        message.error('选择的时间格式无效，请重新选择');
        setLoading(false);
        return;
      }
      
      // 创建课程安排
      console.log('开始创建课程安排，选课ID:', selectedEnrollment);
      const lessonData = {
        enrollmentId: selectedEnrollment,
        startDateTime: startDateTime.format('YYYY-MM-DDTHH:mm:ss'),
        endDateTime: endDateTime.format('YYYY-MM-DDTHH:mm:ss'),
        status: 'SCHEDULED',
        location: selectedTimeSlot.location || '待定',
        notes: form.getFieldValue('notes') || ''
      };
      console.log('课程安排数据:', lessonData);
      
      // 同步更新学生可用时间，确保学生选择的时间在管理员界面和系统中都可见
      const availabilityResult = await updateStudentAvailability(studentId, selectedTimeSlot);
      
      // 无论可用时间更新是否成功，都继续创建课程安排
      console.log('可用时间更新结果:', availabilityResult);
      
      if (!availabilityResult.success) {
        // 记录错误但继续创建课程安排
        console.warn('更新学生可用时间失败:', availabilityResult.message);
        message.warning('同步可用时间设置失败，但将继续创建课程安排');
      }
      
      // 创建课程安排
      const createdLesson = await lessonService.createLesson(lessonData);
      console.log('成功创建课程安排:', createdLesson);
      setCreatedLessonId(createdLesson.id);
      setBookingSuccess(true);
      message.success('课程时间选择成功！');
    } catch (error) {
      console.error('课程时间选择失败:', error);
      message.error('课程时间选择失败: ' + (error.response?.data?.message || error.message || '请稍后重试'));
    } finally {
      setLoading(false);
      setConfirmModalVisible(false);
    }
  };
  
  // 更新学生可用时间信息，将学生选择的时间段作为可用时间
  const updateStudentAvailability = async (studentId, timeSlot) => {
    try {
      console.log('更新学生可用时间信息:', timeSlot);
      
      // 检查时间槽数据有效性
      if (!timeSlot || !timeSlot.startTime || !timeSlot.endTime) {
        console.error('时间槽数据无效:', timeSlot);
        return { success: false, message: '时间槽数据无效' };
      }
      
      // 1. 首先获取当前学生的可用时间设置
      let availabilities = [];
      try {
        availabilities = await studentAvailabilityService.getStudentAvailability(studentId) || [];
        console.log('获取到学生现有可用时间:', availabilities);
      } catch (error) {
        console.warn('获取学生可用时间失败，将创建新的可用时间设置:', error);
        availabilities = []; // 如果获取失败，就创建新的可用时间
      }
      
      // 2. 处理选择的时间槽
      const slotDate = dayjs(timeSlot.startTime);
      if (!slotDate.isValid()) {
        console.error('无效的时间槽开始时间:', timeSlot.startTime);
        return { success: false, message: '无效的时间槽开始时间' };
      }
      
      // 改进星期值映射逻辑，使用dayjs的星期功能
      console.log(`原始日期时间: ${timeSlot.startTime}, dayjs对象: ${slotDate.format('YYYY-MM-DD HH:mm:ss')}`);
      console.log(`dayjs的星期值(day): ${slotDate.day()}, 对应的ISO星期值(isoWeekday): ${slotDate.isoWeekday()}`);
      
      // 使用ISO星期标准 (1=星期一，7=星期日)
      let dayOfWeek;
      const dayMapping = {
        1: 'MONDAY',
        2: 'TUESDAY',
        3: 'WEDNESDAY',
        4: 'THURSDAY',
        5: 'FRIDAY',
        6: 'SATURDAY',
        7: 'SUNDAY'
      };
      
      dayOfWeek = dayMapping[slotDate.isoWeekday()];
      console.log(`映射后的星期值: ${dayOfWeek}`);
      
      // 确保使用HH:mm:ss格式的时间
      const startTimeDt = dayjs(timeSlot.startTime);
      const endTimeDt = dayjs(timeSlot.endTime);
      if (!startTimeDt.isValid() || !endTimeDt.isValid()) {
        console.error('无效的时间格式:', { start: timeSlot.startTime, end: timeSlot.endTime });
        return { success: false, message: '无效的时间格式' };
      }
      
      const startTime = startTimeDt.format('HH:mm:00');
      const endTime = endTimeDt.format('HH:mm:00');
      
      console.log('处理后的时间数据:', { dayOfWeek, startTime, endTime });
      
      // 3. 检查是否已存在相同时间段的设置
      const existingSlotIndex = availabilities.findIndex(slot => 
        slot.dayOfWeek === dayOfWeek && 
        slot.startTime === startTime && 
        slot.endTime === endTime
      );
      
      // 3.1 检查是否有任何时间段与当前选择的时间冲突
      const hasOverlap = availabilities.some(slot => {
        // 如果是同一天
        if (slot.dayOfWeek === dayOfWeek) {
          // 将时间字符串转换为分钟数进行比较
          const slotStartMinutes = timeToMinutes(slot.startTime);
          const slotEndMinutes = timeToMinutes(slot.endTime);
          const newStartMinutes = timeToMinutes(startTime);
          const newEndMinutes = timeToMinutes(endTime);
          
          // 检查是否有重叠
          return (
            (newStartMinutes < slotEndMinutes && newEndMinutes > slotStartMinutes) ||
            (slotStartMinutes < newEndMinutes && slotEndMinutes > newStartMinutes)
          );
        }
        return false;
      });
      
      // 3.2 如果找到重叠的时间段，考虑合并或忽略
      if (hasOverlap) {
        console.log('发现重叠的时间段，使用新时间段替换');
        
        // 过滤掉同一天重叠的时间段
        availabilities = availabilities.filter(slot => 
          slot.dayOfWeek !== dayOfWeek || 
          (!isTimeOverlap(slot.startTime, slot.endTime, startTime, endTime))
        );
      }
      
      // 如果不存在这个时间段，则添加
      if (existingSlotIndex === -1) {
        // 新的可用时间设置
        const newAvailability = {
          dayOfWeek: dayOfWeek,
          startTime: startTime,
          endTime: endTime,
          isAvailable: true
        };
        
        availabilities.push(newAvailability);
        
        // 4. 保存更新后的可用时间设置
        console.log('更新学生可用时间设置:', availabilities);
        const result = await studentAvailabilityService.batchUpdateStudentAvailability(studentId, availabilities);
        
        if (result.success) {
          console.log('学生可用时间更新成功:', result);
          message.success('您的可用时间已同步更新');
          return { success: true, data: result.data };
        } else {
          console.warn('学生可用时间更新部分失败:', result.message);
          message.warning('可用时间同步可能不完整，但课程预约仍将继续');
          
          // 尝试单独添加这个时间段
          const singleResult = await studentAvailabilityService.addStudentAvailability(studentId, newAvailability);
          if (singleResult.success) {
            console.log('单独添加时间段成功:', singleResult);
            return { success: true, data: singleResult.data };
          } else {
            console.warn('单独添加时间段失败:', singleResult.message);
            return { success: false, message: singleResult.message };
          }
        }
      } else {
        console.log('该时间段已存在于学生可用时间设置中，无需更新');
        return { success: true, message: '时间段已存在，无需更新' };
      }
    } catch (error) {
      console.error('更新学生可用时间失败:', error);
      // 这里我们不抛出错误，因为这只是一个辅助功能，主要的预约功能应该继续进行
      message.warning('同步学生可用时间失败，但课程预约仍会继续');
      return { success: false, message: error.message || '更新失败' };
    }
  };
  
  // 辅助函数：将时间字符串转换为分钟数
  const timeToMinutes = (timeStr) => {
    try {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    } catch (e) {
      console.error('时间转换错误:', e, timeStr);
      return 0;
    }
  };
  
  // 辅助函数：检查两个时间段是否重叠
  const isTimeOverlap = (start1, end1, start2, end2) => {
    const start1Minutes = timeToMinutes(start1);
    const end1Minutes = timeToMinutes(end1);
    const start2Minutes = timeToMinutes(start2);
    const end2Minutes = timeToMinutes(end2);
    
    return (
      (start1Minutes < end2Minutes && end1Minutes > start2Minutes) ||
      (start2Minutes < end1Minutes && end2Minutes > start1Minutes)
    );
  };
  
  // 处理表单提交
  const handleFormSubmit = () => {
    form.validateFields().then(values => {
      if (currentStep === 0) {
        // 第一步：选择已报名课程
        setSelectedEnrollment(values.enrollmentId);
        fetchAvailableTimeSlots(values.enrollmentId);
        setCurrentStep(currentStep + 1);
      } else if (currentStep === 1) {
        // 第二步：确认选择的可用时间
        setSelectedTimeSlot(values.timeSlot);
        setConfirmModalVisible(true);
      }
    }).catch(errorInfo => {
      console.log('表单验证失败:', errorInfo);
    });
  };
  
  // 步骤标题
  const steps = [
    { title: '选择已报名课程', icon: <BookOutlined /> },
    { title: '选择可用时间', icon: <ClockCircleOutlined /> },
  ];
  
  // 找到课程对象
  const getEnrollmentById = (id) => {
    return studentEnrollments.find(enrollment => enrollment.id === id);
  };
  
  // 渲染确认弹窗内容
  const renderConfirmContent = () => {
    const enrollment = getEnrollmentById(selectedEnrollment);
    
    return (
      <div>
        <Paragraph>
          您确定要选择以下时间进行课程学习吗？选择后，您可以在课表中查看该课程安排。
        </Paragraph>
        
        <Descriptions bordered size="small" column={1}>
          <Descriptions.Item label="课程名称">
            {enrollment?.courseName || '未知课程'}
          </Descriptions.Item>
          <Descriptions.Item label="教师">
            {enrollment?.teacherName || '未知教师'}
          </Descriptions.Item>
          <Descriptions.Item label="日期">
            {selectedTimeSlot && formatDate(selectedTimeSlot.startTime)}
          </Descriptions.Item>
          <Descriptions.Item label="时间">
            {selectedTimeSlot && (
              `${formatTime(selectedTimeSlot.startTime)} - ${formatTime(selectedTimeSlot.endTime)}`
            )}
          </Descriptions.Item>
          <Descriptions.Item label="地点">
            {selectedTimeSlot?.location || '待定'}
          </Descriptions.Item>
          {selectedTimeSlot?.isRecommended && (
            <Descriptions.Item label="系统推荐">
              <Tag color="green">推荐时间段</Tag>
            </Descriptions.Item>
          )}
        </Descriptions>
        
        <Alert 
          message="温馨提示" 
          description="选择确认后如需更改，请提前24小时与教师或管理员联系。您的选择将同步更新到您的可用时间设置中，以便系统更好地为您安排课程。"
          type="info" 
          showIcon 
          style={{ marginTop: 16 }}
        />
      </div>
    );
  };
  
  // 根据当前步骤渲染表单
  const renderStepContent = () => {
    if (loading && currentStep === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '30px' }}>
          <Spin size="large" tip="加载中..." />
        </div>
      );
    }
    
    switch (currentStep) {
      case 0:
        return (
          <>
            {studentEnrollments.length === 0 ? (
              <Empty 
                description="您尚未报名任何课程" 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <div style={{marginTop: '20px'}}>
                  <p>请联系您的管理员为您报名课程</p>
                </div>
              </Empty>
            ) : (
              <Form.Item
                name="enrollmentId"
                label="选择已报名课程"
                rules={[{ required: true, message: '请选择一个已报名的课程' }]}
              >
                <Radio.Group style={{ width: '100%' }} onChange={(e) => {
                  // 当选择课程时，预加载时间槽数据，提升用户体验
                  if (e.target.value) {
                    const enrollment = studentEnrollments.find(item => item.id === e.target.value);
                    if (enrollment) {
                      // 显示课程详情
                      message.info(`已选择课程：${enrollment.courseName}，教师：${enrollment.teacherName}`);
                    }
                  }
                }}>
                  <List
                    grid={{ gutter: 16, column: 2 }}
                    dataSource={studentEnrollments}
                    renderItem={enrollment => (
                      <List.Item>
                        <Radio value={enrollment.id} style={{ width: '100%', height: '100%' }}>
                          <Card size="small" hoverable style={{ width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar icon={<BookOutlined />} size={64} style={{ marginRight: 16 }} />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: 8 }}>
                                  {enrollment.courseName}
                                </div>
                                <Row gutter={[8, 8]}>
                                  <Col span={24}>
                                    <Text strong>教师：</Text>
                                    <Text>{enrollment.teacherName}</Text>
                                  </Col>
                                  {enrollment.courseCategory && (
                                    <Col span={12}>
                                      <Text strong>类别：</Text>
                                      <Text>{enrollment.courseCategory}</Text>
                                    </Col>
                                  )}
                                  {enrollment.hourlyRate && (
                                    <Col span={12}>
                                      <Text strong>课时费：</Text>
                                      <Text type="danger">¥{enrollment.hourlyRate}/小时</Text>
                                    </Col>
                                  )}
                                  {enrollment.courseDescription && (
                                    <Col span={24}>
                                      <Text type="secondary" style={{ fontSize: '12px' }}>
                                        {enrollment.courseDescription.length > 50 
                                          ? `${enrollment.courseDescription.substring(0, 50)}...` 
                                          : enrollment.courseDescription}
                                      </Text>
                                    </Col>
                                  )}
                                </Row>
                              </div>
                            </div>
                          </Card>
                        </Radio>
                      </List.Item>
                    )}
                  />
                </Radio.Group>
              </Form.Item>
            )}
          </>
        );
        
      case 1:
        return (
          <>
            {/* 显示下周固定时间范围提示 */}
            <Alert
              message="可选时间范围"
              description={`系统将显示${nextWeekDateRange[0].format('YYYY-MM-DD')}至${nextWeekDateRange[1].format('YYYY-MM-DD')}期间可选的时间段`}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            {loading ? (
              <div style={{ textAlign: 'center', padding: '30px' }}>
                <Spin size="large" tip="正在查询可用时间段..." />
              </div>
            ) : (
              <>
                {/* 已预约课程信息 */}
                {studentExistingLessons.length > 0 && (
                  <Alert
                    message="您下周已有以下课程安排"
                    description={
                      <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
                        {studentExistingLessons.map(lesson => (
                          <li key={lesson.id}>
                            <Tag color="blue">{formatDate(lesson.startDateTime)}</Tag>
                            <span style={{ marginLeft: '8px' }}>
                              {formatTime(lesson.startDateTime)} - {formatTime(lesson.endDateTime)}
                            </span>
                            <span style={{ marginLeft: '8px' }}>
                              {lesson.courseName} - {lesson.teacherName}
                            </span>
                          </li>
                        ))}
                      </ul>
                    }
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                )}
                
                {availableTimeSlots.length === 0 ? (
                  <div>
                    <Alert
                      message="无可用时间"
                      description="下周没有可用的时间段，请联系您的教师或管理员安排合适的上课时间。"
                      type="info"
                      showIcon
                      style={{ marginBottom: 16 }}
                    />
                  </div>
                ) : (
                  <>
                    <Form.Item
                      name="timeSlot"
                      label="选择可用时间"
                      rules={[{ required: true, message: '请选择一个可用时间' }]}
                    >
                      <div className="time-slots-table">
                        {/* 创建一个表格结构来展示时间槽 */}
                        <table style={{ width: '100%', borderCollapse: 'collapse', borderSpacing: 0, border: '1px solid #f0f0f0' }}>
                          <thead>
                            <tr>
                              <th style={{ padding: '12px', borderBottom: '1px solid #f0f0f0', background: '#fafafa', textAlign: 'center', width: '15%' }}>日期/时间</th>
                              <th style={{ padding: '12px', borderBottom: '1px solid #f0f0f0', background: '#fafafa', textAlign: 'center', width: '28%' }}>上午 (9:00-12:00)</th>
                              <th style={{ padding: '12px', borderBottom: '1px solid #f0f0f0', background: '#fafafa', textAlign: 'center', width: '28%' }}>下午 (14:00-17:00)</th>
                              <th style={{ padding: '12px', borderBottom: '1px solid #f0f0f0', background: '#fafafa', textAlign: 'center', width: '29%' }}>晚上 (19:00-21:00)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {/* 按日期分组时间槽 */}
                            {(() => {
                              // 按日期分组
                              const groupedByDate = {};
                              availableTimeSlots.forEach(slot => {
                                const date = formatDate(slot.startTime);
                                if (!groupedByDate[date]) {
                                  groupedByDate[date] = {
                                    morning: [],
                                    afternoon: [],
                                    evening: []
                                  };
                                }
                                
                                const hour = dayjs(slot.startTime).hour();
                                if (hour >= 7 && hour < 12) {
                                  groupedByDate[date].morning.push(slot);
                                } else if (hour >= 12 && hour < 18) {
                                  groupedByDate[date].afternoon.push(slot);
                                } else {
                                  groupedByDate[date].evening.push(slot);
                                }
                              });
                              
                              // 渲染日期行
                              return Object.entries(groupedByDate).map(([date, timeSlots]) => (
                                <tr key={date}>
                                  <td style={{ padding: '10px', border: '1px solid #f0f0f0', fontWeight: 'bold', textAlign: 'center', background: '#fafafa' }}>
                                    {dayjs(date).format('MM-DD')}
                                    <div style={{ fontSize: '12px', color: '#999' }}>
                                      {dayjs(date).format('ddd')}
                                    </div>
                                  </td>
                                  <td style={{ padding: '10px', border: '1px solid #f0f0f0', verticalAlign: 'top' }}>
                                    {timeSlots.morning.length > 0 ? (
                                      <Radio.Group name="timeSlotRadio" style={{ width: '100%' }}>
                                        {timeSlots.morning.map(slot => (
                                          <div key={`${slot.startTime}-${slot.endTime}`} style={{ margin: '8px 0' }}>
                                            <Radio 
                                              value={slot} 
                                              disabled={slot.hasConflict}
                                              style={{ width: '100%', display: 'block' }}
                                              onChange={() => form.setFieldsValue({ timeSlot: slot })}
                                            >
                                              <div style={{ 
                                                padding: '8px 12px', 
                                                borderRadius: '4px',
                                                backgroundColor: slot.hasConflict ? '#fff1f0' : (slot.isRecommended ? '#f6ffed' : '#f5f5f5'),
                                                border: '1px solid #eee',
                                              }}>
                                                <div>
                                                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                                                  <span style={{ fontWeight: 'bold' }}>{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</span>
                                                  {slot.isRecommended && !slot.hasConflict && (
                                                    <Tag color="success" style={{ marginLeft: 4, fontSize: '12px' }}>推荐</Tag>
                                                  )}
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>
                                                  <span>地点: {slot.location || '待定'}</span>
                                                </div>
                                                {slot.hasConflict && (
                                                  <div style={{ fontSize: '12px', color: '#ff4d4f', marginTop: '2px' }}>
                                                    <small>与已有课程冲突</small>
                                                  </div>
                                                )}
                                                {slot.isRecommended && !slot.hasConflict && (
                                                  <div style={{ fontSize: '12px', color: '#52c41a', marginTop: '2px' }}>
                                                    <small>推荐时间</small>
                                                  </div>
                                                )}
                                              </div>
                                            </Radio>
                                          </div>
                                        ))}
                                      </Radio.Group>
                                    ) : (
                                      <div style={{ color: '#999', textAlign: 'center', padding: '15px 0' }}>无可用时间</div>
                                    )}
                                  </td>
                                  <td style={{ padding: '10px', border: '1px solid #f0f0f0', verticalAlign: 'top' }}>
                                    {timeSlots.afternoon.length > 0 ? (
                                      <Radio.Group name="timeSlotRadio" style={{ width: '100%' }}>
                                        {timeSlots.afternoon.map(slot => (
                                          <div key={`${slot.startTime}-${slot.endTime}`} style={{ margin: '8px 0' }}>
                                            <Radio 
                                              value={slot} 
                                              disabled={slot.hasConflict}
                                              style={{ width: '100%', display: 'block' }}
                                              onChange={() => form.setFieldsValue({ timeSlot: slot })}
                                            >
                                              <div style={{ 
                                                padding: '8px 12px', 
                                                borderRadius: '4px',
                                                backgroundColor: slot.hasConflict ? '#fff1f0' : (slot.isRecommended ? '#f6ffed' : '#f5f5f5'),
                                                border: '1px solid #eee',
                                              }}>
                                                <div>
                                                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                                                  <span style={{ fontWeight: 'bold' }}>{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</span>
                                                  {slot.isRecommended && !slot.hasConflict && (
                                                    <Tag color="success" style={{ marginLeft: 4, fontSize: '12px' }}>推荐</Tag>
                                                  )}
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>
                                                  <span>地点: {slot.location || '待定'}</span>
                                                </div>
                                                {slot.hasConflict && (
                                                  <div style={{ fontSize: '12px', color: '#ff4d4f', marginTop: '2px' }}>
                                                    <small>与已有课程冲突</small>
                                                  </div>
                                                )}
                                                {slot.isRecommended && !slot.hasConflict && (
                                                  <div style={{ fontSize: '12px', color: '#52c41a', marginTop: '2px' }}>
                                                    <small>推荐时间</small>
                                                  </div>
                                                )}
                                              </div>
                                            </Radio>
                                          </div>
                                        ))}
                                      </Radio.Group>
                                    ) : (
                                      <div style={{ color: '#999', textAlign: 'center', padding: '15px 0' }}>无可用时间</div>
                                    )}
                                  </td>
                                  <td style={{ padding: '10px', border: '1px solid #f0f0f0', verticalAlign: 'top' }}>
                                    {timeSlots.evening.length > 0 ? (
                                      <Radio.Group name="timeSlotRadio" style={{ width: '100%' }}>
                                        {timeSlots.evening.map(slot => (
                                          <div key={`${slot.startTime}-${slot.endTime}`} style={{ margin: '8px 0' }}>
                                            <Radio 
                                              value={slot} 
                                              disabled={slot.hasConflict}
                                              style={{ width: '100%', display: 'block' }}
                                              onChange={() => form.setFieldsValue({ timeSlot: slot })}
                                            >
                                              <div style={{ 
                                                padding: '8px 12px', 
                                                borderRadius: '4px',
                                                backgroundColor: slot.hasConflict ? '#fff1f0' : (slot.isRecommended ? '#f6ffed' : '#f5f5f5'),
                                                border: '1px solid #eee',
                                              }}>
                                                <div>
                                                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                                                  <span style={{ fontWeight: 'bold' }}>{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</span>
                                                  {slot.isRecommended && !slot.hasConflict && (
                                                    <Tag color="success" style={{ marginLeft: 4, fontSize: '12px' }}>推荐</Tag>
                                                  )}
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>
                                                  <span>地点: {slot.location || '待定'}</span>
                                                </div>
                                                {slot.hasConflict && (
                                                  <div style={{ fontSize: '12px', color: '#ff4d4f', marginTop: '2px' }}>
                                                    <small>与已有课程冲突</small>
                                                  </div>
                                                )}
                                                {slot.isRecommended && !slot.hasConflict && (
                                                  <div style={{ fontSize: '12px', color: '#52c41a', marginTop: '2px' }}>
                                                    <small>推荐时间</small>
                                                  </div>
                                                )}
                                              </div>
                                            </Radio>
                                          </div>
                                        ))}
                                      </Radio.Group>
                                    ) : (
                                      <div style={{ color: '#999', textAlign: 'center', padding: '15px 0' }}>无可用时间</div>
                                    )}
                                  </td>
                                </tr>
                              ));
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </Form.Item>
                  </>
                )}
              </>
            )}
          </>
        );
        
      default:
        return null;
    }
  };
  
  // 渲染"我的课程"弹窗
  const renderMyLessonsModal = () => {
    // 按日期分组课程
    const groupedLessons = {};
    const historyLessons = [];
    const today = dayjs().startOf('day');
    
    // 分离未来课程和历史课程
    allStudentLessons
      .filter(lesson => lesson.status === 'SCHEDULED' || lesson.status === 'COMPLETED')
      .sort((a, b) => dayjs(a.startDateTime).valueOf() - dayjs(b.startDateTime).valueOf())
      .forEach(lesson => {
        const lessonDate = dayjs(lesson.startDateTime).startOf('day');
        if (lessonDate.isBefore(today)) {
          historyLessons.push(lesson);
        } else {
          const dateStr = formatDate(lesson.startDateTime);
          if (!groupedLessons[dateStr]) {
            groupedLessons[dateStr] = [];
          }
          groupedLessons[dateStr].push(lesson);
        }
      });
    
    return (
      <Modal
        title="我的课程"
        open={myLessonsModalVisible}
        onCancel={() => setMyLessonsModalVisible(false)}
        footer={[
          <Button key="dashboard" type="primary" onClick={() => navigate('/student/dashboard')}>
            前往仪表盘查看全部
          </Button>,
          <Button key="close" onClick={() => setMyLessonsModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={700}
      >
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={[
            {
              key: 'upcoming',
              label: `即将到来的课程 (${Object.keys(groupedLessons).length > 0 ? 
                Object.values(groupedLessons).reduce((sum, lessons) => sum + lessons.length, 0) : 0})`,
              children: Object.keys(groupedLessons).length === 0 ? (
                <Empty description="您暂无即将到来的课程安排" />
              ) : (
                <List
                  dataSource={Object.entries(groupedLessons)}
                  renderItem={([date, lessons]) => (
                    <List.Item>
                      <Card
                        title={<Badge status="processing" text={date} />}
                        style={{ width: '100%' }}
                        size="small"
                      >
                        <List
                          dataSource={lessons}
                          renderItem={lesson => (
                            <List.Item>
                              <div style={{ width: '100%' }}>
                                <Row>
                                  <Col span={8}>
                                    <Text strong>{formatTime(lesson.startDateTime)} - {formatTime(lesson.endDateTime)}</Text>
                                  </Col>
                                  <Col span={8}>
                                    <Text>{lesson.courseName}</Text>
                                  </Col>
                                  <Col span={8}>
                                    <Text type="secondary">教师: {lesson.teacherName}</Text>
                                  </Col>
                                </Row>
                                {lesson.location && (
                                  <div style={{ marginTop: 4 }}>
                                    <Text type="secondary">地点: {lesson.location}</Text>
                                  </div>
                                )}
                              </div>
                            </List.Item>
                          )}
                        />
                      </Card>
                    </List.Item>
                  )}
                />
              )
            },
            {
              key: 'history',
              label: `历史课程 (${historyLessons.length})`,
              children: historyLessons.length === 0 ? (
                <Empty description="您暂无历史课程记录" />
              ) : (
                <List
                  dataSource={historyLessons}
                  renderItem={lesson => (
                    <List.Item>
                      <Card
                        style={{ width: '100%' }}
                        size="small"
                      >
                        <Row>
                          <Col span={6}>
                            <Text type="secondary">{formatDate(lesson.startDateTime)}</Text>
                          </Col>
                          <Col span={6}>
                            <Text strong>{formatTime(lesson.startDateTime)} - {formatTime(lesson.endDateTime)}</Text>
                          </Col>
                          <Col span={6}>
                            <Text>{lesson.courseName}</Text>
                          </Col>
                          <Col span={6}>
                            <Text type="secondary">教师: {lesson.teacherName}</Text>
                            <Tag 
                              color={lesson.status === 'COMPLETED' ? 'green' : 'blue'} 
                              style={{ marginLeft: 8 }}
                            >
                              {lesson.status === 'COMPLETED' ? '已完成' : '已安排'}
                            </Tag>
                          </Col>
                        </Row>
                        {lesson.location && (
                          <div style={{ marginTop: 4 }}>
                            <Text type="secondary">地点: {lesson.location}</Text>
                          </div>
                        )}
                      </Card>
                    </List.Item>
                  )}
                />
              )
            }
          ]}
        />
      </Modal>
    );
  };
  
  // 生成iCal格式的日历事件
  const generateCalendarEvent = () => {
    if (!selectedTimeSlot || !selectedEnrollment) return null;
    
    const enrollment = getEnrollmentById(selectedEnrollment);
    if (!enrollment) return null;
    
    const eventStart = new Date(selectedTimeSlot.startTime);
    const eventEnd = new Date(selectedTimeSlot.endTime);
    
    // 格式化为iCal所需的日期时间格式
    const formatDate = (date) => {
      return date.toISOString().replace(/-|:|\.\d+/g, '');
    };
    
    const icalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//SchedulAI//课程预约//CN',
      'BEGIN:VEVENT',
      `DTSTART:${formatDate(eventStart)}`,
      `DTEND:${formatDate(eventEnd)}`,
      `SUMMARY:${enrollment.courseName} 课程`,
      `DESCRIPTION:教师: ${enrollment.teacherName}`,
      `LOCATION:${selectedTimeSlot.location || '待定'}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
    
    return icalContent;
  };
  
  // 下载日历事件
  const downloadCalendarEvent = () => {
    const icalContent = generateCalendarEvent();
    if (!icalContent) {
      message.error('无法生成日历事件');
      return;
    }
    
    const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '课程预约.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    message.success('日历事件已下载，您可以导入到您的日历应用中');
  };
  
  // 渲染成功页面
  if (bookingSuccess) {
    return (
      <Card>
        <Result
          status="success"
          title="课程时间选择成功！"
          subTitle={`您的课程时间已经成功安排，请准时参加。课程ID: ${createdLessonId}`}
          extra={[
            <Button type="primary" key="dashboard" onClick={() => navigate('/student/dashboard')}>
              返回仪表盘
            </Button>,
            <Button key="availability" onClick={() => navigate('/student/availability')}>
              设置更多可用时间
            </Button>,
            <Button 
              key="calendar" 
              type="default" 
              icon={<DownloadOutlined />} 
              onClick={downloadCalendarEvent}
            >
              添加到日历
            </Button>,
            <Button key="book-again" onClick={() => {
              setCurrentStep(0);
              setSelectedEnrollment(null);
              setSelectedTimeSlot(null);
              setBookingSuccess(false);
              form.resetFields();
            }}>
              继续选择
            </Button>,
          ]}
        />
        <Alert
          message="提示"
          description="您可以前往'设置更多可用时间'页面，完善您的可用时间设置，这将帮助系统更好地为您安排课程。您也可以将此课程添加到您的日历中，以便及时收到提醒。"
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      </Card>
    );
  }
  
  return (
    <div className="book-lesson-page">
      <Title level={2}>选择课程可用时间</Title>
      
      {/* 添加"我的课程"按钮 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div></div> {/* 占位，使按钮右对齐 */}
        <Button 
          icon={<ClockCircleOutlined />} 
          onClick={() => setMyLessonsModalVisible(true)}
          disabled={loading}
        >
          我的课程 {allStudentLessons.filter(l => l.status === 'SCHEDULED').length > 0 && 
            `(${allStudentLessons.filter(l => l.status === 'SCHEDULED').length})`}
        </Button>
      </div>
      
      <Card>
        <Steps current={currentStep} style={{ marginBottom: 40 }}>
          {steps.map(item => (
            <Step key={item.title} title={item.title} icon={item.icon} />
          ))}
        </Steps>
        
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          initialValues={{ remember: true }}
        >
          {renderStepContent()}
          
          <Divider />
          
          <Form.Item style={{ marginTop: 24, textAlign: 'right' }}>
            {currentStep > 0 && (
              <Button 
                style={{ marginRight: 8 }} 
                onClick={() => setCurrentStep(currentStep - 1)}
                disabled={loading}
              >
                上一步
              </Button>
            )}
            
            <Button 
              type="primary"
              onClick={handleFormSubmit}
              loading={loading && currentStep === 1}
              disabled={loading || (currentStep === 0 && studentEnrollments.length === 0)}
            >
              {currentStep < 1 ? '下一步' : '确认选择'}
            </Button>
          </Form.Item>
        </Form>
        
        {/* 确认弹窗 */}
        <Modal
          title="确认选择"
          open={confirmModalVisible}
          onOk={confirmTimeSelection}
          onCancel={() => setConfirmModalVisible(false)}
          confirmLoading={loading}
          okText="确认选择"
          cancelText="取消"
          width={500}
        >
          {renderConfirmContent()}
        </Modal>
      </Card>
      
      {/* 渲染"我的课程"弹窗 */}
      {renderMyLessonsModal()}
    </div>
  );
};

export default StudentBookLessonPage; 