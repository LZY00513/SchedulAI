package com.schedulai.controller;

import com.schedulai.dto.CourseDTO;
import com.schedulai.dto.TeacherDTO;
import com.schedulai.service.CourseService;
import com.schedulai.service.TeacherRecommendationService;
import com.schedulai.service.TeacherService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    
    private final TeacherService teacherService;
    private final CourseService courseService;
    private final TeacherRecommendationService recommendationService;
    
    @Autowired
    public AdminController(
        TeacherService teacherService,
        CourseService courseService,
        TeacherRecommendationService recommendationService
    ) {
        this.teacherService = teacherService;
        this.courseService = courseService;
        this.recommendationService = recommendationService;
    }
    
    @PostMapping("/sync-teacher-recommendations")
    @Transactional
    public ResponseEntity<String> syncTeacherRecommendations() {
        try {
            // 1. 获取所有教师
            List<TeacherDTO> teachers = teacherService.getAllTeachers();
            
            // 2. 获取所有课程
            List<CourseDTO> courses = courseService.getAllCourses();
            
            int syncCount = 0;
            
            // 3. 为每个教师设置默认推荐课程
            for (TeacherDTO teacher : teachers) {
                // 根据教师专业设置推荐课程
                List<Long> matchingCourseIds = courses.stream()
                    .filter(course -> course.getCategory() != null && 
                                     course.getCategory().equalsIgnoreCase(teacher.getSubject()))
                    .map(CourseDTO::getId)
                    .collect(Collectors.toList());
                
                if (!matchingCourseIds.isEmpty()) {
                    // 先删除旧的推荐关系
                    recommendationService.deleteTeacherRecommendations(teacher.getId());
                    
                    // 添加新的推荐关系
                    recommendationService.saveTeacherRecommendations(teacher.getId(), matchingCourseIds);
                    syncCount++;
                }
            }
            
            return ResponseEntity.ok("教师推荐课程同步完成，共同步 " + syncCount + " 位教师的推荐课程");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("同步失败: " + e.getMessage());
        }
    }
}
