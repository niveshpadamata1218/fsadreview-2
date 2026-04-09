package com.reviewin.repository;

import com.reviewin.model.Submission;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {

    Optional<Submission> findByAssignmentIdAndStudentId(Long assignmentId, Long studentId);

    List<Submission> findAllByAssignmentId(Long assignmentId);

    List<Submission> findAllByAssignmentClassroomId(Long classId);

    long countByAssignmentId(Long assignmentId);

    long countByAssignmentClassroomIdAndStudentId(Long classId, Long studentId);
}
