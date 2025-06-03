package com.schedulai.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TeacherRecommendationService {
    
    private final JdbcTemplate jdbcTemplate;
    
    @Autowired
    public TeacherRecommendationService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }
    
    @Transactional
    public void saveTeacherRecommendations(Long teacherId, List<Long> courseIds) {
        // 1. 先删除该教师的所有推荐课程关系
        deleteTeacherRecommendations(teacherId);
        
        // 2. 添加新的推荐课程关系
        if (courseIds != null && !courseIds.isEmpty()) {
            String sql = "INSERT INTO course_recommended_teachers (course_id, teacher_id) VALUES (?, ?)";
            for (Long courseId : courseIds) {
                jdbcTemplate.update(sql, courseId, teacherId);
            }
        }
    }
    
    @Transactional
    public void deleteTeacherRecommendations(Long teacherId) {
        String sql = "DELETE FROM course_recommended_teachers WHERE teacher_id = ?";
        jdbcTemplate.update(sql, teacherId);
    }
    
    public List<Long> getRecommendedCourseIds(Long teacherId) {
        String sql = "SELECT course_id FROM course_recommended_teachers WHERE teacher_id = ?";
        return jdbcTemplate.queryForList(sql, Long.class, teacherId);
    }
    
    public List<Long> getCourseRecommendedTeachers(Long courseId) {
        return jdbcTemplate.queryForList(
            "SELECT teacher_id FROM course_recommended_teachers WHERE course_id = ?",
            Long.class,
            courseId
        );
    }
}
