package com.schedulai.repository;

import com.schedulai.domain.StudentAvailability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.DayOfWeek;
import java.util.List;

@Repository
public interface StudentAvailabilityRepository extends JpaRepository<StudentAvailability, Long> {

    // Find availability slots for a specific student
    List<StudentAvailability> findByStudentId(Long studentId);

    // Find availability for a specific student, ordered for consistency
    List<StudentAvailability> findByStudentIdOrderByDayOfWeekAscStartTimeAsc(Long studentId);

    // Find availability for a specific student on a specific day
    List<StudentAvailability> findByStudentIdAndDayOfWeek(Long studentId, DayOfWeek dayOfWeek);

    // Find availability for a specific student, optionally filtering by availability status
    List<StudentAvailability> findByStudentIdAndIsAvailable(Long studentId, boolean isAvailable);

    // Delete all availability slots for a specific student (useful when updating)
    void deleteByStudentId(Long studentId);
} 