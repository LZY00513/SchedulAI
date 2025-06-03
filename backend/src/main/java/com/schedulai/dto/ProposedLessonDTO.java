package com.schedulai.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.ToString;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class ProposedLessonDTO {

    // Including IDs helps verify the AI matched the request
    @JsonProperty("studentId")
    private Long studentId;

    @JsonProperty("teacherId")
    private Long teacherId;

    @JsonProperty("courseId") // Maybe link to enrollmentId instead/as well?
    private Long courseId;

    @JsonProperty("enrollmentId") // Let's ask AI to return this for direct use
    private Long enrollmentId;

    @JsonProperty("startDateTime")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss") // Expect ISO format
    private LocalDateTime startTime;

    @JsonProperty("endDateTime")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss") // Expect ISO format
    private LocalDateTime endTime;

    // 添加位置信息
    @JsonProperty("location")
    private String location;

    // Optional: AI could add notes or confidence score
    @JsonProperty("notes")
    private String notes;
    
    // 简易构造函数，只包含最关键的字段
    public ProposedLessonDTO(LocalDateTime startTime, LocalDateTime endTime) {
        this.startTime = startTime;
        this.endTime = endTime;
    }
    
    // 判断时间槽是否有效
    public boolean isValid() {
        return startTime != null && endTime != null && endTime.isAfter(startTime);
    }
} 