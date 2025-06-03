package com.schedulai.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TeacherWorkloadDTO {
    private Long teacherId;
    private String teacherName;
    private Integer totalLessons;
    private Integer completedLessons;
    private Integer cancelledLessons;
    private Long totalMinutes;
} 