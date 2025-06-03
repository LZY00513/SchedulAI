package com.schedulai.service;

import com.schedulai.domain.Course;
import com.schedulai.dto.CourseDTO;
import com.schedulai.dto.TeacherDTO;
import com.schedulai.repository.CourseRepository;
import com.schedulai.repository.TeacherCourseRepository;
import com.schedulai.repository.TeacherRepository;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CourseService {

    private static final Logger log = LoggerFactory.getLogger(CourseService.class);

    private final CourseRepository courseRepository;
    private final TeacherCourseRepository teacherCourseRepository;
    private final TeacherRepository teacherRepository;
    private final TeacherService teacherService;

    @Autowired
    public CourseService(CourseRepository courseRepository, 
                         TeacherCourseRepository teacherCourseRepository, 
                         TeacherRepository teacherRepository,
                         TeacherService teacherService) {
        this.courseRepository = courseRepository;
        this.teacherCourseRepository = teacherCourseRepository;
        this.teacherRepository = teacherRepository;
        this.teacherService = teacherService;
    }

    // --- Conversion Helper ---
    private CourseDTO toDTO(Course course) {
        if (course == null) return null;
        return new CourseDTO()
            .setId(course.getId())
            .setName(course.getName())
            .setDescription(course.getDescription())
            .setCategory(course.getCategory())
            .setLevel(course.getLevel())
            .setDuration(course.getDuration())
            .setPrice(course.getPrice())
            .setDifficulty(course.getDifficulty())
            .setStatus(course.getStatus())
            .setRecommendedTeachers(tryInitializeAndCopyList(course.getRecommendedTeachers()))
            .setPrerequisites(tryInitializeAndCopyList(course.getPrerequisites()))
            .setMaterials(tryInitializeAndCopyList(course.getMaterials()));
    }

    private <T> List<T> tryInitializeAndCopyList(List<T> list) {
        return list != null ? new ArrayList<>(list) : new ArrayList<>();
    }

    private Course toEntity(CourseDTO dto) {
        if (dto == null) return null;
        Course course = new Course();
        course.setName(dto.getName());
        course.setDescription(dto.getDescription());
        course.setCategory(dto.getCategory());
        course.setLevel(dto.getLevel());
        course.setDuration(dto.getDuration());
        course.setPrice(dto.getPrice());
        course.setDifficulty(dto.getDifficulty());
        course.setStatus(dto.getStatus());
        if (dto.getRecommendedTeachers() != null) {
            course.getRecommendedTeachers().clear();
            course.getRecommendedTeachers().addAll(dto.getRecommendedTeachers());
        }
        if (dto.getPrerequisites() != null) {
            course.getPrerequisites().clear();
            course.getPrerequisites().addAll(dto.getPrerequisites());
        }
        if (dto.getMaterials() != null) {
            course.getMaterials().clear();
            course.getMaterials().addAll(dto.getMaterials());
        }
        return course;
    }

    // --- Service Methods (Using DTOs) ---

    @Transactional(readOnly = true)
    public List<CourseDTO> getAllCourses() {
        log.info("Fetching all courses");
        return courseRepository.findAll()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<CourseDTO> getCourseById(Long id) {
        log.info("Fetching course by ID: {}", id);
        return courseRepository.findById(id).map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public Optional<CourseDTO> getCourseByName(String name) {
        log.info("Fetching course by name: {}", name);
        return courseRepository.findByName(name).map(this::toDTO);
    }

    @Transactional
    public CourseDTO createCourse(CourseDTO courseDTO) {
        log.info("Creating new course: {}", courseDTO);
        Course course = toEntity(courseDTO);
        try {
            Course savedCourse = courseRepository.save(course);
            log.info("Successfully created course with ID: {}", savedCourse.getId());
            return toDTO(savedCourse);
        } catch (Exception e) {
            log.error("Error creating course: {}", courseDTO, e);
            throw e;
        }
    }

    @Transactional
    public CourseDTO updateCourse(Long id, CourseDTO courseDTO) {
        log.info("Attempting to update course with ID: {}, DTO: {}", id, courseDTO);
        return courseRepository.findById(id)
                .map(existingCourse -> {
                    existingCourse.setName(courseDTO.getName());
                    existingCourse.setDescription(courseDTO.getDescription());
                    existingCourse.setCategory(courseDTO.getCategory());
                    existingCourse.setLevel(courseDTO.getLevel());
                    existingCourse.setDuration(courseDTO.getDuration());
                    existingCourse.setPrice(courseDTO.getPrice());
                    existingCourse.setDifficulty(courseDTO.getDifficulty());
                    existingCourse.setStatus(courseDTO.getStatus());
                    if (courseDTO.getRecommendedTeachers() != null) {
                        existingCourse.getRecommendedTeachers().clear();
                        existingCourse.getRecommendedTeachers().addAll(courseDTO.getRecommendedTeachers());
                    }
                    if (courseDTO.getPrerequisites() != null) {
                        existingCourse.getPrerequisites().clear();
                        existingCourse.getPrerequisites().addAll(courseDTO.getPrerequisites());
                    }
                    if (courseDTO.getMaterials() != null) {
                        existingCourse.getMaterials().clear();
                        existingCourse.getMaterials().addAll(courseDTO.getMaterials());
                    }
                    try {
                        Course updatedCourse = courseRepository.save(existingCourse);
                        log.info("Successfully updated course with ID: {}", updatedCourse.getId());
                        return toDTO(updatedCourse);
                    } catch (Exception e) {
                        log.error("Error updating course {}: {}", id, courseDTO, e);
                        throw e;
                    }
                })
                .orElseThrow(() -> new EntityNotFoundException("Course not found with id: " + id));
    }

    @Transactional
    public void deleteCourse(Long id) {
        log.info("Attempting to delete course with ID: {}", id);
        courseRepository.findById(id)
                .ifPresentOrElse(
                        course -> {
                            try {
                                courseRepository.delete(course);
                                log.info("Successfully deleted course with ID: {}", id);
                            } catch (Exception e) {
                                log.error("Error deleting course with ID: {}", id, e);
                                throw e;
                            }
                        },
                        () -> {
                            log.warn("Course with ID: {} not found for deletion", id);
                            throw new EntityNotFoundException("Course not found with id: " + id);
                        }
                );
    }
} 