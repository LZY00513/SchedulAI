package com.schedulai.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.time.format.TextStyle;
import java.util.Locale;

/**
 * DTO类，用于返回学生可用时间信息，避免实体间的循环引用
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentAvailabilityResponseDTO {
    private Long id;
    private Long studentId;
    private String studentName;
    
    private DayOfWeek dayOfWeek;
    private String dayOfWeekDisplay; // 星期几的显示名称
    
    private LocalTime startTime;
    private LocalTime endTime;
    private String timeRange; // 格式化的时间范围，例如 "09:00-10:00"
    
    private Boolean isAvailable;
    
    // 根据dayOfWeek自动设置显示名称
    public void setDayOfWeek(DayOfWeek dayOfWeek) {
        this.dayOfWeek = dayOfWeek;
        if (dayOfWeek != null) {
            this.dayOfWeekDisplay = dayOfWeek.getDisplayName(TextStyle.FULL, Locale.CHINA);
        }
    }
    
    // 根据开始时间和结束时间自动设置时间范围
    public void updateTimeRange() {
        if (startTime != null && endTime != null) {
            this.timeRange = String.format("%02d:%02d-%02d:%02d", 
                    startTime.getHour(), startTime.getMinute(),
                    endTime.getHour(), endTime.getMinute());
        }
    }
} 