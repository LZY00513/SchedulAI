package com.schedulai.controller;

import com.schedulai.domain.Student;
import com.schedulai.dto.StudentAvailabilityDTO;
import com.schedulai.dto.StudentDTO;
import com.schedulai.dto.LessonDTO;
import com.schedulai.service.StudentService;
import com.schedulai.service.LessonService;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/students") // Base path for all student-related endpoints
public class StudentController {

    private static final Logger log = LoggerFactory.getLogger(StudentController.class);

    private final StudentService studentService;
    private final LessonService lessonService;

    @Autowired
    public StudentController(StudentService studentService, LessonService lessonService) {
        this.studentService = studentService;
        this.lessonService = lessonService;
    }

    // GET /api/students - Get all students
    @GetMapping
    public List<StudentDTO> getAllStudents() {
        log.info("Received request to get all students");
        return studentService.getAllStudents();
    }

    // GET /api/students/{id} - Get a specific student by ID
    @GetMapping("/{id}")
    public ResponseEntity<StudentDTO> getStudentById(@PathVariable Long id) {
        log.info("Received request to get student by ID: {}", id);
        return studentService.getStudentById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // POST /api/students - Create a new student
    @PostMapping
    public ResponseEntity<?> createStudent(@RequestBody StudentDTO studentDTO) {
        log.info("Received request to create student: {}", studentDTO);
        try {
            // Directly call the service method which now accepts and returns DTO
            StudentDTO createdDTO = studentService.createStudent(studentDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdDTO);
        } catch (Exception e) {
            log.error("Error creating student from DTO: {}", studentDTO, e);
            // Consider a more specific error response based on exception type if needed
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error creating student: " + e.getMessage());
        }
    }

    // PUT /api/students/{id} - Update an existing student
    @PutMapping("/{id}")
    public ResponseEntity<?> updateStudent(@PathVariable Long id, @RequestBody StudentDTO studentDTO) {
        log.info("Received request to update student with ID: {}, details: {}", id, studentDTO);
        try {
            // Directly call the service method which now accepts DTO and returns Optional<DTO>
            return studentService.updateStudent(id, studentDTO)
                .map(ResponseEntity::ok) // If student is found and updated, return OK with the DTO
                .orElse(ResponseEntity.notFound().build()); // If student is not found by service
        } catch (Exception e) {
            log.error("Error updating student {} with DTO: {}", id, studentDTO, e);
            // Consider specific error handling
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error updating student: " + e.getMessage());
        }
    }

    // DELETE /api/students/{id} - Delete a student
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteStudent(@PathVariable Long id) {
        log.info("Received request to delete student with ID: {}", id);
         try {
            if (studentService.deleteStudent(id)) {
                return ResponseEntity.noContent().build();
            } else {
                // This case might mean the student wasn't found *before* the check for enrollments
                return ResponseEntity.notFound().build(); 
            }
        } catch (IllegalStateException e) {
            log.warn("Cannot delete student {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage()); // Has enrollments
        } catch (Exception e) {
             log.error("Error deleting student {}: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // === Student Availability Management ===

    @GetMapping("/{studentId}/availabilities")
    public ResponseEntity<?> getStudentAvailabilities(@PathVariable Long studentId) {
        log.info("Received request to get availabilities for student ID: {}", studentId);
        try {
            List<StudentAvailabilityDTO> availabilities = studentService.getStudentAvailabilities(studentId);
            return ResponseEntity.ok(availabilities);
        } catch (EntityNotFoundException e) {
            log.warn("Student not found for getting availabilities: ID {}", studentId);
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{studentId}/availabilities")
    public ResponseEntity<?> setStudentAvailabilities(@PathVariable Long studentId, @RequestBody List<StudentAvailabilityDTO> availabilityDTOs) {
        log.info("Received request to set availabilities for student ID: {}. Count: {}", studentId, availabilityDTOs.size());
        try {
            List<StudentAvailabilityDTO> savedAvailabilities = studentService.setStudentAvailabilities(studentId, availabilityDTOs);
            return ResponseEntity.ok(savedAvailabilities);
        } catch (EntityNotFoundException e) {
            log.warn("Student not found for setting availabilities: ID {}", studentId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            log.warn("Invalid availability data for student ID {}: {}", studentId, e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error setting availabilities for student ID {}: {}", studentId, availabilityDTOs, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An unexpected error occurred.");
        }
    }

    // === Student Lessons Endpoint ===
    
    @GetMapping("/{studentId}/lessons")
    public ResponseEntity<?> getStudentLessons(@PathVariable Long studentId) {
        log.info("Received request to get lessons for student ID: {}", studentId);
        try {
            // 先检查学生是否存在
            if (!studentService.getStudentById(studentId).isPresent()) {
                log.warn("Student not found for getting lessons: ID {}", studentId);
                return ResponseEntity.notFound().build();
            }
            
            // 通过LessonRepository获取课程 - 需要注入LessonService
            List<LessonDTO> lessons = lessonService.getLessonsByStudentId(studentId);
            return ResponseEntity.ok(lessons);
        } catch (Exception e) {
            log.error("Error getting lessons for student ID {}: {}", studentId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("An error occurred while fetching student lessons.");
        }
    }
} 