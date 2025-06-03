package com.schedulai.repository;

import com.schedulai.domain.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    // Spring Data JPA will automatically implement basic CRUD methods
    // Custom query methods can be added here if needed
    
    List<Student> findByName(String name);
} 