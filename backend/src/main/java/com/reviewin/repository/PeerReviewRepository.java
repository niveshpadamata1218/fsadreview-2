package com.reviewin.repository;

import com.reviewin.model.PeerReview;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PeerReviewRepository extends JpaRepository<PeerReview, Long> {

    Optional<PeerReview> findByReviewerIdAndSubmissionId(Long reviewerId, Long submissionId);

    boolean existsByReviewerIdAndSubmissionId(Long reviewerId, Long submissionId);

    long countBySubmissionId(Long submissionId);

    List<PeerReview> findAllByAssignmentClassroomIdOrderByReviewedAtDesc(Long classId);

    List<PeerReview> findAllByAssignmentIdAndReviewerIdOrderByReviewedAtDesc(Long assignmentId, Long reviewerId);

    List<PeerReview> findAllByAssignmentIdOrderByReviewedAtDesc(Long assignmentId);
}
