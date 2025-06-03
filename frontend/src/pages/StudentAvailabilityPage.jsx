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
import { SaveOutlined, ClockCircleOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import weekday from 'dayjs/plugin/weekday';
import isoWeek from 'dayjs/plugin/isoWeek';

// Import services
import { studentService, studentAvailabilityService } from '../services';

// Extend dayjs
dayjs.extend(weekday);
dayjs.extend(isoWeek);

const { Title } = Typography;
const { Option } = Select;

// Constants for the grid (same as teacher page)
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
const START_HOUR = 8; 
const END_HOUR = 21; 
for (let hour = START_HOUR; hour < END_HOUR; hour++) {
    TIME_SLOTS.push(`${String(hour).padStart(2, '0')}:00`);
    TIME_SLOTS.push(`${String(hour).padStart(2, '0')}:30`);
}
// END Constants

const StudentAvailabilityPage = () => {
    const [students, setStudents] = useState([]);
    const [selectedStudentId, setSelectedStudentId] = useState(null);
    const [availabilitySlots, setAvailabilitySlots] = useState([]); 
    const [scheduleGrid, setScheduleGrid] = useState({});
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [loadingAvailability, setLoadingAvailability] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [currentAvailability, setCurrentAvailability] = useState(null);
    const [form] = Form.useForm();
    const [addMode, setAddMode] = useState(false);

    // Fetch students on mount
    useEffect(() => {
        fetchStudents();
    }, []);

    // Fetch availability when student changes
    useEffect(() => {
        if (selectedStudentId) {
            fetchAvailability(selectedStudentId); 
        } else {
            setAvailabilitySlots([]);
            setScheduleGrid({}); 
        }
    }, [selectedStudentId]);

    const fetchStudents = async () => {
        setLoadingStudents(true);
        try {
            const data = await studentService.getAllStudents();
            setStudents(data || []);
        } catch (error) {
            notification.error({
                message: '获取学生列表失败',
                description: error.message || '未知错误，请重试',
                placement: 'topRight',
            });
            setStudents([]);
        } finally {
            setLoadingStudents(false);
        }
    };

    const fetchAvailability = async (studentId) => {
        setLoadingAvailability(true);
        try {
            console.log(`正在获取学生(ID: ${studentId})可用时间数据...`);
            const data = await studentAvailabilityService.getStudentAvailability(studentId);
            console.log(`获取到学生可用时间数据: ${data ? data.length : 0}条记录`);
            
            // 安全地处理可能的复杂数据结构
            const safeData = ensureSafeAvailabilityData(data);
            setAvailabilitySlots(safeData || []);
            
            // 立即更新时间表格，不要依赖于useEffect
            updateGridFromAvailability(safeData || []);
        } catch (error) {
            console.error(`获取学生可用时间失败: ${error.message || '未知错误'}`);
            notification.error({
                message: '获取学生可用时间失败',
                description: error.message || '未知错误，请重试',
                placement: 'topRight',
            });
            setAvailabilitySlots([]);
            setScheduleGrid({}); // 清空时间表格
        } finally {
            setLoadingAvailability(false);
        }
    };

    // Convert backend data to grid state
    const updateGridFromAvailability = (slots) => {
        console.log('正在更新时间表格，数据:', slots);
        
        // 创建全新的空白表格状态
        const newGrid = {};
        
        // 初始化所有时间格子为未选择状态
        DAYS_OF_WEEK.forEach(day => {
            TIME_SLOTS.forEach(time => {
                const gridKey = `${day.key}_${time}`;
                newGrid[gridKey] = false;
            });
        });
        
        if (!Array.isArray(slots) || slots.length === 0) {
            console.log('没有可用时间数据，返回空表格');
            setScheduleGrid(newGrid);
            return;
        }
        
        // 添加数据库中的时间段
        slots.forEach(slot => {
            try {
                if (!slot || !slot.dayOfWeek || !slot.startTime || !slot.endTime) {
                    console.warn('跳过无效的时间段数据:', slot);
                    return;
                }
                
                console.log(`处理时间段: ${slot.dayOfWeek} ${slot.startTime} - ${slot.endTime}`);
                
                // 可以直接使用timeRange，但为了兼容性还是使用startTime和endTime
                // 新的方式: if (slot.timeRange) { console.log(`使用时间范围: ${slot.timeRange}`); }
                
                // 确保使用正确的时间格式
                const startStr = typeof slot.startTime === 'string' ? slot.startTime : '00:00:00';
                const endStr = typeof slot.endTime === 'string' ? slot.endTime : '00:00:00';
                
                // 移除可能的秒数部分
                const start = dayjs(startStr.substring(0, 5), 'HH:mm');
                const end = dayjs(endStr.substring(0, 5), 'HH:mm');
                
                if (!start.isValid() || !end.isValid()) {
                    console.warn('时间格式无效:', slot);
                    return;
                }
                
                // 确保使用正确的星期值 - 严格检查dayOfWeek是否为有效值
                const validDayOfWeek = DAYS_OF_WEEK.find(day => day.key === slot.dayOfWeek);
                if (!validDayOfWeek) {
                    console.warn('无效的星期值:', slot.dayOfWeek);
                    // 如果有dayOfWeekDisplay，打印它以便调试
                    if (slot.dayOfWeekDisplay) {
                        console.log(`收到的星期显示名称: ${slot.dayOfWeekDisplay}`);
                    }
                    return;
                }
                
                // 标记此时间段内的所有30分钟格子
                let current = start;
                while (current.isBefore(end) || current.format('HH:mm') === end.format('HH:mm')) {
                    const timeString = current.format('HH:mm');
                    
                    // 只处理时间表中存在的时间点
                    if (TIME_SLOTS.includes(timeString)) {
                        const gridKey = `${slot.dayOfWeek}_${timeString}`;
                        console.log(`标记时间格子为可用: ${gridKey}`);
                        newGrid[gridKey] = true;
                    }
                    
                    // 前进30分钟
                    current = current.add(30, 'minute');
                    
                    // 避免无限循环
                    if (current.isAfter(end.add(1, 'hour'))) {
                        console.warn('时间段处理可能存在无限循环:', slot);
                        break;
                    }
                }
            } catch (error) {
                console.error('处理时间段时出错:', error, slot);
            }
        });
        
        console.log('更新后的时间表格数据:', newGrid);
        setScheduleGrid(newGrid);
    };

    // 确保可用时间数据安全可用
    const ensureSafeAvailabilityData = (data) => {
        if (!Array.isArray(data)) {
            console.warn('收到非数组数据:', data);
            return [];
        }
        
        return data.map(item => {
            // 确保每个对象都有必要的字段，使用新的DTO字段
            const safeItem = {
                id: item?.id || Math.random().toString(36).substring(2, 10),
                studentId: item?.studentId,
                studentName: item?.studentName,
                dayOfWeek: item?.dayOfWeek || 'MONDAY',
                dayOfWeekDisplay: item?.dayOfWeekDisplay || '星期一',
                startTime: item?.startTime || '09:00:00',
                endTime: item?.endTime || '10:00:00',
                timeRange: item?.timeRange || '09:00-10:00',
                isAvailable: item?.isAvailable !== false
            };
            
            console.log('处理后的时间段数据:', safeItem);
            return safeItem;
        });
    };

    // Handle clicking a cell in the grid
    const handleCellClick = (dayKey, timeSlot) => {
        const gridKey = `${dayKey}_${timeSlot}`;
        console.log(`点击时间格子: ${gridKey}, 当前状态: ${scheduleGrid[gridKey] ? '已选' : '未选'}`);
        
        setScheduleGrid(prevGrid => {
            const newGrid = { ...prevGrid };
            newGrid[gridKey] = !prevGrid[gridKey];
            console.log(`更新时间格子: ${gridKey}, 新状态: ${newGrid[gridKey] ? '已选' : '未选'}`);
            return newGrid;
        });
    };

    // Convert grid state back to backend format and save
    const handleSaveChanges = async () => {
        if (!selectedStudentId) {
            notification.warning({
                message: '请先选择一位学生',
                placement: 'topRight',
            });
            return;
        }

        setSaving(true);
        const newAvailabilityList = [];
        
        try {
            console.log("准备保存的时间表格状态:", scheduleGrid);
            
            // 优化时间段合并逻辑
            DAYS_OF_WEEK.forEach(day => {
                // 收集当天所有被选中的时间点
                const selectedTimes = [];
                TIME_SLOTS.forEach(time => {
                    const gridKey = `${day.key}_${time}`;
                    if (scheduleGrid[gridKey]) {
                        selectedTimes.push(time);
                    }
                });
                
                console.log(`${day.key} 被选中的时间点:`, selectedTimes);
                
                if (selectedTimes.length === 0) return; // 当天没有选择任何时间
                
                // 合并连续的时间点为时间段
                const timeRanges = [];
                let rangeStart = null;
                let prevTimeIndex = -1;
                
                selectedTimes.forEach(time => {
                    const currentIndex = TIME_SLOTS.indexOf(time);
                    
                    // 如果是第一个时间点或者与前一个时间点不连续
                    if (rangeStart === null || currentIndex !== prevTimeIndex + 1) {
                        if (rangeStart !== null) {
                            // 结束前一个时间段
                            const endTime = `${TIME_SLOTS[prevTimeIndex]}:00`;
                            const nextTime = TIME_SLOTS[prevTimeIndex + 1] || 
                                            dayjs(TIME_SLOTS[prevTimeIndex], 'HH:mm').add(30, 'minute').format('HH:mm');
                            timeRanges.push({
                                start: `${rangeStart}:00`,
                                end: nextTime + ":00"
                            });
                        }
                        // 开始新的时间段
                        rangeStart = time;
                    }
                    // 更新索引
                    prevTimeIndex = currentIndex;
                });
                
                // 处理最后一个时间段
                if (rangeStart !== null) {
                    const lastIndex = prevTimeIndex;
                    const nextTime = TIME_SLOTS[lastIndex + 1] || 
                                    dayjs(TIME_SLOTS[lastIndex], 'HH:mm').add(30, 'minute').format('HH:mm');
                    timeRanges.push({
                        start: `${rangeStart}:00`,
                        end: nextTime + ":00"
                    });
                }
                
                console.log(`${day.key} 合并后的时间段:`, timeRanges);
                
                // 添加到最终列表
                timeRanges.forEach(range => {
                    newAvailabilityList.push({
                        dayOfWeek: day.key,
                        startTime: range.start,
                        endTime: range.end,
                        isAvailable: true
                    });
                });
            });
            
            console.log("正在保存学生可用时间，最终合并的时间段:", newAvailabilityList);
            
            if (newAvailabilityList.length === 0) {
                notification.warning({
                    message: '没有选择任何可用时间',
                    description: '请至少选择一个时间段',
                    placement: 'topRight',
                });
                setSaving(false);
                return;
            }
            
            const result = await studentAvailabilityService.batchUpdateStudentAvailability(selectedStudentId, newAvailabilityList);
            
            if (result && result.success) {
                notification.success({
                    message: '学生可用时间更新成功！',
                    placement: 'topRight',
                });
                // 重新获取最新数据以确保UI显示一致
                await fetchAvailability(selectedStudentId);
            } else {
                throw new Error(result?.message || '保存失败，请重试');
            }
        } catch (error) {
            notification.error({
                message: '保存学生可用时间失败',
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
            
            if (!selectedStudentId) {
                notification.warning({
                    message: '请先选择一位学生',
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
                const result = await studentAvailabilityService.addStudentAvailability(selectedStudentId, availabilityData);
                if (result && result.success) {
                    notification.success({
                        message: '添加成功',
                        description: '新的可用时间段已添加',
                        placement: 'topRight',
                    });
                    await fetchAvailability(selectedStudentId); // 重新获取数据
                } else {
                    throw new Error(result?.message || '添加失败，请重试');
                }
            } else {
                // 更新现有时间段
                availabilityData.id = currentAvailability.id;
                const response = await fetch(`/api/student-availabilities/${currentAvailability.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(availabilityData)
                });
                
                if (!response.ok) throw new Error('更新失败，请重试');
                
                notification.success({
                    message: '更新成功',
                    description: '可用时间段已更新',
                    placement: 'topRight',
                });
                await fetchAvailability(selectedStudentId); // 重新获取数据
            }

            setIsModalVisible(false);
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
            const response = await fetch(`/api/student-availabilities/${availabilityId}`, {
                method: 'DELETE',
            });
            
            if (!response.ok) throw new Error('删除失败，请重试');
            
            notification.success({
                message: '删除成功',
                description: '可用时间段已删除',
                placement: 'topRight',
            });
            
            await fetchAvailability(selectedStudentId); // 重新获取数据
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
        <div className="student-availability-management">
            <Title level={2}>学生可用时间管理</Title>
            <Card bordered={false}>
                <Row gutter={[16, 16]} align="bottom">
                    <Col>
                        <label>选择学生: </label>
                        <Select
                            style={{ width: 250, marginRight: 16 }}
                            placeholder="请选择学生"
                            loading={loadingStudents}
                            onChange={(value) => setSelectedStudentId(value)}
                            value={selectedStudentId}
                            allowClear
                        >
                            {students.map(student => (
                                <Option key={student.id} value={student.id}>
                                    {student.name}
                                </Option>
                            ))}
                        </Select>
                    </Col>
                    <Col>
                         <Button
                            type="primary"
                            icon={<SaveOutlined />}
                            loading={saving || loadingAvailability}
                            disabled={!selectedStudentId}
                            onClick={handleSaveChanges}
                        >
                            保存更改
                        </Button>
                    </Col>
                    <Col>
                        <Button 
                            type="default" 
                            icon={<PlusOutlined />}
                            disabled={!selectedStudentId}
                            onClick={handleAddAvailability}
                        >
                            添加时间段
                        </Button>
                    </Col>
                </Row>
                <Divider />

                {!selectedStudentId && (
                    <Alert message="请先选择一位学生以查看或编辑其可用时间。" type="info" showIcon />
                )}

                {selectedStudentId && (
                     <Spin spinning={loadingAvailability || saving}>
                        {/* 时间段列表 */}
                        {availabilitySlots.length > 0 && (
                            <div style={{ marginBottom: 20 }}>
                                <Title level={5}>
                                    当前可用时间段
                                    <span style={{ fontSize: '14px', marginLeft: '12px', color: '#666' }}>
                                        (共 {availabilitySlots.length} 个时间段)
                                    </span>
                                </Title>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                    {availabilitySlots.map(slot => (
                                        <Card 
                                            key={slot.id} 
                                            size="small" 
                                            style={{ 
                                                width: 240,
                                                border: '1px solid #e6f7ff',
                                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)',
                                                borderLeft: '4px solid #1890ff'
                                            }}
                                            title={
                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                    <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
                                                        {slot.dayOfWeekDisplay || dayOfWeekToZH[slot.dayOfWeek]}
                                                    </span>
                                                </div>
                                            }
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
                                            <p style={{ display: 'flex', alignItems: 'center' }}>
                                                <ClockCircleOutlined style={{ marginRight: '8px', color: '#1890ff' }} /> 
                                                <span style={{ fontWeight: '500' }}>
                                                    {slot.timeRange || ((slot.startTime && typeof slot.startTime === 'string') ? slot.startTime.substring(0, 5) : '00:00') + ' - ' + ((slot.endTime && typeof slot.endTime === 'string') ? slot.endTime.substring(0, 5) : '00:00')}
                                                </span>
                                            </p>
                                        </Card>
                                    ))}
                                </div>
                                
                                <Divider style={{ margin: '16px 0' }} />
                            </div>
                        )}
                        
                        {availabilitySlots.length === 0 && !loadingAvailability && selectedStudentId && (
                            <Alert 
                                message="尚未设置可用时间，请点击下方时间表格添加。" 
                                type="info" 
                                showIcon 
                                style={{ marginBottom: '16px' }}
                            />
                        )}
                        
                        {/* 传统网格视图 */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <Title level={5}>时间表格选择</Title>
                            </div>
                            
                            <div style={{ display: 'flex', border: '1px solid #f0f0f0' }}>
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
                                                        cursor: 'pointer'
                                                    }}
                                                    onClick={() => handleCellClick(day.key, time)}
                                                />
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
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

export default StudentAvailabilityPage; 