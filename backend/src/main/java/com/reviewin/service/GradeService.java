package com.reviewin.service;

import com.reviewin.dto.request.GradeRequest;
import com.reviewin.exception.ResourceNotFoundException;
import com.reviewin.exception.UnauthorizedException;
import com.reviewin.model.Grade;
import com.reviewin.model.Submission;
import com.reviewin.model.User;
import com.reviewin.repository.GradeRepository;
import com.reviewin.repository.SubmissionRepository;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GradeService {

    private final GradeRepository gradeRepository;
    private final SubmissionRepository submissionRepository;
    private final UserService userService;

    @Transactional
    public Grade upsertGrade(Long submissionId, GradeRequest request, Long teacherId) {
        Submission submission = submissionRepository.findById(submissionId)
            .orElseThrow(() -> new ResourceNotFoundException("Submission not found"));

        Long ownerTeacherId = submission.getAssignment().getClassroom().getTeacher().getId();
        if (!ownerTeacherId.equals(teacherId)) {
            throw new UnauthorizedException("You can grade only your class submissions");
        }

        User teacher = userService.getById(teacherId);
        Grade grade = gradeRepository.findBySubmissionId(submissionId)
            .orElse(Grade.builder()
                .submission(submission)
                .gradedBy(teacher)
                .build());

        grade.setGrade(request.getGrade());
        grade.setFeedback(request.getFeedback());
        grade.setGradedBy(teacher);
        grade.setGradedAt(LocalDateTime.now());

        return gradeRepository.save(grade);
    }
}
