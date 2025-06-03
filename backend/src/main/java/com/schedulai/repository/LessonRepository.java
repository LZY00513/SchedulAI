package com.schedulai.repository;

import com.schedulai.domain.Lesson;
import com.schedulai.domain.LessonStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, Long> {

    // --- Basic Finders ---
    List<Lesson> findByEnrollmentId(Long enrollmentId);
    List<Lesson> findByEnrollment_StudentId(Long studentId);
    List<Lesson> findByEnrollment_TeacherCourse_TeacherId(Long teacherId);
    List<Lesson> findByEnrollment_TeacherCourse_CourseId(Long courseId);
    List<Lesson> findByStatus(LessonStatus status);
    List<Lesson> findByStartDateTimeBetween(LocalDateTime start, LocalDateTime end);

    // --- Finders with Time Range and Ordering ---
    List<Lesson> findByEnrollment_StudentIdAndStartDateTimeBetweenOrderByStartDateTimeAsc(
            Long studentId,
            LocalDateTime startDateTime,
            LocalDateTime endDateTime
    );
    List<Lesson> findByEnrollment_TeacherCourse_TeacherIdAndStartDateTimeBetweenOrderByStartDateTimeAsc(
        Long teacherId, 
        LocalDateTime start, 
        LocalDateTime end
    );

    // --- Conflict Detection --- 
    @Query("SELECT l FROM Lesson l WHERE " +
           "(l.enrollment.student.id = :studentId OR l.enrollment.teacherCourse.teacher.id = :teacherId) AND " +
           "(:excludeLessonId IS NULL OR l.id <> :excludeLessonId) AND " +
           "l.status <> com.schedulai.domain.LessonStatus.CANCELLED_BY_STUDENT AND " +
           "l.status <> com.schedulai.domain.LessonStatus.CANCELLED_BY_TEACHER AND " +
           "(l.startDateTime < :endDateTime) AND (l.endDateTime > :startDateTime)")
    List<Lesson> findOverlappingLessonsForStudentOrTeacher(
            @Param("studentId") Long studentId,
            @Param("teacherId") Long teacherId,
            @Param("startDateTime") LocalDateTime startDateTime,
            @Param("endDateTime") LocalDateTime endDateTime,
            @Param("excludeLessonId") Long excludeLessonId
    );

    // --- Finders with Eager Fetching (for Service Layer) ---
    @Query("SELECT l FROM Lesson l JOIN FETCH l.enrollment e JOIN FETCH e.student JOIN FETCH e.teacherCourse tc JOIN FETCH tc.teacher JOIN FETCH tc.course")
    List<Lesson> findAllWithEnrollmentDetails();

    @Query("SELECT l FROM Lesson l JOIN FETCH l.enrollment e JOIN FETCH e.student JOIN FETCH e.teacherCourse tc JOIN FETCH tc.teacher JOIN FETCH tc.course WHERE l.id = :id")
    Optional<Lesson> findByIdWithEnrollmentDetails(@Param("id") Long id);

    @Query("SELECT l FROM Lesson l JOIN FETCH l.enrollment e JOIN FETCH e.student JOIN FETCH e.teacherCourse tc JOIN FETCH tc.teacher JOIN FETCH tc.course WHERE e.id = :enrollmentId")
    List<Lesson> findByEnrollmentIdWithEnrollmentDetails(@Param("enrollmentId") Long enrollmentId);

    // 添加按时间范围查询所有课程的方法
    List<Lesson> findByStartDateTimeBetweenOrderByStartDateTimeAsc(LocalDateTime start, LocalDateTime end);
} 