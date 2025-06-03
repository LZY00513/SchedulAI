import api from './api';

const authService = {
  // 用户登录
  login: async (username, password, role = 'ADMIN') => {
    try {
      console.log(`尝试以 ${role} 角色登录，用户名: ${username}`);
      
      // 验证输入
      if (!username) {
        throw new Error('用户名或密码错误');
      }
      if (!password) {
        throw new Error('用户名或密码错误');
      }
      
      // 确保role是字符串类型且为大写
      const loginData = {
        username,
        password,
        role: role ? String(role).toUpperCase() : 'ADMIN'
      };
      
      console.log('发送登录请求数据:', {
        ...loginData,
        password: '***隐藏***'
      });
      
      try {
        const response = await api.post('/auth/login', loginData);
        console.log('登录API响应数据:', response);
        
        // 登录成功后，保存用户信息
        if (response && response.success) {
          // 根据角色使用不同的键存储，支持同时登录不同角色
          const rolePrefix = response.user.role === 'ADMIN' ? 'admin_' : 'student_';
          
          localStorage.setItem(`${rolePrefix}isAuthenticated`, 'true');
          localStorage.setItem(`${rolePrefix}user`, JSON.stringify(response.user));
          localStorage.setItem(`${rolePrefix}userRole`, response.user.role);
          
          console.log('登录成功，用户信息:', response.user);
          console.log('用户角色:', response.user.role);
        } else {
          // API返回成功但响应结构有问题
          console.error('登录API返回异常响应:', response);
          throw new Error('用户名或密码错误');
        }
        
        return response;
      } catch (apiError) {
        console.error('API调用失败:', apiError);
        
        // 尝试使用fetch直接调用
        console.log('尝试使用fetch重试登录...');
        
        try {
          const fetchResponse = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData),
            credentials: 'include'
          });
          
          if (fetchResponse.ok) {
            const data = await fetchResponse.json();
            console.log('fetch登录成功:', data);
            
            if (data.success) {
              // 根据角色使用不同的键存储，支持同时登录不同角色
              const rolePrefix = data.user.role === 'ADMIN' ? 'admin_' : 'student_';
              
              localStorage.setItem(`${rolePrefix}isAuthenticated`, 'true');
              localStorage.setItem(`${rolePrefix}user`, JSON.stringify(data.user));
              localStorage.setItem(`${rolePrefix}userRole`, data.user.role);
              return data;
            } else {
              throw new Error('用户名或密码错误');
            }
          } else {
            console.error('fetch登录失败:', fetchResponse.status);
            throw new Error('用户名或密码错误');
          }
        } catch (fetchError) {
          console.error('fetch登录异常:', fetchError);
          throw new Error('用户名或密码错误');
        }
      }
    } catch (error) {
      console.error('登录失败详情:', error);
      // 无论实际错误是什么，对外都统一显示"用户名或密码错误"
      throw new Error('用户名或密码错误');
    }
  },

  // 用户注册
  register: async (userData) => {
    try {
      console.log('authService.register被调用，userData:', userData);
      
      // 检查必填字段
      const requiredFields = ['username', 'password', 'email', 'name'];
      const missingFields = requiredFields.filter(field => !userData[field]);
      if (missingFields.length > 0) {
        console.error(`注册数据缺少必填字段: ${missingFields.join(', ')}`, userData);
        throw new Error(`注册失败: 请填写 ${missingFields.join(', ')} 字段`);
      }
      
      // 确保role字段正确设置为STUDENT字符串
      userData.role = "STUDENT";
      
      // 处理学生特有字段，确保即使为空也传递为空字符串而非undefined
      const registrationData = {
        ...userData,
        grade: userData.grade || '',
        enrollmentDate: userData.enrollmentDate || '',
        parentName: userData.parentName || '',
        parentPhone: userData.parentPhone || '',
        address: userData.address || '',
        notes: userData.notes || ''
      };
      
      console.log('处理后的注册数据:', {
        ...registrationData,
        password: '***隐藏***'
      });
      
      // 直接使用fetch进行注册，更加透明的错误处理
      console.log('开始发送注册请求...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超时
      
      try {
        const fetchResponse = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(registrationData),
          credentials: 'include',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId); // 清除超时
        
        // 记录响应状态
        console.log('注册请求HTTP状态:', fetchResponse.status);
        
        // 尝试解析响应JSON
        let data;
        const contentType = fetchResponse.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          data = await fetchResponse.json();
          console.log('注册响应数据:', data);
        } else {
          const textResponse = await fetchResponse.text();
          console.log('注册响应(非JSON):', textResponse);
          data = { success: fetchResponse.ok, message: textResponse };
        }
        
        if (fetchResponse.ok) {
          console.log('注册成功!');
          return { ...data, success: true };
        } else {
          console.error('注册失败:', data);
          throw new Error(data.error || `注册失败 (${fetchResponse.status})`);
        }
      } catch (fetchError) {
        clearTimeout(timeoutId); // 清除超时
        console.error('注册请求异常:', fetchError);
        
        if (fetchError.name === 'AbortError') {
          throw new Error('注册请求超时，请稍后重试');
        }
        throw fetchError;
      }
    } catch (error) {
      console.error('注册失败详情:', error);
      throw error;
    }
  },

  // 退出登录
  logout: async (role = null) => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('登出请求失败:', error);
    } finally {
      if (!role) {
        // 获取当前用户角色
        const user = authService.getCurrentUser();
        role = user ? user.role : null;
      }
      
      // 根据角色清除对应的登录信息
      const rolePrefix = role === 'ADMIN' ? 'admin_' : 'student_';
      localStorage.removeItem(`${rolePrefix}isAuthenticated`);
      localStorage.removeItem(`${rolePrefix}user`);
      localStorage.removeItem(`${rolePrefix}userRole`);
    }
  },

  // 获取当前用户信息
  getCurrentUser: (role = null) => {
    // 如果未指定角色，则优先检查当前页面URL确定角色
    if (!role) {
      const isStudentPage = window.location.pathname.includes('/student/');
      role = isStudentPage ? 'STUDENT' : 'ADMIN';
    }
    
    const rolePrefix = role === 'ADMIN' ? 'admin_' : 'student_';
    const user = localStorage.getItem(`${rolePrefix}user`);
    return user ? JSON.parse(user) : null;
  },

  // 检查用户是否已登录
  isAuthenticated: (role = null) => {
    // 如果未指定角色，则优先检查当前页面URL确定角色
    if (!role) {
      const isStudentPage = window.location.pathname.includes('/student/');
      role = isStudentPage ? 'STUDENT' : 'ADMIN';
    }
    
    const rolePrefix = role === 'ADMIN' ? 'admin_' : 'student_';
    return localStorage.getItem(`${rolePrefix}isAuthenticated`) === 'true';
  },

  // 获取JWT令牌 - 暂时不支持多角色
  getToken: () => {
    return localStorage.getItem('token');
  },
  
  // 设置当前用户信息
  setCurrentUser: (user) => {
    if (user) {
      const rolePrefix = user.role === 'ADMIN' ? 'admin_' : 'student_';
      localStorage.setItem(`${rolePrefix}user`, JSON.stringify(user));
      return true;
    }
    return false;
  },
  
  // 检查用户名是否已存在
  checkUsernameExists: async (username) => {
    try {
      console.log(`检查用户名: ${username}`);
      
      // 直接使用fetch替代api
      const response = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('API响应错误: ' + response.status);
      }
      
      // 直接返回解析后的布尔值
      const exists = await response.json();
      console.log(`用户名 ${username} 是否存在:`, exists, typeof exists);
      return exists;
    } catch (error) {
      console.error('检查用户名失败:', error);
      throw error;
    }
  },
  
  // 检查邮箱是否已存在
  checkEmailExists: async (email) => {
    try {
      console.log(`检查邮箱: ${email}`);
      
      // 直接使用fetch替代api
      const response = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('API响应错误: ' + response.status);
      }
      
      // 直接返回解析后的布尔值
      const exists = await response.json();
      console.log(`邮箱 ${email} 是否存在:`, exists, typeof exists);
      return exists;
    } catch (error) {
      console.error('检查邮箱失败:', error);
      throw error;
    }
  },
  
  // 发送密码重置请求
  requestPasswordReset: async (email) => {
    try {
      console.log(`发送密码重置请求: ${email}`);
      
      // 由于目前后端可能没有实现密码重置功能，这里模拟一个成功的响应
      // 实际项目中应该调用真实的API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 在实际项目中这里应该调用真实API:
      // const response = await fetch('/api/auth/request-password-reset', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ email }),
      //   credentials: 'include'
      // });
      // 
      // if (!response.ok) {
      //   throw new Error('密码重置请求失败: ' + response.status);
      // }
      // return await response.json();
      
      // 模拟成功响应
      return {
        success: true,
        message: '重置链接已发送到您的邮箱'
      };
    } catch (error) {
      console.error('发送密码重置请求失败:', error);
      throw error;
    }
  },
  
  // 验证密码重置令牌
  validateResetToken: async (token) => {
    try {
      console.log(`验证密码重置令牌: ${token}`);
      
      // 模拟验证过程
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 这里应该调用真实API验证token
      return {
        success: true,
        message: '令牌有效'
      };
    } catch (error) {
      console.error('验证密码重置令牌失败:', error);
      throw error;
    }
  },
  
  // 重置密码
  resetPassword: async (token, newPassword) => {
    try {
      console.log(`使用令牌重置密码`);
      
      // 模拟重置过程
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // 这里应该调用真实API重置密码
      return {
        success: true,
        message: '密码已成功重置'
      };
    } catch (error) {
      console.error('重置密码失败:', error);
      throw error;
    }
  },
  
  // 简化版重置密码（通过用户名）
  resetPasswordByUsername: async (username) => {
    try {
      console.log(`尝试通过用户名重置密码: ${username}`);
      
      // 检查用户名是否存在
      const exists = await authService.checkUsernameExists(username);
      if (!exists) {
        return {
          success: false,
          message: '该用户不存在，请检查用户名'
        };
      }
      
      // 模拟API调用，这里应该调用后端API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 实际项目中应该调用真实API:
      // const response = await fetch('/api/auth/reset-password-simple', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ username }),
      //   credentials: 'include'
      // });
      // 
      // if (!response.ok) {
      //   throw new Error('密码重置失败: ' + response.status);
      // }
      // return await response.json();
      
      // 模拟成功响应
      return {
        success: true,
        message: '密码已重置为123456，请登录后立即修改密码',
        defaultPassword: '123456'
      };
    } catch (error) {
      console.error('重置密码失败:', error);
      throw error;
    }
  },
  
  // 通过注册信息验证身份重置密码
  verifyIdentityAndResetPassword: async (verificationData) => {
    try {
      console.log('尝试通过身份信息验证重置密码:', verificationData);
      
      // 调用后端API验证身份并重置密码
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(verificationData),
        credentials: 'include'
      });
      
      // 检查响应状态
      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          message: errorData.message || '身份验证失败'
        };
      }
      
      // 解析响应数据
      const data = await response.json();
      console.log('重置密码响应:', data);
      
      // 返回响应结果
      return {
        success: data.success,
        message: data.message,
        defaultPassword: data.defaultPassword
      };
    } catch (error) {
      console.error('身份验证重置密码失败:', error);
      throw error;
    }
  },
  
  // 修改密码
  changePassword: async (username, oldPassword, newPassword) => {
    try {
      console.log('尝试修改密码:', username);
      
      // 调用后端API修改密码
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          oldPassword,
          newPassword
        }),
        credentials: 'include'
      });
      
      // 检查响应状态
      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          message: errorData.message || '修改密码失败'
        };
      }
      
      // 解析响应数据
      const data = await response.json();
      console.log('修改密码响应:', data);
      
      // 返回响应结果
      return {
        success: data.success,
        message: data.message
      };
    } catch (error) {
      console.error('修改密码失败:', error);
      throw error;
    }
  }
};

export default authService; 