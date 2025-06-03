package com.schedulai.service;

import com.schedulai.domain.Course;
import com.schedulai.domain.Teacher;
import com.schedulai.domain.TeacherCourse;
import com.schedulai.dto.TeacherCourseDTO;
import com.schedulai.repository.CourseRepository;
import com.schedulai.repository.EnrollmentRepository;
import com.schedulai.repository.TeacherCourseRepository;
import com.schedulai.repository.TeacherRepository;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class TeacherCourseService {

    private static final Logger log = LoggerFactory.getLogger(TeacherCourseService.class);

    private final TeacherCourseRepository teacherCourseRepository;
    private final TeacherRepository teacherRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository; // Needed to check before unassigning

    @Autowired
    public TeacherCourseService(TeacherCourseRepository teacherCourseRepository,
                              TeacherRepository teacherRepository,
                              CourseRepository courseRepository,
                              EnrollmentRepository enrollmentRepository) {
        this.teacherCourseRepository = teacherCourseRepository;
        this.teacherRepository = teacherRepository;
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
    }

    // --- Conversion Helper ---
    private TeacherCourseDTO toDTO(TeacherCourse teacherCourse) {
        if (teacherCourse == null) return null;
        Long teacherId = (teacherCourse.getTeacher() != null) ? teacherCourse.getTeacher().getId() : null;
        Long courseId = (teacherCourse.getCourse() != null) ? teacherCourse.getCourse().getId() : null;
        return new TeacherCourseDTO(
            teacherCourse.getId(),
            teacherId,
            courseId
        );
    }

    // Get assignment for a specific teacher and course
    @Transactional(readOnly = true)
    public Optional<TeacherCourseDTO> getTeacherCourseAssignment(Long teacherId, Long courseId) {
        log.info("Getting assignment for teacher {} and course {}", teacherId, courseId);
        return teacherCourseRepository.findByTeacherIdAndCourseId(teacherId, courseId)
                .map(this::toDTO);
    }

    // --- Service Methods ---

    @Transactional
    public TeacherCourseDTO assignTeacherToCourse(Long teacherId, Long courseId) {
        log.info("Assigning teacher {} to course {}", teacherId, courseId);

        // 首先检查是否已存在分配关系
        Optional<TeacherCourse> existingAssignment = teacherCourseRepository.findByTeacherIdAndCourseId(teacherId, courseId);
        if (existingAssignment.isPresent()) {
            log.info("Found existing assignment for teacher {} and course {}", teacherId, courseId);
            return toDTO(existingAssignment.get());
        }

        Teacher teacher = teacherRepository.findById(teacherId)
                .orElseThrow(() -> new EntityNotFoundException("Teacher not found with ID: " + teacherId));
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new EntityNotFoundException("Course not found with ID: " + courseId));

        TeacherCourse teacherCourse = new TeacherCourse(teacher, course);
        try {
            TeacherCourse savedAssignment = teacherCourseRepository.save(teacherCourse);
            log.info("Successfully assigned teacher {} to course {}. Assignment ID: {}", teacherId, courseId, savedAssignment.getId());
            return toDTO(savedAssignment);
        } catch (Exception e) {
            log.error("Error assigning teacher {} to course {}: {}", teacherId, courseId, e);
            throw e;
        }
    }

    @Transactional
    public boolean unassignTeacherFromCourse(Long teacherId, Long courseId) {
        log.info("Unassigning teacher {} from course {}", teacherId, courseId);

        Optional<TeacherCourse> teacherCourseOpt = teacherCourseRepository.findByTeacherIdAndCourseId(teacherId, courseId);
        if (teacherCourseOpt.isEmpty()) {
            log.warn("Assignment not found for teacher {} and course {}. Cannot unassign.", teacherId, courseId);
            return false; // Or throw NotFoundException
        }

        TeacherCourse teacherCourse = teacherCourseOpt.get();

        // Check if there are any enrollments for this specific TeacherCourse
        if (!enrollmentRepository.findByTeacherCourseId(teacherCourse.getId()).isEmpty()) {
            log.warn("Cannot unassign teacher {} from course {} because students are enrolled.", teacherId, courseId);
            throw new IllegalStateException("Cannot unassign course: Students are currently enrolled in this teacher's course.");
        }

        teacherCourseRepository.delete(teacherCourse);
        log.info("Successfully unassigned teacher {} from course {}.", teacherId, courseId);
        return true;
    }

    @Transactional(readOnly = true)
    public List<TeacherCourseDTO> getCoursesForTeacher(Long teacherId) {
        log.info("Fetching courses for teacher ID: {}", teacherId);
        if (!teacherRepository.existsById(teacherId)) {
             throw new EntityNotFoundException("Teacher not found with ID: " + teacherId);
        }
        return teacherCourseRepository.findByTeacherId(teacherId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TeacherCourseDTO> getTeachersForCourse(Long courseId) {
        log.info("Fetching teachers for course ID: {}", courseId);
         if (!courseRepository.existsById(courseId)) {
             throw new EntityNotFoundException("Course not found with ID: " + courseId);
        }
        return teacherCourseRepository.findByCourseId(courseId)
                 .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
} 