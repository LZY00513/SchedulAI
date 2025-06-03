package com.schedulai.controller;

import com.schedulai.dto.ProposedLessonDTO;
import com.schedulai.dto.TimeSlotDTO;
import com.schedulai.service.SchedulingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.time.LocalDateTime;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/scheduling")
public class SchedulingController {

    private static final Logger log = LoggerFactory.getLogger(SchedulingController.class);

    private final SchedulingService schedulingService;

    @Autowired
    public SchedulingController(SchedulingService schedulingService) {
        this.schedulingService = schedulingService;
    }

    @GetMapping("/common-slots")
    public ResponseEntity<?> findCommonAvailableSlots(@RequestParam Long studentId, @RequestParam Long teacherId) {
        log.info("Received request to find common slots for student {} and teacher {}", studentId, teacherId);
        // Basic validation
        if (studentId == null || teacherId == null) {
            return ResponseEntity.badRequest().body("Both studentId and teacherId parameters are required.");
        }
        try {
            List<TimeSlotDTO> commonSlots = schedulingService.findCommonAvailableSlots(studentId, teacherId);
            return ResponseEntity.ok(commonSlots);
        } catch (Exception e) {
            // Catch specific exceptions from service if needed (e.g., Student/Teacher not found)
            log.error("Error finding common slots for student {} and teacher {}: {}", studentId, teacherId, e);
            return ResponseEntity.internalServerError().body("An error occurred while finding common slots.");
        }
    }

    // Endpoint to get AI-powered lesson time suggestions
    @GetMapping("/suggest-times")
    public ResponseEntity<?> suggestLessonTimes(
            @RequestParam Long studentId,
            @RequestParam Long teacherId,
            @RequestParam Long enrollmentId, // Need enrollment to link the lesson
            @RequestParam int durationMinutes) {

        log.info("Received request to suggest lesson times for student {}, teacher {}, enrollment {}, duration {} mins",
                 studentId, teacherId, enrollmentId, durationMinutes);

        // Basic validation
        if (studentId == null || teacherId == null || enrollmentId == null || durationMinutes <= 0) {
            return ResponseEntity.badRequest().body("studentId, teacherId, enrollmentId, and a positive durationMinutes are required.");
        }

        try {
            List<ProposedLessonDTO> suggestions = schedulingService.suggestLessonTimes(enrollmentId, durationMinutes);
            if (suggestions.isEmpty()) {
                // It's not necessarily an error if no slots are found, return OK with empty list
                log.info("No suitable lesson time suggestions found for enrollment {}", enrollmentId);
            }
            return ResponseEntity.ok(suggestions);
        } catch (Exception e) {
            // Catch specific business logic exceptions if needed
            log.error("Error suggesting lesson times for student {}, teacher {}, enrollment {}: {}",
                      studentId, teacherId, enrollmentId, e);
            return ResponseEntity.internalServerError().body("An error occurred while suggesting lesson times.");
        }
    }

    // 添加一个测试端点，返回固定的测试数据，便于前端开发和测试
    @GetMapping("/test-suggestions")
    public ResponseEntity<List<ProposedLessonDTO>> getTestSuggestions(
            @RequestParam(required = false, defaultValue = "1") Long studentId,
            @RequestParam(required = false, defaultValue = "1") Long teacherId,
            @RequestParam(required = false, defaultValue = "1") Long courseId,
            @RequestParam(required = false, defaultValue = "1") Long enrollmentId) {
        
        log.info("Received request for test suggestions with studentId={}, teacherId={}, courseId={}, enrollmentId={}",
                 studentId, teacherId, courseId, enrollmentId);
        
        List<ProposedLessonDTO> testSuggestions = new ArrayList<>();
        
        // 创建几个固定的测试建议，使用当前时间为基准
        LocalDateTime now = LocalDateTime.now();
        
        // 第一个建议：明天上午
        ProposedLessonDTO suggestion1 = new ProposedLessonDTO();
        suggestion1.setStartTime(now.plusDays(1).withHour(10).withMinute(0).withSecond(0));
        suggestion1.setEndTime(now.plusDays(1).withHour(11).withMinute(30).withSecond(0));
        suggestion1.setNotes("测试建议：明天上午的课程");
        suggestion1.setStudentId(studentId);
        suggestion1.setTeacherId(teacherId);
        suggestion1.setCourseId(courseId);
        suggestion1.setEnrollmentId(enrollmentId);
        
        // 第二个建议：明天下午
        ProposedLessonDTO suggestion2 = new ProposedLessonDTO();
        suggestion2.setStartTime(now.plusDays(1).withHour(14).withMinute(30).withSecond(0));
        suggestion2.setEndTime(now.plusDays(1).withHour(16).withMinute(0).withSecond(0));
        suggestion2.setNotes("测试建议：明天下午的课程");
        suggestion2.setStudentId(studentId);
        suggestion2.setTeacherId(teacherId);
        suggestion2.setCourseId(courseId);
        suggestion2.setEnrollmentId(enrollmentId);
        
        // 第三个建议：后天上午
        ProposedLessonDTO suggestion3 = new ProposedLessonDTO();
        suggestion3.setStartTime(now.plusDays(2).withHour(9).withMinute(0).withSecond(0));
        suggestion3.setEndTime(now.plusDays(2).withHour(10).withMinute(30).withSecond(0));
        suggestion3.setNotes("测试建议：后天上午的课程");
        suggestion3.setStudentId(studentId);
        suggestion3.setTeacherId(teacherId);
        suggestion3.setCourseId(courseId);
        suggestion3.setEnrollmentId(enrollmentId);
        
        testSuggestions.add(suggestion1);
        testSuggestions.add(suggestion2);
        testSuggestions.add(suggestion3);
        
        log.info("Returning {} test suggestions", testSuggestions.size());
        return ResponseEntity.ok(testSuggestions);
    }

    // 添加一个端点，用于获取可用时间段 (前端已在调用这个接口)
    @GetMapping("/available-time-slots")
    public ResponseEntity<?> getAvailableTimeSlots(
            @RequestParam Long teacherId,
            @RequestParam(required = false) Long studentId,
            @RequestParam(required = false) Long courseId,
            @RequestParam String startDate,
            @RequestParam String endDate) {
        
        log.info("Received request for available time slots: teacher={}, student={}, course={}, startDate={}, endDate={}",
                 teacherId, studentId, courseId, startDate, endDate);
        
        try {
            // 为简化开发，我们直接返回模拟的可用时间段数据
            // 在实际场景中，应该从teacherAvailability和studentAvailability表中查询真实数据
            
            List<ProposedLessonDTO> availableSlots = new ArrayList<>();
            
            // 解析日期范围
            LocalDateTime start = LocalDateTime.parse(startDate + "T00:00:00");
            LocalDateTime end = LocalDateTime.parse(endDate + "T23:59:59");
            
            // 为每天创建几个固定的时间段
            LocalDateTime currentDay = start;
            while (!currentDay.isAfter(end)) {
                // 上午时间段
                ProposedLessonDTO morningSlot = new ProposedLessonDTO();
                morningSlot.setStartTime(currentDay.withHour(9).withMinute(0));
                morningSlot.setEndTime(currentDay.withHour(11).withMinute(0));
                morningSlot.setLocation("教室A");
                
                // 下午早些时间段
                ProposedLessonDTO earlyAfternoonSlot = new ProposedLessonDTO();
                earlyAfternoonSlot.setStartTime(currentDay.withHour(13).withMinute(30));
                earlyAfternoonSlot.setEndTime(currentDay.withHour(15).withMinute(0));
                earlyAfternoonSlot.setLocation("教室B");
                
                // 下午晚些时间段
                ProposedLessonDTO lateAfternoonSlot = new ProposedLessonDTO();
                lateAfternoonSlot.setStartTime(currentDay.withHour(16).withMinute(0));
                lateAfternoonSlot.setEndTime(currentDay.withHour(17).withMinute(30));
                lateAfternoonSlot.setLocation("教室C");
                
                // 晚上时间段
                ProposedLessonDTO eveningSlot = new ProposedLessonDTO();
                eveningSlot.setStartTime(currentDay.withHour(19).withMinute(0));
                eveningSlot.setEndTime(currentDay.withHour(20).withMinute(30));
                eveningSlot.setLocation("线上");
                
                // 只在工作日添加所有时间段，周末只添加两个
                if (currentDay.getDayOfWeek().getValue() <= 5) {
                    availableSlots.add(morningSlot);
                    availableSlots.add(earlyAfternoonSlot);
                    availableSlots.add(lateAfternoonSlot);
                    availableSlots.add(eveningSlot);
                } else {
                    // 周末只有上午和晚上时间段
                    availableSlots.add(morningSlot);
                    availableSlots.add(eveningSlot);
                }
                
                // 前进到下一天
                currentDay = currentDay.plusDays(1);
            }
            
            log.info("Returning {} available time slots between {} and {}", 
                     availableSlots.size(), startDate, endDate);
            return ResponseEntity.ok(availableSlots);
            
        } catch (Exception e) {
            log.error("Error getting available time slots: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("获取可用时间段失败: " + e.getMessage());
        }
    }

    // --- Potential future endpoints ---
    // @GetMapping("/suggest-times")
    // public ResponseEntity<?> suggestLessonTimes(@RequestParam Long studentId,
    //                                             @RequestParam Long teacherId,
    //                                             @RequestParam int durationMinutes) {
    //    // ... call service ...
    // }

}
