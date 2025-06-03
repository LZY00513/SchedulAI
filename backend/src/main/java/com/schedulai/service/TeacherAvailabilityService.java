package com.schedulai.service;

import com.schedulai.domain.Teacher;
import com.schedulai.domain.TeacherAvailability;
import com.schedulai.repository.TeacherAvailabilityRepository;
import com.schedulai.repository.TeacherRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TeacherAvailabilityService {

    private static final Logger log = LoggerFactory.getLogger(TeacherAvailabilityService.class);

    private final TeacherAvailabilityRepository teacherAvailabilityRepository;
    private final TeacherRepository teacherRepository; // To verify teacher exists

    /**
     * Retrieves all availability slots for a specific teacher.
     * @param teacherId The ID of the teacher.
     * @return A list of TeacherAvailability slots.
     */
    @Transactional(readOnly = true)
    public List<TeacherAvailability> getAvailabilityForTeacher(Long teacherId) {
        log.info("Fetching availability for teacher ID: {}", teacherId);
        // Optional: Check if teacher exists first
        // if (!teacherRepository.existsById(teacherId)) {
        //     throw new EntityNotFoundException("Teacher not found with ID: " + teacherId);
        // }
        return teacherAvailabilityRepository.findByTeacherIdOrderByDayOfWeekAscStartTimeAsc(teacherId);
    }

    /**
     * Adds a new availability slot for a teacher.
     * @param teacherId The ID of the teacher.
     * @param availability The TeacherAvailability object to add.
     * @return The saved TeacherAvailability object.
     */
    @Transactional
    public TeacherAvailability addAvailability(Long teacherId, TeacherAvailability availability) {
        log.info("Adding availability for teacher ID: {}: {}", teacherId, availability);
        Teacher teacher = teacherRepository.findById(teacherId)
                .orElseThrow(() -> new EntityNotFoundException("Teacher not found with ID: " + teacherId));
        
        // Basic validation
        if (availability.getStartTime() == null || availability.getEndTime() == null || availability.getDayOfWeek() == null) {
             throw new IllegalArgumentException("DayOfWeek, StartTime, and EndTime cannot be null.");
        }
        if (!availability.getStartTime().isBefore(availability.getEndTime())) {
            throw new IllegalArgumentException("Start time must be before end time.");
        }

        availability.setTeacher(teacher);
        availability.setId(null); // Ensure it's a new entity
        return teacherAvailabilityRepository.save(availability);
    }

    /**
     * Updates an existing availability slot.
     * @param availabilityId The ID of the availability slot to update.
     * @param updatedAvailability The TeacherAvailability object with updated data.
     * @return The updated TeacherAvailability object.
     */
    @Transactional
    public TeacherAvailability updateAvailability(Long availabilityId, TeacherAvailability updatedAvailability) {
        log.info("Updating availability ID: {}: {}", availabilityId, updatedAvailability);
        TeacherAvailability existingAvailability = teacherAvailabilityRepository.findById(availabilityId)
                .orElseThrow(() -> new EntityNotFoundException("TeacherAvailability not found with ID: " + availabilityId));

        // Basic validation for updated data
         if (updatedAvailability.getStartTime() == null || updatedAvailability.getEndTime() == null || updatedAvailability.getDayOfWeek() == null) {
             throw new IllegalArgumentException("DayOfWeek, StartTime, and EndTime cannot be null.");
        }
        if (!updatedAvailability.getStartTime().isBefore(updatedAvailability.getEndTime())) {
            throw new IllegalArgumentException("Start time must be before end time.");
        }

        // Update fields - assuming teacher cannot be changed via this method
        existingAvailability.setDayOfWeek(updatedAvailability.getDayOfWeek());
        existingAvailability.setStartTime(updatedAvailability.getStartTime());
        existingAvailability.setEndTime(updatedAvailability.getEndTime());
        existingAvailability.setIsAvailable(updatedAvailability.getIsAvailable()); // Allow updating isAvailable flag

        return teacherAvailabilityRepository.save(existingAvailability);
    }

    /**
     * Deletes an availability slot.
     * @param availabilityId The ID of the availability slot to delete.
     */
    @Transactional
    public void deleteAvailability(Long availabilityId) {
        log.info("Deleting availability ID: {}", availabilityId);
        if (!teacherAvailabilityRepository.existsById(availabilityId)) {
            throw new EntityNotFoundException("TeacherAvailability not found with ID: " + availabilityId);
        }
        teacherAvailabilityRepository.deleteById(availabilityId);
    }

    /**
     * Replaces all existing availability slots for a teacher with a new list.
     * Useful for UIs where the user sets the entire weekly schedule at once.
     * @param teacherId The ID of the teacher.
     * @param newAvailabilities The new list of TeacherAvailability slots.
     * @return The list of newly saved TeacherAvailability slots.
     */
    @Transactional
    public List<TeacherAvailability> batchUpdateAvailability(Long teacherId, List<TeacherAvailability> newAvailabilities) {
        log.info("Batch updating availability for teacher ID: {}. Replacing with {} new slots.", teacherId, newAvailabilities.size());
        Teacher teacher = teacherRepository.findById(teacherId)
                .orElseThrow(() -> new EntityNotFoundException("Teacher not found with ID: " + teacherId));

        // Delete existing availability for this teacher
        teacherAvailabilityRepository.deleteByTeacherId(teacherId);
        log.debug("Deleted existing availability for teacher ID: {}", teacherId);

        // Validate and save new availabilities
        for (TeacherAvailability availability : newAvailabilities) {
            if (availability.getStartTime() == null || availability.getEndTime() == null || availability.getDayOfWeek() == null) {
                 throw new IllegalArgumentException("DayOfWeek, StartTime, and EndTime cannot be null for all slots.");
            }
            if (!availability.getStartTime().isBefore(availability.getEndTime())) {
                throw new IllegalArgumentException("Start time must be before end time for all slots.");
            }
            availability.setTeacher(teacher);
            availability.setId(null); // Ensure they are treated as new entities
        }

        List<TeacherAvailability> savedAvailabilities = teacherAvailabilityRepository.saveAll(newAvailabilities);
        log.info("Successfully saved {} new availability slots for teacher ID: {}", savedAvailabilities.size(), teacherId);
        return savedAvailabilities;
    }
} 