import api from './api';
import dayjs from 'dayjs';

const schedulingService = {
  // 查找师生共同空闲时间
  findCommonAvailableSlots: async (studentId, teacherId) => {
    try {
      return await api.get('/api/scheduling/common-slots', {
        params: { studentId, teacherId }
      });
    } catch (error) {
      console.error(`查找共同空闲时间(学生ID: ${studentId}, 教师ID: ${teacherId})失败:`, error);
      throw error;
    }
  },

  // 获取 AI 排课建议
  suggestLessonTimes: async (studentId, teacherId, enrollmentId, durationMinutes) => {
    try {
      // 验证参数
      if (!studentId || !teacherId || !enrollmentId || !durationMinutes) {
        console.error('获取排课建议失败: 缺少必要参数', { studentId, teacherId, enrollmentId, durationMinutes });
        throw new Error('获取排课建议需要学生ID、教师ID、选课ID和课程时长');
      }
      
      console.log(`正在获取排课建议: 学生ID=${studentId}, 教师ID=${teacherId}, 选课ID=${enrollmentId}, 时长=${durationMinutes}`);
      
      const params = {
        studentId,
        teacherId,
        enrollmentId,
        durationMinutes
      };
      
      const response = await api.get('/api/scheduling/suggest-times', { params });
      console.log('获取排课建议成功:', response);
      
      // 验证返回的数据格式
      if (!Array.isArray(response)) {
        console.warn('排课API返回的不是数组:', response);
        return []; // 确保返回空数组而不是其他类型
      }
      
      return response;
    } catch (error) {
      console.error(`获取排课建议失败(选课ID: ${enrollmentId}):`, error);
      // 返回详细的错误信息以便调试
      const errorMessage = error.response?.data?.message || error.message || '未知错误';
      console.error('错误详情:', errorMessage);
      throw error;
    }
  },
  
  // 获取测试排课建议数据
  getTestSuggestions: async (studentId=1, teacherId=1, courseId=1, enrollmentId=1) => {
    try {
      console.log(`正在获取测试排课建议: 学生ID=${studentId}, 教师ID=${teacherId}, 课程ID=${courseId}, 选课ID=${enrollmentId}`);
      
      const params = { studentId, teacherId, courseId, enrollmentId };
      
      const response = await api.get('/api/scheduling/test-suggestions', { params });
      console.log('获取测试排课建议成功:', response);
      
      // 验证返回的数据格式
      if (!Array.isArray(response)) {
        console.warn('测试排课API返回的不是数组:', response);
        return []; // 确保返回空数组而不是其他类型
      }
      
      return response;
    } catch (error) {
      console.error(`获取测试排课建议失败:`, error);
      const errorMessage = error.response?.data?.message || error.message || '未知错误';
      console.error('错误详情:', errorMessage);
      throw error;
    }
  },

  // 获取教师可用时间段
  getTeacherAvailableSlots: async (teacherId, startDate, endDate) => {
    try {
      return await api.get('/api/scheduling/teacher-available-slots', {
        params: { teacherId, startDate, endDate }
      });
    } catch (error) {
      console.error('获取教师可用时间段失败:', error);
      throw error;
    }
  },

  // 获取学生可用时间段
  getStudentAvailableSlots: async (studentId, startDate, endDate) => {
    try {
      return await api.get('/api/scheduling/student-available-slots', {
        params: { studentId, startDate, endDate }
      });
    } catch (error) {
      console.error('获取学生可用时间段失败:', error);
      throw error;
    }
  },

  // 检查排课冲突
  checkScheduleConflicts: async (lessonData) => {
    try {
      return await api.post('/api/scheduling/check-conflicts', lessonData);
    } catch (error) {
      console.error('检查排课冲突失败:', error);
      throw error;
    }
  },

  // 获取智能排课建议
  getSchedulingSuggestions: async (params) => {
    try {
      return await api.get('/api/scheduling/suggestions', { params });
    } catch (error) {
      console.error('获取智能排课建议失败:', error);
      throw error;
    }
  },
  
  // 获取可用时间段
  getAvailableTimeSlots: async (params) => {
    try {
      console.log('获取可用时间段，参数:', params);
      
      // 检查必要参数
      if (!params.teacherId || !params.studentId || !params.courseId || !params.startDate || !params.endDate) {
        console.error('参数不完整:', params);
        throw new Error('请求参数不完整');
      }
      
      try {
        // 尝试从API获取数据
        const response = await api.get('/api/scheduling/available-time-slots', { 
          params: {
            teacherId: params.teacherId,
            studentId: params.studentId,
            courseId: params.courseId,
            startDate: params.startDate,
            endDate: params.endDate,
            enrollmentId: params.enrollmentId
          },
          timeout: 10000 // 设置10秒超时
        });
        
        // 打印原始返回数据，帮助调试
        console.log('API原始返回数据:', response);
        
        // 验证返回的数据
        if (!Array.isArray(response)) {
          console.warn('API返回的不是数组格式:', response);
          return [];
        }
        
        return response;
      } catch (apiError) {
        console.warn('API调用失败，使用模拟数据:', apiError);
        throw apiError;
      }
    } catch (error) {
      console.error('获取可用时间段失败，使用模拟数据:', error);
      
      // 创建一个从当前日期开始的一周的模拟数据
      const startDate = new Date(params.startDate);
      const endDate = new Date(params.endDate);
      const mockData = [];
      
      // 确保日期对象有效
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.error('无效的日期参数', params);
        return [];
      }
      
      // 为每天创建3个不同的时间段
      for (let day = new Date(startDate); day <= endDate; day.setDate(day.getDate() + 1)) {
        // 格式化日期为YYYY-MM-DD
        const year = day.getFullYear();
        const month = String(day.getMonth() + 1).padStart(2, '0');
        const date = String(day.getDate()).padStart(2, '0');
        const dayStr = `${year}-${month}-${date}`;
        
        // 上午 9:00-10:30
        mockData.push({
          id: `${dayStr}-morning`,
          startTime: `${dayStr}T09:00:00`,
          endTime: `${dayStr}T10:30:00`,
          location: '教室A',
          isRecommended: Math.random() > 0.7, // 30%的概率设为推荐
          hasConflict: Math.random() > 0.9, // 10%的概率设为冲突
        });
        
        // 下午 14:00-15:30
        mockData.push({
          id: `${dayStr}-afternoon`,
          startTime: `${dayStr}T14:00:00`,
          endTime: `${dayStr}T15:30:00`,
          location: '教室B',
          isRecommended: Math.random() > 0.7,
          hasConflict: Math.random() > 0.9,
        });
        
        // 晚上 19:00-20:30
        mockData.push({
          id: `${dayStr}-evening`,
          startTime: `${dayStr}T19:00:00`,
          endTime: `${dayStr}T20:30:00`,
          location: '线上',
          isRecommended: Math.random() > 0.7,
          hasConflict: Math.random() > 0.9,
        });
      }
      
      console.log('返回模拟时间槽数据，数量:', mockData.length);
      return mockData;
    }
  },
  
  // 批量创建课程（批量排课）
  batchCreateLessons: async (lessonsData) => {
    try {
      return await api.post('/api/scheduling/batch-create', lessonsData);
    } catch (error) {
      console.error('批量创建课程失败:', error);
      throw error;
    }
  },
  
  // 自动排课
  autoSchedule: async (params) => {
    try {
      return await api.post('/api/scheduling/auto-schedule', params);
    } catch (error) {
      console.error('自动排课失败:', error);
      throw error;
    }
  },

  // 创建灵活排课请求
  createFlexibleBooking: async (flexibleBookingData) => {
    try {
      console.log('创建灵活排课请求:', flexibleBookingData);
      return await api.post('/api/scheduling/flexible-booking', flexibleBookingData);
    } catch (error) {
      console.error('创建灵活排课请求失败:', error);
      throw error;
    }
  },
  
  // 获取灵活排课请求
  getFlexibleBookingRequests: async (params = {}) => {
    try {
      console.log('获取灵活排课请求:', params);
      return await api.get('/api/scheduling/flexible-booking', { params });
    } catch (error) {
      console.error('获取灵活排课请求失败:', error);
      throw error;
    }
  },
  
  // 处理灵活排课请求
  processFlexibleBookingRequest: async (requestId, data) => {
    try {
      console.log(`处理灵活排课请求 ID: ${requestId}`, data);
      return await api.post(`/scheduling/flexible-booking/${requestId}/process`, data);
    } catch (error) {
      console.error(`处理灵活排课请求失败(ID: ${requestId}):`, error);
      throw error;
    }
  }
};

export default schedulingService;