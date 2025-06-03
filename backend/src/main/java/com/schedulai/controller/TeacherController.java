package com.schedulai.controller;

import com.schedulai.domain.Teacher;
import com.schedulai.domain.TeacherAvailability;
import com.schedulai.dto.TeacherAvailabilityDTO;
import com.schedulai.dto.TeacherDTO;
import com.schedulai.dto.ErrorResponse;
import com.schedulai.service.TeacherRecommendationService;
import com.schedulai.service.TeacherService;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/teachers")
public class TeacherController {

    private static final Logger log = LoggerFactory.getLogger(TeacherController.class);

    private final TeacherService teacherService;
    private final TeacherRecommendationService recommendationService;

    @Autowired
    public TeacherController(TeacherService teacherService, TeacherRecommendationService recommendationService) {
        this.teacherService = teacherService;
        this.recommendationService = recommendationService;
    }

    // === Teacher CRUD ===

    @GetMapping
    public ResponseEntity<List<TeacherDTO>> getAllTeachers() {
        log.info("Received request to get all teachers");
        return ResponseEntity.ok(teacherService.getAllTeachers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TeacherDTO> getTeacherById(@PathVariable Long id) {
        log.info("Received request to get teacher by ID: {}", id);
        Optional<TeacherDTO> teacherDTO = teacherService.getTeacherById(id);
        if (teacherDTO.isPresent()) {
            List<Long> recommendedCourses = recommendationService.getRecommendedCourseIds(id);
            TeacherDTO dto = teacherDTO.get();
            dto.setRecommendedCourseIds(recommendedCourses);
            return ResponseEntity.ok(dto);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<TeacherDTO> createTeacher(@RequestBody TeacherDTO teacherDTO) {
        log.info("Received request to create teacher: {}", teacherDTO);
        try {
            TeacherDTO createdTeacher = teacherService.createTeacher(teacherDTO);
            return ResponseEntity.ok(createdTeacher);
        } catch (Exception e) {
            log.error("Error creating teacher: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<TeacherDTO> updateTeacher(@PathVariable Long id, @RequestBody TeacherDTO teacherDTO) {
        log.info("Received request to update teacher with ID: {}", id);
        try {
            TeacherDTO updatedTeacher = teacherService.updateTeacherWithRecommendations(id, teacherDTO);
            if (updatedTeacher != null) {
                return ResponseEntity.ok(updatedTeacher);
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error updating teacher: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTeacher(@PathVariable Long id) {
        try {
            teacherService.deleteTeacher(id);
            return ResponseEntity.ok().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // === Teacher Availability Management (using DTOs) ===

    @GetMapping("/{teacherId}/availabilities")
    public ResponseEntity<?> getTeacherAvailabilities(@PathVariable Long teacherId) {
        log.info("Received request to get availabilities for teacher ID: {}", teacherId);
        try {
            List<TeacherAvailabilityDTO> availabilities = teacherService.getTeacherAvailabilities(teacherId);
            return ResponseEntity.ok(availabilities);
        } catch (EntityNotFoundException e) {
            log.warn("Teacher not found for getting availabilities: ID {}", teacherId);
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{teacherId}/availabilities")
    public ResponseEntity<?> setTeacherAvailabilities(@PathVariable Long teacherId, @RequestBody List<TeacherAvailabilityDTO> availabilityDTOs) {
        log.info("Received request to set availabilities for teacher ID: {}. Count: {}", teacherId, availabilityDTOs.size());
        try {
            List<TeacherAvailabilityDTO> savedAvailabilities = teacherService.setTeacherAvailabilities(teacherId, availabilityDTOs);
            return ResponseEntity.ok(savedAvailabilities);
        } catch (EntityNotFoundException e) {
            log.warn("Teacher not found for setting availabilities: ID {}", teacherId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            log.warn("Invalid availability data for teacher ID {}: {}", teacherId, e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error setting availabilities for teacher ID {}: {}", teacherId, availabilityDTOs, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An unexpected error occurred.");
        }
    }

    // 添加获取教师推荐课程的新端点
    @GetMapping("/{id}/recommended-courses")
    public ResponseEntity<List<Long>> getRecommendedCourses(@PathVariable Long id) {
        log.info("Received request to get recommended courses for teacher ID: {}", id);
        try {
            List<Long> recommendedCourses = recommendationService.getRecommendedCourseIds(id);
            return ResponseEntity.ok(recommendedCourses);
        } catch (Exception e) {
            log.error("Error getting recommended courses for teacher {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // 添加获取课程推荐教师的新端点
    @GetMapping("/courses/{id}/recommended-teachers")
    public ResponseEntity<List<Long>> getCourseRecommendedTeachers(@PathVariable Long id) {
        List<Long> recommendedTeachers = recommendationService.getCourseRecommendedTeachers(id);
        return ResponseEntity.ok(recommendedTeachers);
    }
} 