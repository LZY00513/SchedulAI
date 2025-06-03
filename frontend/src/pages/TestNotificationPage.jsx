import React from 'react';
import { Button, Card, notification, message, Space, Divider, Typography, Alert } from 'antd';
import { CheckCircleFilled, InfoCircleFilled, WarningFilled, CloseCircleFilled } from '@ant-design/icons';

const { Title, Text } = Typography;

const TestNotificationPage = () => {
  // 基本通知
  const showBasicNotification = () => {
    notification.open({
      message: '基本通知',
      description: '这是一个基本通知',
    });
    console.log('触发基本通知');
    message.info('消息：已触发基本通知');
  };

  // 成功通知
  const showSuccessNotification = () => {
    notification.success({
      message: '成功通知',
      description: '操作已成功完成',
      icon: <CheckCircleFilled style={{ color: '#52c41a' }} />,
    });
    console.log('触发成功通知');
    message.success('消息：已触发成功通知');
  };

  // 信息通知
  const showInfoNotification = () => {
    notification.info({
      message: '信息通知',
      description: '这是一条重要信息',
      icon: <InfoCircleFilled style={{ color: '#1890ff' }} />,
    });
  };

  // 警告通知
  const showWarningNotification = () => {
    notification.warning({
      message: '警告通知',
      description: '请注意这个警告信息',
      icon: <WarningFilled style={{ color: '#faad14' }} />,
    });
  };

  // 错误通知
  const showErrorNotification = () => {
    notification.error({
      message: '错误通知',
      description: '操作过程中发生错误',
      icon: <CloseCircleFilled style={{ color: '#ff4d4f' }} />,
    });
  };

  // 带自定义样式的通知
  const showCustomStyledNotification = () => {
    notification.success({
      message: '自定义样式通知',
      description: '这个通知有自定义样式',
      style: {
        backgroundColor: '#f6ffed',
        border: '1px solid #b7eb8f',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        borderRadius: '4px',
        zIndex: 10000,
      },
      className: 'custom-styled-notification',
    });
  };

  // 带直接样式的通知
  const showInlineStyledNotification = () => {
    // 使用DOM API直接创建并显示通知
    const notificationDiv = document.createElement('div');
    notificationDiv.innerHTML = `
      <div style="position: fixed; top: 20px; right: 20px; background: white; padding: 16px; 
                 border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10000;">
        <h4 style="margin: 0 0 8px 0;">内联样式通知</h4>
        <p style="margin: 0;">这是通过DOM API直接创建的通知</p>
      </div>
    `;
    document.body.appendChild(notificationDiv);
    
    // 5秒后移除
    setTimeout(() => {
      document.body.removeChild(notificationDiv);
    }, 5000);
    
    message.info('已显示内联样式通知');
  };

  // 创建通知API配置
  React.useEffect(() => {
    notification.config({
      placement: 'topRight',
      duration: 4.5,
      maxCount: 5,
      rtl: false,
      zIndex: 9999,
    });
    
    console.log('通知配置已初始化');
    message.success('页面加载完成，通知系统已初始化');
  }, []);

  return (
    <div style={{ padding: '24px' }}>
      <Alert
        message="通知测试页面"
        description="此页面用于测试Ant Design的通知组件。如果你看到此页面的消息提示(message)但看不到通知(notification)，可能是React和Ant Design的版本不兼容。"
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />
      
      <Card title="通知测试" style={{ marginBottom: '24px' }}>
        <Title level={4}>点击下面的按钮测试不同类型的通知</Title>
        <Text type="secondary">如果通知不显示，请检查控制台是否有错误信息</Text>
        
        <Divider />
        
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button type="primary" onClick={showBasicNotification} block>
            显示基本通知
          </Button>
          
          <Button onClick={showSuccessNotification} style={{ backgroundColor: '#52c41a', color: 'white' }} block>
            显示成功通知
          </Button>
          
          <Button onClick={showInfoNotification} style={{ backgroundColor: '#1890ff', color: 'white' }} block>
            显示信息通知
          </Button>
          
          <Button onClick={showWarningNotification} style={{ backgroundColor: '#faad14', color: 'white' }} block>
            显示警告通知
          </Button>
          
          <Button danger onClick={showErrorNotification} block>
            显示错误通知
          </Button>
          
          <Divider />
          
          <Button onClick={showCustomStyledNotification} block>
            显示自定义样式通知
          </Button>
          
          <Button onClick={showInlineStyledNotification} block>
            显示内联样式通知 (DOM API)
          </Button>
        </Space>
      </Card>
      
      <Card title="问题排查">
        <ul>
          <li>检查React版本是否与Ant Design兼容 (Ant Design v5 支持 React 16-18)</li>
          <li>检查控制台是否有关于通知组件的错误</li>
          <li>检查是否有CSS样式覆盖了通知组件</li>
          <li>检查z-index是否足够高以显示在其他元素之上</li>
          <li>尝试使用DOM API直接创建通知元素</li>
        </ul>
      </Card>
    </div>
  );
};

export default TestNotificationPage; 