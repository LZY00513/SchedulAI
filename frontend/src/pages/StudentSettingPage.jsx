import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Form, 
  Input, 
  Button, 
  Card, 
  Space, 
  message, 
  Divider, 
  Row, 
  Col,
  Spin
} from 'antd';
import { 
  SaveOutlined, 
  EyeInvisibleOutlined, 
  EyeTwoTone,
  UserOutlined,
  LockOutlined
} from '@ant-design/icons';
import { authService } from '../services';

const { Title, Text } = Typography;

const StudentSettingPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);
  
  // 加载学生信息
  useEffect(() => {
    const loadStudentInfo = async () => {
      try {
        setLoading(true);
        const user = authService.getCurrentUser();
        if (user) {
          setCurrentStudent(user);
          form.setFieldsValue({
            name: user.name,
            email: user.email
          });
        }
      } catch (error) {
        console.error('获取学生信息失败:', error);
        message.error('获取个人信息失败');
      } finally {
        setLoading(false);
      }
    };
    
    loadStudentInfo();
  }, [form]);
  
  // 更新个人资料
  const handleUpdateProfile = async (values) => {
    try {
      setSavingProfile(true);
      // 这里调用API更新学生信息
      // 为简单起见，我们只模拟更新成功
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 更新本地存储的用户信息
      const updatedUser = {
        ...currentStudent,
        name: values.name,
        email: values.email
      };
      authService.setCurrentUser(updatedUser);
      setCurrentStudent(updatedUser);
      
      message.success('个人信息更新成功');
    } catch (error) {
      console.error('更新个人信息失败:', error);
      message.error('更新个人信息失败');
    } finally {
      setSavingProfile(false);
    }
  };
  
  // 修改密码
  const handleChangePassword = async (values) => {
    try {
      setChangingPassword(true);
      
      // 校验旧密码和新密码不能相同
      if (values.oldPassword === values.newPassword) {
        message.error('新密码不能与当前密码相同');
        return;
      }
      
      // 校验两次输入的新密码是否一致
      if (values.newPassword !== values.confirmPassword) {
        message.error('两次输入的新密码不一致');
        return;
      }
      
      // 获取当前用户名
      const username = currentStudent?.username;
      if (!username) {
        message.error('获取用户信息失败，请重新登录');
        return;
      }
      
      // 调用API更改密码
      const response = await authService.changePassword(
        username,
        values.oldPassword,
        values.newPassword
      );
      
      if (response.success) {
        message.success('密码修改成功');
        form.resetFields(['oldPassword', 'newPassword', 'confirmPassword']);
      } else {
        message.error(response.message || '密码修改失败');
      }
    } catch (error) {
      console.error('修改密码失败:', error);
      message.error('修改密码失败: ' + (error.message || '未知错误'));
    } finally {
      setChangingPassword(false);
    }
  };
  
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin size="large" tip="正在加载个人信息..." />
      </div>
    );
  }
  
  return (
    <div className="student-settings-page">
      <Title level={2}>个人设置</Title>
      
      {/* 个人资料表单 */}
      <Card title="个人资料" bordered={false} style={{ marginBottom: 24 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateProfile}
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="姓名"
                rules={[{ required: true, message: '请输入您的姓名' }]}
              >
                <Input prefix={<UserOutlined />} placeholder="您的姓名" />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="email"
                label="邮箱"
                rules={[
                  { required: true, message: '请输入您的邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input placeholder="您的邮箱地址" />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              icon={<SaveOutlined />} 
              loading={savingProfile}
            >
              保存资料
            </Button>
          </Form.Item>
        </Form>
      </Card>
      
      {/* 修改密码表单 */}
      <Card title="修改密码" bordered={false}>
        <Form
          layout="vertical"
          onFinish={handleChangePassword}
        >
          <Form.Item
            name="oldPassword"
            label="当前密码"
            rules={[{ required: true, message: '请输入当前密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="当前密码"
              iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>
          
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码长度不能少于6个字符' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="新密码"
              iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>
          
          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            rules={[
              { required: true, message: '请再次输入新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="确认新密码"
              iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>
          
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              icon={<LockOutlined />} 
              loading={changingPassword}
            >
              修改密码
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default StudentSettingPage; 