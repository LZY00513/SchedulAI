package com.schedulai.repository;

import com.schedulai.domain.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TeacherRepository extends JpaRepository<Teacher, Long> {
    // Basic CRUD methods are inherited
    // Add custom query methods if needed later
} 