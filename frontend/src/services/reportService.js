import api from './api';

const reportService = {
  // 获取教师工作量统计
  getTeacherWorkloadReport: async (params) => {
    try {
      return await api.get('/api/reports/teacher-workload', { params });
    } catch (error) {
      console.error('获取教师工作量统计失败:', error);
      throw error;
    }
  },

  // 获取学生学习时长统计
  getStudentLearningReport: async (params) => {
    try {
      return await api.get('/api/reports/student-learning', { params });
    } catch (error) {
      console.error('获取学生学习时长统计失败:', error);
      throw error;
    }
  },

  // 获取课程受欢迎度统计
  getCoursePopularityReport: async () => {
    try {
      return await api.get('/api/reports/course-popularity');
    } catch (error) {
      console.error('获取课程受欢迎度统计失败:', error);
      throw error;
    }
  },

  // 获取每月课时统计
  getMonthlyLessonsReport: async (year) => {
    try {
      return await api.get('/api/reports/monthly-lessons', { params: { year } });
    } catch (error) {
      console.error('获取每月课时统计失败:', error);
      throw error;
    }
  },

  // 按学生和时间段生成学习报告 (调用现有接口)
  generateStudentReport: async (studentId, startDate, endDate) => {
    try {
      const params = {};
      if (startDate) params.startDate = startDate; // Format YYYY-MM-DD
      if (endDate) params.endDate = endDate; // Format YYYY-MM-DD
      const response = await api.get(`/api/reports/learning/${studentId}`, { params });
      // Assuming the response directly contains LearningReportDTO { reportContent: "..." }
      return response;
    } catch (error) {
      console.error(`获取学生 (ID: ${studentId}) 学习报告失败:`, error);
      throw error;
    }
  },

  // 为单节课生成 AI 评价报告
  generateLessonReport: async (lessonId) => {
    try {
      if (!lessonId) {
          throw new Error("Lesson ID is required to generate a report.");
      }
      // POST request to the new endpoint
      const response = await api.post(`/api/reports/generate/lesson/${lessonId}`);
      // Assuming response directly contains LearningReportDTO or error message string
      return response;
    } catch (error) {
      console.error(`生成课程 (ID: ${lessonId}) 评价报告失败:`, error);
       // Re-throw the error so the component can handle it (e.g., show message)
      throw error; 
    }
  },
  
  // 获取课程的学生评价信息
  getLessonFeedback: async (lessonId) => {
    try {
      if (!lessonId) {
          throw new Error("Lesson ID is required to get feedback.");
      }
      const response = await api.get(`/api/reports/lesson/${lessonId}/feedback`);
      return response;
    } catch (error) {
      console.error(`获取课程 (ID: ${lessonId}) 的学生评价失败:`, error);
      throw error;
    }
  }
};

export default reportService; 