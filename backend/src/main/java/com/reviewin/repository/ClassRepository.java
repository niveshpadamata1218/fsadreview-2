package com.reviewin.repository;

import com.reviewin.model.Classroom;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClassRepository extends JpaRepository<Classroom, Long> {

    boolean existsByClassCode(String classCode);

    Optional<Classroom> findByClassCode(String classCode);

    List<Classroom> findAllByTeacherIdOrderByCreatedAtDesc(Long teacherId);
}
