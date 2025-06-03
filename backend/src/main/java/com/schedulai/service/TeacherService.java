package com.schedulai.service;

import com.schedulai.domain.Student;
import com.schedulai.domain.StudentAvailability;
import com.schedulai.domain.Teacher;
import com.schedulai.domain.TeacherAvailability;
import com.schedulai.domain.Course;
import com.schedulai.domain.TeacherCourse;
import com.schedulai.dto.TeacherAvailabilityDTO;
import com.schedulai.dto.TeacherDTO;
import com.schedulai.dto.CourseDTO;
import com.schedulai.repository.TeacherAvailabilityRepository;
import com.schedulai.repository.TeacherCourseRepository;
import com.schedulai.repository.TeacherRepository;
import com.schedulai.repository.CourseRepository;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class TeacherService {

    private static final Logger log = LoggerFactory.getLogger(TeacherService.class);

    private final TeacherRepository teacherRepository;
    private final TeacherAvailabilityRepository teacherAvailabilityRepository;
    private final TeacherCourseRepository teacherCourseRepository;
    private final TeacherRecommendationService recommendationService;
    private final CourseRepository courseRepository;

    @Autowired
    public TeacherService(TeacherRepository teacherRepository,
                          TeacherAvailabilityRepository teacherAvailabilityRepository,
                          TeacherCourseRepository teacherCourseRepository,
                          TeacherRecommendationService recommendationService,
                          CourseRepository courseRepository) {
        this.teacherRepository = teacherRepository;
        this.teacherAvailabilityRepository = teacherAvailabilityRepository;
        this.teacherCourseRepository = teacherCourseRepository;
        this.recommendationService = recommendationService;
        this.courseRepository = courseRepository;
    }

    // --- Conversion Helpers ---
    private TeacherAvailabilityDTO toAvailabilityDTO(TeacherAvailability availability) {
        if (availability == null) return null;
        return new TeacherAvailabilityDTO(
            availability.getId(),
            availability.getDayOfWeek(),
            availability.getStartTime(),
            availability.getEndTime(),
            availability.getIsAvailable()
        );
    }

    private TeacherAvailability toAvailabilityEntity(TeacherAvailabilityDTO dto, Teacher teacher) {
        if (dto == null) return null;
        TeacherAvailability entity = new TeacherAvailability();
        entity.setId(dto.getId());
        entity.setTeacher(teacher);
        entity.setDayOfWeek(dto.getDayOfWeek());
        entity.setStartTime(dto.getStartTime());
        entity.setEndTime(dto.getEndTime());
        entity.setIsAvailable(dto.getIsAvailable() != null ? dto.getIsAvailable() : true);
        return entity;
    }

    private CourseDTO toCourseDTO(Course course) {
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
            .setRecommendedTeachers(course.getRecommendedTeachers())
            .setPrerequisites(course.getPrerequisites())
            .setMaterials(course.getMaterials());
    }

    // Make public so other services (like CourseService) can use it
    public TeacherDTO toDTO(Teacher teacher) {
        if (teacher == null) return null;
        
        // Convert courses
        List<CourseDTO> courseDTOs = teacher.getTeacherCourses().stream()
                .map(tc -> toCourseDTO(tc.getCourse()))
                .collect(Collectors.toList());

        TeacherDTO dto = new TeacherDTO();
        dto.setId(teacher.getId());
        dto.setName(teacher.getName());
        dto.setHourlyRate(teacher.getHourlyRate());
        dto.setAvailabilityMode(teacher.getAvailabilityMode());
        dto.setGender(teacher.getGender());
        dto.setAge(teacher.getAge());
        dto.setSubject(teacher.getSubject());
        dto.setEducation(teacher.getEducation());
        dto.setExperience(teacher.getExperience());
        dto.setPhone(teacher.getPhone());
        dto.setEmail(teacher.getEmail());
        dto.setStatus(teacher.getStatus());
        dto.setCourses(courseDTOs);
        
        // 获取推荐课程ID列表
        List<Long> recommendedCourseIds = recommendationService.getRecommendedCourseIds(teacher.getId());
        dto.setRecommendedCourseIds(recommendedCourseIds);
        
        return dto;
    }

    // Helper to convert DTO to Entity
    private Teacher toEntity(TeacherDTO dto) {
        if (dto == null) return null;
        Teacher teacher = new Teacher();
        // ID is set in update method
        teacher.setName(dto.getName());
        teacher.setHourlyRate(dto.getHourlyRate());
        teacher.setAvailabilityMode(dto.getAvailabilityMode());
        // Set new fields
        teacher.setGender(dto.getGender());
        teacher.setAge(dto.getAge());
        teacher.setSubject(dto.getSubject());
        teacher.setEducation(dto.getEducation());
        teacher.setExperience(dto.getExperience());
        teacher.setPhone(dto.getPhone());
        teacher.setEmail(dto.getEmail());
        teacher.setStatus(dto.getStatus());
        // Collections managed separately
        return teacher;
    }

    // --- Service Methods (Returning DTOs) ---
    @Transactional(readOnly = true)
    public List<TeacherDTO> getAllTeachers() {
        log.info("Fetching all teachers");
        return teacherRepository.findAll()
                .stream()
                .map(this::toDTO) // Convert to DTO
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<TeacherDTO> getTeacherById(Long id) {
        log.info("Fetching teacher by ID: {}", id);
        return teacherRepository.findById(id).map(this::toDTO); // Convert to DTO
    }

    @Transactional
    public TeacherDTO createTeacher(TeacherDTO teacherDTO) {
        log.info("Creating new teacher: {}", teacherDTO);
        Teacher teacher = toEntity(teacherDTO);
        try {
            Teacher savedTeacher = teacherRepository.save(teacher);
            log.info("Successfully created teacher with ID: {}", savedTeacher.getId());
            return toDTO(savedTeacher);
        } catch (Exception e) {
            log.error("Error creating teacher: {}", teacherDTO, e);
            throw e;
        }
    }

    @Transactional
    public TeacherDTO updateTeacher(Long id, TeacherDTO teacherDTO) {
        log.info("Attempting to update teacher with ID: {}, DTO: {}", id, teacherDTO);
        return teacherRepository.findById(id)
                .map(existingTeacher -> {
                    existingTeacher.setName(teacherDTO.getName());
                    existingTeacher.setHourlyRate(teacherDTO.getHourlyRate());
                    existingTeacher.setAvailabilityMode(teacherDTO.getAvailabilityMode());
                    existingTeacher.setGender(teacherDTO.getGender());
                    existingTeacher.setAge(teacherDTO.getAge());
                    existingTeacher.setSubject(teacherDTO.getSubject());
                    existingTeacher.setEducation(teacherDTO.getEducation());
                    existingTeacher.setExperience(teacherDTO.getExperience());
                    existingTeacher.setPhone(teacherDTO.getPhone());
                    existingTeacher.setEmail(teacherDTO.getEmail());
                    existingTeacher.setStatus(teacherDTO.getStatus());

                    try {
                        Teacher updatedTeacher = teacherRepository.save(existingTeacher);
                        log.info("Successfully updated teacher with ID: {}", updatedTeacher.getId());
                        return toDTO(updatedTeacher);
                    } catch (Exception e) {
                        log.error("Error updating teacher {}: {}", id, teacherDTO, e);
                        throw e;
                    }
                })
                .orElseThrow(() -> new EntityNotFoundException("Teacher not found with id: " + id));
    }

    @Transactional
    public TeacherDTO updateTeacherWithRecommendations(Long id, TeacherDTO teacherDTO) {
        log.info("Attempting to update teacher with ID: {} and course assignments, DTO: {}", id, teacherDTO);
        return teacherRepository.findById(id)
                .map(existingTeacher -> {
                    // 1. 更新教师基本信息
                    existingTeacher.setName(teacherDTO.getName());
                    existingTeacher.setHourlyRate(teacherDTO.getHourlyRate());
                    existingTeacher.setAvailabilityMode(teacherDTO.getAvailabilityMode());
                    existingTeacher.setGender(teacherDTO.getGender());
                    existingTeacher.setAge(teacherDTO.getAge());
                    existingTeacher.setSubject(teacherDTO.getSubject());
                    existingTeacher.setEducation(teacherDTO.getEducation());
                    existingTeacher.setExperience(teacherDTO.getExperience());
                    existingTeacher.setPhone(teacherDTO.getPhone());
                    existingTeacher.setEmail(teacherDTO.getEmail());
                    existingTeacher.setStatus(teacherDTO.getStatus());

                    Teacher updatedTeacher = teacherRepository.save(existingTeacher);

                    // 2. 更新教师课程关联
                    List<Long> courseIds = teacherDTO.getCourseIds();
                    if (courseIds != null && !courseIds.isEmpty()) {
                        for (Long courseId : courseIds) {
                            teacherCourseRepository.findByTeacherIdAndCourseId(id, courseId)
                                .orElseGet(() -> {
                                    // 如果关联不存在，创建新的关联
                                    Course course = courseRepository.findById(courseId)
                                        .orElseThrow(() -> new EntityNotFoundException("Course not found with id: " + courseId));
                                    TeacherCourse teacherCourse = new TeacherCourse(updatedTeacher, course);
                                    return teacherCourseRepository.save(teacherCourse);
                                });
                        }
                    }

                    log.info("Successfully updated teacher and course assignments with ID: {}", updatedTeacher.getId());
                    return toDTO(updatedTeacher);
                })
                .orElse(null);
    }

    @Transactional
    public void deleteTeacher(Long id) {
        log.info("Attempting to delete teacher with ID: {}", id);
        teacherRepository.findById(id)
                .ifPresentOrElse(
                        teacher -> {
                            try {
                                teacherRepository.delete(teacher);
                                log.info("Successfully deleted teacher with ID: {}", id);
                            } catch (Exception e) {
                                log.error("Error deleting teacher with ID: {}", id, e);
                                throw e;
                            }
                        },
                        () -> {
                            log.warn("Teacher with ID: {} not found for deletion", id);
                            throw new EntityNotFoundException("Teacher not found with id: " + id);
                        }
                );
    }

    // --- Availability Management (using DTOs) ---
    @Transactional(readOnly = true)
    public List<TeacherAvailabilityDTO> getTeacherAvailabilities(Long teacherId) {
        log.info("Fetching availabilities for teacher ID: {}", teacherId);
        if (!teacherRepository.existsById(teacherId)) {
            throw new EntityNotFoundException("Teacher not found with ID: " + teacherId);
        }
        return teacherAvailabilityRepository.findByTeacherIdOrderByDayOfWeekAscStartTimeAsc(teacherId)
                .stream()
                .map(this::toAvailabilityDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<TeacherAvailabilityDTO> setTeacherAvailabilities(Long teacherId, List<TeacherAvailabilityDTO> newAvailabilityDTOs) {
        log.info("Setting availabilities for teacher ID: {}. Count: {}", teacherId, newAvailabilityDTOs.size());
        Teacher teacher = teacherRepository.findById(teacherId)
                .orElseThrow(() -> new EntityNotFoundException("Teacher not found with ID: " + teacherId));

        // Validate and convert DTOs to Entities
        List<TeacherAvailability> newAvailabilities = newAvailabilityDTOs.stream()
            .map(dto -> {
                 if (dto.getStartTime() == null || dto.getEndTime() == null || !dto.getEndTime().isAfter(dto.getStartTime())) {
                    throw new IllegalArgumentException("Invalid time slot: End time must be after start time. Slot: " + dto);
                }
                // 重要修复：将ID设为null，避免与已删除记录的ID冲突，从而避免乐观锁异常
                dto.setId(null);
                return toAvailabilityEntity(dto, teacher);
            })
            .collect(Collectors.toList());

        // Efficiently replace existing availabilities
        teacherAvailabilityRepository.deleteByTeacherId(teacherId);
        List<TeacherAvailability> savedAvailabilities = teacherAvailabilityRepository.saveAll(newAvailabilities);

        log.info("Successfully set {} availability slots for teacher ID: {}", savedAvailabilities.size(), teacherId);
        return savedAvailabilities.stream()
                .map(this::toAvailabilityDTO)
                .collect(Collectors.toList());
    }
} 