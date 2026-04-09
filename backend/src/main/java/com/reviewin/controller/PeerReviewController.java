package com.reviewin.controller;

import com.reviewin.dto.request.PeerReviewRequest;
import com.reviewin.exception.BadRequestException;
import com.reviewin.model.Submission;
import com.reviewin.service.PeerReviewService;
import com.reviewin.service.SubmissionService;
import com.reviewin.util.SecurityUtils;
import jakarta.validation.Valid;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/peer-reviews")
@RequiredArgsConstructor
@PreAuthorize("hasRole('STUDENT')")
public class PeerReviewController {

    private final PeerReviewService peerReviewService;
    private final SubmissionService submissionService;

    @GetMapping("/classes")
    public ResponseEntity<List<Map<String, Object>>> classes() {
        Long studentId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(peerReviewService.getReviewClasses(studentId));
    }

    @GetMapping("/assignments/{assignmentId}/submissions")
    public ResponseEntity<List<Map<String, Object>>> assignmentSubmissions(@PathVariable Long assignmentId) {
        Long studentId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(peerReviewService.getAssignmentSubmissionsForReview(assignmentId, studentId));
    }

    @GetMapping("/assignments/{assignmentId}/submissions/{submissionId}/file")
    public ResponseEntity<Resource> viewSubmissionFile(@PathVariable Long assignmentId, @PathVariable Long submissionId) {
        Long studentId = SecurityUtils.getCurrentUserId();
        Submission submission = validateSubmission(assignmentId, submissionId, studentId);
        Resource resource = submissionService.getFileResource(submissionId, studentId, "STUDENT");

        String contentType = probeContentType(Paths.get(submission.getFilePath()));
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(contentType))
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + submission.getFileName() + "\"")
            .body(resource);
    }

    @GetMapping("/assignments/{assignmentId}/submissions/{submissionId}/download")
    public ResponseEntity<Resource> downloadSubmissionFile(@PathVariable Long assignmentId, @PathVariable Long submissionId) {
        Long studentId = SecurityUtils.getCurrentUserId();
        Submission submission = validateSubmission(assignmentId, submissionId, studentId);
        Resource resource = submissionService.getFileResource(submissionId, studentId, "STUDENT");

        String contentType = probeContentType(Paths.get(submission.getFilePath()));
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(contentType))
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + submission.getFileName() + "\"")
            .body(resource);
    }

    @PostMapping("/assignments/{assignmentId}/submissions/{submissionId}")
    public ResponseEntity<Map<String, Object>> createReview(
        @PathVariable Long assignmentId,
        @PathVariable Long submissionId,
        @Valid @RequestBody PeerReviewRequest request
    ) {
        Long studentId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(peerReviewService.createPeerReview(assignmentId, submissionId, studentId, request));
    }

    @PutMapping("/assignments/{assignmentId}/submissions/{submissionId}")
    public ResponseEntity<Map<String, Object>> updateReview(
        @PathVariable Long assignmentId,
        @PathVariable Long submissionId,
        @Valid @RequestBody PeerReviewRequest request
    ) {
        Long studentId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(peerReviewService.updatePeerReview(assignmentId, submissionId, studentId, request));
    }

    @GetMapping("/my-reviews/{assignmentId}")
    public ResponseEntity<List<Map<String, Object>>> myReviews(@PathVariable Long assignmentId) {
        Long studentId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(peerReviewService.getMyReviews(assignmentId, studentId));
    }

    private Submission validateSubmission(Long assignmentId, Long submissionId, Long studentId) {
        Submission submission = submissionService.getSubmissionWithAccessCheck(submissionId, studentId, "STUDENT");
        if (!submission.getAssignment().getId().equals(assignmentId)) {
            throw new BadRequestException("Submission does not belong to assignment");
        }
        if (submission.getStudent().getId().equals(studentId)) {
            throw new BadRequestException("Cannot access your own submission in peer review mode");
        }
        return submission;
    }

    private String probeContentType(Path path) {
        try {
            String contentType = Files.probeContentType(path);
            return contentType == null ? MediaType.APPLICATION_OCTET_STREAM_VALUE : contentType;
        } catch (IOException ex) {
            return MediaType.APPLICATION_OCTET_STREAM_VALUE;
        }
    }
}
