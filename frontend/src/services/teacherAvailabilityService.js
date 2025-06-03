import api from './api';

const teacherAvailabilityService = {
  // 获取指定教师的可用时间列表
  getTeacherAvailability: async (teacherId) => {
    try {
      // Ensure teacherId is provided
      if (!teacherId) {
          console.warn("getTeacherAvailability called without teacherId");
          return []; // Return empty array or handle as appropriate
      }
      
      console.log(`正在获取教师(ID: ${teacherId})的可用时间设置...`);
      
      const response = await api.get(`/api/teacher-availabilities/teacher/${teacherId}`, {
        timeout: 10000
      });
      
      // 验证返回的数据是数组
      if (Array.isArray(response)) {
        console.log(`成功获取教师(ID: ${teacherId})的可用时间，计数: ${response.length}`);
        
        // 验证每条数据的有效性，特别是星期值
        const validDaysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
        
        // 使用新的DTO结构，已经包含所有必要字段
        const validatedData = response.map(item => {
          // 使用新的DTO结构中的字段，无需额外转换
          const dayOfWeek = item.dayOfWeek || 'MONDAY';
          
          // 验证星期值
          if (!validDaysOfWeek.includes(dayOfWeek)) {
            console.warn(`接收到的星期值 ('${dayOfWeek}') 无效，已自动更正为: 'MONDAY'. 原始item:`, item);
          }
          
          // 验证并标准化时间格式
          const validateTimeFormat = (timeStr) => {
            if (!timeStr || typeof timeStr !== 'string') return '00:00:00';
            // 确保时间格式为 HH:mm:ss
            if (timeStr.length === 5) return `${timeStr}:00`;
            if (timeStr.length === 8) return timeStr;
            return '00:00:00';
          };
          
          // 直接返回新的DTO结构字段，同时进行验证
          return {
            id: item.id,
            teacherId: item.teacherId,
            teacherName: item.teacherName,
            dayOfWeek: validDaysOfWeek.includes(dayOfWeek) ? dayOfWeek : 'MONDAY',
            dayOfWeekDisplay: item.dayOfWeekDisplay || '星期一',
            startTime: validateTimeFormat(item.startTime),
            endTime: validateTimeFormat(item.endTime),
            timeRange: item.timeRange || '00:00-00:00',
            isAvailable: item.isAvailable !== false
          };
        });
        
        console.log(`数据验证后的有效记录数: ${validatedData.length}`);
        return validatedData;
      }
      
      console.warn(`获取教师(ID: ${teacherId})的可用时间返回了非数组数据:`, response);
      return [];
    } catch (error) {
      console.error(`获取教师 (ID: ${teacherId}) 可用时间失败:`, error);
      return []; // 优先返回空数组而非抛出错误
    }
  },

  // 批量更新教师的可用时间列表
  batchUpdateTeacherAvailability: async (teacherId, availabilityList) => {
    try {
       // Ensure teacherId is provided
      if (!teacherId) {
          throw new Error("Teacher ID is required for batch update.");
      }
      
      if (!Array.isArray(availabilityList) || availabilityList.length === 0) {
        console.warn(`批量更新教师(ID: ${teacherId})可用时间时收到空数组或非数组数据`);
        return { success: false, message: "无有效的可用时间数据" };
      }
      
      console.log(`正在批量更新教师(ID: ${teacherId})的可用时间，数据条数: ${availabilityList.length}`);
      
      // 验证每个时间段的格式
      const validDaysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
      const validAvailabilities = availabilityList.map(slot => {
        // 验证星期值
        const dayOfWeek = slot.dayOfWeek && validDaysOfWeek.includes(slot.dayOfWeek) 
            ? slot.dayOfWeek 
            : null;
            
        if (!dayOfWeek) {
          console.warn(`跳过无效星期值的时间段: ${slot.dayOfWeek}`);
          return null;
        }
        
        // 验证并标准化时间格式
        const validateTimeFormat = (timeStr) => {
          if (!timeStr || typeof timeStr !== 'string') return null;
          // 确保时间格式为 HH:mm:ss
          if (timeStr.length === 5) return `${timeStr}:00`;
          if (timeStr.length === 8) return timeStr;
          return null;
        };
        
        const startTime = validateTimeFormat(slot.startTime);
        const endTime = validateTimeFormat(slot.endTime);
        
        if (!startTime || !endTime) {
          console.warn(`跳过时间格式无效的时间段: ${slot.startTime} - ${slot.endTime}`);
          return null;
        }
        
        // 只保留后端需要的字段，不需要传回所有DTO字段
        return {
          id: slot.id, // 如果有ID则传回，用于更新
          dayOfWeek: dayOfWeek,
          startTime: startTime,
          endTime: endTime,
          isAvailable: slot.isAvailable !== false
        };
      }).filter(Boolean); // 过滤掉null值
      
      if (validAvailabilities.length === 0) {
        console.warn(`批量更新教师(ID: ${teacherId})可用时间时所有数据都无效`);
        return { success: false, message: "所有时间段数据无效" };
      }
      
      console.log(`实际发送的有效时间段数据: ${validAvailabilities.length}`, validAvailabilities);
      
      const response = await api.put(`/api/teacher-availabilities/teacher/${teacherId}/batch`, validAvailabilities, {
        timeout: 15000
      });
      
      console.log(`成功批量更新教师(ID: ${teacherId})的可用时间`);
      return { success: true, data: response };
    } catch (error) {
      console.error(`批量更新教师 (ID: ${teacherId}) 可用时间失败:`, error);
      return { success: false, message: error.message || "更新失败" };
    }
  },

  // 添加单个教师可用时间段
  addTeacherAvailability: async (teacherId, availabilityData) => {
    try {
      if (!teacherId) {
        throw new Error("Teacher ID is required.");
      }
      
      // 验证必要字段
      const validDaysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
      if (!availabilityData || 
          !availabilityData.dayOfWeek || 
          !validDaysOfWeek.includes(availabilityData.dayOfWeek) ||
          !availabilityData.startTime || 
          !availabilityData.endTime) {
        console.warn(`添加教师(ID: ${teacherId})可用时间时数据无效:`, availabilityData);
        return { success: false, message: "无效的可用时间数据" };
      }
      
      // 验证并标准化时间格式
      const validateTimeFormat = (timeStr) => {
        if (!timeStr || typeof timeStr !== 'string') return null;
        // 确保时间格式为 HH:mm:ss
        if (timeStr.length === 5) return `${timeStr}:00`;
        if (timeStr.length === 8) return timeStr;
        return null;
      };
      
      const startTime = validateTimeFormat(availabilityData.startTime);
      const endTime = validateTimeFormat(availabilityData.endTime);
      
      if (!startTime || !endTime) {
        console.warn(`添加教师(ID: ${teacherId})可用时间时时间格式无效: ${availabilityData.startTime} - ${availabilityData.endTime}`);
        return { success: false, message: "无效的时间格式" };
      }
      
      // 清理数据，只保留必要字段
      const cleanData = {
        dayOfWeek: availabilityData.dayOfWeek,
        startTime: startTime,
        endTime: endTime,
        isAvailable: availabilityData.isAvailable !== false
      };
      
      console.log(`正在添加教师(ID: ${teacherId})的可用时间:`, cleanData);
      
      const response = await api.post(`/api/teacher-availabilities/teacher/${teacherId}`, cleanData);
      
      console.log(`成功添加教师(ID: ${teacherId})的可用时间`);
      return { success: true, data: response };
    } catch (error) {
      console.error(`添加教师 (ID: ${teacherId}) 可用时间失败:`, error);
      return { success: false, message: error.message || "添加失败" };
    }
  },

  // 更新单个教师可用时间段
  updateTeacherAvailability: async (availabilityId, availabilityData) => {
    try {
      if (!availabilityId) {
        throw new Error("Availability ID is required for update.");
      }
      
      // 验证必要字段
      const validDaysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
      if (!availabilityData || 
          !availabilityData.dayOfWeek || 
          !validDaysOfWeek.includes(availabilityData.dayOfWeek) ||
          !availabilityData.startTime || 
          !availabilityData.endTime) {
        console.warn(`更新教师可用时间(ID: ${availabilityId})时数据无效:`, availabilityData);
        return { success: false, message: "无效的可用时间数据" };
      }
      
      // 验证并标准化时间格式
      const validateTimeFormat = (timeStr) => {
        if (!timeStr || typeof timeStr !== 'string') return null;
        // 确保时间格式为 HH:mm:ss
        if (timeStr.length === 5) return `${timeStr}:00`;
        if (timeStr.length === 8) return timeStr;
        return null;
      };
      
      const startTime = validateTimeFormat(availabilityData.startTime);
      const endTime = validateTimeFormat(availabilityData.endTime);
      
      if (!startTime || !endTime) {
        console.warn(`更新教师可用时间(ID: ${availabilityId})时时间格式无效: ${availabilityData.startTime} - ${availabilityData.endTime}`);
        return { success: false, message: "无效的时间格式" };
      }
      
      // 清理数据，只保留必要字段
      const cleanData = {
        id: availabilityId,
        dayOfWeek: availabilityData.dayOfWeek,
        startTime: startTime,
        endTime: endTime,
        isAvailable: availabilityData.isAvailable !== false
      };
      
      console.log(`正在更新教师可用时间(ID: ${availabilityId}):`, cleanData);
      
      const response = await api.put(`/api/teacher-availabilities/${availabilityId}`, cleanData);
      
      console.log(`成功更新教师可用时间(ID: ${availabilityId})`);
      return { success: true, data: response };
    } catch (error) {
      console.error(`更新教师可用时间(ID: ${availabilityId})失败:`, error);
      return { success: false, message: error.message || "更新失败" };
    }
  },

  // 删除单个教师可用时间段
  deleteTeacherAvailability: async (availabilityId) => {
    try {
      if (!availabilityId) {
        throw new Error("Availability ID is required for deletion.");
      }
      
      console.log(`正在删除教师可用时间(ID: ${availabilityId})`);
      
      await api.delete(`/api/teacher-availabilities/${availabilityId}`);
      
      console.log(`成功删除教师可用时间(ID: ${availabilityId})`);
      return { success: true };
    } catch (error) {
      console.error(`删除教师可用时间(ID: ${availabilityId})失败:`, error);
      return { success: false, message: error.message || "删除失败" };
    }
  }
};

export default teacherAvailabilityService; 