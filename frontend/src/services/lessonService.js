import api from './api';
import dayjs from 'dayjs';

const lessonService = {
  // 获取所有课时
  getAllLessons: async (params) => {
    try {
      console.log('开始获取所有课程安排...');
      const startTime = new Date().getTime();
      
      const response = await api.get('/api/lessons', { params });
      
      const endTime = new Date().getTime();
      console.log(`获取课程安排完成，耗时: ${endTime - startTime}ms`);
      console.log('原始课程安排数据:', response);
      
      // 统计无效数据
      if (Array.isArray(response)) {
        console.log(`获取到 ${response.length} 条课程记录`);
        
        // 检查课程状态
        const statusCount = {};
        response.forEach(lesson => {
          const status = lesson.status || 'NULL';
          statusCount[status] = (statusCount[status] || 0) + 1;
        });
        console.log('状态统计:', statusCount);
        
        // 检查日期有效性
        const validDateCount = response.filter(lesson => 
          lesson.startDateTime && dayjs(lesson.startDateTime).isValid()
        ).length;
        console.log(`有效日期数: ${validDateCount}/${response.length}`);
        
        // 输出几个样本记录
        if (response.length > 0) {
          console.log('示例课程记录(前3条):'); 
          response.slice(0, 3).forEach((lesson, i) => {
            console.log(`[${i}] ID:${lesson.id}, 状态:${lesson.status}, 开始时间:${lesson.startDateTime}`);
          });
        }
      } else {
        console.warn('API返回的数据不是数组:', response);
      }
      
      return response;
    } catch (error) {
      console.error('获取课时列表失败:', error);
      throw error;
    }
  },

  // 获取单个课时信息
  getLessonById: async (id) => {
    try {
      return await api.get(`/api/lessons/${id}`);
    } catch (error) {
      console.error(`获取课时(ID: ${id})信息失败:`, error);
      throw error;
    }
  },

  // 创建新课时（排课）
  createLesson: async (lessonData) => {
    try {
      console.log('开始创建课时，原始数据:', lessonData);
      
      // 确保时间格式正确
      const formattedData = {
        ...lessonData,
        startDateTime: lessonData.startDateTime ? dayjs(lessonData.startDateTime).format('YYYY-MM-DDTHH:mm:ss') : null,
        endDateTime: lessonData.endDateTime ? dayjs(lessonData.endDateTime).format('YYYY-MM-DDTHH:mm:ss') : null
      };
      
      // 验证时间
      if (!formattedData.startDateTime || !formattedData.endDateTime) {
        console.error('创建课时失败：开始或结束时间为空', formattedData);
        throw new Error('课程开始和结束时间不能为空');
      }
      
      if (dayjs(formattedData.startDateTime).isAfter(dayjs(formattedData.endDateTime))) {
        console.error('创建课时失败：开始时间晚于结束时间', formattedData);
        throw new Error('课程开始时间必须早于结束时间');
      }
      
      console.log('格式化后的数据:', formattedData);
      return await api.post('/api/lessons', formattedData);
    } catch (error) {
      console.error('创建课时失败:', error);
      
      // 处理特定类型的错误
      if (error.response) {
        // 针对409冲突错误提供更详细的日志
        if (error.response.status === 409) {
          console.error('创建课时时发生时间冲突:', error.response.data);
          console.error('冲突类型:', error.response.data?.conflictType || '未指定');
          console.error('冲突详情:', error.response.data?.conflictDetails || '无详情');
        } 
        // 针对400错误(Bad Request)
        else if (error.response.status === 400) {
          console.error('创建课时的数据格式错误:', error.response.data);
        }
        // 针对403错误(Forbidden)
        else if (error.response.status === 403) {
          console.error('没有创建课时的权限:', error.response.data);
        }
        // 针对其他HTTP错误
        else {
          console.error(`创建课时时收到HTTP错误 ${error.response.status}:`, error.response.data);
        }
      }
      
      throw error;
    }
  },

  // 更新课时信息
  updateLesson: async (id, lessonData) => {
    try {
      return await api.put(`/api/lessons/${id}`, lessonData);
    } catch (error) {
      console.error(`更新课时(ID: ${id})信息失败:`, error);
      
      // 处理特定类型的错误
      if (error.response) {
        // 针对409冲突错误提供更详细的日志
        if (error.response.status === 409) {
          console.error('更新课时时发生时间冲突:', error.response.data);
          console.error('冲突类型:', error.response.data?.conflictType || '未指定');
          console.error('冲突详情:', error.response.data?.conflictDetails || '无详情');
          
          // 扩展错误对象，添加更多有用的信息
          error.conflictInfo = {
            type: error.response.data?.conflictType,
            details: error.response.data?.conflictDetails,
            affectedResources: error.response.data?.affectedResources
          };
        }
        // 针对404错误(Not Found)
        else if (error.response.status === 404) {
          console.error(`更新的课时ID ${id} 不存在:`, error.response.data);
        }
        // 针对其他HTTP错误
        else {
          console.error(`更新课时时收到HTTP错误 ${error.response.status}:`, error.response.data);
        }
      }
      
      throw error;
    }
  },

  // 删除课时
  deleteLesson: async (id) => {
    try {
      return await api.delete(`/api/lessons/${id}`);
    } catch (error) {
      console.error(`删除课时(ID: ${id})失败:`, error);
      throw error;
    }
  },

  // 获取学生的课时
  getStudentLessons: async (studentId, params) => {
    try {
      console.log(`开始获取学生(ID: ${studentId})的课程列表...`);
      
      try {
        // 使用 api 实例发送请求
        const response = await api.get(`/api/students/${studentId}/lessons`);
        console.log(`成功获取学生(ID: ${studentId})课程，计数:`, Array.isArray(response) ? response.length : 0);
        return response || [];
      } catch (error) {
        console.error(`获取学生(ID: ${studentId})课程失败:`, error);
        
        // 如果是404错误，返回空数组
        if (error.status === 404) {
          console.log('未找到学生课程记录，返回空数组');
          return [];
        }
        
        throw error;
      }
    } catch (error) {
      console.error(`获取学生(ID: ${studentId})课时失败:`, error);
      return []; // 出错时返回空数组而不是抛出错误
    }
  },

  // 获取教师的课时
  getTeacherLessons: async (teacherId, params) => {
    try {
      return await api.get(`/api/teachers/${teacherId}/lessons`, { params });
    } catch (error) {
      console.error(`获取教师(ID: ${teacherId})课时失败:`, error);
      throw error;
    }
  },

  // 检查排课冲突
  checkLessonConflicts: async (lessonData) => {
    try {
      return await api.post('/api/scheduling/check-conflicts', lessonData);
    } catch (error) {
      console.error('检查排课冲突失败:', error);
      
      // 处理特定类型的错误
      if (error.response) {
        // 针对409冲突错误提供更详细的日志
        if (error.response.status === 409) {
          // 解析冲突详情
          const conflicts = error.response.data?.conflicts || [];
          const conflictType = error.response.data?.conflictType || '未知冲突类型';
          
          console.error(`检测到${conflicts.length}个排课冲突，类型: ${conflictType}`);
          
          // 记录每个冲突的详细信息
          conflicts.forEach((conflict, index) => {
            console.error(`冲突 ${index + 1}:`, {
              资源类型: conflict.resourceType,
              资源ID: conflict.resourceId,
              资源名称: conflict.resourceName,
              冲突开始时间: conflict.startTime,
              冲突结束时间: conflict.endTime,
              冲突原因: conflict.reason
            });
          });
          
          // 扩展错误对象，添加结构化的冲突信息
          error.conflicts = conflicts;
          error.conflictType = conflictType;
        }
        // 针对其他HTTP错误
        else {
          console.error(`检查排课冲突时收到HTTP错误 ${error.response.status}:`, error.response.data);
        }
      }
      
      throw error;
    }
  },

  // 更新课时状态
  updateLessonStatus: async (id, status, notes) => {
    try {
      return await api.patch(`/api/lessons/${id}/status`, { status, notes });
    } catch (error) {
      console.error(`更新课时(ID: ${id})状态失败:`, error);
      throw error;
    }
  },

  // 更新课程安排状态 (调用 PATCH /{id}/status)
  updateStatus: async (id, status) => {
    try {
      console.log(`尝试更新课程(ID: ${id})状态为 ${status}`);
      
      // 获取当前用户认证信息
      let user = null;
      try {
        // 从localStorage获取认证信息
        const adminUser = localStorage.getItem('admin_user');
        const studentUser = localStorage.getItem('student_user');
        user = adminUser ? JSON.parse(adminUser) : (studentUser ? JSON.parse(studentUser) : null);
        console.log('当前登录用户:', user);
      } catch (e) {
        console.warn('无法获取用户信息:', e);
      }
      
      // 直接使用api对象进行调用，避开fetch
      const response = await api.patch(`/api/lessons/${id}/status`, { 
        status: status ? status.toUpperCase() : 'SCHEDULED' 
      });
      
      console.log('API响应:', response);
      return response;
    } catch (error) {
      console.error(`更新课程(ID: ${id})状态失败:`, error);
      
      // 如果是403错误，显示权限错误
      if (error.status === 403) {
        throw {
          message: '您没有权限执行此操作',
          isPermissionError: true
        };
      }
      
      throw {
        message: error.message || '状态更新失败，请重试',
        isNetworkError: error.isNetworkError || false
      };
    }
  },
};

export default lessonService; 