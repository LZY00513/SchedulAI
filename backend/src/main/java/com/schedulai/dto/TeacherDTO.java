package com.schedulai.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TeacherDTO {
    private Long id;
    private String name;
    private BigDecimal hourlyRate;
    private String availabilityMode;

    // Add fields required by frontend
    private String gender;
    private Integer age;
    private String subject;
    private String education;
    private Integer experience; // Assuming experience is in years (Integer)
    private String phone;
    private String email;
    private String status;

    // 教师可教授的课程列表
    private List<CourseDTO> courses;

    // 教师可教授的课程ID列表
    private List<Long> courseIds;

    public List<Long> getCourseIds() {
        return courseIds;
    }

    public void setCourseIds(List<Long> courseIds) {
        this.courseIds = courseIds;
    }

    // Usually fetched on demand, not in list DTO
    // private List<TeacherAvailabilityDTO> availabilities;
    // NOTE: Exclude teacherCourses list to break the cycle

    private List<Long> recommendedCourseIds;

    public List<Long> getRecommendedCourseIds() {
        return recommendedCourseIds;
    }

    public void setRecommendedCourseIds(List<Long> recommendedCourseIds) {
        this.recommendedCourseIds = recommendedCourseIds;
    }
} 