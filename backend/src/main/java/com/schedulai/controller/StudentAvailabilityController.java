package com.schedulai.controller;

import com.schedulai.domain.StudentAvailability;
import com.schedulai.dto.StudentAvailabilityResponseDTO;
import com.schedulai.service.StudentAvailabilityService;
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
@RequestMapping("/api/student-availabilities")
@RequiredArgsConstructor
public class StudentAvailabilityController {

    private static final Logger log = LoggerFactory.getLogger(StudentAvailabilityController.class);

    private final StudentAvailabilityService studentAvailabilityService;

    // --- Get Student Availability ---
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<StudentAvailabilityResponseDTO>> getStudentAvailability(@PathVariable Long studentId) {
        log.info("GET /student-availabilities/student/{}", studentId);
        try {
            List<StudentAvailability> availabilities = studentAvailabilityService.getAvailabilityForStudent(studentId);
            List<StudentAvailabilityResponseDTO> dtoList = DTOConverter.convertToDTOList(availabilities);
            return ResponseEntity.ok(dtoList);
        } catch (EntityNotFoundException e) {
            log.warn("Student not found when getting availability: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error fetching availability for student {}: {}", studentId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // --- Add Single Availability Slot ---
    @PostMapping("/student/{studentId}")
    public ResponseEntity<?> addStudentAvailability(@PathVariable Long studentId, @RequestBody StudentAvailability availability) {
        log.info("POST /student-availabilities/student/{} with data: {}", studentId, availability);
        try {
            StudentAvailability savedAvailability = studentAvailabilityService.addAvailability(studentId, availability);
            StudentAvailabilityResponseDTO dto = DTOConverter.convertToDTO(savedAvailability);
            return new ResponseEntity<>(dto, HttpStatus.CREATED);
        } catch (EntityNotFoundException e) {
            log.warn("Student not found when adding availability: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            log.warn("Invalid data when adding availability: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Error adding availability for student {}: {}", studentId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An internal error occurred.");
        }
    }

    // --- Update Single Availability Slot ---
    @PutMapping("/student/{studentId}/batch")
    public ResponseEntity<?> updateStudentAvailability(@PathVariable Long studentId, @RequestBody List<StudentAvailability> availabilities) {
        log.info("PUT /student-availabilities/student/{}/batch with data: {}", studentId, availabilities);
        try {
            List<StudentAvailability> savedAvailabilities = studentAvailabilityService.batchUpdateAvailability(studentId, availabilities);
            List<StudentAvailabilityResponseDTO> dtoList = DTOConverter.convertToDTOList(savedAvailabilities);
            return ResponseEntity.ok(dtoList);
        } catch (EntityNotFoundException e) {
            log.warn("Student not found when updating availability: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            log.warn("Invalid data when updating availability: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Error updating availability for student {}: {}", studentId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An internal error occurred.");
        }
    }

    // --- Delete Single Availability Slot ---
    @DeleteMapping("/{availabilityId}")
    public ResponseEntity<Void> deleteStudentAvailability(@PathVariable Long availabilityId) {
        log.info("DELETE /student-availabilities/{}", availabilityId);
        try {
            studentAvailabilityService.deleteAvailability(availabilityId);
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