import api from './api';

const studentService = {
  // 获取所有学生
  getAllStudents: async () => {
    try {
      return await api.get('/api/students');
    } catch (error) {
      console.error('获取学生列表失败:', error);
      throw error;
    }
  },

  // 获取单个学生信息
  getStudentById: async (id) => {
    try {
      return await api.get(`/api/students/${id}`);
    } catch (error) {
      console.error(`获取学生(ID: ${id})信息失败:`, error);
      throw error;
    }
  },

  // 创建新学生
  createStudent: async (studentData) => {
    try {
      return await api.post('/api/students', studentData);
    } catch (error) {
      console.error('创建学生失败:', error);
      throw error;
    }
  },

  // 更新学生信息
  updateStudent: async (id, studentData) => {
    try {
      return await api.put(`/api/students/${id}`, studentData);
    } catch (error) {
      console.error(`更新学生(ID: ${id})信息失败:`, error);
      throw error;
    }
  },

  // 删除学生
  deleteStudent: async (id) => {
    try {
      return await api.delete(`/api/students/${id}`);
    } catch (error) {
      console.error(`删除学生(ID: ${id})失败:`, error);
      throw error;
    }
  },

  // 获取学生可用时间
  getStudentAvailabilities: async (studentId) => {
    try {
      console.log(`获取学生(ID: ${studentId})可用时间...`);
      const response = await api.get(`/api/student-availabilities/student/${studentId}`);
      console.log(`获取学生(ID: ${studentId})可用时间成功:`, response);
      return response;
    } catch (error) {
      console.error(`获取学生(ID: ${studentId})可用时间失败:`, error);
      throw error;
    }
  },

  // 设置学生可用时间
  setStudentAvailabilities: async (studentId, availabilities) => {
    try {
      console.log(`设置学生(ID: ${studentId})可用时间:`, availabilities);
      const response = await api.put(`/api/student-availabilities/student/${studentId}/batch`, availabilities);
      console.log(`设置学生(ID: ${studentId})可用时间成功:`, response);
      return response;
    } catch (error) {
      console.error(`设置学生(ID: ${studentId})可用时间失败:`, error);
      throw error;
    }
  }
};

export default studentService; 