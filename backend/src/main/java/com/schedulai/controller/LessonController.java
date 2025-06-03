package com.schedulai.controller;

import com.schedulai.domain.LessonStatus;
import com.schedulai.dto.LessonDTO;
import com.schedulai.service.LessonService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/lessons") // Base path for lesson-related operations
@RequiredArgsConstructor
public class LessonController {

    private static final Logger log = LoggerFactory.getLogger(LessonController.class);
    private final LessonService lessonService;

    @PostMapping
    public ResponseEntity<?> createLesson(@RequestBody LessonDTO lessonDTO) {
        log.info("Received request to create lesson: {}", lessonDTO);
        try {
            LessonDTO createdLesson = lessonService.createLesson(lessonDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdLesson);
        } catch (EntityNotFoundException e) {
            log.warn("Failed to create lesson, entity not found: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            log.warn("Failed to create lesson, invalid argument: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (IllegalStateException e) {
            log.warn("Failed to create lesson due to conflict: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (Exception e) {
            log.error("Error creating lesson: {}", lessonDTO, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An internal error occurred while creating the lesson.");
        }
    }

    @GetMapping
    public ResponseEntity<List<LessonDTO>> getAllLessons(@RequestParam(required = false) Long enrollmentId) {
        List<LessonDTO> lessons;
        if (enrollmentId != null) {
            log.info("Received request to get lessons for enrollment ID: {}", enrollmentId);
            lessons = lessonService.getLessonsByEnrollmentId(enrollmentId);
        } else {
            log.info("Received request to get all lessons");
            lessons = lessonService.getAllLessons();
        }
        return ResponseEntity.ok(lessons);
    }

    @GetMapping("/{id}")
    public ResponseEntity<LessonDTO> getLessonById(@PathVariable Long id) {
        log.info("Received request to get lesson by ID: {}", id);
        return lessonService.getLessonById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateLesson(@PathVariable Long id, @RequestBody LessonDTO lessonDTO) {
        log.info("Received request to update lesson ID: {} with data: {}", id, lessonDTO);
        try {
            return lessonService.updateLesson(id, lessonDTO)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (EntityNotFoundException e) {
            log.warn("Failed to update lesson {}, entity not found: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            log.warn("Failed to update lesson {}, invalid argument: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (IllegalStateException e) {
            log.warn("Failed to update lesson {} due to conflict: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (Exception e) {
            log.error("Error updating lesson {}: {}", id, lessonDTO, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An internal error occurred while updating the lesson.");
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateLessonStatus(@PathVariable Long id, @RequestBody Map<String, String> statusUpdate) {
        String statusString = statusUpdate.get("status");
        log.info("Received request to update status for lesson ID: {} to {}", id, statusString);

        if (statusString == null || statusString.isBlank()) {
            return ResponseEntity.badRequest().body("Status field is required.");
        }

        LessonStatus status;
        try {
            status = LessonStatus.valueOf(statusString.toUpperCase());
        } catch (IllegalArgumentException e) {
            log.warn("Invalid status value provided for lesson {}: {}", id, statusString);
            return ResponseEntity.badRequest().body("Invalid status value provided.");
        }

        try {
            return lessonService.updateLessonStatus(id, status)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (EntityNotFoundException e) {
            log.warn("Failed to update status for lesson {}, not found: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            log.error("Error updating status for lesson {}: {}", id, statusString, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An internal error occurred while updating the lesson status.");
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLesson(@PathVariable Long id) {
        log.info("Received request to delete lesson with ID: {}", id);
        try {
            lessonService.deleteLesson(id);
            return ResponseEntity.noContent().build();
        } catch (EntityNotFoundException e) {
            log.warn("Lesson not found for deletion with ID: {}", id);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error deleting lesson {}: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
} 