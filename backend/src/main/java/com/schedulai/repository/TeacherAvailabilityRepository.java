package com.schedulai.repository;

import com.schedulai.domain.TeacherAvailability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface TeacherAvailabilityRepository extends JpaRepository<TeacherAvailability, Long> {

    // Find availability by teacher, ordered for consistency
    List<TeacherAvailability> findByTeacherIdOrderByDayOfWeekAscStartTimeAsc(Long teacherId);

    // Find specific time slots (e.g., for conflict checking, though less common for general availability)
    List<TeacherAvailability> findByTeacherIdAndDayOfWeek(Long teacherId, DayOfWeek dayOfWeek);
    List<TeacherAvailability> findByTeacherIdAndDayOfWeekAndStartTimeBetween(Long teacherId, DayOfWeek dayOfWeek, LocalTime start, LocalTime end);

    // Delete all availability for a specific teacher (used for batch updates)
    void deleteByTeacherId(Long teacherId);
} 