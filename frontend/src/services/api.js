import axios from 'axios';
import { message } from 'antd';

// 创建axios实例
const api = axios.create({
  baseURL: 'http://localhost:8080',
  timeout: 15000, // 15秒超时
  withCredentials: true
});

// 添加请求拦截器，用于日志记录
api.interceptors.request.use(
  config => {
    // 记录请求信息
    console.log(`API请求: ${config.method.toUpperCase()} ${config.url}`, 
      config.method === 'get' ? config.params : '数据已隐藏');
    return config;
  }, 
  error => {
    console.error('API请求错误:', error);
    return Promise.reject(error);
  }
);

// 添加响应拦截器，用于统一处理错误
api.interceptors.response.use(
  response => {
    // 直接返回响应数据
    console.log(`API响应: ${response.config.url}`, response.status);
    return response.data;
  },
  error => {
    // 处理错误
    if (error.response) {
      // 服务器返回错误状态码
      console.error(`API错误 ${error.response.status}: ${error.response.config.url}`, error.response.data);
      return Promise.reject({
        status: error.response.status,
        data: error.response.data,
        message: error.response.data?.message || error.message
      });
    } else if (error.request) {
      // 请求已发送但没有收到响应
      console.error('API请求无响应:', error.request);
      return Promise.reject({
        message: '服务器无响应，请检查网络连接',
        isNetworkError: true
      });
    } else {
      // 请求配置错误
      console.error('API请求配置错误:', error.message);
      return Promise.reject({
        message: error.message
      });
    }
  }
);

export default api; 