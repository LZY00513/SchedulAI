package com.schedulai.controller;

import com.schedulai.dto.LearningReportDTO;
import com.schedulai.dto.MonthlyLessonDTO;
import com.schedulai.dto.CoursePopularityDTO;
import com.schedulai.dto.TeacherWorkloadDTO;
import com.schedulai.dto.StudentLearningDTO;
import com.schedulai.service.ReportService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.HashMap;

import com.schedulai.repository.FeedbackRepository;
import com.schedulai.domain.Feedback;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private static final Logger log = LoggerFactory.getLogger(ReportController.class);
    private final ReportService reportService;
    private final FeedbackRepository feedbackRepository;

    @GetMapping("/learning/{studentId}")
    public ResponseEntity<LearningReportDTO> generateLearningReport(
            @PathVariable Long studentId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        log.info("Received request to generate learning report for student ID: {}, StartDate: {}, EndDate: {}",
                 studentId, startDate, endDate);

        // Default date range if not provided (e.g., last 30 days? Needs defining)
        if (startDate == null) {
            startDate = LocalDate.now().minusDays(30); // Example: Default to last 30 days
        }
        if (endDate == null) {
            endDate = LocalDate.now();
        }

        try {
            LearningReportDTO report = reportService.generateLearningReport(studentId, startDate, endDate);
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            // Add specific exception handling (e.g., StudentNotFound)
            log.error("Error generating learning report for student ID {}: {}", studentId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body(new LearningReportDTO("Error generating report: " + e.getMessage()));
        }
    }

    // --- Generate Report for a Single Lesson ---
    @PostMapping("/generate/lesson/{lessonId}")
    public ResponseEntity<?> generateReportForSingleLesson(@PathVariable Long lessonId) {
        log.info("POST /generate/lesson/{} request received", lessonId);
        try {
            LearningReportDTO report = reportService.generateReportForLesson(lessonId);
            return ResponseEntity.ok(report);
        } catch (EntityNotFoundException e) {
            log.warn("Cannot generate report: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IllegalStateException e) {
             log.warn("Cannot generate report: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            log.error("Error generating report for lesson {}: {}", lessonId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An internal error occurred while generating the report.");
        }
    }
    
    // --- 获取教师工作量统计 ---
    @GetMapping("/teacher-workload")
    public ResponseEntity<List<TeacherWorkloadDTO>> getTeacherWorkloadReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        log.info("GET /teacher-workload request received, startDate: {}, endDate: {}", startDate, endDate);
        
        // 设置默认日期范围
        if (startDate == null) {
            startDate = LocalDate.now().withDayOfMonth(1); // 本月第一天
        }
        if (endDate == null) {
            endDate = LocalDate.now();
        }
        
        try {
            List<TeacherWorkloadDTO> report = reportService.getTeacherWorkloadReport(startDate, endDate);
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            log.error("Error generating teacher workload report: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    // --- 获取学生学习时长统计 ---
    @GetMapping("/student-learning")
    public ResponseEntity<List<StudentLearningDTO>> getStudentLearningReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        log.info("GET /student-learning request received, startDate: {}, endDate: {}", startDate, endDate);
        
        // 设置默认日期范围
        if (startDate == null) {
            startDate = LocalDate.now().withDayOfMonth(1); // 本月第一天
        }
        if (endDate == null) {
            endDate = LocalDate.now();
        }
        
        try {
            List<StudentLearningDTO> report = reportService.getStudentLearningReport(startDate, endDate);
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            log.error("Error generating student learning report: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    // --- 获取课程受欢迎度统计 ---
    @GetMapping("/course-popularity")
    public ResponseEntity<List<CoursePopularityDTO>> getCoursePopularityReport() {
        log.info("GET /course-popularity request received");
        
        try {
            List<CoursePopularityDTO> report = reportService.getCoursePopularityReport();
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            log.error("Error generating course popularity report: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    // --- 获取每月课时统计 ---
    @GetMapping("/monthly-lessons")
    public ResponseEntity<List<MonthlyLessonDTO>> getMonthlyLessonsReport(
            @RequestParam(required = false, defaultValue = "#{T(java.time.Year).now().getValue()}") Integer year) {
        
        log.info("GET /monthly-lessons request received, year: {}", year);
        
        try {
            List<MonthlyLessonDTO> report = reportService.getMonthlyLessonsReport(year);
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            log.error("Error generating monthly lessons report: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    /**
     * 获取课程的学生评价信息（用于报告生成前查看）
     */
    @GetMapping("/lesson/{lessonId}/feedback")
    public ResponseEntity<?> getLessonFeedback(@PathVariable Long lessonId) {
        log.info("GET /lesson/{}/feedback request received", lessonId);
        try {
            // 查找该课程的学生评价
            Optional<Feedback> feedback = feedbackRepository.findByLessonId(lessonId)
                    .stream()
                    .findFirst();
            
            if (feedback.isPresent()) {
                Map<String, Object> response = new HashMap<>();
                response.put("hasFeedback", true);
                response.put("rating", feedback.get().getRating());
                response.put("content", feedback.get().getContent());
                response.put("studentName", feedback.get().getStudent().getName());
                return ResponseEntity.ok(response);
            } else {
                Map<String, Object> response = new HashMap<>();
                response.put("hasFeedback", false);
                response.put("message", "该课程暂无学生评价");
                return ResponseEntity.ok(response);
            }
        } catch (Exception e) {
            log.error("Error getting lesson feedback: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "获取课程评价失败: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
} 