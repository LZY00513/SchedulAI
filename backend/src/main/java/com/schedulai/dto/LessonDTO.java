package com.schedulai.dto;

import com.schedulai.domain.LessonStatus;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LessonDTO {
    private Long id;
    private Long enrollmentId;
    private LocalDateTime startDateTime;
    private LocalDateTime endDateTime;
    private LessonStatus status;

    // Add fields required by frontend
    private String location;
    private String notes;

    // Add related info for convenience
    private Long studentId;
    private String studentName;
    private Long teacherId;
    private String teacherName;
    private Long courseId;
    private String courseName;
} 