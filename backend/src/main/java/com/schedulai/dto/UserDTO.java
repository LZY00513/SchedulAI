package com.schedulai.dto;

import com.schedulai.domain.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Long id;
    private String username;
    private String name;
    private String email;
    private String phone;
    private UserRole role;
    private boolean enabled;
    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;
    
    // 学生特有字段
    private String grade;
    private String enrollmentDate;
    private String parentName;
    private String parentPhone;
    private String address;
    private String notes;
    
    // 关联的学生ID (当用户是学生角色时)
    private Long studentId;
} 