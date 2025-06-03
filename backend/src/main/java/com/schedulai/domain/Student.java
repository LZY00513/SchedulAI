package com.schedulai.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "students")
@EqualsAndHashCode(exclude = {"availabilities", "enrollments"})
@ToString(exclude = {"availabilities", "enrollments"})
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 10)
    private String gender;

    @Column
    private Integer age;

    @Column(length = 50)
    private String grade;

    @Column(length = 20)
    private String phone;

    @Column(length = 100)
    private String parent;

    @Column(length = 20)
    private String parentPhone;

    @Column
    private LocalDate enrollmentDate;

    @Column(length = 20)
    private String status;

    // One Student can have Many Availability slots
    @OneToMany(mappedBy = "student", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<StudentAvailability> availabilities = new ArrayList<>();

    // One Student can have Many Enrollments
    @OneToMany(mappedBy = "student", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Enrollment> enrollments = new ArrayList<>();

    // Helper methods to manage the bidirectional relationship (optional but good practice)
    public void addAvailability(StudentAvailability availability) {
        availabilities.add(availability);
        availability.setStudent(this);
    }

    public void removeAvailability(StudentAvailability availability) {
        availabilities.remove(availability);
        availability.setStudent(null);
    }

    // Enrollment helpers (optional)
    public void addEnrollment(Enrollment enrollment) {
        enrollments.add(enrollment);
        enrollment.setStudent(this);
    }

    public void removeEnrollment(Enrollment enrollment) {
        enrollments.remove(enrollment);
        enrollment.setStudent(null);
    }
} 