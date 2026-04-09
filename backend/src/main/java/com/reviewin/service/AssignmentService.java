package com.reviewin.service;

import com.reviewin.dto.request.CreateAssignmentRequest;
import com.reviewin.dto.response.AssignmentResponse;
import com.reviewin.exception.ResourceNotFoundException;
import com.reviewin.exception.UnauthorizedException;
import com.reviewin.model.Assignment;
import com.reviewin.model.Classroom;
import com.reviewin.repository.AssignmentRepository;
import com.reviewin.repository.ClassRepository;
import com.reviewin.repository.GradeRepository;
import com.reviewin.repository.SubmissionRepository;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final ClassRepository classRepository;
    private final SubmissionRepository submissionRepository;
    private final GradeRepository gradeRepository;

    @Transactional
    public AssignmentResponse createAssignment(String classCode, CreateAssignmentRequest request, Long teacherId) {
        Classroom classroom = classRepository.findByClassCode(classCode)
            .orElseThrow(() -> new ResourceNotFoundException("Class not found"));

        if (!classroom.getTeacher().getId().equals(teacherId)) {
            throw new UnauthorizedException("You can create assignments only for your classes");
        }

        Assignment assignment = Assignment.builder()
            .classroom(classroom)
            .title(request.getTitle().trim())
            .description(request.getDescription())
            .deadline(request.getDeadline())
            .build();

        Assignment saved = assignmentRepository.save(assignment);
        return AssignmentResponse.builder()
            .id(saved.getId())
            .title(saved.getTitle())
            .description(saved.getDescription())
            .deadline(saved.getDeadline())
            .submissionCount(0L)
            .status("PENDING")
            .build();
    }

    @Transactional
    public void deleteAssignment(String classCode, Long assignmentId, Long teacherId) {
        Classroom classroom = classRepository.findByClassCode(classCode)
            .orElseThrow(() -> new ResourceNotFoundException("Class not found"));
        if (!classroom.getTeacher().getId().equals(teacherId)) {
            throw new UnauthorizedException("You can delete assignments only for your classes");
        }

        Assignment assignment = assignmentRepository.findByIdAndClassroomId(assignmentId, classroom.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Assignment not found"));
        assignmentRepository.delete(assignment);
    }

    public List<Assignment> getAssignmentsByClassId(Long classId) {
        return assignmentRepository.findAllByClassroomIdOrderByCreatedAtDesc(classId);
    }

    public Assignment getAssignmentById(Long assignmentId) {
        return assignmentRepository.findById(assignmentId)
            .orElseThrow(() -> new ResourceNotFoundException("Assignment not found"));
    }

    public AssignmentResponse toStudentAssignmentResponse(Assignment assignment, Long studentId) {
        var submission = submissionRepository.findByAssignmentIdAndStudentId(assignment.getId(), studentId);
        String status;

        if (submission.isPresent()) {
            var grade = gradeRepository.findBySubmissionId(submission.get().getId());
            status = grade.isPresent() ? "GRADED" : "PENDING";
        } else if (assignment.getDeadline().isBefore(LocalDate.now())) {
            status = "OVERDUE";
        } else {
            status = "NOT_SUBMITTED";
        }

        return AssignmentResponse.builder()
            .id(assignment.getId())
            .title(assignment.getTitle())
            .description(assignment.getDescription())
            .deadline(assignment.getDeadline())
            .submissionCount(submissionRepository.countByAssignmentId(assignment.getId()))
            .status(status)
            .build();
    }
}
