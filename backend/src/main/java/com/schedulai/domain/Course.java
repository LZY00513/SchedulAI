package com.schedulai.domain;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.ToString;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "courses")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(exclude = "teacherCourses")
@ToString(exclude = "teacherCourses")
@Getter
@Setter
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 50)
    private String category;

    @Column(length = 50)
    private String level;

    @Column
    private Integer duration;

    @Column(precision = 10, scale = 2)
    private BigDecimal price;

    @Column
    private Integer difficulty;

    @Column(length = 20)
    private String status;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "course_recommended_teachers", joinColumns = @JoinColumn(name = "course_id"))
    @Column(name = "teacher_id")
    private List<Long> recommendedTeachers = new ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "course_prerequisites", joinColumns = @JoinColumn(name = "course_id"))
    @Column(name = "prerequisite")
    private List<String> prerequisites = new ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "course_materials", joinColumns = @JoinColumn(name = "course_id"))
    @Column(name = "material")
    private List<String> materials = new ArrayList<>();

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<TeacherCourse> teacherCourses = new ArrayList<>();

    public void addTeacherCourse(TeacherCourse teacherCourse) {
        teacherCourses.add(teacherCourse);
        teacherCourse.setCourse(this);
    }

    public void removeTeacherCourse(TeacherCourse teacherCourse) {
        teacherCourses.remove(teacherCourse);
        teacherCourse.setCourse(null);
    }
} 