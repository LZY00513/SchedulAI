import api from './api';

const enrollmentService = {
  // 获取所有选课记录 (可带筛选参数)
  getAllEnrollments: async (params = {}) => {
    try {
      // 后端 EnrollmentController 可能支持 studentId, teacherId, courseId 等筛选
      return await api.get('/api/enrollments', { params }); 
    } catch (error) {
      console.error('获取选课列表失败:', error);
      throw error;
    }
  },

  // 根据 ID 获取单个选课记录
  getEnrollmentById: async (id) => {
    try {
      return await api.get(`/api/enrollments/${id}`);
    } catch (error) {
      console.error(`获取选课(ID: ${id})信息失败:`, error);
      throw error;
    }
  },

  // 创建选课记录
  createEnrollment: async (enrollmentData) => {
    try {
      console.log('开始创建选课记录:', enrollmentData);
      
      // 添加参数验证
      if (!enrollmentData.studentId || !enrollmentData.teacherCourseId) {
        console.error('创建选课失败: 缺少必要参数', enrollmentData);
        throw new Error('创建选课失败: 学生ID和教师课程ID不能为空');
      }
      
      // 记录详细参数用于调试
      console.log(`创建选课 - 学生ID: ${enrollmentData.studentId}, 教师课程ID: ${enrollmentData.teacherCourseId}, 课时费: ${enrollmentData.hourlyRate}`);
      
      // 发送请求创建选课
      const response = await api.post('/api/enrollments', enrollmentData);
      console.log('选课创建成功:', response);
      return response;
    } catch (error) {
      // 更详细的错误日志
      console.error('创建选课失败:', error);
      if (error.response) {
        console.error('错误状态码:', error.response.status);
        console.error('错误数据:', error.response.data);
      }
      throw error;
    }
  },

  // 更新选课信息 (可能主要是更新费率?)
  updateEnrollment: async (id, enrollmentData) => {
    try {
      return await api.put(`/api/enrollments/${id}`, enrollmentData);
    } catch (error) {
      console.error(`更新选课(ID: ${id})信息失败:`, error);
      throw error;
    }
  },

  // 删除选课记录
  deleteEnrollment: async (id) => {
    try {
      return await api.delete(`/api/enrollments/${id}`);
    } catch (error) {
      console.error(`删除选课(ID: ${id})失败:`, error);
      throw error;
    }
  },

  // **关键**: 根据学生和教师课程查找选课 (用于排课)
  findEnrollment: async (studentId, teacherCourseId) => {
    try {
      console.log(`查找选课记录，学生ID: ${studentId}, 教师课程ID: ${teacherCourseId}`);
      
      // 添加参数验证
      if (!studentId || !teacherCourseId) {
        console.error('查找选课失败: 缺少必要参数', { studentId, teacherCourseId });
        throw new Error('查找选课失败: 学生ID和教师课程ID不能为空');
      }
      
      // 假设后端支持这种查询
      const response = await api.get('/api/enrollments', { 
        params: { studentId, teacherCourseId }
      });
      
      console.log(`选课查询结果:`, response);
      
      // 期望返回一个列表，我们取第一个 (理论上应该是唯一的)
      return response && response.length > 0 ? response[0] : null;
    } catch (error) {
      console.error(`查找选课(学生ID: ${studentId}, 教师课程ID: ${teacherCourseId})失败:`, error);
      throw error;
    }
  }
};

export default enrollmentService; 