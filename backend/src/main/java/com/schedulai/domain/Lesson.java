package com.schedulai.domain;

import com.schedulai.domain.LessonStatus;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.time.LocalDateTime;

@Entity
@Table(name = "lessons") // Renamed table
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(exclude = {"enrollment"}) // Avoid recursion in equals/hashCode
@ToString(exclude = {"enrollment"})      // Avoid recursion in toString
public class Lesson { // Renamed class

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enrollment_id", nullable = false) // Link to Enrollment
    private Enrollment enrollment;

    @Column(name = "start_date_time", nullable = false) // Renamed field
    private LocalDateTime startDateTime;

    @Column(name = "end_date_time", nullable = false) // Renamed field
    private LocalDateTime endDateTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private LessonStatus status;

    @Column(length = 255) // Optional: Specify length
    private String location;

    @Column(columnDefinition = "TEXT") // Allow longer notes
    private String notes;

    // Removed durationMinutes and cost fields
} 