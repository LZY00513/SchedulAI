package com.schedulai.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentLearningDTO {
    private Long studentId;
    private String studentName;
    private Integer totalLessons;
    private Integer completedLessons;
    private Integer cancelledLessons;
    private Long totalMinutes;
} 