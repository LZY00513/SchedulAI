package com.schedulai.controller;

import com.schedulai.dto.CourseDTO;
import com.schedulai.dto.TeacherDTO;
import com.schedulai.dto.TeacherCourseDTO;
import com.schedulai.service.CourseService;
import com.schedulai.service.TeacherCourseService;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    private static final Logger log = LoggerFactory.getLogger(CourseController.class);

    private final CourseService courseService;
    private final TeacherCourseService teacherCourseService;

    @Autowired
    public CourseController(CourseService courseService, TeacherCourseService teacherCourseService) {
        this.courseService = courseService;
        this.teacherCourseService = teacherCourseService;
    }

    @GetMapping
    public ResponseEntity<List<CourseDTO>> getAllCourses() {
        return ResponseEntity.ok(courseService.getAllCourses());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CourseDTO> getCourseById(@PathVariable Long id) {
        return courseService.getCourseById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Example: Get course by name might be useful too
    @GetMapping("/byName")
    public ResponseEntity<CourseDTO> getCourseByName(@RequestParam String name) {
        log.info("Received request to get course by name: {}", name);
        return courseService.getCourseByName(name)
                 .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<CourseDTO> createCourse(@RequestBody CourseDTO courseDTO) {
        try {
            CourseDTO createdCourse = courseService.createCourse(courseDTO);
            return ResponseEntity.ok(createdCourse);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<CourseDTO> updateCourse(@PathVariable Long id, @RequestBody CourseDTO courseDTO) {
        try {
            CourseDTO updatedCourse = courseService.updateCourse(id, courseDTO);
            return ResponseEntity.ok(updatedCourse);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCourse(@PathVariable Long id) {
        try {
            courseService.deleteCourse(id);
            return ResponseEntity.ok().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{courseId}/teachers")
    public ResponseEntity<List<Long>> getTeachersForCourse(@PathVariable Long courseId) {
        log.info("Received request to get teachers for course ID: {}", courseId);
        try {
            List<TeacherCourseDTO> assignments = teacherCourseService.getTeachersForCourse(courseId);
            List<Long> teacherIds = assignments.stream()
                .map(TeacherCourseDTO::getTeacherId)
                .collect(Collectors.toList());
            return ResponseEntity.ok(teacherIds);
        } catch (EntityNotFoundException e) {
            log.warn("Course not found: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error getting teachers for course {}: {}", courseId, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
} 