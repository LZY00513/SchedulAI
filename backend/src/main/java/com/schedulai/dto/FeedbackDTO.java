package com.schedulai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeedbackDTO {
    private Long id;
    private Long lessonId;
    private Long studentId;
    private String studentName;
    private String courseName;
    private String teacherName;
    private LocalDateTime lessonDate;
    private Integer rating; // 1-5星评分
    private String content; // 评价内容
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
} 