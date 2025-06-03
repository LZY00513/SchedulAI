package com.schedulai.controller;

import com.schedulai.domain.TeacherCourse;
import com.schedulai.dto.TeacherCourseDTO;
import com.schedulai.service.TeacherCourseService;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map; // For simple request body
import java.util.Optional;

@RestController
@RequestMapping("/api/teachercourses")
public class TeacherCourseController {

    private static final Logger log = LoggerFactory.getLogger(TeacherCourseController.class);

    private final TeacherCourseService teacherCourseService;

    @Autowired
    public TeacherCourseController(TeacherCourseService teacherCourseService) {
        this.teacherCourseService = teacherCourseService;
    }

    // Get assignment for a specific teacher and course
    @GetMapping("/assignment")
    public ResponseEntity<?> getTeacherCourseAssignment(@RequestParam Long teacherId, @RequestParam Long courseId) {
        log.info("Received request to get assignment for teacher ID: {} and course ID: {}", teacherId, courseId);
        try {
            Optional<TeacherCourseDTO> assignment = teacherCourseService.getTeacherCourseAssignment(teacherId, courseId);
            return assignment.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error getting assignment for teacher {} and course {}: {}", teacherId, courseId, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An unexpected error occurred.");
        }
    }

    // Assign a teacher to a course
    @PostMapping
    public ResponseEntity<?> assignTeacherToCourse(@RequestParam Long teacherId, @RequestParam Long courseId) {
        log.info("Received request to assign teacher ID: {} to course ID: {}", teacherId, courseId);
        try {
            // Service now returns DTO
            TeacherCourseDTO assignmentDTO = teacherCourseService.assignTeacherToCourse(teacherId, courseId); // Changed variable type
            return ResponseEntity.status(HttpStatus.CREATED).body(assignmentDTO); // Return DTO
        } catch (EntityNotFoundException e) {
            log.warn("Error assigning teacher to course: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IllegalStateException e) {
            log.warn("Assignment conflict: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error assigning teacher {} to course {}: {}", teacherId, courseId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An unexpected error occurred.");
        }
    }

    // Unassign a teacher from a course
    @DeleteMapping
    public ResponseEntity<?> unassignTeacherFromCourse(@RequestParam Long teacherId, @RequestParam Long courseId) {
        log.info("Received request to unassign teacher {} from course {}", teacherId, courseId);

        if (teacherId == null || courseId == null) {
             return ResponseEntity.badRequest().body("Both teacherId and courseId query parameters are required.");
        }

        try {
            boolean success = teacherCourseService.unassignTeacherFromCourse(teacherId, courseId);
            if (success) {
                return ResponseEntity.noContent().build();
            } else {
                // This case might happen if the service returns false instead of throwing NotFoundException
                log.warn("Assignment not found for unassigning teacher {} from course {}", teacherId, courseId);
                return ResponseEntity.notFound().build();
            }
        } catch (IllegalStateException e) {
             log.warn("Cannot unassign teacher {} from course {}: {}", teacherId, courseId, e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error unassigning teacher {} from course {}: {}", teacherId, courseId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An unexpected error occurred.");
        }
    }

    // Get all courses assigned to a specific teacher
    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<List<TeacherCourseDTO>> getCoursesForTeacher(@PathVariable Long teacherId) {
        log.info("Received request to get courses for teacher ID: {}", teacherId);
        try {
            // Service returns List<DTO>
            List<TeacherCourseDTO> assignments = teacherCourseService.getCoursesForTeacher(teacherId);
            return ResponseEntity.ok(assignments);
        } catch (EntityNotFoundException e) {
            log.warn("Teacher not found when fetching courses: ID {}", teacherId);
            return ResponseEntity.notFound().build();
        }
    }

    // Get all teachers assigned to a specific course
    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<TeacherCourseDTO>> getTeachersForCourse(@PathVariable Long courseId) {
        log.info("Received request to get teachers for course ID: {}", courseId);
        try {
            // Service returns List<DTO>
            List<TeacherCourseDTO> assignments = teacherCourseService.getTeachersForCourse(courseId);
            return ResponseEntity.ok(assignments);
        } catch (EntityNotFoundException e) {
            log.warn("Course not found when fetching teachers: ID {}", courseId);
            return ResponseEntity.notFound().build();
        }
    }
} 