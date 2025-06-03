package com.schedulai.dto;

import com.schedulai.domain.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequestDTO {
    private String username;
    private String password;
    private String name;
    private String email;
    private String phone;
    private UserRole role;
    
    // 学生特有字段
    private String grade;
    private String enrollmentDate;
    private String parentName;
    private String parentPhone;
    private String address;
    private String notes;
} 