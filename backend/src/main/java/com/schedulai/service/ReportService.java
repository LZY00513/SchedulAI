package com.schedulai.service;

import com.schedulai.domain.Lesson;
import com.schedulai.domain.LessonStatus;
import com.schedulai.dto.LearningReportDTO;
import com.schedulai.dto.MonthlyLessonDTO;
import com.schedulai.dto.CoursePopularityDTO;
import com.schedulai.dto.TeacherWorkloadDTO;
import com.schedulai.dto.StudentLearningDTO;
import com.schedulai.repository.LessonRepository;
import com.schedulai.repository.StudentRepository;
import com.schedulai.repository.TeacherRepository;
import com.schedulai.repository.CourseRepository;
import com.schedulai.repository.EnrollmentRepository;
import com.schedulai.repository.FeedbackRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private static final Logger log = LoggerFactory.getLogger(ReportService.class);

    private final LessonRepository lessonRepository;
    private final OpenAIService openAIService;
    private final StudentRepository studentRepository;
    private final TeacherRepository teacherRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final FeedbackRepository feedbackRepository;

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    @Transactional(readOnly = true)
    public LearningReportDTO generateLearningReport(Long studentId, LocalDate startDate, LocalDate endDate) {
        log.info("Generating learning report for student ID {} from {} to {}", studentId, startDate, endDate);

        String studentName = studentRepository.findById(studentId)
                .map(student -> student.getName())
                .orElseThrow(() -> new EntityNotFoundException("Student not found with ID: " + studentId));

        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.plusDays(1).atStartOfDay();

        List<Lesson> lessons = lessonRepository.findByEnrollment_StudentIdAndStartDateTimeBetweenOrderByStartDateTimeAsc(
                studentId, startDateTime, endDateTime);

        if (lessons.isEmpty()) {
            log.warn("No lessons found for student {} between {} and {}", studentId, startDate, endDate);
            return new LearningReportDTO("No lesson data available for the selected period to generate a report.");
        }

        String lessonDataSummary = lessons.stream()
                .map(lesson -> String.format("- Date: %s, Duration: %d mins, Status: %s, Teacher: %s, Course: %s, Notes: %s",
                        lesson.getStartDateTime().format(DATE_TIME_FORMATTER),
                        java.time.Duration.between(lesson.getStartDateTime(), lesson.getEndDateTime()).toMinutes(),
                        lesson.getStatus(),
                        lesson.getEnrollment().getTeacherCourse().getTeacher().getName(),
                        lesson.getEnrollment().getTeacherCourse().getCourse().getName(),
                        lesson.getNotes() != null ? lesson.getNotes() : "N/A"
                ))
                .collect(Collectors.joining("\n"));

        String systemMessage = "You are an insightful assistant helping private tutors summarize student progress. Generate a concise learning report based on the provided lesson records.";
        String userPrompt = String.format(
                "Please generate a learning report for student '%s' based on their lesson history from %s to %s.\n\n" +
                "Lesson Records:\n%s\n\n" +
                "The report should summarize the student's attendance (based on lesson status like COMPLETED vs CANCELLED), highlight key areas of progress or topics covered (infer from course name and notes if available), mention any challenges observed (from notes), and suggest potential focus areas for upcoming lessons. Be constructive and professional.",
                studentName,
                startDate.toString(),
                endDate.toString(),
                lessonDataSummary
        );

        String reportContent = openAIService.generateTextCompletion(systemMessage, userPrompt);

        if (reportContent == null || reportContent.isBlank()) {
            log.error("AI service failed to generate report content for student {}", studentId);
            return new LearningReportDTO("Failed to generate report content from AI service.");
        }

        return new LearningReportDTO(reportContent);
    }

    /**
     * Generates a learning report/evaluation based on a single completed lesson.
     * @param lessonId The ID of the lesson.
     * @return A LearningReportDTO containing the generated report.
     * @throws EntityNotFoundException if the lesson is not found.
     * @throws IllegalStateException if the lesson is not completed.
     */
    @Transactional(readOnly = true)
    public LearningReportDTO generateReportForLesson(Long lessonId) {
        log.info("Generating learning report for single lesson ID: {}", lessonId);

        // Fetch lesson with details using the repository method
        Lesson lesson = lessonRepository.findByIdWithEnrollmentDetails(lessonId)
                .orElseThrow(() -> new EntityNotFoundException("Lesson not found with ID: " + lessonId));

        // Ensure the lesson is completed
        if (lesson.getStatus() != LessonStatus.COMPLETED) {
            log.warn("Cannot generate report for lesson {} because its status is not COMPLETED (Status: {}).", lessonId, lesson.getStatus());
            throw new IllegalStateException("Report can only be generated for completed lessons.");
        }

        String studentName = lesson.getEnrollment().getStudent().getName();
        String teacherName = lesson.getEnrollment().getTeacherCourse().getTeacher().getName();
        String courseName = lesson.getEnrollment().getTeacherCourse().getCourse().getName();
        String lessonNotes = lesson.getNotes() != null && !lesson.getNotes().isBlank() ? lesson.getNotes() : "No specific notes provided.";
        
        // 查询学生对该课程的评价 - 新增代码
        Long studentId = lesson.getEnrollment().getStudent().getId();
        final StringBuilder studentFeedbackBuilder = new StringBuilder();
        try {
            // 注入FeedbackRepository
            if (feedbackRepository != null) {
                feedbackRepository.findByStudentIdAndLessonId(studentId, lessonId)
                    .ifPresent(feedback -> {
                        studentFeedbackBuilder.append("学生评分: ").append(feedback.getRating()).append("/5星\n");
                        studentFeedbackBuilder.append("学生评价: ").append(feedback.getContent());
                    });
            }
        } catch (Exception e) {
            log.warn("Unable to fetch student feedback for lesson {}: {}", lessonId, e.getMessage());
            // 继续处理，不让查询反馈失败影响整个报告生成
        }
        
        // 获取最终的学生反馈文本
        final String studentFeedback = studentFeedbackBuilder.toString();

        // 完善提示，包括学生反馈
        String systemMessage = "You are an insightful AI assistant helping private tutors summarize student progress after a lesson. Generate a concise evaluation based on the provided lesson details.";
        String userPrompt = String.format(
                "Please generate a brief learning evaluation for student '%s' following their lesson on '%s' with teacher '%s' for the course '%s'.\n\n" +
                "Lesson Details:\n" +
                "- Date & Time: %s to %s\n" +
                "- Teacher's Notes/Observations: %s\n" +
                "%s\n\n" + // 这里添加学生评价，如果有的话
                "The evaluation should focus on this specific lesson. Briefly comment on the student's engagement, understanding of the topic covered (infer from course/notes), strengths shown, and any areas needing reinforcement or focus for the next session. " +
                "If student feedback is provided, incorporate their self-assessment and perspective into your evaluation. " +
                "Keep it constructive and concise (e.g., 2-4 sentences). " +
                "请用中文回答。",
                studentName,
                courseName,
                teacherName,
                courseName,
                lesson.getStartDateTime().format(DATE_TIME_FORMATTER),
                lesson.getEndDateTime().format(DATE_TIME_FORMATTER),
                lessonNotes,
                studentFeedback.isEmpty() ? "" : "- Student's Own Feedback:\n" + studentFeedback
        );

        String reportContent = openAIService.generateTextCompletion(systemMessage, userPrompt);

        if (reportContent == null || reportContent.isBlank()) {
            log.error("AI service failed to generate report content for lesson {}", lessonId);
            // Consider returning a more specific error DTO or throwing exception
            return new LearningReportDTO("Failed to generate report content from AI service."); 
        }

        return new LearningReportDTO(reportContent);
    }

    // --- 仪表盘数据接口 ---

    /**
     * 获取教师工作量统计
     */
    @Transactional(readOnly = true)
    public List<TeacherWorkloadDTO> getTeacherWorkloadReport(LocalDate startDate, LocalDate endDate) {
        log.info("Generating teacher workload report from {} to {}", startDate, endDate);
        
        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.plusDays(1).atStartOfDay();
        
        // 获取所有课程记录
        List<Lesson> lessons = lessonRepository.findByStartDateTimeBetweenOrderByStartDateTimeAsc(
                startDateTime, endDateTime);
        
        // 按教师分组统计
        Map<Long, TeacherWorkloadDTO> teacherStatsMap = new HashMap<>();
        
        for (Lesson lesson : lessons) {
            Long teacherId = lesson.getEnrollment().getTeacherCourse().getTeacher().getId();
            String teacherName = lesson.getEnrollment().getTeacherCourse().getTeacher().getName();
            
            teacherStatsMap.putIfAbsent(teacherId, new TeacherWorkloadDTO(
                    teacherId, teacherName, 0, 0, 0, 0L
            ));
            
            TeacherWorkloadDTO stats = teacherStatsMap.get(teacherId);
            stats.setTotalLessons(stats.getTotalLessons() + 1);
            
            // 计算课程时长（分钟）
            long durationMinutes = ChronoUnit.MINUTES.between(
                    lesson.getStartDateTime(), lesson.getEndDateTime());
            
            // 根据课程状态更新统计
            if (lesson.getStatus() == LessonStatus.COMPLETED) {
                stats.setCompletedLessons(stats.getCompletedLessons() + 1);
                stats.setTotalMinutes(stats.getTotalMinutes() + durationMinutes);
            } else if (lesson.getStatus() == LessonStatus.CANCELLED || 
                      lesson.getStatus() == LessonStatus.CANCELLED_BY_TEACHER || 
                      lesson.getStatus() == LessonStatus.CANCELLED_BY_STUDENT) {
                stats.setCancelledLessons(stats.getCancelledLessons() + 1);
            }
        }
        
        // 转换为列表并排序（按总课时降序）
        return teacherStatsMap.values().stream()
                .sorted((a, b) -> b.getTotalMinutes().compareTo(a.getTotalMinutes()))
                .collect(Collectors.toList());
    }
    
    /**
     * 获取学生学习时长统计
     */
    @Transactional(readOnly = true)
    public List<StudentLearningDTO> getStudentLearningReport(LocalDate startDate, LocalDate endDate) {
        log.info("Generating student learning report from {} to {}", startDate, endDate);
        
        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.plusDays(1).atStartOfDay();
        
        // 获取所有课程记录
        List<Lesson> lessons = lessonRepository.findByStartDateTimeBetweenOrderByStartDateTimeAsc(
                startDateTime, endDateTime);
        
        // 按学生分组统计
        Map<Long, StudentLearningDTO> studentStatsMap = new HashMap<>();
        
        for (Lesson lesson : lessons) {
            Long studentId = lesson.getEnrollment().getStudent().getId();
            String studentName = lesson.getEnrollment().getStudent().getName();
            
            studentStatsMap.putIfAbsent(studentId, new StudentLearningDTO(
                    studentId, studentName, 0, 0, 0, 0L
            ));
            
            StudentLearningDTO stats = studentStatsMap.get(studentId);
            stats.setTotalLessons(stats.getTotalLessons() + 1);
            
            // 计算课程时长（分钟）
            long durationMinutes = ChronoUnit.MINUTES.between(
                    lesson.getStartDateTime(), lesson.getEndDateTime());
            
            // 根据课程状态更新统计
            if (lesson.getStatus() == LessonStatus.COMPLETED) {
                stats.setCompletedLessons(stats.getCompletedLessons() + 1);
                stats.setTotalMinutes(stats.getTotalMinutes() + durationMinutes);
            } else if (lesson.getStatus() == LessonStatus.CANCELLED || 
                      lesson.getStatus() == LessonStatus.CANCELLED_BY_TEACHER || 
                      lesson.getStatus() == LessonStatus.CANCELLED_BY_STUDENT) {
                stats.setCancelledLessons(stats.getCancelledLessons() + 1);
            }
        }
        
        // 转换为列表并排序（按总课时降序）
        return studentStatsMap.values().stream()
                .sorted((a, b) -> b.getTotalMinutes().compareTo(a.getTotalMinutes()))
                .collect(Collectors.toList());
    }
    
    /**
     * 获取课程受欢迎度统计
     */
    @Transactional(readOnly = true)
    public List<CoursePopularityDTO> getCoursePopularityReport() {
        log.info("Generating course popularity report");
        
        // 使用选课记录统计各课程的选课人数
        List<Object[]> courseCounts = enrollmentRepository.countEnrollmentsByCourse();
        
        List<CoursePopularityDTO> result = new ArrayList<>();
        for (Object[] row : courseCounts) {
            Long courseId = (Long) row[0];
            String courseName = (String) row[1];
            String courseCategory = (String) row[2];
            Long count = (Long) row[3];
            
            result.add(new CoursePopularityDTO(
                    courseId,
                    courseName,
                    count.intValue(),
                    courseCategory
            ));
        }
        
        // 按选课人数降序排序
        return result.stream()
                .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                .collect(Collectors.toList());
    }
    
    /**
     * 获取每月课时统计
     */
    @Transactional(readOnly = true)
    public List<MonthlyLessonDTO> getMonthlyLessonsReport(Integer year) {
        log.info("Generating monthly lessons report for year {}", year);
        
        // 设置年份的时间范围
        LocalDateTime startOfYear = LocalDate.of(year, 1, 1).atStartOfDay();
        LocalDateTime endOfYear = LocalDate.of(year, 12, 31).atTime(23, 59, 59);
        
        // 获取该年份的所有课程
        List<Lesson> yearLessons = lessonRepository.findByStartDateTimeBetweenOrderByStartDateTimeAsc(
                startOfYear, endOfYear);
        
        // 初始化12个月的数据
        List<MonthlyLessonDTO> monthlyData = new ArrayList<>();
        String[] monthNames = {"一月", "二月", "三月", "四月", "五月", "六月", 
                              "七月", "八月", "九月", "十月", "十一月", "十二月"};
        
        for (int i = 0; i < 12; i++) {
            monthlyData.add(new MonthlyLessonDTO(
                    monthNames[i],  // 月份名称
                    i + 1,          // 月份数字 (1-12)
                    year,           // 年份
                    0,              // 初始化计划课程数
                    0               // 初始化完成课程数
            ));
        }
        
        // 统计每月课程数据
        for (Lesson lesson : yearLessons) {
            int month = lesson.getStartDateTime().getMonthValue(); // 1-12
            MonthlyLessonDTO monthData = monthlyData.get(month - 1);
            
            if (lesson.getStatus() == LessonStatus.SCHEDULED) {
                monthData.setScheduledLessons(monthData.getScheduledLessons() + 1);
            } else if (lesson.getStatus() == LessonStatus.COMPLETED) {
                monthData.setCompletedLessons(monthData.getCompletedLessons() + 1);
            }
        }
        
        return monthlyData;
    }
} 