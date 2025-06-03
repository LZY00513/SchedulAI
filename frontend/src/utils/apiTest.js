/**
 * 可用时间API测试工具
 * 这个工具用于测试学生和教师可用时间的API
 */

import { teacherAvailabilityService, studentAvailabilityService } from '../services';

const ApiTestUtils = {
  /**
   * 测试获取学生可用时间
   * @param {number} studentId 学生ID
   */
  testGetStudentAvailability: async (studentId) => {
    try {
      console.log(`正在测试获取学生(${studentId})可用时间...`);
      const data = await studentAvailabilityService.getStudentAvailability(studentId);
      console.log('获取成功:', data);
      console.log(`共获取到 ${data.length} 条学生可用时间记录`);
      return data;
    } catch (error) {
      console.error('测试失败:', error);
      throw error;
    }
  },

  /**
   * 测试添加学生可用时间
   * @param {number} studentId 学生ID
   * @param {object} availabilityData 可用时间数据
   */
  testAddStudentAvailability: async (studentId, availabilityData) => {
    try {
      console.log(`正在测试添加学生(${studentId})可用时间...`);
      console.log('添加数据:', availabilityData);
      const result = await studentAvailabilityService.addStudentAvailability(studentId, availabilityData);
      console.log('添加结果:', result);
      return result;
    } catch (error) {
      console.error('测试失败:', error);
      throw error;
    }
  },

  /**
   * 测试批量更新学生可用时间
   * @param {number} studentId 学生ID
   * @param {array} availabilityList 可用时间数据数组
   */
  testBatchUpdateStudentAvailability: async (studentId, availabilityList) => {
    try {
      console.log(`正在测试批量更新学生(${studentId})可用时间...`);
      console.log('更新数据:', availabilityList);
      const result = await studentAvailabilityService.batchUpdateStudentAvailability(studentId, availabilityList);
      console.log('更新结果:', result);
      return result;
    } catch (error) {
      console.error('测试失败:', error);
      throw error;
    }
  },

  /**
   * 测试获取教师可用时间
   * @param {number} teacherId 教师ID
   */
  testGetTeacherAvailability: async (teacherId) => {
    try {
      console.log(`正在测试获取教师(${teacherId})可用时间...`);
      const data = await teacherAvailabilityService.getTeacherAvailability(teacherId);
      console.log('获取成功:', data);
      console.log(`共获取到 ${data.length} 条教师可用时间记录`);
      return data;
    } catch (error) {
      console.error('测试失败:', error);
      throw error;
    }
  },

  /**
   * 测试添加教师可用时间
   * @param {number} teacherId 教师ID
   * @param {object} availabilityData 可用时间数据
   */
  testAddTeacherAvailability: async (teacherId, availabilityData) => {
    try {
      console.log(`正在测试添加教师(${teacherId})可用时间...`);
      console.log('添加数据:', availabilityData);
      const result = await teacherAvailabilityService.addTeacherAvailability(teacherId, availabilityData);
      console.log('添加结果:', result);
      return result;
    } catch (error) {
      console.error('测试失败:', error);
      throw error;
    }
  },

  /**
   * 测试批量更新教师可用时间
   * @param {number} teacherId 教师ID
   * @param {array} availabilityList 可用时间数据数组
   */
  testBatchUpdateTeacherAvailability: async (teacherId, availabilityList) => {
    try {
      console.log(`正在测试批量更新教师(${teacherId})可用时间...`);
      console.log('更新数据:', availabilityList);
      const result = await teacherAvailabilityService.batchUpdateTeacherAvailability(teacherId, availabilityList);
      console.log('更新结果:', result);
      return result;
    } catch (error) {
      console.error('测试失败:', error);
      throw error;
    }
  },

  /**
   * 测试更新教师单个可用时间
   * @param {number} availabilityId 可用时间ID
   * @param {object} availabilityData 可用时间数据
   */
  testUpdateTeacherAvailability: async (availabilityId, availabilityData) => {
    try {
      console.log(`正在测试更新教师可用时间(${availabilityId})...`);
      console.log('更新数据:', availabilityData);
      const result = await teacherAvailabilityService.updateTeacherAvailability(availabilityId, availabilityData);
      console.log('更新结果:', result);
      return result;
    } catch (error) {
      console.error('测试失败:', error);
      throw error;
    }
  },

  /**
   * 测试删除教师可用时间
   * @param {number} availabilityId 可用时间ID
   */
  testDeleteTeacherAvailability: async (availabilityId) => {
    try {
      console.log(`正在测试删除教师可用时间(${availabilityId})...`);
      const result = await teacherAvailabilityService.deleteTeacherAvailability(availabilityId);
      console.log('删除结果:', result);
      return result;
    } catch (error) {
      console.error('测试失败:', error);
      throw error;
    }
  },

  /**
   * 测试示例，可在浏览器控制台运行
   */
  runTestExample: async () => {
    console.log('开始测试可用时间API...');
    const studentId = 1; // 替换为实际学生ID
    const teacherId = 2; // 替换为实际教师ID
    
    try {
      // 测试获取数据
      await ApiTestUtils.testGetStudentAvailability(studentId);
      await ApiTestUtils.testGetTeacherAvailability(teacherId);
      
      // 测试添加数据
      const studentAvailability = {
        dayOfWeek: 'MONDAY',
        startTime: '14:00:00',
        endTime: '16:00:00',
        isAvailable: true
      };
      
      const teacherAvailability = {
        dayOfWeek: 'TUESDAY',
        startTime: '09:00:00',
        endTime: '11:00:00',
        isAvailable: true
      };
      
      await ApiTestUtils.testAddStudentAvailability(studentId, studentAvailability);
      await ApiTestUtils.testAddTeacherAvailability(teacherId, teacherAvailability);
      
      console.log('API测试完成');
    } catch (error) {
      console.error('API测试过程中发生错误:', error);
    }
  }
};

export default ApiTestUtils; 