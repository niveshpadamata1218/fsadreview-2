package com.reviewin.service;

import com.reviewin.dto.request.PeerReviewRequest;
import com.reviewin.exception.BadRequestException;
import com.reviewin.exception.ResourceNotFoundException;
import com.reviewin.model.Assignment;
import com.reviewin.model.ClassEnrollment;
import com.reviewin.model.Classroom;
import com.reviewin.model.PeerReview;
import com.reviewin.model.Submission;
import com.reviewin.model.User;
import com.reviewin.repository.AssignmentRepository;
import com.reviewin.repository.ClassEnrollmentRepository;
import com.reviewin.repository.PeerReviewRepository;
import com.reviewin.repository.SubmissionRepository;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PeerReviewService {

    private final ClassEnrollmentRepository classEnrollmentRepository;
    private final AssignmentRepository assignmentRepository;
    private final SubmissionRepository submissionRepository;
    private final PeerReviewRepository peerReviewRepository;
    private final UserService userService;
    private final ClassService classService;

    public List<Map<String, Object>> getReviewClasses(Long studentId) {
        List<ClassEnrollment> enrollments = classEnrollmentRepository.findAllByStudentId(studentId);

        return enrollments.stream().map(enrollment -> {
            Classroom classroom = enrollment.getClassroom();
            List<Assignment> assignments = assignmentRepository.findAllByClassroomIdOrderByCreatedAtDesc(classroom.getId());

            long totalSubmissions = 0;
            long needsReview = 0;
            for (Assignment assignment : assignments) {
                List<Submission> submissions = submissionRepository.findAllByAssignmentId(assignment.getId());
                for (Submission submission : submissions) {
                    if (submission.getStudent().getId().equals(studentId)) {
                        continue;
                    }
                    totalSubmissions++;
                    boolean alreadyReviewed = peerReviewRepository.existsByReviewerIdAndSubmissionId(studentId, submission.getId());
                    if (!alreadyReviewed) {
                        needsReview++;
                    }
                }
            }

            Map<String, Object> map = new LinkedHashMap<>();
            map.put("classCode", classroom.getClassCode());
            map.put("className", classroom.getName());
            map.put("subject", classroom.getSubject());
            map.put("assignmentCount", assignments.size());
            map.put("submissionCount", totalSubmissions);
            map.put("needReview", needsReview);
            return map;
        }).toList();
    }

    public List<Map<String, Object>> getAssignmentSubmissionsForReview(Long assignmentId, Long reviewerId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
            .orElseThrow(() -> new ResourceNotFoundException("Assignment not found"));

        classService.ensureStudentEnrollment(assignment.getClassroom().getId(), reviewerId);

        return submissionRepository.findAllByAssignmentId(assignmentId)
            .stream()
            .filter(submission -> !submission.getStudent().getId().equals(reviewerId))
            .map(submission -> {
                boolean alreadyReviewed = peerReviewRepository.existsByReviewerIdAndSubmissionId(reviewerId, submission.getId());
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("submissionId", submission.getId());
                map.put("studentId", submission.getStudent().getId());
                map.put("studentName", submission.getStudent().getName());
                map.put("fileName", submission.getFileName());
                map.put("submittedAt", submission.getSubmittedAt());
                map.put("alreadyReviewed", alreadyReviewed);
                return map;
            })
            .toList();
    }

    @Transactional
    public Map<String, Object> createPeerReview(Long assignmentId, Long submissionId, Long reviewerId, PeerReviewRequest request) {
        return savePeerReview(assignmentId, submissionId, reviewerId, request, false);
    }

    @Transactional
    public Map<String, Object> updatePeerReview(Long assignmentId, Long submissionId, Long reviewerId, PeerReviewRequest request) {
        return savePeerReview(assignmentId, submissionId, reviewerId, request, true);
    }

    public List<Map<String, Object>> getMyReviews(Long assignmentId, Long reviewerId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
            .orElseThrow(() -> new ResourceNotFoundException("Assignment not found"));
        classService.ensureStudentEnrollment(assignment.getClassroom().getId(), reviewerId);

        return peerReviewRepository.findAllByAssignmentIdAndReviewerIdOrderByReviewedAtDesc(assignmentId, reviewerId)
            .stream()
            .map(review -> {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("reviewId", review.getId());
                map.put("submissionId", review.getSubmission().getId());
                map.put("grade", review.getGrade());
                map.put("feedback", review.getFeedback());
                map.put("reviewedAt", review.getReviewedAt());
                return map;
            })
            .toList();
    }

    private Map<String, Object> savePeerReview(
        Long assignmentId,
        Long submissionId,
        Long reviewerId,
        PeerReviewRequest request,
        boolean update
    ) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
            .orElseThrow(() -> new ResourceNotFoundException("Assignment not found"));
        classService.ensureStudentEnrollment(assignment.getClassroom().getId(), reviewerId);

        Submission submission = submissionRepository.findById(submissionId)
            .orElseThrow(() -> new ResourceNotFoundException("Submission not found"));

        if (!submission.getAssignment().getId().equals(assignmentId)) {
            throw new BadRequestException("Submission does not belong to assignment");
        }

        if (submission.getStudent().getId().equals(reviewerId)) {
            throw new BadRequestException("You cannot peer-review your own submission");
        }

        PeerReview review = peerReviewRepository.findByReviewerIdAndSubmissionId(reviewerId, submissionId).orElse(null);

        if (!update && review != null) {
            throw new BadRequestException("Peer review already submitted");
        }
        if (update && review == null) {
            throw new ResourceNotFoundException("Peer review not found");
        }

        if (review == null) {
            User reviewer = userService.getById(reviewerId);
            review = PeerReview.builder()
                .assignment(assignment)
                .submission(submission)
                .reviewer(reviewer)
                .build();
        }

        review.setGrade(request.getGrade());
        review.setFeedback(request.getFeedback());
        review.setReviewedAt(LocalDateTime.now());
        PeerReview saved = peerReviewRepository.save(review);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("reviewId", saved.getId());
        response.put("assignmentId", assignmentId);
        response.put("submissionId", submissionId);
        response.put("grade", saved.getGrade());
        response.put("feedback", saved.getFeedback());
        response.put("reviewedAt", saved.getReviewedAt());
        return response;
    }
}
