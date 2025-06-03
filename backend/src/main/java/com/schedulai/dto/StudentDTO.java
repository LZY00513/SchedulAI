package com.schedulai.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentDTO {
    private Long id;
    private String name;
    private String gender;
    private Integer age;
    private String grade;
    private String phone;
    private String parent;
    private String parentPhone;
    private LocalDate enrollmentDate;
    private String status;

    // 暂时注释掉可用时间，通常在获取详情时才需要
    // private List<StudentAvailabilityDTO> availabilities;
    // NOTE: Exclude enrollments list to break the cycle
} 