import api from './api';

const courseService = {
  // 获取所有课程
  getAllCourses: async () => {
    try {
      return await api.get('/api/courses');
    } catch (error) {
      console.error('获取课程列表失败:', error);
      throw error;
    }
  },

  // 获取单个课程信息
  getCourseById: async (id) => {
    try {
      return await api.get(`/api/courses/${id}`);
    } catch (error) {
      console.error(`获取课程(ID: ${id})信息失败:`, error);
      throw error;
    }
  },

  // 创建新课程
  createCourse: async (courseData) => {
    try {
      return await api.post('/api/courses', courseData);
    } catch (error) {
      console.error('创建课程失败:', error);
      throw error;
    }
  },

  // 更新课程信息
  updateCourse: async (id, courseData) => {
    try {
      return await api.put(`/api/courses/${id}`, courseData);
    } catch (error) {
      console.error(`更新课程(ID: ${id})信息失败:`, error);
      throw error;
    }
  },

  // 删除课程
  deleteCourse: async (id) => {
    try {
      return await api.delete(`/api/courses/${id}`);
    } catch (error) {
      console.error(`删除课程(ID: ${id})失败:`, error);
      throw error;
    }
  },

  // 获取课程可教授的教师
  getCourseTeachers: async (courseId) => {
    try {
      return await api.get(`/api/courses/${courseId}/teachers`);
    } catch (error) {
      console.error(`获取课程(ID: ${courseId})可教授教师失败:`, error);
      throw error;
    }
  },

  // 更改课程状态
  updateCourseStatus: async (id, status) => {
    try {
      return await api.patch(`/api/courses/${id}/status`, { status });
    } catch (error) {
      console.error(`更新课程(ID: ${id})状态失败:`, error);
      throw error;
    }
  }
};

export default courseService; 