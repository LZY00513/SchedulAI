package com.schedulai.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CoursePopularityDTO {
    private Long courseId;
    private String name;
    private Integer value; // 代表选课数量
    private String category;
} 