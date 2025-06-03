package com.schedulai.controller;

import com.schedulai.dto.EnrollmentDTO;
import com.schedulai.service.EnrollmentService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map; // For rate update

@RestController
@RequestMapping("/api/enrollments")
@RequiredArgsConstructor // Use constructor injection
public class EnrollmentController {

    private static final Logger log = LoggerFactory.getLogger(EnrollmentController.class);

    private final EnrollmentService enrollmentService;

    @GetMapping
    public ResponseEntity<List<EnrollmentDTO>> getAllEnrollments(
            @RequestParam(required = false) Long studentId,
            @RequestParam(required = false) Long teacherCourseId) {
        List<EnrollmentDTO> enrollments;
        if (studentId != null) {
            enrollments = enrollmentService.getEnrollmentsByStudentId(studentId);
        } else if (teacherCourseId != null) {
            enrollments = enrollmentService.getEnrollmentsByTeacherCourseId(teacherCourseId);
        } else {
            enrollments = enrollmentService.getAllEnrollments();
        }
        return ResponseEntity.ok(enrollments);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EnrollmentDTO> getEnrollmentById(@PathVariable Long id) {
        log.info("Received request to get enrollment by ID: {}", id);
        return enrollmentService.getEnrollmentById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<EnrollmentDTO> createEnrollment(@RequestBody EnrollmentDTO enrollmentDTO) {
        log.info("Received request to create enrollment: {}", enrollmentDTO);
        EnrollmentDTO createdEnrollment = enrollmentService.createEnrollment(enrollmentDTO);
        return new ResponseEntity<>(createdEnrollment, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EnrollmentDTO> updateEnrollmentRate(@PathVariable Long id, @RequestBody EnrollmentDTO enrollmentDTO) {
        log.info("Received request to update enrollment rate for ID: {}", id);
        return enrollmentService.updateEnrollment(id, enrollmentDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEnrollment(@PathVariable Long id) {
        log.info("Received request to delete enrollment with ID: {}", id);
        try {
            enrollmentService.deleteEnrollment(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) { // Catch specific exceptions in real app
            // Log the error
            return ResponseEntity.notFound().build(); // Or internal server error depending on cause
        }
    }
}
