package com.schedulai.repository;

import com.schedulai.domain.Enrollment;
import com.schedulai.domain.Student;
import com.schedulai.domain.TeacherCourse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {

    // Find a specific enrollment by student and teacherCourse
    Optional<Enrollment> findByStudentAndTeacherCourse(Student student, TeacherCourse teacherCourse);
    Optional<Enrollment> findByStudentIdAndTeacherCourseId(Long studentId, Long teacherCourseId);

    // Find all enrollments for a specific student
    List<Enrollment> findByStudentId(Long studentId);

    // Find all enrollments for a specific teacher's course offering
    List<Enrollment> findByTeacherCourseId(Long teacherCourseId);

    // Find all enrollments for a specific teacher (might involve joins in service layer or custom query)
    // List<Enrollment> findByTeacherCourse_TeacherId(Long teacherId); // Example using nested properties

    // Find all enrollments for a specific course (might involve joins in service layer or custom query)
    // List<Enrollment> findByTeacherCourse_CourseId(Long courseId); // Example using nested properties

    // Check if a student is enrolled in a specific teacher's course
    boolean existsByStudentIdAndTeacherCourseId(Long studentId, Long teacherCourseId);

    // Fetch enrollment with all necessary details for scheduling suggestions
    @Query("SELECT e FROM Enrollment e " +
           "JOIN FETCH e.student s " +
           "JOIN FETCH e.teacherCourse tc " +
           "JOIN FETCH tc.teacher t " +
           "JOIN FETCH tc.course c " +
           "WHERE e.id = :enrollmentId")
    Optional<Enrollment> findByIdWithDetails(@Param("enrollmentId") Long enrollmentId);

    // Find all enrollments with details (useful for frontend display if needed)
    @Query("SELECT e FROM Enrollment e " +
           "JOIN FETCH e.student s " +
           "JOIN FETCH e.teacherCourse tc " +
           "JOIN FETCH tc.teacher t " +
           "JOIN FETCH tc.course c")
    List<Enrollment> findAllWithDetails();

    // 统计每个课程的选课人数
    @Query("SELECT tc.course.id, tc.course.name, tc.course.category, COUNT(e.id) " +
           "FROM Enrollment e JOIN e.teacherCourse tc GROUP BY tc.course.id, tc.course.name, tc.course.category")
    List<Object[]> countEnrollmentsByCourse();
} 