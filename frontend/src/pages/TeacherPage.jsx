import React, { useState, useEffect } from 'react'
import { 
  Table, 
  Card, 
  Button, 
  Input, 
  Space, 
  Modal, 
  Form, 
  InputNumber, 
  message, 
  Popconfirm, 
  Typography,
  Divider,
  Tag,
  Row,
  Col,
  Select,
  Spin
} from 'antd'
import { 
  PlusOutlined, 
  SearchOutlined, 
  EditOutlined, 
  DeleteOutlined,
  UserOutlined
} from '@ant-design/icons'
import { teacherService, courseService } from '../services'
import dayjs from 'dayjs'

const { Title } = Typography
const { Search } = Input
const { Option } = Select

const TeacherPage = () => {
  // 状态管理
  const [loading, setLoading] = useState(false)
  const [teachers, setTeachers] = useState([])
  const [filteredTeachers, setFilteredTeachers] = useState([])
  const [searchText, setSearchText] = useState('')
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [currentTeacher, setCurrentTeacher] = useState(null)
  const [form] = Form.useForm()
  const [courses, setCourses] = useState([])
  const [loadingCourses, setLoadingCourses] = useState(false)

  // 获取教师数据
  useEffect(() => {
    fetchTeachers()
  }, [])

  const fetchTeachers = async () => {
    setLoading(true)
    try {
      const data = await teacherService.getAllTeachers()
      console.log('获取到的教师数据:', data)
      setTeachers(data || [])
      setFilteredTeachers(data || [])
    } catch (error) {
      message.error('获取教师数据失败')
      console.error('获取教师数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 搜索功能
  const handleSearch = (value) => {
    setSearchText(value)
    if (!value) {
      setFilteredTeachers(teachers)
      return
    }
    
    const filtered = teachers.filter(teacher => 
      teacher.name.toLowerCase().includes(value.toLowerCase()) ||
      (teacher.subject && teacher.subject.toLowerCase().includes(value.toLowerCase())) ||
      (teacher.phone && teacher.phone.includes(value)) ||
      (teacher.email && teacher.email.toLowerCase().includes(value.toLowerCase()))
    )
    
    setFilteredTeachers(filtered)
  }

  // 弹窗处理
  const showAddModal = () => {
    setCurrentTeacher(null)
    form.resetFields()
    setIsModalVisible(true)
  }

  const showEditModal = (teacher) => {
    setCurrentTeacher(teacher)
    form.setFieldsValue(teacher)
    setIsModalVisible(true)
  }

  const handleModalCancel = () => {
    setIsModalVisible(false)
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      
      if (currentTeacher) {
        // 更新教师
        await teacherService.updateTeacher(currentTeacher.id, values)
        message.success('教师信息更新成功！')
      } else {
        // 添加教师
        await teacherService.createTeacher(values)
        message.success('教师添加成功！')
      }
      
      setIsModalVisible(false)
      fetchTeachers() // 刷新数据
    } catch (error) {
      console.error('保存教师信息失败:', error)
      
      // 检查是否是唯一约束冲突（邮箱或名字重复）
      if (error.status === 500 && 
          (error.data?.includes('Duplicate entry') || 
           error.message?.includes('Duplicate entry'))) {
        if (error.data?.includes('UK4l9jjfvsct1dd5aufnurxcvbs') || 
            error.message?.includes('UK4l9jjfvsct1dd5aufnurxcvbs')) {
          message.error('添加失败：该邮箱已被注册，请使用其他邮箱')
        } else {
          message.error('添加失败：教师信息重复，请检查邮箱或姓名是否已存在')
        }
      } else {
        message.error('保存失败: ' + (error.response?.data || error.message))
      }
    }
  }

  const handleDelete = async (id) => {
    try {
      await teacherService.deleteTeacher(id)
      message.success('教师删除成功！')
      fetchTeachers() // 刷新数据
    } catch (error) {
      if (error.response?.status === 409) {
        message.error('无法删除：该教师有关联的课程或课时')
      } else {
        message.error('删除失败: ' + (error.response?.data || error.message))
      }
      console.error(`删除教师(ID: ${id})失败:`, error)
    }
  }

  // 表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
      sorter: (a, b) => a.id - b.id
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 100,
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text) => <a>{text}</a>
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 80,
      filters: [
        { text: '男', value: '男' },
        { text: '女', value: '女' }
      ],
      onFilter: (value, record) => record.gender === value,
    },
    {
      title: '年龄',
      dataIndex: 'age',
      key: 'age',
      width: 80,
      sorter: (a, b) => a.age - b.age
    },
    {
      title: '学科',
      dataIndex: 'subject',
      key: 'subject',
      width: 100,
      filters: [
        { text: '数学', value: '数学' },
        { text: '英语', value: '英语' },
        { text: '物理', value: '物理' },
        { text: '化学', value: '化学' },
        { text: '生物', value: '生物' }
      ],
      onFilter: (value, record) => record.subject === value,
    },
    {
      title: '学历',
      dataIndex: 'education',
      key: 'education',
      width: 100,
      filters: [
        { text: '本科', value: '本科' },
        { text: '研究生', value: '研究生' },
        { text: '博士', value: '博士' }
      ],
      onFilter: (value, record) => record.education === value,
    },
    {
      title: '教龄',
      dataIndex: 'experience',
      key: 'experience',
      width: 80,
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
    },
    {
      title: '电子邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 150,
    },
    {
      title: '时薪 (元/小时)',
      dataIndex: 'hourlyRate',
      key: 'hourlyRate',
      width: 120,
      sorter: (a, b) => a.hourlyRate - b.hourlyRate,
      render: (text) => `¥${text}`
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: status => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '在职' : '离职'}
        </Tag>
      ),
      filters: [
        { text: '在职', value: 'active' },
        { text: '离职', value: 'inactive' }
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Space size="small" split={<Divider type="vertical" />}>
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => showEditModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除此教师吗?"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // 可选学科列表
  const subjectOptions = [
    { value: '数学', label: '数学' },
    { value: '语文', label: '语文' },
    { value: '英语', label: '英语' },
    { value: '物理', label: '物理' },
    { value: '化学', label: '化学' },
    { value: '生物', label: '生物' },
    { value: '历史', label: '历史' },
    { value: '地理', label: '地理' },
    { value: '政治', label: '政治' },
    { value: '音乐', label: '音乐' },
    { value: '美术', label: '美术' },
    { value: '体育', label: '体育' }
  ]

  // 获取课程数据
  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    setLoadingCourses(true)
    try {
      const data = await courseService.getAllCourses()
      setCourses(data)
    } catch (error) {
      message.error('获取课程数据失败')
      console.error('获取课程数据失败:', error)
    } finally {
      setLoadingCourses(false)
    }
  }

  // 表单组件
  const teacherForm = (
    <Form
      form={form}
      layout="vertical"
      name="teacherForm"
      initialValues={{
        status: 'active',
        courseIds: []
      }}
    >
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入教师姓名' }]}
          >
            <Input placeholder="请输入教师姓名" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="gender"
            label="性别"
            rules={[{ required: true, message: '请选择性别' }]}
          >
            <Select placeholder="请选择性别">
              <Option value="男">男</Option>
              <Option value="女">女</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="age"
            label="年龄"
            rules={[{ required: true, message: '请输入年龄' }]}
          >
            <InputNumber min={18} max={100} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="subject"
            label="学科"
            rules={[{ required: true, message: '请选择学科' }]}
          >
            <Select placeholder="请选择学科">
              <Option value="数学">数学</Option>
              <Option value="英语">英语</Option>
              <Option value="物理">物理</Option>
              <Option value="化学">化学</Option>
              <Option value="生物">生物</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="education"
            label="学历"
            rules={[{ required: true, message: '请选择学历' }]}
          >
            <Select placeholder="请选择学历">
              <Option value="本科">本科</Option>
              <Option value="研究生">研究生</Option>
              <Option value="博士">博士</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="experience"
            label="教龄(年)"
            rules={[{ required: true, message: '请输入教龄' }]}
          >
            <InputNumber min={0} max={50} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="phone"
            label="联系电话"
            rules={[
              { required: true, message: '请输入联系电话' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码' }
            ]}
          >
            <Input placeholder="请输入联系电话" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="email"
            label="电子邮箱"
            rules={[
              { required: true, message: '请输入电子邮箱' },
              { type: 'email', message: '请输入正确的邮箱格式' }
            ]}
          >
            <Input placeholder="请输入电子邮箱" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="hourlyRate"
            label="时薪(元/小时)"
            rules={[{ required: true, message: '请输入时薪' }]}
          >
            <InputNumber
              min={0}
              max={1000}
              style={{ width: '100%' }}
              formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\¥\s?|(,*)/g, '')}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              <Option value="active">在职</Option>
              <Option value="inactive">离职</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="courseIds"
        label="可教授课程"
        rules={[{ required: false }]}
      >
        <Select
          mode="multiple"
          placeholder="请选择可教授的课程"
          loading={loadingCourses}
          style={{ width: '100%' }}
        >
          {courses.map(course => (
            <Option key={course.id} value={course.id}>
              {course.name} ({course.category} - {course.level})
            </Option>
          ))}
        </Select>
      </Form.Item>
    </Form>
  )

  // Modal 组件
  const modalContent = (
    <Modal
      title={currentTeacher ? '编辑教师信息' : '添加新教师'}
      open={isModalVisible}
      onOk={handleModalOk}
      onCancel={handleModalCancel}
      width={800}
      destroyOnClose
    >
      {teacherForm}
    </Modal>
  )

  return (
    <div className="teacher-management">
      <Title level={2}>教师管理</Title>
      
      <Card bordered={false}>
        {/* 搜索和操作区域 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Search
              placeholder="搜索教师姓名/学科/电话"
              allowClear
              enterButton={<SearchOutlined />}
              size="middle"
              onSearch={handleSearch}
            />
          </Col>
          <Col span={16} style={{ textAlign: 'right' }}>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={showAddModal}
            >
              添加教师
            </Button>
          </Col>
        </Row>
        
        {/* 教师列表 */}
        <Table
          columns={columns}
          dataSource={filteredTeachers}
          rowKey="id"
          loading={loading}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (total) => `共 ${total} 条记录`
          }}
          scroll={{ x: 1500 }}
        />
      </Card>
      
      {/* 添加/编辑教师表单 */}
      {modalContent}
    </div>
  )
}

export default TeacherPage 