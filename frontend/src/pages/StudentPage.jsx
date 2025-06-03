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
  DatePicker,
  Select,
  notification,
  Tooltip
} from 'antd'
import { 
  PlusOutlined, 
  SearchOutlined, 
  EditOutlined, 
  DeleteOutlined,
  UserOutlined,
  ScheduleOutlined,
  CheckCircleFilled,
  BookOutlined,
  DashboardOutlined,
  CalendarOutlined,
  CommentOutlined,
  SettingOutlined
} from '@ant-design/icons'
import { studentService, courseService, teacherService, enrollmentService } from '../services'
import dayjs from 'dayjs'
import StudentDashboardPage from './StudentDashboardPage'
import StudentSchedulePage from './StudentSchedulePage'
import StudentBookLessonPage from './StudentBookLessonPage'
import StudentSettingPage from './StudentSettingPage'
import StudentAvailabilityPage from './StudentAvailabilityPage'
import StudentFeedbackPage from './StudentFeedbackPage'

const { Title } = Typography
const { Search } = Input
const { RangePicker } = DatePicker
const { Option } = Select

const StudentPage = () => {
  // 状态管理
  const [loading, setLoading] = useState(false)
  const [students, setStudents] = useState([])
  const [filteredStudents, setFilteredStudents] = useState([])
  const [searchText, setSearchText] = useState('')
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isScheduleModalVisible, setIsScheduleModalVisible] = useState(false)
  const [isEnrollModalVisible, setIsEnrollModalVisible] = useState(false)
  const [currentStudent, setCurrentStudent] = useState(null)
  const [form] = Form.useForm()
  const [scheduleForm] = Form.useForm()
  const [enrollForm] = Form.useForm()
  
  // 课程和教师数据
  const [courses, setCourses] = useState([])
  const [teachers, setTeachers] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState(null)

  // 获取学生数据
  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    setLoading(true)
    try {
      const data = await studentService.getAllStudents()
      setStudents(data)
      setFilteredStudents(data)
    } catch (error) {
      message.error('获取学生数据失败')
      console.error('获取学生数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 搜索功能
  const handleSearch = (value) => {
    setSearchText(value)
    if (!value) {
      setFilteredStudents(students)
      return
    }
    
    const filtered = students.filter(student => 
      student.name.toLowerCase().includes(value.toLowerCase()) ||
      (student.phone && student.phone.includes(value)) ||
      (student.parent && student.parent.toLowerCase().includes(value.toLowerCase())) ||
      (student.parentPhone && student.parentPhone.includes(value))
    )
    
    setFilteredStudents(filtered)
  }

  // 弹窗处理
  const showAddModal = () => {
    setCurrentStudent(null)
    form.resetFields()
    setIsModalVisible(true)
  }

  const showEditModal = (student) => {
    setCurrentStudent(student)
    form.setFieldsValue({
      ...student,
      enrollmentDate: student.enrollmentDate ? dayjs(student.enrollmentDate) : null
    })
    setIsModalVisible(true)
  }

  const showScheduleModal = async (student) => {
    setCurrentStudent(student)
    setIsScheduleModalVisible(true)
    
    try {
      const availabilities = await studentService.getStudentAvailabilities(student.id)
      scheduleForm.setFieldsValue({
        availabilities: availabilities
      })
    } catch (error) {
      console.error(`获取学生(ID: ${student.id})可用时间失败:`, error)
    }
  }

  const handleModalCancel = () => {
    setIsModalVisible(false)
  }

  const handleScheduleModalCancel = () => {
    setIsScheduleModalVisible(false)
  }

  // 显示成功通知
  const showSuccessNotification = (title, description) => {
    notification.success({
      message: title,
      description: description,
      icon: <CheckCircleFilled style={{ color: '#52c41a' }} />,
      placement: 'topRight',
      duration: 3
    });
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      
      // 格式化日期
      if (values.enrollmentDate) {
        values.enrollmentDate = values.enrollmentDate.format('YYYY-MM-DD')
      }
      
      if (currentStudent) {
        // 更新学生
        await studentService.updateStudent(currentStudent.id, values)
        showSuccessNotification('更新成功', `学生 ${values.name} 的信息已成功更新`);
      } else {
        // 添加学生
        await studentService.createStudent(values)
        showSuccessNotification('添加成功', `学生 ${values.name} 已成功添加到系统`);
      }
      
      setIsModalVisible(false)
      fetchStudents() // 刷新数据
    } catch (error) {
      console.error('保存学生信息失败:', error)
      message.error('保存失败: ' + (error.response?.data || error.message))
    }
  }

  const handleScheduleSubmit = async () => {
    try {
      const values = await scheduleForm.validateFields()
      await studentService.setStudentAvailabilities(currentStudent.id, values.availabilities)
      showSuccessNotification('设置成功', `学生 ${currentStudent.name} 的可用时间已成功设置`);
      setIsScheduleModalVisible(false)
    } catch (error) {
      console.error('保存学生可用时间失败:', error)
      message.error('保存失败: ' + (error.response?.data || error.message))
    }
  }

  const handleDelete = async (id) => {
    try {
      // 先获取学生信息，以便在删除成功后显示姓名
      const studentToDelete = students.find(s => s.id === id);
      const studentName = studentToDelete?.name || '';
      
      await studentService.deleteStudent(id)
      showSuccessNotification('删除成功', `学生 ${studentName} 已从系统中删除`);
      fetchStudents() // 刷新数据
    } catch (error) {
      if (error.response?.status === 409) {
        message.error('无法删除：该学生已有课程记录')
      } else {
        message.error('删除失败: ' + (error.response?.data || error.message))
      }
      console.error(`删除学生(ID: ${id})失败:`, error)
    }
  }

  // 获取课程和教师数据
  const fetchCoursesAndTeachers = async () => {
    try {
      // 获取课程列表
      const coursesData = await courseService.getAllCourses();
      
      // 过滤出活跃状态的课程
      const activeCourses = coursesData.filter(course => 
        course.status === 'ACTIVE' || course.status === 'active'
      );
      
      setCourses(activeCourses);
      
      // 不预先加载所有教师，而是在选择课程后再加载对应的教师
      setTeachers([]);
      
      console.log('成功获取课程数据:', activeCourses.length + '个活跃课程');
    } catch (error) {
      console.error('获取课程数据失败:', error);
      message.error('获取课程数据失败');
    }
  }

  // 显示报名课程弹窗
  const showEnrollModal = (student) => {
    setCurrentStudent(student);
    // 获取课程数据
    fetchCoursesAndTeachers();
    // 重置表单
    enrollForm.resetFields();
    // 显示弹窗
    setIsEnrollModalVisible(true);
  }

  // 处理课程选择
  const handleCourseChange = async (courseId) => {
    setSelectedCourseId(courseId);
    
    try {
      console.log(`获取课程ID ${courseId} 的教师列表...`);
      
      // 1. 获取教师ID列表
      const teacherIds = await teacherService.getTeachersForCourse(courseId);
      console.log('原始教师ID列表:', teacherIds);
      
      if (!teacherIds || teacherIds.length === 0) {
        message.info('该课程暂无可用教师');
        setTeachers([]);
        return;
      }

      // 显示加载状态
      message.loading('正在加载教师数据...', 1);

      // 2. 获取教师详细信息
      const teachersData = [];
      for (const teacherId of teacherIds) {
        try {
          console.log(`开始获取教师详情，ID: ${teacherId}`);
          const teacherData = await teacherService.getTeacherById(teacherId);
          if (teacherData) {
            console.log(`获取到教师详情:`, teacherData);
            teachersData.push(teacherData);
          }
        } catch (error) {
          console.error(`获取教师(ID: ${teacherId})详情失败:`, error);
        }
      }
      
      console.log('最终获取到的教师数据:', teachersData);
      
      if (teachersData.length === 0) {
        message.info('未能获取到教师信息');
        setTeachers([]);
        return;
      }
      
      setTeachers(teachersData);
      message.success(`已找到 ${teachersData.length} 位可教授此课程的教师`);
      
      // 清空教师选择
      enrollForm.setFieldsValue({ teacherId: undefined });
    } catch (error) {
      console.error(`获取课程(ID: ${courseId})的教师列表失败:`, error);
      message.error('获取推荐教师失败');
      setTeachers([]);
    }
  };

  // 关闭报名弹窗
  const handleEnrollModalCancel = () => {
    setIsEnrollModalVisible(false)
    setSelectedCourseId(null)
  }

  // 提交报名
  const handleEnrollSubmit = async () => {
    try {
      const values = await enrollForm.validateFields();
      console.log('表单值:', values);
      
      const teacherId = values.teacherId;
      const courseId = values.courseId;
      
      console.log(`开始报名流程 - 教师ID: ${teacherId}, 课程ID: ${courseId}`);
      
      // 1. 获取或创建教师课程关联
      const teacherCourseAssignment = await teacherService.assignCourseToTeacher(teacherId, courseId);
      
      if (!teacherCourseAssignment || !teacherCourseAssignment.id) {
        throw new Error('未能获取有效的教师课程关联');
      }
      
      console.log('成功获取教师课程关联:', teacherCourseAssignment);
      
      // 2. 创建选课记录
      const enrollmentData = {
        studentId: currentStudent.id,
        teacherCourseId: teacherCourseAssignment.id,
        hourlyRate: values.hourlyRate
      };
      
      console.log('准备提交报名数据:', enrollmentData);
      
      // 创建报名记录
      const result = await enrollmentService.createEnrollment(enrollmentData);
      console.log('报名结果:', result);
      
      // 显示成功消息
      showSuccessNotification(
        '报名成功', 
        `学生 ${currentStudent.name} 已成功报名课程`
      );
      
      // 关闭弹窗并刷新数据
      setIsEnrollModalVisible(false);
      fetchStudents();
    } catch (error) {
      console.error('报名失败:', error);
      message.error('报名失败: ' + (error.response?.data?.message || error.message || String(error)));
    }
  };

  // 处理教师选择
  const handleTeacherChange = (teacherId) => {
    // 根据选择的教师ID找到对应的教师对象
    const selectedTeacher = teachers.find(teacher => teacher.id === teacherId);
    
    if (selectedTeacher && selectedTeacher.hourlyRate) {
      // 如果教师有默认课时费，则自动填充
      enrollForm.setFieldsValue({ hourlyRate: selectedTeacher.hourlyRate });
    } else {
      // 否则清空课时费字段
      enrollForm.setFieldsValue({ hourlyRate: undefined });
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
      title: '姓名',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 80,
      render: (text) => <Tag color={text === '男' ? 'blue' : 'magenta'}>{text}</Tag>
    },
    {
      title: '年龄',
      dataIndex: 'age',
      key: 'age',
      width: 80
    },
    {
      title: '年级',
      dataIndex: 'grade',
      key: 'grade',
      width: 100
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone'
    },
    {
      title: '家长',
      dataIndex: 'parent',
      key: 'parent',
      width: 100
    },
    {
      title: '家长电话',
      dataIndex: 'parentPhone',
      key: 'parentPhone'
    },
    {
      title: '入学日期',
      dataIndex: 'enrollmentDate',
      key: 'enrollmentDate',
      render: (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '在学' : '停课'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="编辑">
            <Button 
              icon={<EditOutlined />} 
              onClick={() => showEditModal(record)}
              type="text"
            />
          </Tooltip>
          <Tooltip title="排课时间">
            <Button 
              icon={<ScheduleOutlined />}
              onClick={() => showScheduleModal(record)}
              type="text"
            />
          </Tooltip>
          <Tooltip title="报名课程">
            <Button 
              icon={<BookOutlined />}
              onClick={() => showEnrollModal(record)}
              type="text"
            />
          </Tooltip>
          <Popconfirm
            title="确定删除此学生吗?"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button 
                danger 
                icon={<DeleteOutlined />}
                type="text"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const routes = [
    {
      path: '/student/dashboard',
      element: <StudentDashboardPage />,
      icon: <DashboardOutlined />,
      label: '仪表盘',
    },
    {
      path: '/student/schedule',
      element: <StudentSchedulePage />,
      icon: <CalendarOutlined />,
      label: '我的课表',
    },
    {
      path: '/student/book-lesson',
      element: <StudentBookLessonPage />,
      icon: <BookOutlined />,
      label: '预约课程',
    },
    {
      path: '/student/feedback',
      element: <StudentFeedbackPage />,
      icon: <CommentOutlined />,
      label: '课程评价',
    },
    {
      path: '/student/availability',
      element: <StudentAvailabilityPage />,
      icon: <ScheduleOutlined />,
      label: '可用时间',
    },
    {
      path: '/student/setting',
      element: <StudentSettingPage />,
      icon: <SettingOutlined />,
      label: '设置',
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <UserOutlined /> 学生管理
          </Title>
          <Space>
            <Search
              placeholder="搜索学生"
              onSearch={handleSearch}
              style={{ width: 300 }}
              allowClear
            />
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={showAddModal}
            >
              添加学生
            </Button>
          </Space>
        </div>

        <Table 
          dataSource={filteredStudents} 
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

      {/* 学生编辑/添加弹窗 */}
      <Modal
        title={currentStudent ? '编辑学生信息' : '添加新学生'}
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
            gender: '男',
            status: 'active'
          }}
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="姓名"
                rules={[{ required: true, message: '请输入学生姓名' }]}
              >
                <Input placeholder="请输入学生姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="gender"
                label="性别"
              >
                <Select>
                  <Option value="男">男</Option>
                  <Option value="女">女</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="age"
                label="年龄"
              >
                <InputNumber min={1} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="grade"
                label="年级"
              >
                <Select>
                  <Option value="小一">小一</Option>
                  <Option value="小二">小二</Option>
                  <Option value="小三">小三</Option>
                  <Option value="小四">小四</Option>
                  <Option value="小五">小五</Option>
                  <Option value="小六">小六</Option>
                  <Option value="初一">初一</Option>
                  <Option value="初二">初二</Option>
                  <Option value="初三">初三</Option>
                  <Option value="高一">高一</Option>
                  <Option value="高二">高二</Option>
                  <Option value="高三">高三</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="电话"
              >
                <Input placeholder="请输入学生电话" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="parent"
                label="家长姓名"
              >
                <Input placeholder="请输入家长姓名" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="parentPhone"
                label="家长电话"
              >
                <Input placeholder="请输入家长电话" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="enrollmentDate"
                label="入学日期"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
              >
                <Select>
                  <Option value="active">在学</Option>
                  <Option value="inactive">停课</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 排课时间设置弹窗 */}
      <Modal
        title={`${currentStudent?.name || ''} - 可用上课时间设置`}
        open={isScheduleModalVisible}
        onOk={handleScheduleSubmit}
        onCancel={handleScheduleModalCancel}
        width={900}
        destroyOnClose
      >
        <Form
          form={scheduleForm}
          layout="vertical"
        >
          <Form.List name="availabilities">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row gutter={16} key={key} style={{ marginBottom: 16 }}>
                    <Col span={6}>
                      <Form.Item
                        {...restField}
                        name={[name, 'dayOfWeek']}
                        label="星期"
                        rules={[{ required: true, message: '请选择星期' }]}
                      >
                        <Select placeholder="选择星期">
                          <Option value="MONDAY">周一</Option>
                          <Option value="TUESDAY">周二</Option>
                          <Option value="WEDNESDAY">周三</Option>
                          <Option value="THURSDAY">周四</Option>
                          <Option value="FRIDAY">周五</Option>
                          <Option value="SATURDAY">周六</Option>
                          <Option value="SUNDAY">周日</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'startTime']}
                        label="开始时间"
                        rules={[{ required: true, message: '请选择开始时间' }]}
                      >
                        <Input placeholder="格式: HH:mm (如 14:30)" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'endTime']}
                        label="结束时间"
                        rules={[{ required: true, message: '请选择结束时间' }]}
                      >
                        <Input placeholder="格式: HH:mm (如 16:00)" />
                      </Form.Item>
                    </Col>
                    <Col span={2} style={{ display: 'flex', alignItems: 'center', marginTop: 29 }}>
                      <Button 
                        type="text" 
                        danger 
                        icon={<DeleteOutlined />} 
                        onClick={() => remove(name)} 
                      />
                    </Col>
                  </Row>
                ))}
                <Form.Item>
                  <Button 
                    type="dashed" 
                    onClick={() => add()} 
                    block 
                    icon={<PlusOutlined />}
                  >
                    添加可用时间段
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>

      {/* 报名课程弹窗 */}
      <Modal
        title={`为 ${currentStudent?.name || ''} 报名课程`}
        open={isEnrollModalVisible}
        onCancel={handleEnrollModalCancel}
        onOk={handleEnrollSubmit}
        width={600}
        okText="确认报名"
        cancelText="取消"
      >
        <Form
          form={enrollForm}
          layout="vertical"
        >
          <Form.Item
            name="courseId"
            label="选择课程"
            rules={[{ required: true, message: '请选择课程' }]}
          >
            <Select 
              placeholder="请选择课程" 
              onChange={handleCourseChange}
              loading={courses.length === 0}
            >
              {courses.map(course => (
                <Option key={course.id} value={course.id}>
                  {course.name} {course.level ? `(${course.level})` : ''}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="teacherId"
            label="选择教师"
            rules={[{ required: true, message: '请选择教师' }]}
            extra={teachers.length === 0 && selectedCourseId ? "没有找到可教授此课程的教师" : ""}
          >
            <Select 
              placeholder="请选择教师"
              disabled={!selectedCourseId || teachers.length === 0}
              loading={selectedCourseId && teachers.length === 0}
              notFoundContent={selectedCourseId ? (teachers.length === 0 ? "没有找到可教授此课程的教师" : null) : "请先选择课程"}
              onChange={handleTeacherChange}
            >
              {teachers.map(teacher => {
                console.log('渲染教师选项:', teacher);
                // 确保教师ID和名称可用
                const teacherId = teacher?.id || 'unknown';
                const teacherName = teacher?.name || `教师ID: ${teacherId}`;
                const hourlyRate = teacher?.hourlyRate;
                
                return (
                  <Option key={teacherId} value={teacherId}>
                    {teacherName}
                    {hourlyRate ? ` (￥${hourlyRate}/小时)` : ''}
                  </Option>
                );
              })}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="hourlyRate"
            label="课时费(元/小时)"
            rules={[
              { required: true, message: '请输入课时费' },
              { type: 'number', min: 0, message: '课时费必须大于等于0' }
            ]}
          >
            <InputNumber placeholder="请输入课时费" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default StudentPage 