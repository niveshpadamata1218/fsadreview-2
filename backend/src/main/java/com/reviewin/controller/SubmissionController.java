package com.reviewin.controller;

import com.reviewin.dto.response.SubmissionResponse;
import com.reviewin.exception.UnauthorizedException;
import com.reviewin.model.Submission;
import com.reviewin.service.SubmissionService;
import com.reviewin.util.SecurityUtils;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/submissions")
@RequiredArgsConstructor
public class SubmissionController {

    private final SubmissionService submissionService;

    @PostMapping("/{assignmentId}")
    public ResponseEntity<SubmissionResponse> upload(
        @PathVariable Long assignmentId,
        @RequestParam("file") MultipartFile file
    ) {
        ensureStudentRole();
        Long studentId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(submissionService.uploadSubmission(assignmentId, studentId, file));
    }

    @PutMapping("/{assignmentId}")
    public ResponseEntity<SubmissionResponse> replace(
        @PathVariable Long assignmentId,
        @RequestParam("file") MultipartFile file
    ) {
        ensureStudentRole();
        Long studentId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(submissionService.replaceSubmission(assignmentId, studentId, file));
    }

    @DeleteMapping("/{assignmentId}")
    public ResponseEntity<Map<String, String>> withdraw(@PathVariable Long assignmentId) {
        ensureStudentRole();
        Long studentId = SecurityUtils.getCurrentUserId();
        submissionService.withdrawSubmission(assignmentId, studentId);
        return ResponseEntity.ok(Map.of("message", "Submission withdrawn"));
    }

    @GetMapping("/file/{submissionId}")
    public ResponseEntity<Resource> viewFile(@PathVariable Long submissionId) {
        Long userId = SecurityUtils.getCurrentUserId();
        String role = SecurityUtils.getCurrentRole();
        Submission submission = submissionService.getSubmissionWithAccessCheck(submissionId, userId, role);
        if ("STUDENT".equalsIgnoreCase(role) && !submission.getStudent().getId().equals(userId)) {
            throw new UnauthorizedException("Students can only view their own submissions from this endpoint");
        }
        Resource resource = submissionService.getFileResource(submissionId, userId, role);

        String contentType = probeContentType(Paths.get(submission.getFilePath()));
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(contentType))
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + submission.getFileName() + "\"")
            .body(resource);
    }

    @GetMapping("/download/{submissionId}")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long submissionId) {
        Long userId = SecurityUtils.getCurrentUserId();
        String role = SecurityUtils.getCurrentRole();
        Submission submission = submissionService.getSubmissionWithAccessCheck(submissionId, userId, role);
        if ("STUDENT".equalsIgnoreCase(role) && !submission.getStudent().getId().equals(userId)) {
            throw new UnauthorizedException("Students can only download their own submissions from this endpoint");
        }
        Resource resource = submissionService.getFileResource(submissionId, userId, role);

        String contentType = probeContentType(Paths.get(submission.getFilePath()));
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(contentType))
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + submission.getFileName() + "\"")
            .body(resource);
    }

    private String probeContentType(Path path) {
        try {
            String contentType = Files.probeContentType(path);
            return contentType == null ? MediaType.APPLICATION_OCTET_STREAM_VALUE : contentType;
        } catch (IOException ex) {
            return MediaType.APPLICATION_OCTET_STREAM_VALUE;
        }
    }

    private void ensureStudentRole() {
        if (!"STUDENT".equalsIgnoreCase(SecurityUtils.getCurrentRole())) {
            throw new UnauthorizedException("Only students can modify submissions");
        }
    }
}
