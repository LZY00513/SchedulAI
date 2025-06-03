package com.schedulai.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.ToString;
import com.schedulai.domain.TeacherAvailability;
import com.schedulai.domain.TeacherCourse;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "teachers")
@EqualsAndHashCode(exclude = {"availabilities", "teacherCourses"})
@ToString(exclude = {"availabilities", "teacherCourses"})
public class Teacher {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(precision = 10, scale = 2)
    private BigDecimal hourlyRate;

    @Column(length = 50)
    private String availabilityMode;

    @Column(length = 10)
    private String gender;

    @Column
    private Integer age;

    @Column(length = 50)
    private String subject;

    @Column(length = 50)
    private String education;

    @Column
    private Integer experience;

    @Column(length = 20)
    private String phone;

    @Column(length = 100, unique = true)
    private String email;

    @Column(length = 20)
    private String status;

    @OneToMany(mappedBy = "teacher", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<TeacherAvailability> availabilities = new ArrayList<>();

    @OneToMany(mappedBy = "teacher", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<TeacherCourse> teacherCourses = new ArrayList<>();

    public void addAvailability(TeacherAvailability availability) {
        availabilities.add(availability);
        availability.setTeacher(this);
    }

    public void removeAvailability(TeacherAvailability availability) {
        availabilities.remove(availability);
        availability.setTeacher(null);
    }

    public void addTeacherCourse(TeacherCourse teacherCourse) {
        teacherCourses.add(teacherCourse);
        teacherCourse.setTeacher(this);
    }

    public void removeTeacherCourse(TeacherCourse teacherCourse) {
        teacherCourses.remove(teacherCourse);
        teacherCourse.setTeacher(null);
    }
} 