package com.schedulai.util;

import com.schedulai.domain.StudentAvailability;
import com.schedulai.domain.TeacherAvailability;
import com.schedulai.dto.StudentAvailabilityResponseDTO;
import com.schedulai.dto.TeacherAvailabilityResponseDTO;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 工具类，用于实体和DTO之间的转换
 */
public class DTOConverter {

    /**
     * 将 StudentAvailability 实体转换为 StudentAvailabilityResponseDTO
     * @param availability 学生可用时间实体
     * @return 学生可用时间响应DTO
     */
    public static StudentAvailabilityResponseDTO convertToDTO(StudentAvailability availability) {
        if (availability == null) {
            return null;
        }
        
        StudentAvailabilityResponseDTO dto = new StudentAvailabilityResponseDTO();
        dto.setId(availability.getId());
        
        // 设置学生信息
        if (availability.getStudent() != null) {
            dto.setStudentId(availability.getStudent().getId());
            dto.setStudentName(availability.getStudent().getName());
        }
        
        // 设置时间信息
        dto.setDayOfWeek(availability.getDayOfWeek()); // 这里会自动设置 dayOfWeekDisplay
        dto.setStartTime(availability.getStartTime());
        dto.setEndTime(availability.getEndTime());
        dto.updateTimeRange(); // 更新时间范围字符串
        
        dto.setIsAvailable(availability.getIsAvailable());
        
        return dto;
    }
    
    /**
     * 将 StudentAvailability 实体列表转换为 StudentAvailabilityResponseDTO 列表
     * @param availabilities 学生可用时间实体列表
     * @return 学生可用时间响应DTO列表
     */
    public static List<StudentAvailabilityResponseDTO> convertToDTOList(List<StudentAvailability> availabilities) {
        if (availabilities == null) {
            return List.of();
        }
        
        return availabilities.stream()
                .map(DTOConverter::convertToDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * 将 TeacherAvailability 实体转换为 TeacherAvailabilityResponseDTO
     * @param availability 教师可用时间实体
     * @return 教师可用时间响应DTO
     */
    public static TeacherAvailabilityResponseDTO convertToTeacherDTO(TeacherAvailability availability) {
        if (availability == null) {
            return null;
        }
        
        TeacherAvailabilityResponseDTO dto = new TeacherAvailabilityResponseDTO();
        dto.setId(availability.getId());
        
        // 设置教师信息
        if (availability.getTeacher() != null) {
            dto.setTeacherId(availability.getTeacher().getId());
            dto.setTeacherName(availability.getTeacher().getName());
        }
        
        // 设置时间信息
        dto.setDayOfWeek(availability.getDayOfWeek()); // 这里会自动设置 dayOfWeekDisplay
        dto.setStartTime(availability.getStartTime());
        dto.setEndTime(availability.getEndTime());
        dto.updateTimeRange(); // 更新时间范围字符串
        
        dto.setIsAvailable(availability.getIsAvailable());
        
        return dto;
    }
    
    /**
     * 将 TeacherAvailability 实体列表转换为 TeacherAvailabilityResponseDTO 列表
     * @param availabilities 教师可用时间实体列表
     * @return 教师可用时间响应DTO列表
     */
    public static List<TeacherAvailabilityResponseDTO> convertToTeacherDTOList(List<TeacherAvailability> availabilities) {
        if (availabilities == null) {
            return List.of();
        }
        
        return availabilities.stream()
                .map(DTOConverter::convertToTeacherDTO)
                .collect(Collectors.toList());
    }
} 