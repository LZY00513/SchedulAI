package com.schedulai.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

// Option 1: Simple DTO with IDs only
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TeacherCourseDTO {
    private Long id;
    private Long teacherId;
    private Long courseId;

    // Option 2: Include nested simple DTOs (Create TeacherSimpleDTO, CourseSimpleDTO if needed)
    // private TeacherSimpleDTO teacher;
    // private CourseSimpleDTO course;
} 