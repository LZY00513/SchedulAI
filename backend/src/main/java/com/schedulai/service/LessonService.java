package com.schedulai.service;

import com.schedulai.domain.Enrollment;
import com.schedulai.domain.Lesson;
import com.schedulai.domain.LessonStatus;
import com.schedulai.dto.LessonDTO;
import com.schedulai.repository.EnrollmentRepository;
import com.schedulai.repository.LessonRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LessonService {

    private static final Logger log = LoggerFactory.getLogger(LessonService.class);
    private final LessonRepository lessonRepository;
    private final EnrollmentRepository enrollmentRepository;

    // --- DTO Conversion ---

    private LessonDTO convertToDTO(Lesson lesson) {
        if (lesson == null) return null; 
        Enrollment enrollment = lesson.getEnrollment(); 
        if (enrollment == null) {
             log.warn("Lesson {} has null enrollment!", lesson.getId());
             return null; 
        }
        
        // Traditional null checks
        Long studentId = null;
        String studentName = "N/A";
        if (enrollment.getStudent() != null) {
            studentId = enrollment.getStudent().getId();
            studentName = enrollment.getStudent().getName();
        }

        Long teacherId = null;
        String teacherName = "N/A";
        Long courseId = null;
        String courseName = "N/A";
        if (enrollment.getTeacherCourse() != null) {
            if (enrollment.getTeacherCourse().getTeacher() != null) {
                 teacherId = enrollment.getTeacherCourse().getTeacher().getId();
                 teacherName = enrollment.getTeacherCourse().getTeacher().getName();
            }
             if (enrollment.getTeacherCourse().getCourse() != null) {
                 courseId = enrollment.getTeacherCourse().getCourse().getId();
                 courseName = enrollment.getTeacherCourse().getCourse().getName();
             }
        }

        return new LessonDTO(
            lesson.getId(),
            enrollment.getId(),
            lesson.getStartDateTime(),
            lesson.getEndDateTime(),
            lesson.getStatus(),
            lesson.getLocation(), // Add location
            lesson.getNotes(),    // Add notes
            studentId,            // Add studentId
            studentName,          // Add studentName
            teacherId,            // Add teacherId
            teacherName,          // Add teacherName
            courseId,             // Add courseId
            courseName            // Add courseName
        );
    }

    // --- Service Methods ---

    @Transactional(readOnly = true)
    public List<LessonDTO> getAllLessons() {
        log.info("Fetching all lessons");
        // Use standard findAll() - N+1 potential!
        return lessonRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<LessonDTO> getLessonById(Long id) {
        log.info("Fetching lesson by ID: {}", id);
        // Use standard findById() - N+1 potential!
        return lessonRepository.findById(id)
                .map(this::convertToDTO);
    }

    @Transactional(readOnly = true)
    public List<LessonDTO> getLessonsByEnrollmentId(Long enrollmentId) {
        log.info("Fetching lessons for enrollment ID: {}", enrollmentId);
        // Use standard findByEnrollmentId() - N+1 potential!
        return lessonRepository.findByEnrollmentId(enrollmentId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LessonDTO> getLessonsByStudentId(Long studentId) {
        log.info("Fetching lessons for student ID: {}", studentId);
        return lessonRepository.findByEnrollment_StudentId(studentId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public LessonDTO createLesson(LessonDTO lessonDTO) {
        log.info("Attempting to create lesson for enrollment ID: {} from {} to {}",
                lessonDTO.getEnrollmentId(), lessonDTO.getStartDateTime(), lessonDTO.getEndDateTime());

        Enrollment enrollment = enrollmentRepository.findById(lessonDTO.getEnrollmentId())
                .orElseThrow(() -> new EntityNotFoundException("Enrollment not found with ID: " + lessonDTO.getEnrollmentId()));

        // Validate date/time
        validateLessonTimes(lessonDTO.getStartDateTime(), lessonDTO.getEndDateTime());

        // Check for conflicts
        checkConflicts(enrollment.getStudent().getId(), enrollment.getTeacherCourse().getTeacher().getId(), 
                       lessonDTO.getStartDateTime(), lessonDTO.getEndDateTime(), null);

        Lesson lesson = new Lesson();
        lesson.setEnrollment(enrollment);
        lesson.setStartDateTime(lessonDTO.getStartDateTime());
        lesson.setEndDateTime(lessonDTO.getEndDateTime());
        lesson.setStatus(lessonDTO.getStatus() != null ? lessonDTO.getStatus() : LessonStatus.SCHEDULED);
        lesson.setLocation(lessonDTO.getLocation()); // Set location
        lesson.setNotes(lessonDTO.getNotes());       // Set notes

        Lesson savedLesson = lessonRepository.save(lesson);
        log.info("Successfully created lesson with ID: {}", savedLesson.getId());
        return convertToDTO(savedLesson);
    }

    @Transactional
    public Optional<LessonDTO> updateLesson(Long id, LessonDTO lessonDTO) {
        log.info("Attempting to update lesson with ID: {}", id);
        return lessonRepository.findById(id)
                .map(existingLesson -> {
                    // Validate date/time
                    validateLessonTimes(lessonDTO.getStartDateTime(), lessonDTO.getEndDateTime());

                    // Check for conflicts (excluding self)
                    checkConflicts(existingLesson.getEnrollment().getStudent().getId(), 
                                   existingLesson.getEnrollment().getTeacherCourse().getTeacher().getId(),
                                   lessonDTO.getStartDateTime(), lessonDTO.getEndDateTime(), id);

                    // Update fields
                    existingLesson.setStartDateTime(lessonDTO.getStartDateTime());
                    existingLesson.setEndDateTime(lessonDTO.getEndDateTime());
                    if (lessonDTO.getStatus() != null) {
                        existingLesson.setStatus(lessonDTO.getStatus());
                    }
                    existingLesson.setLocation(lessonDTO.getLocation()); // Update location
                    existingLesson.setNotes(lessonDTO.getNotes());       // Update notes
                    // Cannot change enrollment via this method

                    Lesson updatedLesson = lessonRepository.save(existingLesson);
                    log.info("Successfully updated lesson with ID: {}", id);
                    return convertToDTO(updatedLesson);
                });
    }

    // Add method to update status specifically
    @Transactional
    public Optional<LessonDTO> updateLessonStatus(Long id, LessonStatus status) {
         log.info("Attempting to update status for lesson ID: {} to {}", id, status);
          if (status == null) {
            throw new IllegalArgumentException("Status cannot be null.");
        }
         return lessonRepository.findById(id)
                .map(lesson -> {
                    lesson.setStatus(status);
                    Lesson updatedLesson = lessonRepository.save(lesson);
                    log.info("Successfully updated status for lesson ID: {} to {}", id, status);
                    return convertToDTO(updatedLesson);
                })
                 .or(() -> {
                    log.warn("Lesson not found for status update with ID: {}", id);
                    return Optional.empty();
                });
    }

    @Transactional
    public void deleteLesson(Long id) {
        log.info("Attempting to delete lesson with ID: {}", id);
        if (!lessonRepository.existsById(id)) {
            throw new EntityNotFoundException("Lesson not found with id: " + id);
        }
        lessonRepository.deleteById(id);
        log.info("Successfully deleted lesson with ID: {}", id);
    }

    // --- Helper Methods ---

    private void validateLessonTimes(LocalDateTime start, LocalDateTime end) {
        if (start == null || end == null || start.isAfter(end) || start.isEqual(end)) {
             log.warn("Invalid lesson times provided: start={}, end={}", start, end);
            throw new IllegalArgumentException("Invalid lesson start/end times. Start must be before End.");
        }
    }

    private void checkConflicts(Long studentId, Long teacherId, LocalDateTime start, LocalDateTime end, Long excludeLessonId) {
         List<Lesson> conflicts = findConflictingLessons(studentId, teacherId, start, end, excludeLessonId);
        if (!conflicts.isEmpty()) {
            log.warn("Conflict detected for student {} or teacher {} between {} and {}. Excluding lesson {}. Conflicts: {}", 
                     studentId, teacherId, start, end, excludeLessonId, conflicts.stream().map(Lesson::getId).collect(Collectors.toList()));
            throw new IllegalStateException("Lesson time conflicts with an existing lesson.");
        }
    }

    // Internal method for conflict detection - remains working with entities
    @Transactional(readOnly = true)
    public List<Lesson> findConflictingLessons(Long studentId, Long teacherId, LocalDateTime start, LocalDateTime end, Long excludeLessonId) {
        log.debug("Checking for conflicts for student {}, teacher {}, between {} and {}, excluding lesson {}",
                studentId, teacherId, start, end, excludeLessonId);

        if (start == null || end == null || start.isAfter(end)) {
            log.warn("Invalid time range for conflict check: start={}, end={}", start, end);
            throw new IllegalArgumentException("Start time must be before end time for conflict check.");
        }

        List<Lesson> potentialConflicts = lessonRepository.findOverlappingLessonsForStudentOrTeacher(
                studentId,
                teacherId,
                start,
                end,
                excludeLessonId // Pass excludeLessonId to the repository method
        );

        log.debug("Found {} potential conflicts for student {}, teacher {} between {} and {}. Excluding {}",
                potentialConflicts.size(), studentId, teacherId, start, end, excludeLessonId);
        return potentialConflicts;
    }
} 