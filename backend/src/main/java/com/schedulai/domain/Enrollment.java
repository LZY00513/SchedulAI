package com.schedulai.domain;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "enrollments",
       uniqueConstraints = {
           @UniqueConstraint(columnNames = {"student_id", "teacher_course_id"}) // Ensure a student enrolls in a specific teacher's course only once
       }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(exclude = "lessons")
@ToString(exclude = "lessons")
public class Enrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_course_id", nullable = false)
    private TeacherCourse teacherCourse;

    @Column(name = "hourly_rate", precision = 10, scale = 2, nullable = false)
    private BigDecimal hourlyRate; // The agreed rate for this specific enrollment

    @Column(name = "enrollment_date", nullable = false, updatable = false)
    private LocalDateTime enrollmentDate = LocalDateTime.now(); // Record when the enrollment happened

    // One Enrollment can have Many Lessons
    @OneToMany(mappedBy = "enrollment", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private Set<Lesson> lessons = new HashSet<>();

    // Custom constructor might be useful
    public Enrollment(Student student, TeacherCourse teacherCourse, BigDecimal hourlyRate) {
        this.student = student;
        this.teacherCourse = teacherCourse;
        this.hourlyRate = hourlyRate;
        // enrollmentDate is set automatically
    }

    // Helper methods for Lessons (optional)
    public void addLesson(Lesson lesson) {
        lessons.add(lesson);
        lesson.setEnrollment(this);
    }

    public void removeLesson(Lesson lesson) {
        lessons.remove(lesson);
        lesson.setEnrollment(null);
    }
} 