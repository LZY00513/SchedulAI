package com.schedulai.controller;

import com.schedulai.domain.Student;
import com.schedulai.domain.StudentAvailability;
import com.schedulai.dto.StudentAvailabilityResponseDTO;
import com.schedulai.service.StudentAvailabilityService;
import com.schedulai.util.DTOConverter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class StudentAvailabilityControllerTest {

    @Mock
    private StudentAvailabilityService studentAvailabilityService;

    @InjectMocks
    private StudentAvailabilityController controller;

    private Student testStudent;
    private StudentAvailability testAvailability;

    @BeforeEach
    void setUp() {
        // 创建测试数据
        testStudent = new Student();
        testStudent.setId(17L);
        testStudent.setName("测试学生");
        testStudent.setGrade("primary_1");
        testStudent.setPhone("13800138000");

        testAvailability = new StudentAvailability();
        testAvailability.setId(65L);
        testAvailability.setStudent(testStudent);
        testAvailability.setDayOfWeek(DayOfWeek.FRIDAY);
        testAvailability.setStartTime(LocalTime.of(9, 0));
        testAvailability.setEndTime(LocalTime.of(10, 0));
        testAvailability.setIsAvailable(true);
    }

    @Test
    void testGetStudentAvailability() {
        // 准备模拟数据
        when(studentAvailabilityService.getAvailabilityForStudent(anyLong()))
                .thenReturn(List.of(testAvailability));

        // 调用controller方法
        ResponseEntity<List<StudentAvailabilityResponseDTO>> response = controller.getStudentAvailability(17L);

        // 验证结果
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());

        StudentAvailabilityResponseDTO dto = response.getBody().get(0);
        assertEquals(65L, dto.getId());
        assertEquals(17L, dto.getStudentId());
        assertEquals("测试学生", dto.getStudentName());
        assertEquals(DayOfWeek.FRIDAY, dto.getDayOfWeek());
        assertEquals("星期五", dto.getDayOfWeekDisplay());
        assertEquals(LocalTime.of(9, 0), dto.getStartTime());
        assertEquals(LocalTime.of(10, 0), dto.getEndTime());
        assertEquals("09:00-10:00", dto.getTimeRange());
        assertTrue(dto.getIsAvailable());
    }

    @Test
    void testAddStudentAvailability() {
        // 准备模拟数据
        when(studentAvailabilityService.addAvailability(anyLong(), any(StudentAvailability.class)))
                .thenReturn(testAvailability);

        // 调用controller方法
        ResponseEntity<?> response = controller.addStudentAvailability(17L, testAvailability);

        // 验证结果
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof StudentAvailabilityResponseDTO);
        
        StudentAvailabilityResponseDTO dto = (StudentAvailabilityResponseDTO) response.getBody();
        assertEquals(65L, dto.getId());
        assertEquals("09:00-10:00", dto.getTimeRange());
    }

    @Test
    void testBatchUpdateStudentAvailability() {
        // 准备模拟数据
        when(studentAvailabilityService.batchUpdateAvailability(anyLong(), anyList()))
                .thenReturn(List.of(testAvailability));

        // 调用controller方法
        ResponseEntity<?> response = controller.batchUpdateStudentAvailability(17L, List.of(testAvailability));

        // 验证结果
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof List);
        
        @SuppressWarnings("unchecked")
        List<StudentAvailabilityResponseDTO> dtoList = (List<StudentAvailabilityResponseDTO>) response.getBody();
        assertEquals(1, dtoList.size());
        assertEquals("09:00-10:00", dtoList.get(0).getTimeRange());
    }
} 