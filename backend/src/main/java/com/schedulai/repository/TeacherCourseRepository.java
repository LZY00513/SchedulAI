package com.schedulai.repository;

import com.schedulai.domain.Course;
import com.schedulai.domain.Teacher;
import com.schedulai.domain.TeacherCourse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeacherCourseRepository extends JpaRepository<TeacherCourse, Long> {

    // Find the specific TeacherCourse entry for a given teacher and course
    Optional<TeacherCourse> findByTeacherAndCourse(Teacher teacher, Course course);
    Optional<TeacherCourse> findByTeacherIdAndCourseId(Long teacherId, Long courseId);

    // Find all courses taught by a specific teacher
    List<TeacherCourse> findByTeacherId(Long teacherId);

    // Find all teachers teaching a specific course
    List<TeacherCourse> findByCourseId(Long courseId);

    // Check if a specific teacher teaches a specific course
    boolean existsByTeacherIdAndCourseId(Long teacherId, Long courseId);
} 