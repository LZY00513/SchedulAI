package com.schedulai.repository;

import com.schedulai.domain.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    
    // 根据课程ID查找反馈
    List<Feedback> findByLessonId(Long lessonId);
    
    // 根据学生ID查找该学生发表的所有反馈
    List<Feedback> findByStudentId(Long studentId);
    
    // 根据学生ID和课程ID查找反馈，确保一个学生对同一课程只能有一条评价
    Optional<Feedback> findByStudentIdAndLessonId(Long studentId, Long lessonId);
} 