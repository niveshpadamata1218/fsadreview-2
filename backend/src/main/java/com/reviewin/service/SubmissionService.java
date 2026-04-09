package com.reviewin.service;

import com.reviewin.dto.response.SubmissionResponse;
import com.reviewin.exception.BadRequestException;
import com.reviewin.exception.ResourceNotFoundException;
import com.reviewin.exception.UnauthorizedException;
import com.reviewin.model.Assignment;
import com.reviewin.model.Submission;
import com.reviewin.model.User;
import com.reviewin.repository.AssignmentRepository;
import com.reviewin.repository.GradeRepository;
import com.reviewin.repository.SubmissionRepository;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class SubmissionService {

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    private final SubmissionRepository submissionRepository;
    private final AssignmentRepository assignmentRepository;
    private final GradeRepository gradeRepository;
    private final UserService userService;
    private final ClassService classService;

    @Value("${file.upload-dir:./uploads}")
    private String uploadDir;

    @Transactional
    public SubmissionResponse uploadSubmission(Long assignmentId, Long studentId, MultipartFile file) {
        return saveSubmission(assignmentId, studentId, file, false);
    }

    @Transactional
    public SubmissionResponse replaceSubmission(Long assignmentId, Long studentId, MultipartFile file) {
        return saveSubmission(assignmentId, studentId, file, true);
    }

    @Transactional
    public void withdrawSubmission(Long assignmentId, Long studentId) {
        Submission submission = submissionRepository.findByAssignmentIdAndStudentId(assignmentId, studentId)
            .orElseThrow(() -> new ResourceNotFoundException("Submission not found"));
        deletePhysicalFile(submission.getFilePath());
        submissionRepository.delete(submission);
    }

    public Resource getFileResource(Long submissionId, Long userId, String role) {
        Submission submission = getSubmissionWithAccessCheck(submissionId, userId, role);
        Path filePath = Paths.get(submission.getFilePath());
        if (!Files.exists(filePath)) {
            throw new ResourceNotFoundException("File not found on disk");
        }
        try {
            return new UrlResource(filePath.toUri());
        } catch (IOException ex) {
            throw new BadRequestException("Unable to read file");
        }
    }

    public Submission getSubmissionWithAccessCheck(Long submissionId, Long userId, String role) {
        Submission submission = submissionRepository.findById(submissionId)
            .orElseThrow(() -> new ResourceNotFoundException("Submission not found"));

        if ("TEACHER".equalsIgnoreCase(role)) {
            Long classTeacherId = submission.getAssignment().getClassroom().getTeacher().getId();
            if (!classTeacherId.equals(userId)) {
                throw new UnauthorizedException("You can access only submissions from your classes");
            }
            return submission;
        }

        if ("STUDENT".equalsIgnoreCase(role)) {
            Long classId = submission.getAssignment().getClassroom().getId();
            classService.ensureStudentEnrollment(classId, userId);
            return submission;
        }

        throw new UnauthorizedException("Invalid role");
    }

    public SubmissionResponse toSubmissionResponse(Submission submission) {
        var grade = gradeRepository.findBySubmissionId(submission.getId());
        return SubmissionResponse.builder()
            .submissionId(submission.getId())
            .assignmentId(submission.getAssignment().getId())
            .studentId(submission.getStudent().getId())
            .studentName(submission.getStudent().getName())
            .fileName(submission.getFileName())
            .filePath(submission.getFilePath())
            .fileSizeKb(submission.getFileSizeKb())
            .submittedAt(submission.getSubmittedAt())
            .grade(grade.map(g -> g.getGrade()).orElse(null))
            .feedback(grade.map(g -> g.getFeedback()).orElse(null))
            .status(grade.isPresent() ? "GRADED" : "PENDING")
            .build();
    }

    private SubmissionResponse saveSubmission(Long assignmentId, Long studentId, MultipartFile file, boolean replace) {
        validateFile(file);

        Assignment assignment = assignmentRepository.findById(assignmentId)
            .orElseThrow(() -> new ResourceNotFoundException("Assignment not found"));
        classService.ensureStudentEnrollment(assignment.getClassroom().getId(), studentId);

        Submission existing = submissionRepository.findByAssignmentIdAndStudentId(assignmentId, studentId).orElse(null);
        if (!replace && existing != null) {
            throw new BadRequestException("Submission already exists. Use update endpoint to replace file.");
        }
        if (replace && existing == null) {
            throw new ResourceNotFoundException("No existing submission to update");
        }

        if (existing != null) {
            deletePhysicalFile(existing.getFilePath());
        }

        User student = userService.getById(studentId);
        String safeOriginalName = sanitizeFilename(file.getOriginalFilename());
        Path targetPath = Paths.get(uploadDir, String.valueOf(studentId), String.valueOf(assignmentId), safeOriginalName)
            .toAbsolutePath()
            .normalize();

        try {
            Files.createDirectories(targetPath.getParent());
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            throw new BadRequestException("Failed to store uploaded file");
        }

        Submission submission = existing == null ? Submission.builder().build() : existing;
        submission.setAssignment(assignment);
        submission.setStudent(student);
        submission.setFileName(safeOriginalName);
        submission.setFilePath(targetPath.toString());
        submission.setFileSizeKb(toKb(file.getSize()));
        submission.setSubmittedAt(LocalDateTime.now());

        Submission saved = submissionRepository.save(submission);
        return toSubmissionResponse(saved);
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File is required");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType)) {
            throw new BadRequestException("Only PDF, DOC, and DOCX files are allowed");
        }
    }

    private String sanitizeFilename(String originalFilename) {
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new BadRequestException("Invalid file name");
        }
        String cleaned = originalFilename.replace("..", "").replace("/", "_").replace("\\", "_").trim();
        if (cleaned.isBlank()) {
            throw new BadRequestException("Invalid file name");
        }
        return cleaned;
    }

    private void deletePhysicalFile(String path) {
        if (path == null || path.isBlank()) {
            return;
        }
        try {
            Files.deleteIfExists(Path.of(path));
        } catch (IOException ignored) {
            // Deleting DB record should still continue even if file cleanup fails.
        }
    }

    private BigDecimal toKb(long bytes) {
        return BigDecimal.valueOf(bytes)
            .divide(BigDecimal.valueOf(1024), 2, RoundingMode.HALF_UP);
    }
}
