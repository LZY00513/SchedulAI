package com.schedulai.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate; // Import if adding enrollmentDate

@Data
@NoArgsConstructor // Add Lombok annotations
@AllArgsConstructor // Add Lombok annotations
public class EnrollmentDTO {
    private Long id;
    private Long studentId;
    private String studentName; // Add student name
    private Long teacherCourseId; 
    private Long teacherId;     // Add teacher ID
    private String teacherName; // Add teacher name
    private Long courseId;      // Add course ID
    private String courseName;  // Add course name
    private BigDecimal hourlyRate;
    // private LocalDate enrollmentDate; // Uncomment if needed
} 