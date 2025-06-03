import api from './api';

const teacherService = {
  // 获取所有教师
  getAllTeachers: async () => {
    try {
      const response = await api.get('/api/teachers');
      console.log('获取所有教师成功:', response);
      return response; // 直接返回响应，因为后端已经返回了正确格式的数据
    } catch (error) {
      console.error('获取教师列表失败:', error);
      throw error;
    }
  },

  // 获取单个教师信息，包括推荐课程
  getTeacherById: async (id) => {
    try {
      // 确保id是一个有效值
      if (!id) {
        console.error('调用getTeacherById时提供了无效的ID:', id);
        return null;
      }
      
      console.log(`开始获取教师(ID: ${id})信息...`);
      const response = await api.get(`/api/teachers/${id}`);
      console.log(`教师(ID: ${id})API响应:`, response);
      
      // 尝试获取教师数据
      let teacherData = null;
      
      if (response && response.data) {
        teacherData = response.data;
      } else if (response) {
        // 可能响应本身就是数据
        teacherData = response;
      }
      
      if (!teacherData) {
        console.warn(`未能获取到教师(ID: ${id})的有效数据`);
        return null;
      }
      
      console.log(`成功获取教师(ID: ${id})数据:`, teacherData);
      return teacherData;
    } catch (error) {
      console.error(`获取教师(ID: ${id})信息失败:`, error);
      return null; // 返回null而不是抛出异常，这样可以在遍历时跳过失败的项
    }
  },

  // 获取特定课程的教师列表
  getTeachersForCourse: async (courseId) => {
    try {
      console.log(`开始获取课程(ID: ${courseId})的教师列表...`);
      
      const response = await api.get(`/api/courses/${courseId}/teachers`);
      console.log(`获取课程(ID: ${courseId})的教师列表成功:`, response);
      
      let teacherIds = [];
      if (response?.data) {
        teacherIds = response.data;
      } else if (Array.isArray(response)) {
        teacherIds = response;
      }
      
      console.log(`处理后的教师ID列表:`, teacherIds);
      return teacherIds;
    } catch (error) {
      console.error(`获取课程(ID: ${courseId})的教师列表失败:`, error);
      throw error;
    }
  },

  // 创建教师，包含推荐课程
  createTeacher: async (teacherData) => {
    try {
      console.log('创建教师数据:', teacherData);
      const response = await api.post('/api/teachers', teacherData);
      console.log('创建教师成功:', response);
      return response.data;
    } catch (error) {
      console.error('创建教师失败:', error);
      throw error;
    }
  },

  // 更新教师，包含推荐课程
  updateTeacher: async (id, teacherData) => {
    try {
      console.log(`更新教师(ID: ${id})数据:`, teacherData);
      const response = await api.put(`/api/teachers/${id}`, teacherData);
      console.log(`更新教师(ID: ${id})成功:`, response);
      return response.data;
    } catch (error) {
      console.error(`更新教师(ID: ${id})信息失败:`, error);
      throw error;
    }
  },

  // 删除教师
  deleteTeacher: async (id) => {
    try {
      await api.delete(`/api/teachers/${id}`);
    } catch (error) {
      console.error(`删除教师(ID: ${id})失败:`, error);
      throw error;
    }
  },

  // 获取教师可用时间
  getTeacherAvailabilities: async (teacherId) => {
    try {
      console.log(`获取教师(ID: ${teacherId})可用时间...`);
      const response = await api.get(`/api/teacher-availabilities/teacher/${teacherId}`);
      console.log(`获取教师(ID: ${teacherId})可用时间成功:`, response);
      return response;
    } catch (error) {
      console.error(`获取教师(ID: ${teacherId})可用时间失败:`, error);
      throw error;
    }
  },

  // 设置教师可用时间
  setTeacherAvailabilities: async (teacherId, availabilities) => {
    try {
      console.log(`设置教师(ID: ${teacherId})可用时间:`, availabilities);
      const response = await api.put(`/api/teacher-availabilities/teacher/${teacherId}/batch`, availabilities);
      console.log(`设置教师(ID: ${teacherId})可用时间成功:`, response);
      return response;
    } catch (error) {
      console.error(`设置教师(ID: ${teacherId})可用时间失败:`, error);
      throw error;
    }
  },

  // 获取教师课程
  getTeacherCourses: async (path) => {
    try {
      // 如果提供了完整路径，直接使用；否则默认获取特定教师的课程
      const endpoint = path.startsWith('/') 
        ? `/api/teachercourses${path}` 
        : `/api/teachercourses/teacher/${path}`;
        
      return await api.get(endpoint);
    } catch (error) {
      console.error(`获取教师课程关联失败:`, error);
      throw error;
    }
  },

  // 获取教师课程关联
  getTeacherCourseAssignment: async (teacherId, courseId) => {
    try {
      console.log(`尝试获取教师(ID: ${teacherId})和课程(ID: ${courseId})的关联...`);
      
      // 确保参数有效
      if (!teacherId || !courseId) {
        console.error('获取教师课程关联失败: 缺少必要参数', { teacherId, courseId });
        return null;
      }

      const response = await api.get(`/api/teachercourses/assignment`, {
        params: { 
          teacherId, 
          courseId 
        }
      });

      // 处理响应数据
      let assignmentData = null;
      if (response?.data) {
        assignmentData = response.data;
      } else if (response) {
        assignmentData = response;
      }

      if (assignmentData) {
        console.log(`成功获取教师课程关联:`, assignmentData);
        return {
          id: assignmentData.id || assignmentData.teacherCourseId,
          teacherId: assignmentData.teacherId || teacherId,
          courseId: assignmentData.courseId || courseId
        };
      }

      console.log(`未找到教师(ID: ${teacherId})和课程(ID: ${courseId})的关联`);
      return null;
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(`未找到教师(ID: ${teacherId})和课程(ID: ${courseId})的关联`);
        return null;
      }
      console.error(`获取教师(ID: ${teacherId})和课程(ID: ${courseId})的关联失败:`, error);
      throw error;
    }
  },

  // 分配课程给教师
  assignCourseToTeacher: async (teacherId, courseId) => {
    try {
      console.log(`尝试分配课程(ID: ${courseId})给教师(ID: ${teacherId})`);
      
      // 确保参数有效
      if (!teacherId || !courseId) {
        console.error('分配课程失败: 缺少必要参数', { teacherId, courseId });
        throw new Error('教师ID和课程ID不能为空');
      }

      // 1. 先尝试获取已存在的关联
      const existingAssignment = await teacherService.getTeacherCourseAssignment(teacherId, courseId);
      if (existingAssignment) {
        console.log(`找到已存在的关联:`, existingAssignment);
        return existingAssignment;
      }

      // 2. 如果不存在，则创建新的关联
      console.log(`开始创建新的教师课程关联...`);
      const response = await api.post(`/api/teachercourses`, {
        teacherId,
        courseId
      });
      
      // 处理响应数据
      let assignmentData = null;
      if (response?.data) {
        assignmentData = response.data;
      } else if (response) {
        assignmentData = response;
      }

      // 验证返回的数据
      if (assignmentData && (assignmentData.id || assignmentData.teacherCourseId)) {
        console.log(`成功创建教师课程关联:`, assignmentData);
        return {
          id: assignmentData.id || assignmentData.teacherCourseId,
          teacherId: assignmentData.teacherId || teacherId,
          courseId: assignmentData.courseId || courseId
        };
      }
      
      throw new Error('服务器返回的数据无效');
    } catch (error) {
      console.error(`分配课程(ID: ${courseId})给教师(ID: ${teacherId})失败:`, error);
      
      if (error.response?.status === 409) {
        // 如果是冲突错误，再次尝试获取已存在的关联
        const retryAssignment = await teacherService.getTeacherCourseAssignment(teacherId, courseId);
        if (retryAssignment) {
          console.log('成功获取已存在的关联:', retryAssignment);
          return retryAssignment;
        }
      } else if (error.response?.status === 404) {
        throw new Error('教师或课程不存在');
      }
      
      throw error;
    }
  },

  // 移除教师课程
  removeTeacherCourse: async (teacherCourseId) => {
    try {
      return await api.delete(`/api/teacher-courses/${teacherCourseId}`);
    } catch (error) {
      console.error(`移除教师课程(ID: ${teacherCourseId})失败:`, error);
      throw error;
    }
  },

  // 获取教师的推荐课程
  getTeacherRecommendedCourses: async (teacherId) => {
    try {
      const response = await api.get(`/api/teachercourses/teacher/${teacherId}`);
      console.log(`获取教师(ID: ${teacherId})课程列表成功:`, response);
      
      let courseIds = [];
      if (response?.data) {
        courseIds = response.data.map(tc => tc.courseId);
      } else if (Array.isArray(response)) {
        courseIds = response.map(tc => tc.courseId);
      }
      
      return courseIds;
    } catch (error) {
      console.error(`获取教师(ID: ${teacherId})课程列表失败:`, error);
      throw error;
    }
  },

  // 设置教师的推荐课程
  setTeacherRecommendedCourses: async (teacherId, courseIds) => {
    try {
      // 使用 assignCourseToTeacher 方法为每个课程创建关联
      const assignments = await Promise.all(
        courseIds.map(courseId => 
          teacherService.assignCourseToTeacher(teacherId, courseId)
        )
      );
      
      console.log(`设置教师(ID: ${teacherId})课程列表成功:`, assignments);
      return assignments;
    } catch (error) {
      console.error(`设置教师(ID: ${teacherId})课程列表失败:`, error);
      throw error;
    }
  }
};

export default teacherService; 