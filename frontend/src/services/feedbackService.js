import api from './api';

const feedbackService = {
  // 获取指定课程的所有评价
  getLessonFeedbacks: async (lessonId) => {
    try {
      const response = await api.get(`/api/feedbacks/lesson/${lessonId}`);
      return response;
    } catch (error) {
      console.error(`获取课程(ID: ${lessonId})评价失败:`, error);
      throw error;
    }
  },

  // 获取学生的所有评价
  getStudentFeedbacks: async (studentId) => {
    try {
      const response = await api.get(`/api/feedbacks/student/${studentId}`);
      return response;
    } catch (error) {
      console.error(`获取学生(ID: ${studentId})评价失败:`, error);
      throw error;
    }
  },

  // 创建或更新评价
  createOrUpdateFeedback: async (feedbackData) => {
    try {
      const response = await api.post('/api/feedbacks', feedbackData);
      return response;
    } catch (error) {
      console.error('创建/更新评价失败:', error);
      throw error;
    }
  },

  // 删除评价
  deleteFeedback: async (feedbackId) => {
    try {
      const response = await api.delete(`/api/feedbacks/${feedbackId}`);
      return response;
    } catch (error) {
      console.error(`删除评价(ID: ${feedbackId})失败:`, error);
      throw error;
    }
  }
};

export default feedbackService; 