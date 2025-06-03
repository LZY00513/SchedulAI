package com.schedulai.repository;

import com.schedulai.domain.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {

    // Find a course by its name (useful since name is unique)
    Optional<Course> findByName(String name);

    // Find courses containing a certain keyword in the name or description (example)
    // List<Course> findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(String nameKeyword, String descriptionKeyword);
} 