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
  Rate,
  Switch,
  Descriptions,
  Tooltip
} from 'antd'
import { 
  PlusOutlined, 
  SearchOutlined, 
  EditOutlined, 
  DeleteOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons'
import { courseService } from '../services'
import dayjs from 'dayjs'

const { Title } = Typography
const { Search } = Input
const { Option } = Select
const { TextArea } = Input

const CoursePage = () => {
  // 状态管理
  const [loading, setLoading] = useState(false)
  const [courses, setCourses] = useState([])
  const [filteredCourses, setFilteredCourses] = useState([])
  const [searchText, setSearchText] = useState('')
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isViewModalVisible, setIsViewModalVisible] = useState(false)
  const [currentCourse, setCurrentCourse] = useState(null)
  const [form] = Form.useForm()

  // 获取课程数据
  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    setLoading(true)
    try {
      const data = await courseService.getAllCourses()
      setCourses(data)
      setFilteredCourses(data)
    } catch (error) {
      message.error('获取课程数据失败')
      console.error('获取课程数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 搜索功能
  const handleSearch = (value) => {
    setSearchText(value)
    if (!value) {
      setFilteredCourses(courses)
      return
    }
    
    const filtered = courses.filter(course => 
      course.name.toLowerCase().includes(value.toLowerCase()) ||
      (course.category && course.category.toLowerCase().includes(value.toLowerCase())) ||
      (course.level && course.level.toLowerCase().includes(value.toLowerCase())) ||
      (course.description && course.description.toLowerCase().includes(value.toLowerCase()))
    )
    
    setFilteredCourses(filtered)
  }

  // 弹窗处理
  const showAddModal = () => {
    setCurrentCourse(null)
    form.resetFields()
    setIsModalVisible(true)
  }

  const showEditModal = (course) => {
    setCurrentCourse(course)
    form.setFieldsValue({
      ...course,
      recommendedTeachers: course.recommendedTeachers ? course.recommendedTeachers.map(teacher => ({ label: teacher, value: teacher })) : [],
      prerequisites: course.prerequisites ? course.prerequisites.map(prerequisite => ({ label: prerequisite, value: prerequisite })) : [],
      materials: course.materials ? course.materials.map(material => ({ label: material, value: material })) : []
    })
    setIsModalVisible(true)
  }

  const showViewModal = (course) => {
    setCurrentCourse(course)
    setIsViewModalVisible(true)
  }

  const handleModalCancel = () => {
    setIsModalVisible(false)
  }

  const handleViewModalCancel = () => {
    setIsViewModalVisible(false)
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      
      // 处理多选值
      const processedValues = {
        ...values,
        recommendedTeachers: values.recommendedTeachers ? values.recommendedTeachers.map(item => item.value || item) : [],
        prerequisites: values.prerequisites ? values.prerequisites.map(item => item.value || item) : [],
        materials: values.materials ? values.materials.map(item => item.value || item) : []
      }
      
      if (currentCourse) {
        // 更新课程
        await courseService.updateCourse(currentCourse.id, processedValues)
        message.success('课程信息更新成功！')
      } else {
        // 添加课程
        await courseService.createCourse(processedValues)
        message.success('课程添加成功！')
      }
      
      setIsModalVisible(false)
      fetchCourses() // 刷新数据
    } catch (error) {
      console.error('保存课程信息失败:', error)
      message.error('保存失败: ' + (error.response?.data || error.message))
    }
  }

  const handleDelete = async (id) => {
    try {
      await courseService.deleteCourse(id)
      message.success('课程删除成功！')
      fetchCourses() // 刷新数据
    } catch (error) {
      if (error.response?.status === 409) {
        message.error('无法删除：该课程已被教师或学生选择')
      } else {
        message.error('删除失败: ' + (error.response?.data || error.message))
      }
      console.error(`删除课程(ID: ${id})失败:`, error)
    }
  }

  const handleStatusChange = async (id, checked) => {
    try {
      await courseService.updateCourseStatus(id, checked ? 'active' : 'inactive')
      message.success(`课程状态已${checked ? '启用' : '停用'}`)
      fetchCourses() // 刷新数据
    } catch (error) {
      message.error('状态更新失败')
      console.error(`更新课程状态失败:`, error)
    }
  }

  // 表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60
    },
    {
      title: '课程名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      width: 100
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 100
    },
    {
      title: '时长(分钟)',
      dataIndex: 'duration',
      key: 'duration',
      width: 100
    },
    {
      title: '单价(元)',
      dataIndex: 'price',
      key: 'price',
      width: 100
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      width: 100,
      render: (difficulty) => (
        <Rate 
          disabled 
          count={5} 
          value={difficulty} 
          style={{ fontSize: '12px' }}
        />
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status, record) => (
        <Switch 
          checked={status === 'active'} 
          onChange={(checked) => handleStatusChange(record.id, checked)}
          checkedChildren={<CheckCircleOutlined />}
          unCheckedChildren={<CloseCircleOutlined />}
        />
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            size="small" 
            onClick={() => showEditModal(record)}
          >
            编辑
          </Button>
          <Button 
            icon={<EyeOutlined />} 
            size="small" 
            onClick={() => showViewModal(record)}
          >
            查看
          </Button>
          <Popconfirm
            title="确定删除此课程吗？"
            description="删除后无法恢复！"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              size="small"
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <Title level={2} style={{ margin: 0 }}>
            课程管理
          </Title>
          <Space>
            <Search
              placeholder="搜索课程"
              onSearch={handleSearch}
              style={{ width: 300 }}
              allowClear
            />
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={showAddModal}
            >
              添加课程
            </Button>
          </Space>
        </div>

        <Table 
          dataSource={filteredCourses} 
          columns={columns} 
          rowKey="id"
          loading={loading}
          pagination={{ 
            pageSize: 10, 
            showSizeChanger: true, 
            showTotal: (total) => `共 ${total} 条记录` 
          }}
        />
      </Card>

      {/* 课程编辑/添加弹窗 */}
      <Modal
        title={currentCourse ? '编辑课程信息' : '添加新课程'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={700}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            difficulty: 3,
            status: 'active'
          }}
        >
          <Row gutter={24}>
            <Col span={16}>
              <Form.Item
                name="name"
                label="课程名称"
                rules={[{ required: true, message: '请输入课程名称' }]}
              >
                <Input placeholder="请输入课程名称" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="difficulty"
                label="难度"
              >
                <Rate count={5} />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="category"
                label="类别"
                rules={[{ required: true, message: '请选择类别' }]}
              >
                <Select>
                  <Option value="数学">数学</Option>
                  <Option value="英语">英语</Option>
                  <Option value="物理">物理</Option>
                  <Option value="化学">化学</Option>
                  <Option value="生物">生物</Option>
                  <Option value="历史">历史</Option>
                  <Option value="地理">地理</Option>
                  <Option value="政治">政治</Option>
                  <Option value="其他">其他</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="level"
                label="级别"
                rules={[{ required: true, message: '请选择级别' }]}
              >
                <Select>
                  <Option value="小学">小学</Option>
                  <Option value="初中">初中</Option>
                  <Option value="高中">高中</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="duration"
                label="课时长度(分钟)"
                rules={[{ required: true, message: '请输入课时长度' }]}
              >
                <InputNumber min={15} max={180} step={15} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="price"
                label="单价(元)"
                rules={[{ required: true, message: '请输入单价' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="description"
            label="课程描述"
            rules={[{ required: true, message: '请输入课程描述' }]}
          >
            <TextArea rows={4} placeholder="请输入课程描述" />
          </Form.Item>
          
          <Form.Item
            name="recommendedTeachers"
            label="推荐教师"
          >
            <Select
              mode="tags"
              style={{ width: '100%' }}
              placeholder="输入推荐教师名称，按回车确认"
              labelInValue
            />
          </Form.Item>
          
          <Form.Item
            name="prerequisites"
            label="先修课程"
          >
            <Select
              mode="tags"
              style={{ width: '100%' }}
              placeholder="输入先修课程名称，按回车确认"
              labelInValue
            />
          </Form.Item>
          
          <Form.Item
            name="materials"
            label="教学材料"
          >
            <Select
              mode="tags"
              style={{ width: '100%' }}
              placeholder="输入教学材料名称，按回车确认"
              labelInValue
            />
          </Form.Item>
          
          <Form.Item
            name="status"
            label="状态"
          >
            <Select>
              <Option value="active">启用</Option>
              <Option value="inactive">停用</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 课程详情查看弹窗 */}
      <Modal
        title={`课程详情: ${currentCourse?.name || ''}`}
        open={isViewModalVisible}
        onCancel={handleViewModalCancel}
        footer={[
          <Button key="back" onClick={handleViewModalCancel}>
            关闭
          </Button>
        ]}
        width={700}
      >
        {currentCourse && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="课程编号" span={1}>
              {currentCourse.id}
            </Descriptions.Item>
            <Descriptions.Item label="课程名称" span={1}>
              {currentCourse.name}
            </Descriptions.Item>
            <Descriptions.Item label="类别" span={1}>
              {currentCourse.category}
            </Descriptions.Item>
            <Descriptions.Item label="级别" span={1}>
              {currentCourse.level}
            </Descriptions.Item>
            <Descriptions.Item label="课时长度" span={1}>
              {currentCourse.duration} 分钟
            </Descriptions.Item>
            <Descriptions.Item label="单价" span={1}>
              {currentCourse.price} 元
            </Descriptions.Item>
            <Descriptions.Item label="难度" span={1}>
              <Rate disabled value={currentCourse.difficulty} />
            </Descriptions.Item>
            <Descriptions.Item label="状态" span={1}>
              <Tag color={currentCourse.status === 'active' ? 'green' : 'red'}>
                {currentCourse.status === 'active' ? '启用' : '停用'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="创建日期" span={2}>
              {currentCourse.createdAt ? dayjs(currentCourse.createdAt).format('YYYY-MM-DD') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="课程描述" span={2}>
              {currentCourse.description}
            </Descriptions.Item>
            <Descriptions.Item label="推荐教师" span={2}>
              {currentCourse.recommendedTeachers && currentCourse.recommendedTeachers.length > 0 ? (
                currentCourse.recommendedTeachers.map(teacher => (
                  <Tag key={teacher}>{teacher}</Tag>
                ))
              ) : (
                '无'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="先修课程" span={2}>
              {currentCourse.prerequisites && currentCourse.prerequisites.length > 0 ? (
                currentCourse.prerequisites.map(prerequisite => (
                  <Tag key={prerequisite}>{prerequisite}</Tag>
                ))
              ) : (
                '无'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="教学材料" span={2}>
              {currentCourse.materials && currentCourse.materials.length > 0 ? (
                currentCourse.materials.map(material => (
                  <Tag key={material}>{material}</Tag>
                ))
              ) : (
                '无'
              )}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}

export default CoursePage 