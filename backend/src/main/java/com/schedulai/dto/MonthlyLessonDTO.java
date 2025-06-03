package com.schedulai.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyLessonDTO {
    private String name; // 月份名称，如"一月"、"二月"
    private Integer month; // 月份数字，1-12
    private Integer year;
    private Integer scheduledLessons; // 计划课程数
    private Integer completedLessons; // 完成课程数
} 