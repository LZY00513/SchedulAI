import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Checkbox, Modal, notification } from 'antd';
import { UserOutlined, LockOutlined, CloseCircleOutlined, CheckCircleFilled } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services';

const { Title, Text } = Typography;

const StudentLoginPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  // 显示错误弹窗
  const showErrorModal = (title, content) => {
    // 强制延迟100ms以确保UI更新
    setTimeout(() => {
      console.log("显示错误弹窗:", { title, content });
      Modal.error({
        title: title || '登录失败',
        content: content || '用户名或密码错误',
        okText: '确定',
        icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
        zIndex: 1500, // 确保弹窗在最上层
        maskClosable: false // 防止点击背景关闭弹窗
      });
    }, 100);
  };
  
  // 显示成功通知
  const showSuccessNotification = () => {
    notification.success({
      message: '登录成功',
      description: '欢迎回到SchedulAI学生课程预约系统',
      icon: <CheckCircleFilled style={{ color: '#52c41a' }} />,
      placement: 'topRight',
      duration: 3
    });
  };
  
  // 常规登录
  const onFinish = async (values) => {
    try {
      setLoading(true);
      console.log('学生登录表单提交:', values);
      
      // 传递学生角色信息 - 确保使用大写字符串
      const response = await authService.login(values.username, values.password, 'STUDENT');
      console.log('学生登录响应:', response);
      
      if (response && response.success) {
        showSuccessNotification();
        // 确保导航到学生仪表盘
        navigate('/student/dashboard');
      } else {
        console.error("登录失败，服务器响应:", response);
        // 显示错误弹窗替代简单消息
        showErrorModal('登录失败', response && response.message ? response.message : '用户名或密码错误，请重新输入');
      }
    } catch (error) {
      console.error('登录失败详情:', error);
      
      // 打印错误对象的所有属性以便调试
      console.error('错误类型:', typeof error);
      console.error('错误消息:', error.message);
      console.error('错误堆栈:', error.stack);
      
      // 错误消息处理 - 更人性化的错误提示
      let errorMsg = '用户名或密码错误，请重新输入';
      let errorTitle = '登录失败';
      
      if (error.response) {
        console.error('HTTP错误状态:', error.response.status);
        console.error('HTTP错误数据:', error.response.data);
        
        // 根据HTTP状态码提供更具体的错误信息
        if (error.response.status === 401) {
          errorMsg = '用户名或密码错误，请重新输入';
        } else if (error.response.status === 403) {
          errorMsg = '您没有访问权限，请联系系统管理员';
        } else if (error.response.status >= 500) {
          errorTitle = '服务器错误';
          errorMsg = '服务器暂时无法处理您的请求，请稍后再试';
        }
      } else if (error.message && error.message.includes('Network Error')) {
        // 网络错误特殊处理
        errorTitle = '网络连接错误';
        errorMsg = '无法连接到服务器，请检查您的网络连接后重试';
      }
      
      // 显示错误弹窗
      showErrorModal(errorTitle, errorMsg);
    } finally {
      setLoading(false);
    }
  };
  
  // 直接登录函数（用于测试）
  const directLogin = async () => {
    try {
      setLoading(true);
      message.info('正在尝试直接登录...');
      
      // 修改测试账号为有效的测试学生用户
      const testUserData = {
        username: 'teststudent',
        password: '123456',
        role: 'STUDENT'  // 确保大写
      };
      
      console.log('直接登录请求数据:', {
        ...testUserData,
        password: '***隐藏***'
      });
      
      // 先检查测试账号是否存在，如果不存在则自动注册
      try {
        const existsResponse = await fetch(`http://localhost:8080/api/auth/check-username?username=${testUserData.username}`);
        const exists = await existsResponse.json();
        
        if (!exists) {
          console.log('测试账号不存在，自动注册...');
          // 注册测试账号
          const registerResponse = await fetch('http://localhost:8080/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: testUserData.username,
              password: testUserData.password,
              name: '测试学生',
              email: 'teststudent@example.com',
              phone: '13800138000',
              role: 'STUDENT',
              grade: 'primary_1',
              parentName: '测试家长',
              parentPhone: '13900139000',
              address: '测试地址',
              notes: '测试备注'
            }),
            credentials: 'include'
          });
          
          const registerData = await registerResponse.json();
          console.log('测试账号注册结果:', registerData);
          
          if (!registerData.success) {
            throw new Error('测试账号注册失败');
          }
        }
      } catch (error) {
        console.error('检查或注册测试账号失败:', error);
        // 继续尝试登录，可能账号已存在
      }
      
      // 使用更简单的登录方式
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testUserData),
        credentials: 'include',
        mode: 'cors', // 确保CORS设置正确
        cache: 'no-cache', // 不使用缓存
        redirect: 'follow', // 自动处理重定向
        referrerPolicy: 'no-referrer', // 不发送referrer信息
        // 设置超时时间为15秒
        signal: AbortSignal.timeout(15000)
      });
      
      if (!response.ok) {
        throw new Error(`登录失败，HTTP状态: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('直接登录响应:', data);
      
      if (data.success) {
        // 登录成功，保存用户信息
        const rolePrefix = data.user.role === 'ADMIN' ? 'admin_' : 'student_';
        localStorage.setItem(`${rolePrefix}isAuthenticated`, 'true');
        localStorage.setItem(`${rolePrefix}user`, JSON.stringify(data.user));
        localStorage.setItem(`${rolePrefix}userRole`, data.user.role);
        
        showSuccessNotification();
        navigate('/student/dashboard');
      } else {
        console.error('登录响应错误:', response.status, data);
        
        // 无论服务器返回什么错误，始终向用户显示标准错误消息
        showErrorModal('登录失败', '用户名或密码错误，请重新输入');
      }
    } catch (error) {
      console.error('直接登录异常:', error);
      
      // 错误消息处理 - 更人性化的错误提示
      let errorMsg = '用户名或密码错误，请重新输入';
      let errorTitle = '登录失败';
      
      // 检测特定错误类型
      if (error.name === 'TimeoutError' || error.name === 'AbortError') {
        errorTitle = '请求超时';
        errorMsg = '服务器响应时间过长，请稍后重试';
      } else if (error.message && error.message.includes('Network Error')) {
        errorTitle = '网络连接错误';
        errorMsg = '无法连接到服务器，请检查您的网络连接后重试';
      }
      
      showErrorModal(errorTitle, errorMsg);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="login-container" style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: '#f0f2f5'
    }}>
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <Title level={2}>SchedulAI</Title>
          <Text type="secondary">学生课程预约系统</Text>
        </div>
        
        <Form
          name="student_login_form"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名!' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="用户名" 
              size="large"
            />
          </Form.Item>
          
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码!' }]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="密码" 
              size="large"
            />
          </Form.Item>
          
          <Form.Item>
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>记住我</Checkbox>
            </Form.Item>
            <Link to="/forgot-password" style={{ float: 'right' }}>
              忘记密码?
            </Link>
          </Form.Item>
          
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              size="large" 
              block
              loading={loading}
            >
              学生登录
            </Button>
            
            <Button 
              onClick={directLogin}
              style={{ marginTop: 10 }}
              size="large" 
              block
              type="dashed"
            >
              测试账号登录
            </Button>
          </Form.Item>
          
          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">还没有账号? </Text>
            <Link to="/register">立即注册</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default StudentLoginPage; 