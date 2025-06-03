import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Result, Select, Divider } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, HomeOutlined, TeamOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const ForgotPasswordPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [defaultPassword, setDefaultPassword] = useState('');
  const navigate = useNavigate();

  // 处理表单提交
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      // 调用身份验证服务
      const response = await authService.verifyIdentityAndResetPassword(values);
      
      if (response.success) {
        message.success(response.message);
        setDefaultPassword(response.defaultPassword || '123456');
        setIsSuccess(true);
      } else {
        message.error(response.message || '身份验证失败，请检查输入信息');
      }
    } catch (error) {
      console.error('重置密码失败:', error);
      message.error('重置密码失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  // 重置表单
  const handleReset = () => {
    form.resetFields();
  };

  // 返回登录页
  const handleBackToLogin = () => {
    navigate('/student/login');
  };

  // 成功结果页面
  if (isSuccess) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: '#f0f2f5',
        padding: '20px'
      }}>
        <Card style={{ width: 500, maxWidth: '100%' }}>
          <Result
            status="success"
            title="密码重置成功！"
            subTitle={
              <>
                <p>您的密码已被重置为: <Text strong copyable>{defaultPassword}</Text></p>
                <p>请使用此临时密码登录，并立即修改为安全密码。</p>
              </>
            }
            extra={[
              <Button type="primary" key="login" onClick={handleBackToLogin}>
                返回登录
              </Button>
            ]}
          />
        </Card>
      </div>
    );
  }

  // 忘记密码表单
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: '#f0f2f5',
      padding: '20px'
    }}>
      <Card style={{ width: 500, maxWidth: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3}>找回密码</Title>
          <Text type="secondary">请填写您注册时的个人信息以验证身份</Text>
        </div>
        
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入您的用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="您的登录用户名" />
          </Form.Item>
          
          <Divider dashed>请至少填写以下三项信息进行身份验证</Divider>
          
          <Form.Item
            name="name"
            label="学生姓名"
            rules={[{ required: true, message: '请输入学生姓名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="注册时填写的学生姓名" />
          </Form.Item>
          
          <Form.Item
            name="email"
            label="注册邮箱"
            rules={[
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="注册时填写的邮箱地址" />
          </Form.Item>
          
          <Form.Item
            name="phone"
            label="手机号码"
          >
            <Input prefix={<PhoneOutlined />} placeholder="注册时填写的手机号码" />
          </Form.Item>
          
          <Form.Item
            name="grade"
            label="学生年级"
          >
            <Select placeholder="请选择学生年级">
              <Option value="primary_1">小学一年级</Option>
              <Option value="primary_2">小学二年级</Option>
              <Option value="primary_3">小学三年级</Option>
              <Option value="primary_4">小学四年级</Option>
              <Option value="primary_5">小学五年级</Option>
              <Option value="primary_6">小学六年级</Option>
              <Option value="junior_1">初中一年级</Option>
              <Option value="junior_2">初中二年级</Option>
              <Option value="junior_3">初中三年级</Option>
              <Option value="high_1">高中一年级</Option>
              <Option value="high_2">高中二年级</Option>
              <Option value="high_3">高中三年级</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="parentName"
            label="家长姓名"
          >
            <Input prefix={<TeamOutlined />} placeholder="注册时填写的家长姓名" />
          </Form.Item>
          
          <Form.Item
            name="parentPhone"
            label="家长电话"
          >
            <Input prefix={<PhoneOutlined />} placeholder="注册时填写的家长电话" />
          </Form.Item>
          
          <Form.Item
            name="address"
            label="家庭住址"
          >
            <Input prefix={<HomeOutlined />} placeholder="注册时填写的家庭住址" />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              验证身份并重置密码
            </Button>
            <Button style={{ marginTop: 10 }} onClick={handleReset} block>
              重置表单
            </Button>
          </Form.Item>
        </Form>
        
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Link to="/student/login">返回登录</Link>
        </div>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage; 