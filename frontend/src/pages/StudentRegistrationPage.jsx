import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, Button, Card, Typography, message, Steps, Select, DatePicker, Modal, Result, Space } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { Step } = Steps;

const StudentRegistrationPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({}); // 存储所有步骤的表单数据
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [countDown, setCountDown] = useState(5);
  const navigate = useNavigate();
  
  // 创建一个ref来存储当前的AbortController
  const abortControllerRef = useRef(null);
  
  // 测试函数：直接输出表单内容
  const testFormData = () => {
    const values = form.getFieldsValue(true); // 获取全部字段
    console.log('当前表单内容:', values);
    message.info('表单数据已输出到控制台');
  };
  
  // 测试直接调用API
  const testDirectApiCall = async () => {
    try {
      const values = form.getFieldsValue(true); // 获取全部字段
      setLoading(true);
      message.info('正在尝试直接调用API...');
      
      // 直接使用fetch调用API
      const response = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: values.username || 'testuser' + Math.floor(Math.random() * 1000),
          password: values.password || 'password123',
          name: values.name || '测试用户',
          email: values.email || 'test' + Math.floor(Math.random() * 1000) + '@example.com',
          role: 'STUDENT'
        }),
        credentials: 'include'
      });
      
      const data = await response.json();
      console.log('直接API调用响应:', data);
      
      if (data.success) {
        message.success('API调用成功!');
      } else {
        message.error('API调用失败: ' + (data.error || '未知错误'));
      }
    } catch (error) {
      console.error('直接API调用异常:', error);
      message.error('API调用异常: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const showSuccessModal = () => {
    setTimeout(() => {
      Modal.success({
        title: '注册成功',
        content: (
          <div>
            <p>您已成功注册为学生账号！</p>
            <p>请记住您的用户名和密码，现在可以登录系统了。</p>
            <p>3秒后将自动跳转到登录页面...</p>
          </div>
        ),
        onOk: () => {
          navigate('/student/login');
        },
        okText: '立即登录',
        zIndex: 1500
      });
      
      // 3秒后自动跳转到登录页面
      setTimeout(() => {
        navigate('/student/login');
      }, 3000);
    }, 100);
  };
  
  const onFinish = async (values) => {
    // 直接输出调试信息
    console.log('表单提交了！值为:', values);
    
    // 在提交开始时设置loading状态，避免重复提交
    if (loading) {
      console.log('表单已经在提交中，忽略重复提交');
      return;
    }
    
    // 获取表单完整数据（确保所有步骤的数据都包含）
    const allFormData = { ...formData, ...values };
    console.log('获取完整表单数据(合并formData):', allFormData);
    
    // 检查必填字段
    const requiredFields = ['username', 'password', 'email', 'name', 'parentName', 'parentPhone'];
    const missingFields = requiredFields.filter(field => !allFormData[field]);
    
    if (missingFields.length > 0) {
      message.error(`以下必填字段缺失: ${missingFields.join(', ')}`);
      console.error('缺少必填字段:', missingFields, allFormData);
      setLoading(false);
      return;
    }
    
    // 检查所有字段类型
    for (const field of requiredFields) {
      console.log(`字段 ${field} 的值:`, allFormData[field], `类型:`, typeof allFormData[field]);
    }
    
    // 显示加载中消息，持续到请求完成
    const loadingKey = 'registerLoading';
    message.loading({ content: '正在提交注册信息...', key: loadingKey, duration: 0 });
    
    try {
      // 设置loading状态
      setLoading(true);
      
      // 删除confirmPassword字段，因为后端不需要它
      const { confirmPassword, ...userData } = allFormData;
      
      // 确保注册为学生角色 - 使用枚举值
      const registerData = {
        ...userData,
        role: "STUDENT", // 确保后端接收的是枚举字符串，大写
        enrollmentDate: userData.enrollmentDate ? userData.enrollmentDate.format('YYYY-MM-DD') : null,
        // 确保以下字段即使为空也以字符串形式传递
        grade: userData.grade || '',
        parentName: userData.parentName || '',
        parentPhone: userData.parentPhone || '',
        address: userData.address || '',
        notes: userData.notes || ''
      };
      
      // 再次确认关键字段存在
      console.log('最终注册数据字段检查:', {
        username: !!registerData.username,
        password: !!registerData.password,
        email: !!registerData.email,
        name: !!registerData.name,
        parentName: !!registerData.parentName,
        parentPhone: !!registerData.parentPhone,
        role: registerData.role
      });
      
      console.log('发送到后端的注册数据:', {
        ...registerData,
        password: '***隐藏***'
      });
      
      // 使用简化的fetch请求
      console.log('开始发送注册请求...');
      const requestBody = JSON.stringify(registerData);
      console.log('请求体:', requestBody);
      
      const response = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody,
        credentials: 'include',
      });
      
      console.log('注册请求状态码:', response.status);
      console.log('响应头:', Object.fromEntries([...response.headers.entries()]));
      
      // 尝试解析响应
      let data;
      try {
        data = await response.json();
        console.log('注册响应数据:', data);
      } catch (e) {
        console.error('解析响应JSON失败:', e);
        data = { success: response.ok };
        
        if (response.ok) {
          console.log('响应解析失败但状态码表示成功');
        }
      }
      
      // 关闭加载消息
      message.destroy(loadingKey);
      
      if (response.ok && (data.success === true || response.status === 200)) {
        // 显示成功消息
        message.success('注册成功！');
        console.log('注册成功，返回用户信息:', data.user);
        
        // 显示成功弹窗
        showSuccessModal();
      } else {
        console.error('注册失败:', data);
        
        // 显示错误消息
        message.error({ 
          content: data.error || '注册失败，请稍后重试', 
          key: loadingKey,
          duration: 3
        });
        
        // 更详细的错误信息弹窗
        Modal.error({
          title: '注册失败',
          content: data.error || `服务器错误 (${response.status})`,
          okText: '确定'
        });
      }
    } catch (error) {
      console.error('注册请求异常:', error);
      
      // 关闭加载消息
      message.destroy(loadingKey);
      
      // 显示错误消息
      message.error({ 
        content: '注册请求发生错误: ' + error.message, 
        key: loadingKey,
        duration: 3
      });
      
      Modal.error({
        title: '注册请求异常',
        content: error.message || '网络错误，请检查网络连接',
        okText: '确定'
      });
    } finally {
      // 无论如何都确保loading状态结束
      setLoading(false);
    }
  };
  
  const nextStep = async () => {
    try {
      if (currentStep === 0) {
        // 验证第一步的字段
        await form.validateFields(['username', 'password', 'confirmPassword', 'email']);
        
        // 保存第一步数据
        const stepOneData = form.getFieldsValue(['username', 'password', 'confirmPassword', 'email']);
        setFormData(prev => ({ ...prev, ...stepOneData }));
        console.log('保存第一步数据:', stepOneData);
        
        setCurrentStep(currentStep + 1);
      } else if (currentStep === 1) {
        // 验证第二步的字段
        await form.validateFields(['name', 'phone', 'grade', 'enrollmentDate']);
        
        // 保存第二步数据
        const stepTwoData = form.getFieldsValue(['name', 'phone', 'grade', 'enrollmentDate']);
        setFormData(prev => ({ ...prev, ...stepTwoData }));
        console.log('保存第二步数据:', stepTwoData);
        
        setCurrentStep(currentStep + 1);
        
        // 在切换到第三步时，确保前两步的数据被保留
        setTimeout(() => {
          form.setFieldsValue(formData);
        }, 100);
      }
    } catch (error) {
      console.error('表单验证失败:', error);
      message.error('请完成必填项再继续');
    }
  };
  
  const prevStep = () => {
    if (currentStep === 2) {
      // 保存第三步已填写的数据
      const stepThreeData = form.getFieldsValue(['parentName', 'parentPhone', 'address', 'notes']);
      setFormData(prev => ({ ...prev, ...stepThreeData }));
      console.log('保存第三步数据:', stepThreeData);
    } else if (currentStep === 1) {
      // 保存第二步已填写的数据
      const stepTwoData = form.getFieldsValue(['name', 'phone', 'grade', 'enrollmentDate']);
      setFormData(prev => ({ ...prev, ...stepTwoData }));
      console.log('保存第二步数据:', stepTwoData);
    }
    
    // 切换到上一步
    setCurrentStep(currentStep - 1);
    
    // 恢复之前的数据
    setTimeout(() => {
      form.setFieldsValue(formData);
    }, 100);
  };
  
  // 自定义验证器 - 确认密码
  const validateConfirmPassword = ({ getFieldValue }) => ({
    validator(_, value) {
      if (!value || getFieldValue('password') === value) {
        return Promise.resolve();
      }
      return Promise.reject(new Error('两次输入的密码不一致'));
    },
  });
  
  // 自定义验证器 - 检查用户名是否可用
  const validateUsername = async (_, value) => {
    if (!value) {
      return Promise.reject(new Error('请输入用户名'));
    }
    
    try {
      console.log('调用checkUsernameExists，检查用户名:', value);
      
      // 直接使用fetch替代authService.checkUsernameExists
      const response = await fetch(`http://localhost:8080/api/auth/check-username?username=${encodeURIComponent(value)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        console.error('检查用户名API响应错误:', response.status);
        return Promise.resolve(); // 允许通过，后端会再次验证
      }
      
      // 解析响应数据
      const exists = await response.json();
      console.log('检查用户名结果:', exists, typeof exists);
      
      if (exists === true) {
        return Promise.reject(new Error('用户名已被使用'));
      }
      return Promise.resolve();
    } catch (error) {
      console.error('检查用户名失败:', error);
      return Promise.resolve(); // 允许通过，后端会再次验证
    }
  };
  
  // 表单提交前检查所有字段是否填写完整
  const handleSubmit = async () => {
    try {
      // 如果已经在提交中，不要重复提交
      if (loading) {
        console.log('已经在提交中，忽略重复点击');
        return false;
      }
      
      console.log('提交按钮被点击');
      
      // 首先保存当前步骤（第三步）的表单数据
      const stepThreeData = form.getFieldsValue(['parentName', 'parentPhone', 'address', 'notes']);
      setFormData(prev => ({ ...prev, ...stepThreeData }));
      console.log('保存第三步数据(家长信息):', stepThreeData);
      
      // 给React一点时间来更新状态
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 验证当前步骤的表单
      await form.validateFields(['parentName', 'parentPhone']);
      
      // 获取完整表单数据并检查必填字段
      const allValues = form.getFieldsValue(true);
      console.log('提交前检查完整表单数据:', allValues);
      
      // 特别打印关键字段
      console.log('关键字段检查:', {
        username: allValues.username,
        password: allValues.password,
        email: allValues.email,
        name: allValues.name,
        parentName: allValues.parentName,
        parentPhone: allValues.parentPhone,
        hasUsername: !!allValues.username,
        hasPassword: !!allValues.password,
        hasEmail: !!allValues.email,
        hasName: !!allValues.name,
        hasParentName: !!allValues.parentName,
        hasParentPhone: !!allValues.parentPhone
      });
      
      // 合并当前表单和已保存的表单数据
      const mergedData = { ...formData, ...stepThreeData, ...allValues };
      console.log('合并后的完整表单数据:', mergedData);
      
      // 验证关键字段是否存在
      const requiredFields = ['username', 'password', 'email', 'name', 'parentName', 'parentPhone'];
      const missingFields = requiredFields.filter(field => !mergedData[field]);
      
      if (missingFields.length > 0) {
        // 如果缺少必填字段，提示用户并跳转回相应步骤
        const missingStep = missingFields.some(field => ['username', 'password', 'email'].includes(field))
          ? 0  // 用户名、密码、邮箱在第一步
          : missingFields.some(field => ['name'].includes(field))
            ? 1  // 姓名在第二步
            : 2; // 家长信息在第三步
            
        message.error(`请补充填写以下必填信息: ${missingFields.join(', ')}`);
        console.error('缺少必填字段:', missingFields);
        setCurrentStep(missingStep);
        return false;
      }
      
      // 手动设置合并后的数据回表单，确保提交时包含所有字段
      form.setFieldsValue(mergedData);
      
      // 立即设置加载状态，防止重复点击
      setLoading(true);
      
      // 触发表单提交，使用setTimeout确保UI状态更新
      setTimeout(() => {
        form.submit();
      }, 100);
      
      return true;
    } catch (error) {
      console.error('提交前验证失败:', error);
      message.error('请检查表单填写是否完整');
      return false;
    }
  };
  
  // 测试API连接
  const testApiConnection = async () => {
    try {
      const key = 'apiTest';
      message.loading({ content: '正在测试与后端的连接...', key });
      
      // 创建请求controller，用于超时处理
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      // 测试后端健康检查接口
      console.log('开始测试API连接');
      const response = await fetch('http://localhost:8080/api/auth/check-username?username=apitest', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        // 解析布尔值
        const exists = await response.json();
        console.log('API测试响应:', exists, typeof exists);
        
        // 更新UI显示连接成功
        message.success({ 
          content: `后端API连接正常 (${response.status})，返回值: ${exists}`,
          key, 
          duration: 3 
        });
        
        // 立即尝试取消注册按钮的加载状态
        if (loading) {
          setTimeout(() => {
            if (loading) {
              stopLoading();
              message.warning('检测到表单提交状态卡住，已自动重置');
            }
          }, 500);
        }
        
        return true;
      } else {
        // 更新UI显示连接失败
        message.error({ 
          content: `API连接失败，HTTP状态码: ${response.status}`,
          key,
          duration: 3
        });
        console.error('API测试失败:', response.status, response.statusText);
        
        // 尝试解析错误
        try {
          const errorData = await response.json();
          console.error('错误响应:', errorData);
        } catch (e) {
          console.error('无法解析错误响应');
        }
        
        return false;
      }
    } catch (error) {
      // 处理网络错误或超时
      const errorMessage = error.name === 'AbortError' 
        ? 'API连接超时，请检查后端服务是否正常运行'
        : `API连接失败: ${error.message}`;
      
      message.error(errorMessage);
      console.error('API测试异常:', error);
      
      // 如果按钮一直在转，尝试重置
      if (loading) {
        stopLoading();
        message.warning('检测到表单提交状态卡住，已自动重置');
      }
      
      return false;
    }
  };
  
  // 一键注册函数 - 自动填充所有字段
  const quickRegister = async () => {
    try {
      // 先保存当前已有的表单数据
      const currentValues = form.getFieldsValue();
      
      // 创建完整的测试数据（保留用户已填写的数据）
      const testData = {
        username: currentValues.username || 'student' + Math.floor(Math.random() * 10000),
        password: currentValues.password || '123456',
        confirmPassword: currentValues.password || '123456',
        email: currentValues.email || 'student' + Math.floor(Math.random() * 10000) + '@example.com',
        name: currentValues.name || '测试学生',
        phone: currentValues.phone || '13800138000',
        grade: currentValues.grade || 'primary_1',
        enrollmentDate: currentValues.enrollmentDate || null,
        parentName: currentValues.parentName || '测试家长',
        parentPhone: currentValues.parentPhone || '13800138000',
        address: currentValues.address || '测试地址',
        notes: currentValues.notes || '测试备注'
      };
      
      // 填充表单
      form.setFieldsValue(testData);
      message.success('已自动填充测试数据');
      
      // 避免正在进行的请求
      if (loading) {
        message.warning('有请求正在进行中，请先等待或取消');
        return;
      }
      
      // 立即设置加载状态
      setLoading(true);
      
      // 延迟提交，确保UI已更新
      setTimeout(() => {
        if (!loading) {
          form.submit();
        }
      }, 500);
    } catch (error) {
      console.error('一键注册失败:', error);
      message.error('一键注册失败: ' + error.message);
      setLoading(false);
    }
  };
  
  // 当表单任何字段变化时自动保存
  const handleFormChange = (changedValues, allValues) => {
    // 只在非空值时更新formData状态
    const nonEmptyChanges = Object.entries(changedValues)
      .filter(([_, value]) => value !== undefined && value !== '')
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
    
    if (Object.keys(nonEmptyChanges).length > 0) {
      setFormData(prev => ({ ...prev, ...nonEmptyChanges }));
    }
  };
  
  // 组件挂载时初始化
  useEffect(() => {
    // 如果有缓存的表单数据，恢复它
    if (Object.keys(formData).length > 0) {
      form.setFieldsValue(formData);
    }
    
    // 测试后端连接
    testBackendConnection();
  }, []);
  
  // 自动测试后端连接
  const testBackendConnection = async () => {
    try {
      // 发送简单的健康检查请求
      const response = await fetch('http://localhost:8080/api/auth/check-username?username=testconnection', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        signal: AbortSignal.timeout(3000) // 3秒超时
      });
      
      if (response.ok) {
        console.log('后端服务连接正常');
        // 可以在页面显示连接状态
      } else {
        console.error('后端服务连接异常，状态码:', response.status);
        message.error('无法连接到后端服务，请检查服务是否启动');
      }
    } catch (error) {
      console.error('后端连接测试失败:', error);
      message.error('检测到后端服务连接问题，注册功能可能不可用');
    }
  };
  
  // 重置表单和状态
  const resetForm = () => {
    form.resetFields();
    setFormData({});
    setLoading(false);
    setCurrentStep(0);
    message.success('表单已重置，请重新填写');
  };
  
  // 停止加载状态的函数
  const stopLoading = () => {
    if (loading) {
      // 如果有活跃的请求控制器，中断它
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        try {
          console.log('用户手动中止请求');
          abortControllerRef.current.abort('用户取消请求');
        } catch (e) {
          console.error('中止请求时发生错误:', e);
        }
      }
      
      // 重置状态
      setLoading(false);
      abortControllerRef.current = null;
      
      // 显示提示消息
      message.info({
        content: '操作已取消，表单已解锁',
        duration: 2
      });
      
      // 检查注册按钮是否一直在转
      if (document.querySelector('button[type="primary"][loading=true]')) {
        // 强制重置页面状态
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    }
  };
  
  // 直接测试注册功能
  const testRegistration = async () => {
    try {
      // 显示加载中消息
      const key = 'testRegister';
      message.loading({ content: '测试注册中...', key });
      
      // 生成随机测试数据
      const randomNum = Math.floor(Math.random() * 100000);
      const testData = {
        username: `teststudent${randomNum}`,
        password: "123456",
        name: "测试学生",
        email: `teststudent${randomNum}@example.com`,
        role: "STUDENT",
        grade: "primary_1",
        parentName: "测试家长",
        parentPhone: "13800138000",
        address: "测试地址",
        notes: "测试备注"
      };
      
      console.log('发送测试注册数据:', {
        ...testData,
        password: '***隐藏***'
      });
      
      // 直接发送请求，使用纯fetch API，避免任何复杂的错误处理
      const response = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
        credentials: 'include'
      });
      
      console.log('测试注册状态码:', response.status);
      
      // 尝试解析响应数据
      try {
        const data = await response.json();
        console.log('测试注册响应:', data);
        
        if (data.success) {
          message.success({ content: '测试注册成功!', key, duration: 3 });
          return true;
        } else {
          message.error({ content: '测试注册失败: ' + (data.error || '未知错误'), key, duration: 3 });
          return false;
        }
      } catch (e) {
        console.error('解析响应数据失败:', e);
        
        if (response.ok) {
          message.success({ content: '请求成功但无法解析响应', key, duration: 3 });
          return true;
        } else {
          message.error({ content: `请求失败，状态码: ${response.status}`, key, duration: 3 });
          return false;
        }
      }
    } catch (error) {
      console.error('测试注册异常:', error);
      message.error('测试注册异常: ' + error.message);
      return false;
    }
  };
  
  // 彻底检查后端服务器状态
  const pingServer = async () => {
    try {
      const key = 'pingServer';
      message.loading({ content: '正在全面检查后端连接...', key });
      
      // 检查1: 简单ping
      console.log('检查1: 简单ping...');
      try {
        const response = await fetch('http://localhost:8080/api/auth/check-username?username=ping', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          signal: AbortSignal.timeout(3000)
        });
        
        console.log('Ping响应状态:', response.status);
        if (response.ok) {
          console.log('基本API连接正常');
        } else {
          throw new Error(`Ping失败，状态码: ${response.status}`);
        }
      } catch (error) {
        message.error({ content: '后端服务无法连接: ' + error.message, key, duration: 3 });
        return false;
      }
      
      // 检查2: 尝试POST请求
      console.log('检查2: 尝试POST请求...');
      try {
        const testRequest = {
          username: 'pingtest' + Math.floor(Math.random() * 10000),
          password: '123456',
          name: '测试',
          email: 'ping' + Math.floor(Math.random() * 10000) + '@test.com',
          role: 'STUDENT'
        };
        
        const response = await fetch('http://localhost:8080/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testRequest),
          credentials: 'include',
          signal: AbortSignal.timeout(5000)
        });
        
        console.log('POST测试响应状态:', response.status);
        try {
          const data = await response.json();
          console.log('POST测试响应数据:', data);
          
          if (data.success || response.ok) {
            message.success({ content: '后端连接正常，POST请求成功', key, duration: 3 });
            return true;
          } else {
            message.warning({ 
              content: '后端返回错误: ' + (data.error || '未知错误'), 
              key, 
              duration: 3
            });
            return false;
          }
        } catch (e) {
          console.error('解析JSON失败:', e);
          if (response.ok) {
            message.success({ 
              content: 'POST请求状态码正常，但响应无法解析', 
              key, 
              duration: 3
            });
            return true;
          } else {
            message.error({ 
              content: 'POST请求失败，状态码: ' + response.status, 
              key, 
              duration: 3
            });
            return false;
          }
        }
      } catch (error) {
        console.error('POST请求测试失败:', error);
        message.error({ content: 'POST请求测试失败: ' + error.message, key, duration: 3 });
        return false;
      }
    } catch (error) {
      console.error('服务器诊断失败:', error);
      message.error('服务器诊断失败: ' + error.message);
      return false;
    }
  };
  
  return (
    <div className="registration-container" style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: '#f0f2f5',
      padding: '20px'
    }}>
      <Card style={{ width: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2}>学生注册</Title>
          <Text type="secondary">创建您的学生账号以预约课程</Text>
        </div>
        
        <Steps current={currentStep} style={{ marginBottom: 24 }}>
          <Step title="账户信息" />
          <Step title="个人信息" />
          <Step title="家长信息" />
        </Steps>
        
        <Form
          form={form}
          name="registration_form"
          initialValues={{ grade: 'primary_1' }}
          onFinish={onFinish}
          layout="vertical"
          requiredMark={false}
          onValuesChange={handleFormChange}
        >
          {/* 步骤一：账户信息 */}
          {currentStep === 0 && (
            <>
              <Form.Item
                name="username"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { validator: validateUsername }
                ]}
              >
                <Input prefix={<UserOutlined />} placeholder="用户名" size="large" />
              </Form.Item>
              
              <Form.Item
                name="password"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码至少6个字符' }
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
              </Form.Item>
              
              <Form.Item
                name="confirmPassword"
                dependencies={['password']}
                rules={[
                  { required: true, message: '请确认密码' },
                  validateConfirmPassword
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="确认密码" size="large" />
              </Form.Item>
              
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input prefix={<MailOutlined />} placeholder="邮箱" size="large" />
              </Form.Item>
            </>
          )}
          
          {/* 步骤二：个人信息 */}
          {currentStep === 1 && (
            <>
              <Form.Item
                name="name"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input placeholder="姓名" size="large" />
              </Form.Item>
              
              <Form.Item
                name="phone"
                rules={[
                  { required: true, message: '请输入手机号码' },
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' }
                ]}
              >
                <Input prefix={<PhoneOutlined />} placeholder="手机号码" size="large" />
              </Form.Item>
              
              <Form.Item
                name="grade"
                label="年级"
                rules={[{ required: true, message: '请选择年级' }]}
              >
                <Select size="large">
                  <Option value="primary_1">小学一年级</Option>
                  <Option value="primary_2">小学二年级</Option>
                  <Option value="primary_3">小学三年级</Option>
                  <Option value="primary_4">小学四年级</Option>
                  <Option value="primary_5">小学五年级</Option>
                  <Option value="primary_6">小学六年级</Option>
                  <Option value="junior_1">初中一年级</Option>
                  <Option value="junior_2">初中二年级</Option>
                  <Option value="junior_3">初中三年级</Option>
                  <Option value="senior_1">高中一年级</Option>
                  <Option value="senior_2">高中二年级</Option>
                  <Option value="senior_3">高中三年级</Option>
                </Select>
              </Form.Item>
              
              <Form.Item name="enrollmentDate" label="入学日期">
                <DatePicker style={{ width: '100%' }} size="large" />
              </Form.Item>
            </>
          )}
          
          {/* 步骤三：家长信息 */}
          {currentStep === 2 && (
            <>
              <Form.Item
                name="parentName"
                label="家长姓名"
                rules={[{ required: true, message: '请输入家长姓名' }]}
              >
                <Input placeholder="家长姓名" size="large" />
              </Form.Item>
              
              <Form.Item
                name="parentPhone"
                label="家长电话"
                rules={[
                  { required: true, message: '请输入家长电话' },
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' }
                ]}
                extra="家长电话是必填项，用于重要信息通知"
              >
                <Input prefix={<PhoneOutlined />} placeholder="家长电话" size="large" />
              </Form.Item>
              
              <Form.Item
                name="address"
                label="家庭住址"
              >
                <Input.TextArea placeholder="家庭住址" rows={3} />
              </Form.Item>
              
              <Form.Item
                name="notes"
                label="备注"
              >
                <Input.TextArea placeholder="其他需要说明的信息" rows={3} />
              </Form.Item>
            </>
          )}
          
          <Form.Item>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              {currentStep > 0 && (
                <Button onClick={prevStep} style={{ marginRight: 8 }}>
                  上一步
                </Button>
              )}
              
              {currentStep < 2 ? (
                <Button type="primary" onClick={nextStep}>
                  下一步
                </Button>
              ) : (
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{ fontSize: '16px', height: '40px', minWidth: '100px' }}
                >
                  {loading ? '注册中...' : '提交注册'}
                </Button>
              )}
              
              {loading && (
                <Button
                  onClick={stopLoading}
                  danger
                  style={{ marginLeft: 8 }}
                >
                  取消
                </Button>
              )}
            </div>
          </Form.Item>
        </Form>
        
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Text type="secondary">已有账号？</Text>
          <Link to="/student/login"> 立即登录</Link>
        </div>
      </Card>
      
      {/* 注册成功弹窗 */}
      <Modal
        open={successModalVisible}
        closable={false}
        footer={null}
        centered
        maskClosable={false}
      >
        <Result
          status="success"
          icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
          title="注册成功！"
          subTitle={`页面将在 ${countDown} 秒后自动跳转到登录页面...`}
          extra={[
            <Button 
              type="primary" 
              key="login" 
              onClick={() => navigate('/student/login')}
            >
              立即前往登录
            </Button>
          ]}
        />
      </Modal>
    </div>
  );
};

export default StudentRegistrationPage; 