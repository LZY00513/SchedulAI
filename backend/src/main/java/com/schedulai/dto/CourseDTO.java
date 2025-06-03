package com.schedulai.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.experimental.Accessors;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
public class CourseDTO {
    private Long id;
    private String name;
    private String description;

    // Add fields required by frontend
    private String category; // e.g., Math, Language, Science
    private String level;    // e.g., Beginner, Intermediate, Advanced, Grade 10
    private Integer duration; // Duration in minutes
    private BigDecimal price;   // Price per lesson/hour?
    private Integer difficulty; // Difficulty rating (e.g., 1-5)
    private String status;   // e.g., active, inactive

    // Fields potentially representing lists of strings
    private List<Long> recommendedTeachers;
    private List<String> prerequisites;      // Course names or descriptions
    private List<String> materials;          // Book names, links, etc.
    private List<TeacherDTO> teachers;

    private String subject;

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }
} 