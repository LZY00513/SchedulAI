package com.schedulai.service;

import com.schedulai.domain.Student;
import com.schedulai.domain.StudentAvailability;
import com.schedulai.dto.StudentAvailabilityDTO;
import com.schedulai.dto.StudentDTO;
import com.schedulai.repository.EnrollmentRepository;
import com.schedulai.repository.StudentAvailabilityRepository;
import com.schedulai.repository.StudentRepository;
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
public class StudentService {

    private static final Logger log = LoggerFactory.getLogger(StudentService.class);

    private final StudentRepository studentRepository;
    private final StudentAvailabilityRepository studentAvailabilityRepository;
    private final EnrollmentRepository enrollmentRepository;

    @Autowired
    public StudentService(StudentRepository studentRepository, 
                          StudentAvailabilityRepository studentAvailabilityRepository,
                          EnrollmentRepository enrollmentRepository) {
        this.studentRepository = studentRepository;
        this.studentAvailabilityRepository = studentAvailabilityRepository;
        this.enrollmentRepository = enrollmentRepository;
    }

    // --- Conversion Helpers ---
    private StudentAvailabilityDTO toAvailabilityDTO(StudentAvailability availability) {
        if (availability == null) return null;
        return new StudentAvailabilityDTO(
            availability.getId(),
            availability.getDayOfWeek(),
            availability.getStartTime(),
            availability.getEndTime(),
            availability.getIsAvailable()
        );
    }

    private StudentAvailability toAvailabilityEntity(StudentAvailabilityDTO dto, Student student) {
        if (dto == null) return null;
        StudentAvailability entity = new StudentAvailability();
        entity.setId(dto.getId()); // Keep ID for potential updates
        entity.setStudent(student); // Link back to student
        entity.setDayOfWeek(dto.getDayOfWeek());
        entity.setStartTime(dto.getStartTime());
        entity.setEndTime(dto.getEndTime());
        entity.setIsAvailable(dto.getIsAvailable() != null ? dto.getIsAvailable() : true);
        return entity;
    }

    private StudentDTO toDTO(Student student) {
        if (student == null) return null;
        // Availability is usually fetched on demand, not in list view
        // List<StudentAvailabilityDTO> availabilityDTOs = fetchAndConvertToAvailabilityDTOs(student);

        return new StudentDTO(
            student.getId(),
            student.getName(),
            student.getGender(),      // Map new field
            student.getAge(),         // Map new field
            student.getGrade(),       // Map new field
            student.getPhone(),       // Map new field
            student.getParent(),      // Map new field
            student.getParentPhone(), // Map new field
            student.getEnrollmentDate(), // Map new field
            student.getStatus()       // Map new field
            // student.getHourlyRate(), // Removed hourlyRate
            // availabilityDTOs // Removed availabilities from main DTO
        );
    }

    // Helper method to convert DTO to Entity
    private Student toEntity(StudentDTO dto) {
        if (dto == null) return null;
        Student student = new Student();
        // ID is usually not set from DTO for creation, but needed for updates.
        // We handle ID setting in the update method itself.
        // student.setId(dto.getId());
        student.setName(dto.getName());
        student.setGender(dto.getGender());
        student.setAge(dto.getAge());
        student.setGrade(dto.getGrade());
        student.setPhone(dto.getPhone());
        student.setParent(dto.getParent());
        student.setParentPhone(dto.getParentPhone());
        student.setEnrollmentDate(dto.getEnrollmentDate());
        student.setStatus(dto.getStatus());
        // Availabilities and Enrollments are handled via separate endpoints
        return student;
    }

    // --- Service Methods (Returning DTOs) ---
    @Transactional(readOnly = true)
    public List<StudentDTO> getAllStudents() {
        log.info("Fetching all students");
        return studentRepository.findAll()
                .stream()
                .map(this::toDTO) // Convert each student to DTO
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<StudentDTO> getStudentById(Long id) {
        log.info("Fetching student by ID: {}", id);
        return studentRepository.findById(id).map(this::toDTO);
    }

    // Create/Update methods now use DTOs
    @Transactional
    public StudentDTO createStudent(StudentDTO studentDTO) {
        log.info("Attempting to create student from DTO: {}", studentDTO);
        Student student = toEntity(studentDTO);
        student.setId(null); // Ensure ID is null for creation
        // Explicitly clear potentially problematic collections from DTO conversion (if any were added)
        if (student.getAvailabilities() != null) student.getAvailabilities().clear();
        if (student.getEnrollments() != null) student.getEnrollments().clear();

        try {
            Student savedStudent = studentRepository.save(student);
            log.info("Successfully created student with ID: {}", savedStudent.getId());
            return toDTO(savedStudent); // Return DTO
        } catch (Exception e) {
            log.error("Error creating student from DTO: {}", studentDTO, e);
            throw e; // Re-throw for controller advice to handle
        }
    }

    @Transactional
    public Optional<StudentDTO> updateStudent(Long id, StudentDTO studentDTO) {
        log.info("Attempting to update student with ID: {}, from DTO: {}", id, studentDTO);
        return studentRepository.findById(id)
                .map(existingStudent -> {
                    // Update fields from DTO
                    existingStudent.setName(studentDTO.getName());
                    existingStudent.setGender(studentDTO.getGender());
                    existingStudent.setAge(studentDTO.getAge());
                    existingStudent.setGrade(studentDTO.getGrade());
                    existingStudent.setPhone(studentDTO.getPhone());
                    existingStudent.setParent(studentDTO.getParent());
                    existingStudent.setParentPhone(studentDTO.getParentPhone());
                    existingStudent.setEnrollmentDate(studentDTO.getEnrollmentDate());
                    existingStudent.setStatus(studentDTO.getStatus());
                    // Availabilities and Enrollments managed separately

                    Student updatedStudent = studentRepository.save(existingStudent);
                    log.info("Successfully updated student with ID: {}", updatedStudent.getId());
                    return toDTO(updatedStudent); // Return updated DTO
                })
                 .or(() -> {
                    log.warn("Student not found for update with ID: {}", id);
                    return Optional.empty();
                });
    }

    @Transactional
    public boolean deleteStudent(Long id) {
        log.info("Attempting to delete student with ID: {}", id);
        if (!studentRepository.existsById(id)) {
            log.warn("Student not found for deletion with ID: {}", id);
            return false;
        }
        // Check for existing enrollments
        if (!enrollmentRepository.findByStudentId(id).isEmpty()) {
             log.warn("Cannot delete student with ID {} because they have existing enrollments.", id);
             throw new IllegalStateException("Cannot delete student: Student has active or past course enrollments.");
        }
        // Availabilities will be cascade deleted due to orphanRemoval=true
        studentRepository.deleteById(id);
        log.info("Successfully deleted student with ID: {}", id);
        return true;
    }

    // --- Student Availability Management ---
    @Transactional(readOnly = true)
    public List<StudentAvailabilityDTO> getStudentAvailabilities(Long studentId) {
        log.info("Fetching availabilities for student ID: {}", studentId);
        if (!studentRepository.existsById(studentId)) {
            throw new EntityNotFoundException("Student not found with ID: " + studentId);
        }
        return studentAvailabilityRepository.findByStudentId(studentId)
                .stream()
                .map(this::toAvailabilityDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<StudentAvailabilityDTO> setStudentAvailabilities(Long studentId, List<StudentAvailabilityDTO> newAvailabilityDTOs) {
        log.info("Setting availabilities for student ID: {}. Count: {}", studentId, newAvailabilityDTOs.size());
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new EntityNotFoundException("Student not found with ID: " + studentId));

        // Validate and convert DTOs to Entities
        List<StudentAvailability> newAvailabilities = newAvailabilityDTOs.stream()
                .map(dto -> {
                    if (dto.getStartTime() == null || dto.getEndTime() == null || !dto.getEndTime().isAfter(dto.getStartTime())) {
                        throw new IllegalArgumentException("Invalid time slot: End time must be after start time. Slot: " + dto);
                    }
                    // 重要修复：将ID设为null，避免与已删除记录的ID冲突，从而避免乐观锁异常
                    dto.setId(null);
                    // Convert DTO to entity, linked to the student
                    return toAvailabilityEntity(dto, student);
                })
                .collect(Collectors.toList());

        // Replace existing availabilities efficiently
        studentAvailabilityRepository.deleteByStudentId(studentId); // Delete old ones
        List<StudentAvailability> savedAvailabilities = studentAvailabilityRepository.saveAll(newAvailabilities); // Save new ones

        log.info("Successfully set {} availability slots for student ID: {}", savedAvailabilities.size(), studentId);
        return savedAvailabilities.stream()
                .map(this::toAvailabilityDTO)
                .collect(Collectors.toList()); // Return DTOs
    }
} 