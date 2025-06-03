package com.schedulai.controller;

import com.schedulai.domain.TeacherAvailability;
import com.schedulai.dto.TeacherAvailabilityResponseDTO;
import com.schedulai.service.TeacherAvailabilityService;
import com.schedulai.util.DTOConverter;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teacher-availabilities")
@RequiredArgsConstructor
public class TeacherAvailabilityController {

    private static final Logger log = LoggerFactory.getLogger(TeacherAvailabilityController.class);

    private final TeacherAvailabilityService teacherAvailabilityService;

    // --- Get Teacher Availability ---
    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<List<TeacherAvailabilityResponseDTO>> getTeacherAvailability(@PathVariable Long teacherId) {
        log.info("GET /teacher-availabilities/teacher/{}", teacherId);
        try {
            List<TeacherAvailability> availabilities = teacherAvailabilityService.getAvailabilityForTeacher(teacherId);
            List<TeacherAvailabilityResponseDTO> dtoList = DTOConverter.convertToTeacherDTOList(availabilities);
            return ResponseEntity.ok(dtoList);
        } catch (EntityNotFoundException e) {
            log.warn("Teacher not found when getting availability: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error fetching availability for teacher {}: {}", teacherId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // --- Add Single Availability Slot ---
    @PostMapping("/teacher/{teacherId}")
    public ResponseEntity<?> addTeacherAvailability(@PathVariable Long teacherId, @RequestBody TeacherAvailability availability) {
        log.info("POST /teacher-availabilities/teacher/{} with data: {}", teacherId, availability);
        try {
            TeacherAvailability savedAvailability = teacherAvailabilityService.addAvailability(teacherId, availability);
            TeacherAvailabilityResponseDTO dto = DTOConverter.convertToTeacherDTO(savedAvailability);
            return new ResponseEntity<>(dto, HttpStatus.CREATED);
        } catch (EntityNotFoundException e) {
            log.warn("Teacher not found when adding availability: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            log.warn("Invalid data when adding availability: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Error adding availability for teacher {}: {}", teacherId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An internal error occurred.");
        }
    }

    // --- Update Single Availability Slot ---
    @PutMapping("/teacher/{teacherId}/batch")
    public ResponseEntity<?> updateTeacherAvailability(@PathVariable Long teacherId, @RequestBody List<TeacherAvailability> availabilities) {
        log.info("PUT /teacher-availabilities/teacher/{}/batch with data: {}", teacherId, availabilities);
        try {
            List<TeacherAvailability> savedAvailabilities = teacherAvailabilityService.batchUpdateAvailability(teacherId, availabilities);
            List<TeacherAvailabilityResponseDTO> dtoList = DTOConverter.convertToTeacherDTOList(savedAvailabilities);
            return ResponseEntity.ok(dtoList);
        } catch (EntityNotFoundException e) {
            log.warn("Teacher not found when updating availability: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            log.warn("Invalid data when updating availability: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Error updating availability for teacher {}: {}", teacherId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An internal error occurred.");
        }
    }

    // --- Delete Single Availability Slot ---
    @DeleteMapping("/{availabilityId}")
    public ResponseEntity<Void> deleteTeacherAvailability(@PathVariable Long availabilityId) {
        log.info("DELETE /teacher-availabilities/{}", availabilityId);
        try {
            teacherAvailabilityService.deleteAvailability(availabilityId);
            return ResponseEntity.noContent().build();
        } catch (EntityNotFoundException e) {
            log.warn("Availability not found when deleting: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error deleting availability {}: {}", availabilityId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
} 