package com.schedulai.service;

import com.schedulai.domain.Enrollment;
import com.schedulai.domain.Lesson;
import com.schedulai.domain.LessonStatus;
import com.schedulai.domain.Student;
import com.schedulai.domain.TeacherCourse;
import com.schedulai.dto.EnrollmentDTO;
import com.schedulai.repository.EnrollmentRepository;
import com.schedulai.repository.LessonRepository;
import com.schedulai.repository.StudentRepository;
import com.schedulai.repository.TeacherCourseRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EnrollmentService {

    private static final Logger log = LoggerFactory.getLogger(EnrollmentService.class);

    private final EnrollmentRepository enrollmentRepository;
    private final StudentRepository studentRepository;
    private final TeacherCourseRepository teacherCourseRepository;
    private final LessonRepository lessonRepository; // Needed to check before deleting enrollment

    // --- DTO Conversion ---

    private EnrollmentDTO convertToDTO(Enrollment enrollment) {
        if (enrollment == null) return null;

        // Safely access related entities
        Long studentId = null;
        String studentName = "N/A";
        if (enrollment.getStudent() != null) {
            studentId = enrollment.getStudent().getId();
            studentName = enrollment.getStudent().getName();
        }

        Long teacherCourseId = null;
        Long teacherId = null;
        String teacherName = "N/A";
        Long courseId = null;
        String courseName = "N/A";
        if (enrollment.getTeacherCourse() != null) {
            teacherCourseId = enrollment.getTeacherCourse().getId();
            if (enrollment.getTeacherCourse().getTeacher() != null) {
                 teacherId = enrollment.getTeacherCourse().getTeacher().getId();
                 teacherName = enrollment.getTeacherCourse().getTeacher().getName();
            }
             if (enrollment.getTeacherCourse().getCourse() != null) {
                 courseId = enrollment.getTeacherCourse().getCourse().getId();
                 courseName = enrollment.getTeacherCourse().getCourse().getName();
             }
        }

        // Create DTO with all fields
        return new EnrollmentDTO(
            enrollment.getId(),
            studentId,
            studentName,
            teacherCourseId,
            teacherId,
            teacherName,
            courseId,
            courseName,
            enrollment.getHourlyRate()
            // enrollment.getEnrollmentDate() // Add if field exists and needed
        );
    }

    // Note: convertToEntity might not be needed if create/update handles fetching entities directly
    // private Enrollment convertToEntity(EnrollmentDTO dto) { ... }

    // --- Service Methods ---

    @Transactional(readOnly = true)
    public List<EnrollmentDTO> getAllEnrollments() {
        log.info("Fetching all enrollments");
        // Consider JOIN FETCH here for performance
        return enrollmentRepository.findAll().stream() // Use findAll() for now
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<EnrollmentDTO> getEnrollmentById(Long id) {
        log.info("Fetching enrollment by ID: {}", id);
        // Consider JOIN FETCH
        return enrollmentRepository.findById(id) // Use findById() for now
                .map(this::convertToDTO);
    }

    @Transactional(readOnly = true)
    public List<EnrollmentDTO> getEnrollmentsByStudentId(Long studentId) {
        log.info("Fetching enrollments for student ID: {}", studentId);
        // Consider JOIN FETCH
        return enrollmentRepository.findByStudentId(studentId).stream() // Use standard method
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<EnrollmentDTO> getEnrollmentsByTeacherCourseId(Long teacherCourseId) {
        log.info("Fetching enrollments for teacher course ID: {}", teacherCourseId);
        // Consider JOIN FETCH
        return enrollmentRepository.findByTeacherCourseId(teacherCourseId).stream() // Use standard method
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Add method to find by student, teacher, and course (if needed by frontend directly)
    @Transactional(readOnly = true)
    public List<EnrollmentDTO> findEnrollments(Long studentId, Long teacherId, Long courseId) {
        log.info("Finding enrollments for student={}, teacher={}, course={}", studentId, teacherId, courseId);
        // This requires a custom query in EnrollmentRepository 
        // to filter based on nested properties (teacherCourse.teacher.id, teacherCourse.course.id)
        // Example: findByStudentIdAndTeacherCourse_TeacherIdAndTeacherCourse_CourseId
        // For now, fetch all and filter in service (inefficient)
        return enrollmentRepository.findAll().stream()
                .filter(e -> (studentId == null || e.getStudent().getId().equals(studentId)) &&
                             (teacherId == null || e.getTeacherCourse().getTeacher().getId().equals(teacherId)) &&
                             (courseId == null || e.getTeacherCourse().getCourse().getId().equals(courseId)))
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        // TODO: Replace with efficient repository query
    }

    @Transactional
    public EnrollmentDTO createEnrollment(EnrollmentDTO enrollmentDTO) {
        log.info("尝试创建选课记录: 学生ID={}, 教师课程ID={}, 课时费={}",
                 enrollmentDTO.getStudentId(), enrollmentDTO.getTeacherCourseId(), enrollmentDTO.getHourlyRate());

        // 参数验证
        if (enrollmentDTO.getStudentId() == null || enrollmentDTO.getTeacherCourseId() == null) {
            log.error("创建选课失败: 学生ID或教师课程ID为空");
            throw new IllegalArgumentException("创建选课失败: 学生ID和教师课程ID不能为空");
        }
        
        // 查找学生记录
        log.info("查找学生记录，ID: {}", enrollmentDTO.getStudentId());
        Optional<Student> studentOpt = studentRepository.findById(enrollmentDTO.getStudentId());
        if (!studentOpt.isPresent()) {
            log.error("创建选课失败: 找不到学生ID为 {} 的记录", enrollmentDTO.getStudentId());
            throw new EntityNotFoundException("Student not found with ID: " + enrollmentDTO.getStudentId());
        }
        Student student = studentOpt.get();
        log.info("找到学生: {}, 年级: {}", student.getName(), student.getGrade());
        
        // 查找教师课程记录
        log.info("查找教师课程记录，ID: {}", enrollmentDTO.getTeacherCourseId());
        Optional<TeacherCourse> teacherCourseOpt = teacherCourseRepository.findById(enrollmentDTO.getTeacherCourseId());
        if (!teacherCourseOpt.isPresent()) {
            log.error("创建选课失败: 找不到教师课程ID为 {} 的记录", enrollmentDTO.getTeacherCourseId());
            throw new EntityNotFoundException("TeacherCourse assignment not found with ID: " + enrollmentDTO.getTeacherCourseId());
        }
        TeacherCourse teacherCourse = teacherCourseOpt.get();
        log.info("找到教师课程关联: 教师={}, 课程={}", 
                teacherCourse.getTeacher().getName(),
                teacherCourse.getCourse().getName());

        // 检查是否已存在选课记录
        if (enrollmentRepository.existsByStudentIdAndTeacherCourseId(student.getId(), teacherCourse.getId())) {
            log.warn("学生已选择该教师的课程: 学生ID={}, 教师课程ID={}", student.getId(), teacherCourse.getId());
            
            // 尝试查找现有的选课记录并返回，而不是抛出异常
            Optional<Enrollment> existingEnrollment = enrollmentRepository.findByStudentIdAndTeacherCourseId(
                student.getId(), teacherCourse.getId());
            if (existingEnrollment.isPresent()) {
                log.info("返回已存在的选课记录 ID: {}", existingEnrollment.get().getId());
                return convertToDTO(existingEnrollment.get());
            }
            
            // 如果找不到记录但existsByStudentIdAndTeacherCourseId返回true，说明有数据一致性问题
            log.error("数据不一致: existsByStudentIdAndTeacherCourseId返回true但找不到记录");
            throw new IllegalStateException("学生已选择该教师的课程，但找不到记录。");
        }

        // 创建选课记录
        Enrollment enrollment = new Enrollment();
        enrollment.setStudent(student);
        enrollment.setTeacherCourse(teacherCourse);
        
        // 处理课时费
        if (enrollmentDTO.getHourlyRate() == null) {
            log.info("未提供课时费，使用默认值0");
            enrollment.setHourlyRate(BigDecimal.ZERO);
        } else {
            enrollment.setHourlyRate(enrollmentDTO.getHourlyRate());
        }

        try {
            Enrollment savedEnrollment = enrollmentRepository.save(enrollment);
            log.info("成功创建选课记录，ID: {}", savedEnrollment.getId());
            return convertToDTO(savedEnrollment);
        } catch (Exception e) {
            log.error("保存选课记录时发生错误: {}", e.getMessage(), e);
            throw e;
        }
    }

    @Transactional
    public Optional<EnrollmentDTO> updateEnrollment(Long id, EnrollmentDTO enrollmentDTO) {
        log.info("Attempting to update enrollment with ID: {}", id);
        return enrollmentRepository.findById(id)
                .map(existingEnrollment -> {
                    existingEnrollment.setHourlyRate(enrollmentDTO.getHourlyRate());
                    Enrollment updatedEnrollment = enrollmentRepository.save(existingEnrollment);
                    log.info("Successfully updated enrollment with ID: {}", id);
                    return convertToDTO(updatedEnrollment);
                })
                .or(() -> {
                    log.warn("Enrollment not found for update with ID: {}", id);
                    return Optional.empty();
                });
    }

    @Transactional
    public void deleteEnrollment(Long id) {
        log.info("Attempting to delete enrollment with ID: {}", id);
        if (!enrollmentRepository.existsById(id)) {
            log.warn("Enrollment not found for deletion with ID: {}", id);
            throw new RuntimeException("Enrollment not found with id: " + id);
        }

        // Check if there are any non-cancelled lessons associated with this enrollment
        List<Lesson> associatedLessons = lessonRepository.findByEnrollmentId(id);
        boolean hasActiveLessons = associatedLessons.stream()
                .anyMatch(lesson -> lesson.getStatus() != LessonStatus.CANCELLED_BY_STUDENT &&
                                   lesson.getStatus() != LessonStatus.CANCELLED_BY_TEACHER);

        if (hasActiveLessons) {
            log.warn("Cannot delete enrollment with ID {} because it has active or completed lessons.", id);
            throw new IllegalStateException("Cannot delete enrollment: There are active or completed lessons associated with it.");
        }

        // If only cancelled lessons exist, we might allow deletion, or force deletion of lessons first.
        // For now, assume we can delete if no active/completed lessons.
        // We might need to delete the lessons explicitly if cascade isn't set up that way (it is from Enrollment -> Lesson currently).
        enrollmentRepository.deleteById(id);
        log.info("Successfully deleted enrollment with ID: {}", id);
    }
} 