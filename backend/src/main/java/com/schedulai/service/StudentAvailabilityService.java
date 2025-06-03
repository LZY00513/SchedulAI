package com.schedulai.service;

import com.schedulai.domain.Student;
import com.schedulai.domain.StudentAvailability;
import com.schedulai.repository.StudentAvailabilityRepository;
import com.schedulai.repository.StudentRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StudentAvailabilityService {

    private static final Logger log = LoggerFactory.getLogger(StudentAvailabilityService.class);

    private final StudentAvailabilityRepository studentAvailabilityRepository;
    private final StudentRepository studentRepository; // To verify student exists

    /**
     * Retrieves all availability slots for a specific student.
     * @param studentId The ID of the student.
     * @return A list of StudentAvailability slots.
     */
    @Transactional(readOnly = true)
    public List<StudentAvailability> getAvailabilityForStudent(Long studentId) {
        log.info("Fetching availability for student ID: {}", studentId);
        // Optional: Check if student exists first
        // if (!studentRepository.existsById(studentId)) {
        //     throw new EntityNotFoundException("Student not found with ID: " + studentId);
        // }
        return studentAvailabilityRepository.findByStudentIdOrderByDayOfWeekAscStartTimeAsc(studentId);
    }

    /**
     * Adds a new availability slot for a student.
     * @param studentId The ID of the student.
     * @param availability The StudentAvailability object to add.
     * @return The saved StudentAvailability object.
     */
    @Transactional
    public StudentAvailability addAvailability(Long studentId, StudentAvailability availability) {
        log.info("Adding availability for student ID: {}: {}", studentId, availability);
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new EntityNotFoundException("Student not found with ID: " + studentId));
        
        // Basic validation
        if (availability.getStartTime() == null || availability.getEndTime() == null || availability.getDayOfWeek() == null) {
             throw new IllegalArgumentException("DayOfWeek, StartTime, and EndTime cannot be null.");
        }
        if (!availability.getStartTime().isBefore(availability.getEndTime())) {
            throw new IllegalArgumentException("Start time must be before end time.");
        }

        availability.setStudent(student);
        availability.setId(null); // Ensure it's a new entity
        return studentAvailabilityRepository.save(availability);
    }

    /**
     * Updates an existing availability slot.
     * @param availabilityId The ID of the availability slot to update.
     * @param updatedAvailability The StudentAvailability object with updated data.
     * @return The updated StudentAvailability object.
     */
    @Transactional
    public StudentAvailability updateAvailability(Long availabilityId, StudentAvailability updatedAvailability) {
        log.info("Updating availability ID: {}: {}", availabilityId, updatedAvailability);
        StudentAvailability existingAvailability = studentAvailabilityRepository.findById(availabilityId)
                .orElseThrow(() -> new EntityNotFoundException("StudentAvailability not found with ID: " + availabilityId));

        // Basic validation for updated data
         if (updatedAvailability.getStartTime() == null || updatedAvailability.getEndTime() == null || updatedAvailability.getDayOfWeek() == null) {
             throw new IllegalArgumentException("DayOfWeek, StartTime, and EndTime cannot be null.");
        }
        if (!updatedAvailability.getStartTime().isBefore(updatedAvailability.getEndTime())) {
            throw new IllegalArgumentException("Start time must be before end time.");
        }

        // Update fields - assuming student cannot be changed via this method
        existingAvailability.setDayOfWeek(updatedAvailability.getDayOfWeek());
        existingAvailability.setStartTime(updatedAvailability.getStartTime());
        existingAvailability.setEndTime(updatedAvailability.getEndTime());
        existingAvailability.setIsAvailable(updatedAvailability.getIsAvailable()); // Allow updating isAvailable flag

        return studentAvailabilityRepository.save(existingAvailability);
    }

    /**
     * Deletes an availability slot.
     * @param availabilityId The ID of the availability slot to delete.
     */
    @Transactional
    public void deleteAvailability(Long availabilityId) {
        log.info("Deleting availability ID: {}", availabilityId);
        if (!studentAvailabilityRepository.existsById(availabilityId)) {
            throw new EntityNotFoundException("StudentAvailability not found with ID: " + availabilityId);
        }
        studentAvailabilityRepository.deleteById(availabilityId);
    }

    /**
     * Replaces all existing availability slots for a student with a new list.
     * @param studentId The ID of the student.
     * @param newAvailabilities The new list of StudentAvailability slots.
     * @return The list of newly saved StudentAvailability slots.
     */
    @Transactional
    public List<StudentAvailability> batchUpdateAvailability(Long studentId, List<StudentAvailability> newAvailabilities) {
        log.info("Batch updating availability for student ID: {}. Replacing with {} new slots.", studentId, newAvailabilities.size());
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new EntityNotFoundException("Student not found with ID: " + studentId));

        // Delete existing availability for this student
        studentAvailabilityRepository.deleteByStudentId(studentId);
        log.debug("Deleted existing availability for student ID: {}", studentId);

        // Validate and save new availabilities
        for (StudentAvailability availability : newAvailabilities) {
            if (availability.getStartTime() == null || availability.getEndTime() == null || availability.getDayOfWeek() == null) {
                 throw new IllegalArgumentException("DayOfWeek, StartTime, and EndTime cannot be null for all slots.");
            }
            if (!availability.getStartTime().isBefore(availability.getEndTime())) {
                throw new IllegalArgumentException("Start time must be before end time for all slots.");
            }
            availability.setStudent(student);
            availability.setId(null); // Ensure they are treated as new entities
        }

        List<StudentAvailability> savedAvailabilities = studentAvailabilityRepository.saveAll(newAvailabilities);
        log.info("Successfully saved {} new availability slots for student ID: {}", savedAvailabilities.size(), studentId);
        return savedAvailabilities;
    }
} 