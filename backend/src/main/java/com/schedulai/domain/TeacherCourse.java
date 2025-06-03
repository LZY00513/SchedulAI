package com.schedulai.domain;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "teacher_courses",
       uniqueConstraints = {
           @UniqueConstraint(columnNames = {"teacher_id", "course_id"}) // Enforce uniqueness
       }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(exclude = "enrollments")
@ToString(exclude = "enrollments")
public class TeacherCourse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", nullable = false)
    private Teacher teacher;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    // One TeacherCourse can have Many Enrollments
    @OneToMany(mappedBy = "teacherCourse", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private Set<Enrollment> enrollments = new HashSet<>();

    // Custom constructor for easier creation
    public TeacherCourse(Teacher teacher, Course course) {
        this.teacher = teacher;
        this.course = course;
    }

    // Enrollment helpers (optional)
    public void addEnrollment(Enrollment enrollment) {
        enrollments.add(enrollment);
        enrollment.setTeacherCourse(this);
    }

    public void removeEnrollment(Enrollment enrollment) {
        enrollments.remove(enrollment);
        enrollment.setTeacherCourse(null);
    }
} 