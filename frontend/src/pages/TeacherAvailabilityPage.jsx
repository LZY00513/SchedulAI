import React, { useState, useEffect } from 'react';
import {
    Select,
    Button,
    Card,
    Typography,
    Spin,
    message,
    Divider,
    Row,
    Col,
    Alert,
    Modal,
    notification,
    Popconfirm,
    Tooltip,
    TimePicker,
    Form
} from 'antd';
import { SaveOutlined, DeleteOutlined, EditOutlined, PlusOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import weekday from 'dayjs/plugin/weekday';
import isoWeek from 'dayjs/plugin/isoWeek';

// Import services
import { teacherService, teacherAvailabilityService } from '../services';

// Extend dayjs
dayjs.extend(weekday);
dayjs.extend(isoWeek);

const { Title } = Typography;
const { Option } = Select;

// Constants for the grid
const DAYS_OF_WEEK = [
    { key: 'MONDAY', label: 'Mon' },
    { key: 'TUESDAY', label: 'Tue' },
    { key: 'WEDNESDAY', label: 'Wed' },
    { key: 'THURSDAY', label: 'Thu' },
    { key: 'FRIDAY', label: 'Fri' },
    { key: 'SATURDAY', label: 'Sat' },
    { key: 'SUNDAY', label: 'Sun' },
];

const TIME_SLOTS = [];
const START_HOUR = 8; // 8 AM
const END_HOUR = 21; // Until 9 PM
for (let hour = START_HOUR; hour < END_HOUR; hour++) {
    TIME_SLOTS.push(`${String(hour).padStart(2, '0')}:00`);
    TIME_SLOTS.push(`${String(hour).padStart(2, '0')}:30`);
}

const TeacherAvailabilityPage = () => {
    const [teachers, setTeachers] = useState([]);
    const [selectedTeacherId, setSelectedTeacherId] = useState(null);
    const [availabilitySlots, setAvailabilitySlots] = useState([]);
    const [scheduleGrid, setScheduleGrid] = useState({});
    const [loadingTeachers, setLoadingTeachers] = useState(false);
    const [loadingAvailability, setLoadingAvailability] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [currentAvailability, setCurrentAvailability] = useState(null);
    const [form] = Form.useForm();
    const [addMode, setAddMode] = useState(false);

    // Fetch teachers on mount
    useEffect(() => {
        fetchTeachers();
    }, []);

    // Fetch availability when teacher changes
    useEffect(() => {
        if (selectedTeacherId) {
            fetchAvailability(selectedTeacherId);
        } else {
            setAvailabilitySlots([]);
            setScheduleGrid({});
        }
    }, [selectedTeacherId]);

    // Update grid when availability data changes
    useEffect(() => {
        updateGridFromAvailability(availabilitySlots);
    }, [availabilitySlots]);

    const fetchTeachers = async () => {
        setLoadingTeachers(true);
        try {
            const data = await teacherService.getAllTeachers();
            setTeachers(data || []);
        } catch (error) {
            notification.error({
                message: '获取教师列表失败',
                description: error.message || '未知错误，请重试',
                placement: 'topRight',
            });
            setTeachers([]);
        } finally {
            setLoadingTeachers(false);
        }
    };

    const fetchAvailability = async (teacherId) => {
        setLoadingAvailability(true);
        try {
            const data = await teacherAvailabilityService.getTeacherAvailability(teacherId);
            // 安全地处理可能的复杂数据结构
            const safeData = ensureSafeAvailabilityData(data);
            setAvailabilitySlots(safeData || []);
        } catch (error) {
            notification.error({
                message: '获取教师可用时间失败',
                description: error.message || '未知错误，请重试',
                placement: 'topRight',
            });
            setAvailabilitySlots([]);
        } finally {
            setLoadingAvailability(false);
        }
    };

    // 确保可用时间数据安全可用
    const ensureSafeAvailabilityData = (data) => {
        if (!Array.isArray(data)) return [];
        return data.map(item => ({
            id: item.id,
            teacherId: item.teacherId,
            teacherName: item.teacherName,
            dayOfWeek: item.dayOfWeek || 'MONDAY',
            dayOfWeekDisplay: item.dayOfWeekDisplay || '星期一',
            startTime: item.startTime || '09:00:00',
            endTime: item.endTime || '10:00:00',
            timeRange: item.timeRange || '09:00-10:00',
            isAvailable: item.isAvailable !== false
        }));
    };

    // Convert backend data to grid state
    const updateGridFromAvailability = (slots) => {
        const newGrid = {};
        slots.forEach(slot => {
            const start = dayjs(slot.startTime, 'HH:mm:ss');
            const end = dayjs(slot.endTime, 'HH:mm:ss');

            // 检查星期值是否有效
            const validDayOfWeek = DAYS_OF_WEEK.find(day => day.key === slot.dayOfWeek);
            if (!validDayOfWeek) {
                console.warn('跳过无效的星期值:', slot.dayOfWeek);
                return;
            }

            // Iterate through 30-min intervals within the slot
            let current = start;
            while (current.isBefore(end)) {
                const timeString = current.format('HH:mm');
                const gridKey = `${slot.dayOfWeek}_${timeString}`;
                if (TIME_SLOTS.includes(timeString)) {
                    newGrid[gridKey] = true; 
                }
                current = current.add(30, 'minute');
            }
        });
        setScheduleGrid(newGrid);
    };

    // Handle clicking a cell in the grid
    const handleCellClick = (dayKey, timeSlot) => {
        const gridKey = `${dayKey}_${timeSlot}`;
        setScheduleGrid(prevGrid => ({
            ...prevGrid,
            [gridKey]: !prevGrid[gridKey]
        }));
    };

    // Convert grid state back to backend format and save
    const handleSaveChanges = async () => {
        if (!selectedTeacherId) {
            notification.warning({
                message: '请先选择一位教师',
                placement: 'topRight',
            });
            return;
        }

        setSaving(true);
        const newAvailabilityList = [];
        
        // Iterate through days and times to build the list
        DAYS_OF_WEEK.forEach(day => {
             let currentSlotStart = null;
             for (const time of TIME_SLOTS) {
                 const gridKey = `${day.key}_${time}`;
                 const isAvailable = scheduleGrid[gridKey];

                 if (isAvailable) {
                    if (currentSlotStart === null) {
                         currentSlotStart = time;
                    }
                 } else {
                     if (currentSlotStart !== null) {
                         const startTime = `${currentSlotStart}:00`;
                         const endTime = `${time}:00`; 
                         newAvailabilityList.push({
                             teacherId: selectedTeacherId,
                             dayOfWeek: day.key,
                             startTime: startTime,
                             endTime: endTime, 
                             isAvailable: true
                         });
                         currentSlotStart = null;
                     }
                 }
             }
             // Check if the last slot of the day was available
             if (currentSlotStart !== null) {
                  const startTime = `${currentSlotStart}:00`;
                  const endHourTime = dayjs(TIME_SLOTS[TIME_SLOTS.length-1], 'HH:mm').add(30,'minute').format('HH:mm:ss');
                  let endTime = endHourTime;
                    
                  newAvailabilityList.push({
                      teacherId: selectedTeacherId,
                      dayOfWeek: day.key,
                      startTime: startTime,
                      endTime: endTime,
                      isAvailable: true
                  });
             }
        });

        try {
            console.log("Saving availability:", newAvailabilityList);
            await teacherAvailabilityService.batchUpdateTeacherAvailability(selectedTeacherId, newAvailabilityList);
            notification.success({
                message: '可用时间更新成功！',
                placement: 'topRight',
            });
            // Refetch to confirm
            fetchAvailability(selectedTeacherId);
        } catch (error) {
            notification.error({
                message: '保存可用时间失败',
                description: error.message || '未知错误，请重试',
                placement: 'topRight',
            });
            console.error("Save error:", error);
        } finally {
            setSaving(false);
        }
    };

    // 打开编辑模态框
    const handleEditAvailability = (slot) => {
        setAddMode(false);
        setCurrentAvailability(slot);
        form.setFieldsValue({
            dayOfWeek: slot.dayOfWeek,
            startTime: dayjs(slot.startTime, 'HH:mm:ss'),
            endTime: dayjs(slot.endTime, 'HH:mm:ss')
        });
        setIsModalVisible(true);
    };

    // 打开添加模态框
    const handleAddAvailability = () => {
        setAddMode(true);
        setCurrentAvailability(null);
        form.resetFields();
        form.setFieldsValue({
            dayOfWeek: 'MONDAY',
            startTime: dayjs('09:00', 'HH:mm'),
            endTime: dayjs('10:00', 'HH:mm')
        });
        setIsModalVisible(true);
    };

    // 保存编辑或新增
    const handleModalOk = async () => {
        try {
            const values = await form.validateFields();
            
            if (!selectedTeacherId) {
                notification.warning({
                    message: '请先选择一位教师',
                    placement: 'topRight',
                });
                return;
            }

            const availabilityData = {
                dayOfWeek: values.dayOfWeek,
                startTime: values.startTime.format('HH:mm:00'),
                endTime: values.endTime.format('HH:mm:00'),
                isAvailable: true
            };

            setSaving(true);

            if (addMode) {
                // 添加新时间段
                const result = await teacherAvailabilityService.addTeacherAvailability(selectedTeacherId, availabilityData);
                if (result.success) {
                    notification.success({
                        message: '添加成功',
                        description: '新的可用时间段已添加',
                        placement: 'topRight',
                    });
                } else {
                    throw new Error(result.message || '添加失败，请重试');
                }
            } else {
                // 更新现有时间段
                availabilityData.id = currentAvailability.id;
                const result = await teacherAvailabilityService.updateTeacherAvailability(currentAvailability.id, availabilityData);
                if (result.success) {
                    notification.success({
                        message: '更新成功',
                        description: '可用时间段已更新',
                        placement: 'topRight',
                    });
                } else {
                    throw new Error(result.message || '更新失败，请重试');
                }
            }

            setIsModalVisible(false);
            fetchAvailability(selectedTeacherId);
        } catch (error) {
            notification.error({
                message: addMode ? '添加可用时间失败' : '更新可用时间失败',
                description: error.message || '未知错误，请重试',
                placement: 'topRight',
            });
            console.error("Error:", error);
        } finally {
            setSaving(false);
        }
    };

    // 删除可用时间段
    const handleDeleteAvailability = async (availabilityId) => {
        if (!availabilityId) return;
        
        try {
            const result = await teacherAvailabilityService.deleteTeacherAvailability(availabilityId);
            if (result.success) {
                notification.success({
                    message: '删除成功',
                    description: '可用时间段已删除',
                    placement: 'topRight',
                });
                fetchAvailability(selectedTeacherId);
            } else {
                throw new Error(result.message || '删除失败，请重试');
            }
        } catch (error) {
            notification.error({
                message: '删除可用时间失败',
                description: error.message || '未知错误，请重试',
                placement: 'topRight',
            });
            console.error("Delete error:", error);
        }
    };
    
    const dayOfWeekToZH = {
        MONDAY: '星期一',
        TUESDAY: '星期二',
        WEDNESDAY: '星期三',
        THURSDAY: '星期四',
        FRIDAY: '星期五',
        SATURDAY: '星期六',
        SUNDAY: '星期日'
    };

    return (
        <div className="teacher-availability-management">
            <Title level={2}>教师可用时间管理</Title>
            <Card bordered={false}>
                <Row gutter={[16, 16]} align="bottom">
                    <Col>
                        <label>选择教师: </label>
                        <Select
                            style={{ width: 250, marginRight: 16 }}
                            placeholder="请选择教师"
                            loading={loadingTeachers}
                            onChange={(value) => setSelectedTeacherId(value)}
                            value={selectedTeacherId}
                            allowClear
                        >
                            {teachers.map(teacher => (
                                <Option key={teacher.id} value={teacher.id}>
                                    {teacher.name} ({teacher.subject})
                                </Option>
                            ))}
                        </Select>
                    </Col>
                    <Col>
                         <Button
                            type="primary"
                            icon={<SaveOutlined />}
                            loading={saving || loadingAvailability}
                            disabled={!selectedTeacherId}
                            onClick={handleSaveChanges}
                        >
                            保存更改
                        </Button>
                    </Col>
                    <Col>
                        <Button 
                            type="default" 
                            icon={<PlusOutlined />}
                            disabled={!selectedTeacherId}
                            onClick={handleAddAvailability}
                        >
                            添加时间段
                        </Button>
                    </Col>
                </Row>
                <Divider />

                {!selectedTeacherId && (
                    <Alert message="请先选择一位教师以查看或编辑其可用时间。" type="info" showIcon />
                )}

                {selectedTeacherId && (
                     <Spin spinning={loadingAvailability || saving}>
                        {/* 时间段列表 */}
                        {availabilitySlots.length > 0 && (
                            <div style={{ marginBottom: 20 }}>
                                <Title level={5}>当前可用时间段</Title>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                    {availabilitySlots.map(slot => (
                                        <Card 
                                            key={slot.id} 
                                            size="small" 
                                            style={{ width: 240 }}
                                            title={slot.dayOfWeekDisplay || dayOfWeekToZH[slot.dayOfWeek]}
                                            extra={
                                                <div>
                                                    <Tooltip title="编辑">
                                                        <Button 
                                                            type="text" 
                                                            size="small" 
                                                            icon={<EditOutlined />} 
                                                            onClick={() => handleEditAvailability(slot)}
                                                        />
                                                    </Tooltip>
                                                    <Popconfirm
                                                        title="确认删除"
                                                        description="确定要删除这个时间段吗？"
                                                        onConfirm={() => handleDeleteAvailability(slot.id)}
                                                        okText="是"
                                                        cancelText="否"
                                                    >
                                                        <Button 
                                                            type="text" 
                                                            danger 
                                                            size="small" 
                                                            icon={<DeleteOutlined />}
                                                        />
                                                    </Popconfirm>
                                                </div>
                                            }
                                        >
                                            <p><ClockCircleOutlined /> {slot.timeRange || ((slot.startTime && typeof slot.startTime === 'string') ? slot.startTime.substring(0, 5) : '00:00') + ' - ' + ((slot.endTime && typeof slot.endTime === 'string') ? slot.endTime.substring(0, 5) : '00:00')}</p>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* 传统网格视图 */}
                         <div style={{ display: 'flex', border: '1px solid #f0f0f0' }}>
                            {/* Header Column (Time Slots) */}
                            <div style={{ borderRight: '1px solid #f0f0f0' }}>
                                <div style={{ height: '30px', padding: '0 8px', visibility:'hidden' }}>Time</div>
                                {TIME_SLOTS.map(time => (
                                    <div key={time} style={{ height: '25px', padding: '0 8px', fontSize: '12px', borderTop: '1px solid #f0f0f0', display: 'flex', alignItems: 'center' }}>
                                        {time}
                                    </div>
                                ))}
                            </div>
                            {DAYS_OF_WEEK.map(day => (
                                <div key={day.key} style={{ flex: 1, textAlign: 'center', borderRight: '1px solid #f0f0f0' }}>
                                    <div style={{ height: '30px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{day.label}</div>
                                    {TIME_SLOTS.map(time => {
                                        const gridKey = `${day.key}_${time}`;
                                        const isAvailable = scheduleGrid[gridKey];
                                        return (
                                            <div
                                                key={time}
                                                style={{
                                                    height: '25px',
                                                    backgroundColor: isAvailable ? '#e6f7ff' : '#fff',
                                                    borderTop: '1px solid #f0f0f0',
                                                    cursor: 'pointer',
                                                }}
                                                onClick={() => handleCellClick(day.key, time)}
                                            />
                                        );
                                    })}
                                </div>
                            ))}
                         </div>
                     </Spin>
                )}
            </Card>

            {/* 编辑/添加模态框 */}
            <Modal
                title={addMode ? "添加可用时间" : "编辑可用时间"}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onOk={handleModalOk}
                confirmLoading={saving}
                destroyOnClose
            >
                <Form
                    form={form}
                    layout="vertical"
                    name="availabilityForm"
                >
                    <Form.Item
                        name="dayOfWeek"
                        label="星期"
                        rules={[{ required: true, message: '请选择星期' }]}
                    >
                        <Select>
                            {DAYS_OF_WEEK.map(day => (
                                <Option key={day.key} value={day.key}>
                                    {dayOfWeekToZH[day.key]}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="startTime"
                        label="开始时间"
                        rules={[{ required: true, message: '请选择开始时间' }]}
                    >
                        <TimePicker format="HH:mm" minuteStep={30} />
                    </Form.Item>
                    <Form.Item
                        name="endTime"
                        label="结束时间"
                        rules={[
                            { required: true, message: '请选择结束时间' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    const start = getFieldValue('startTime');
                                    if (!start || !value || value.isAfter(start)) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('结束时间必须晚于开始时间'));
                                }
                            })
                        ]}
                    >
                        <TimePicker format="HH:mm" minuteStep={30} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default TeacherAvailabilityPage; 