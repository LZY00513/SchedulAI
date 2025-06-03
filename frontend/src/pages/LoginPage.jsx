import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Modal, notification } from 'antd';
import { UserOutlined, LockOutlined, CloseCircleOutlined, CheckCircleFilled } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services';

const { Title, Text } = Typography;

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  // 显示错误弹窗
  const showErrorModal = (title, content) => {
    // 强制延迟100ms以确保UI更新
    setTimeout(() => {
      console.log("管理员登录 - 显示错误弹窗:", { title, content });
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
      description: '欢迎回到SchedulAI智能排课系统',
      icon: <CheckCircleFilled style={{ color: '#52c41a' }} />,
      placement: 'topRight',
      duration: 3
    });
  };
  
  const onFinish = async (values) => {
    try {
      setLoading(true);
      console.log('管理员登录表单提交:', values);
      
      // 明确传递ADMIN角色
      const response = await authService.login(values.username, values.password, 'ADMIN');
      console.log('管理员登录响应:', response);
      
      if (response && response.success) {
        // 移除简单消息，改用更友好的通知
        showSuccessNotification();
        navigate('/dashboard');
      } else {
        console.error("管理员登录失败，服务器响应:", response);
        // 使用弹窗替代简单消息
        showErrorModal('登录失败', response && response.message ? response.message : '用户名或密码错误，请重新输入');
      }
    } catch (error) {
      console.error('管理员登录失败详情:', error);
      
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
      
      // 使用弹窗显示错误
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
          <Text type="secondary">智能排课系统</Text>
        </div>
        
        <Form
          name="login_form"
          initialValues={{ username: 'admin' }}
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名!' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="用户名 (默认: admin)" 
              size="large"
            />
          </Form.Item>
          
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码!' }]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="密码 (默认: admin123)" 
              size="large"
            />
          </Form.Item>
          
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              size="large" 
              block
              loading={loading}
            >
              管理员登录
            </Button>
          </Form.Item>
          
          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">本系统仅限管理员登录使用</Text>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage; 