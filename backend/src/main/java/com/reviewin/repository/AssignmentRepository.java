package com.reviewin.repository;

import com.reviewin.model.Assignment;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssignmentRepository extends JpaRepository<Assignment, Long> {

    List<Assignment> findAllByClassroomIdOrderByCreatedAtDesc(Long classId);

    long countByClassroomId(Long classId);

    Optional<Assignment> findByIdAndClassroomId(Long id, Long classId);
}
