package com.schedulai.service;

import com.schedulai.domain.Feedback;
import com.schedulai.domain.Lesson;
import com.schedulai.domain.Student;
import com.schedulai.dto.FeedbackDTO;
import com.schedulai.repository.FeedbackRepository;
import com.schedulai.repository.LessonRepository;
import com.schedulai.repository.StudentRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FeedbackService {
    
    private static final Logger log = LoggerFactory.getLogger(FeedbackService.class);
    
    private final FeedbackRepository feedbackRepository;
    private final LessonRepository lessonRepository;
    private final StudentRepository studentRepository;
    
    /**
     * 获取课程的所有评价
     */
    @Transactional(readOnly = true)
    public List<FeedbackDTO> getLessonFeedbacks(Long lessonId) {
        log.info("获取课程(ID: {})的评价", lessonId);
        List<Feedback> feedbacks = feedbackRepository.findByLessonId(lessonId);
        return feedbacks.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * 获取学生的所有评价
     */
    @Transactional(readOnly = true)
    public List<FeedbackDTO> getStudentFeedbacks(Long studentId) {
        log.info("获取学生(ID: {})的评价", studentId);
        List<Feedback> feedbacks = feedbackRepository.findByStudentId(studentId);
        return feedbacks.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * 创建或更新评价
     */
    @Transactional
    public FeedbackDTO createOrUpdateFeedback(FeedbackDTO feedbackDTO) {
        log.info("创建/更新评价: {}", feedbackDTO);
        
        // 获取课程
        Lesson lesson = lessonRepository.findById(feedbackDTO.getLessonId())
                .orElseThrow(() -> new EntityNotFoundException("课程不存在，ID: " + feedbackDTO.getLessonId()));
        
        // 获取学生
        Student student = studentRepository.findById(feedbackDTO.getStudentId())
                .orElseThrow(() -> new EntityNotFoundException("学生不存在，ID: " + feedbackDTO.getStudentId()));
        
        // 检查该学生是否已对该课程评价过
        Feedback feedback = feedbackRepository.findByStudentIdAndLessonId(
                feedbackDTO.getStudentId(), feedbackDTO.getLessonId())
                .orElse(new Feedback());
        
        // 设置/更新评价内容
        feedback.setLesson(lesson);
        feedback.setStudent(student);
        feedback.setRating(feedbackDTO.getRating());
        feedback.setContent(feedbackDTO.getContent());
        
        // 保存评价
        feedback = feedbackRepository.save(feedback);
        log.info("评价已保存，ID: {}", feedback.getId());
        
        return convertToDTO(feedback);
    }
    
    /**
     * 删除评价
     */
    @Transactional
    public void deleteFeedback(Long feedbackId) {
        log.info("删除评价，ID: {}", feedbackId);
        feedbackRepository.deleteById(feedbackId);
    }
    
    /**
     * 将实体转换为DTO
     */
    private FeedbackDTO convertToDTO(Feedback feedback) {
        Lesson lesson = feedback.getLesson();
        return FeedbackDTO.builder()
                .id(feedback.getId())
                .lessonId(lesson.getId())
                .studentId(feedback.getStudent().getId())
                .studentName(feedback.getStudent().getName())
                .courseName(lesson.getEnrollment().getTeacherCourse().getCourse().getName())
                .teacherName(lesson.getEnrollment().getTeacherCourse().getTeacher().getName())
                .lessonDate(lesson.getStartDateTime())
                .rating(feedback.getRating())
                .content(feedback.getContent())
                .createdAt(feedback.getCreatedAt())
                .updatedAt(feedback.getUpdatedAt())
                .build();
    }
} 