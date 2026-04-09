package com.reviewin.service;

import com.reviewin.dto.request.CreateClassRequest;
import com.reviewin.dto.request.JoinClassRequest;
import com.reviewin.dto.response.AssignmentResponse;
import com.reviewin.dto.response.ClassResponse;
import com.reviewin.dto.response.StudentProgressResponse;
import com.reviewin.exception.BadRequestException;
import com.reviewin.exception.ResourceNotFoundException;
import com.reviewin.exception.UnauthorizedException;
import com.reviewin.model.Assignment;
import com.reviewin.model.ClassEnrollment;
import com.reviewin.model.Classroom;
import com.reviewin.model.PeerReview;
import com.reviewin.model.Submission;
import com.reviewin.model.User;
import com.reviewin.repository.AssignmentRepository;
import com.reviewin.repository.ClassEnrollmentRepository;
import com.reviewin.repository.ClassRepository;
import com.reviewin.repository.GradeRepository;
import com.reviewin.repository.PeerReviewRepository;
import com.reviewin.repository.SubmissionRepository;
import com.reviewin.util.ClassCodeGenerator;
import com.reviewin.util.PasswordGenerator;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ClassService {

    private final ClassRepository classRepository;
    private final ClassEnrollmentRepository classEnrollmentRepository;
    private final AssignmentRepository assignmentRepository;
    private final SubmissionRepository submissionRepository;
    private final GradeRepository gradeRepository;
    private final PeerReviewRepository peerReviewRepository;
    private final UserService userService;
    private final ClassCodeGenerator classCodeGenerator;
    private final PasswordGenerator passwordGenerator;
    private final AssignmentService assignmentService;

    public Map<String, Object> getTeacherOverview(Long teacherId) {
        List<Classroom> classes = classRepository.findAllByTeacherIdOrderByCreatedAtDesc(teacherId);
        Set<Long> uniqueStudents = new HashSet<>();
        for (Classroom classroom : classes) {
            classEnrollmentRepository.findAllByClassroomId(classroom.getId())
                .forEach(enrollment -> uniqueStudents.add(enrollment.getStudent().getId()));
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalClasses", classes.size());
        response.put("totalStudents", uniqueStudents.size());
        return response;
    }

    @Transactional
    public ClassResponse createClass(CreateClassRequest request, Long teacherId) {
        User teacher = userService.getById(teacherId);
        String classCode;
        do {
            classCode = classCodeGenerator.generateCode();
        } while (classRepository.existsByClassCode(classCode));

        Classroom classroom = Classroom.builder()
            .classCode(classCode)
            .password(passwordGenerator.generateClassPassword())
            .name(request.getName().trim())
            .subject(request.getSubject())
            .gradeLevel(request.getGradeLevel())
            .classFocus(request.getClassFocus())
            .teacher(teacher)
            .build();

        Classroom saved = classRepository.save(classroom);
        return ClassResponse.builder()
            .classCode(saved.getClassCode())
            .password(saved.getPassword())
            .name(saved.getName())
            .subject(saved.getSubject())
            .gradeLevel(saved.getGradeLevel())
            .classFocus(saved.getClassFocus())
            .studentCount(0L)
            .assignmentCount(0L)
            .assignments(List.of())
            .build();
    }

    public List<ClassResponse> getTeacherClasses(Long teacherId) {
        return classRepository.findAllByTeacherIdOrderByCreatedAtDesc(teacherId)
            .stream()
            .map(classroom -> {
                List<Assignment> assignments = assignmentRepository.findAllByClassroomIdOrderByCreatedAtDesc(classroom.getId());
                List<ClassResponse.AssignmentMiniResponse> assignmentMiniResponses = assignments.stream()
                    .map(assignment -> ClassResponse.AssignmentMiniResponse.builder()
                        .assignmentId(assignment.getId())
                        .title(assignment.getTitle())
                        .submissionCount(submissionRepository.countByAssignmentId(assignment.getId()))
                        .build())
                    .toList();

                return ClassResponse.builder()
                    .classCode(classroom.getClassCode())
                    .password(classroom.getPassword())
                    .name(classroom.getName())
                    .subject(classroom.getSubject())
                    .gradeLevel(classroom.getGradeLevel())
                    .classFocus(classroom.getClassFocus())
                    .studentCount(classEnrollmentRepository.countByClassroomId(classroom.getId()))
                    .assignmentCount((long) assignments.size())
                    .assignments(assignmentMiniResponses)
                    .build();
            })
            .toList();
    }

    public Map<String, Object> getTeacherClassDetail(String classCode, Long teacherId) {
        Classroom classroom = getTeacherClassOrThrow(classCode, teacherId);

        List<StudentProgressResponse> students = buildStudentProgress(classroom);
        List<AssignmentResponse> assignments = assignmentRepository.findAllByClassroomIdOrderByCreatedAtDesc(classroom.getId())
            .stream()
            .map(assignment -> AssignmentResponse.builder()
                .id(assignment.getId())
                .title(assignment.getTitle())
                .description(assignment.getDescription())
                .deadline(assignment.getDeadline())
                .submissionCount(submissionRepository.countByAssignmentId(assignment.getId()))
                .status("PENDING")
                .build())
            .toList();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("classCode", classroom.getClassCode());
        response.put("password", classroom.getPassword());
        response.put("name", classroom.getName());
        response.put("subject", classroom.getSubject());
        response.put("gradeLevel", classroom.getGradeLevel());
        response.put("classFocus", classroom.getClassFocus());
        response.put("studentCount", students.size());
        response.put("students", students);
        response.put("assignments", assignments);
        return response;
    }

    @Transactional
    public void deleteClass(String classCode, Long teacherId) {
        Classroom classroom = getTeacherClassOrThrow(classCode, teacherId);
        classRepository.delete(classroom);
    }

    public List<StudentProgressResponse> getStudentsForTeacherClass(String classCode, Long teacherId) {
        Classroom classroom = getTeacherClassOrThrow(classCode, teacherId);
        return buildStudentProgress(classroom);
    }

    @Transactional
    public void removeStudentFromClass(String classCode, Long studentId, Long teacherId) {
        Classroom classroom = getTeacherClassOrThrow(classCode, teacherId);
        ClassEnrollment enrollment = classEnrollmentRepository.findByClassroomIdAndStudentId(classroom.getId(), studentId)
            .orElseThrow(() -> new ResourceNotFoundException("Student enrollment not found"));
        classEnrollmentRepository.delete(enrollment);
    }

    public Map<String, Object> getStudentHistory(String classCode, Long studentId, Long teacherId) {
        Classroom classroom = getTeacherClassOrThrow(classCode, teacherId);
        User student = userService.getById(studentId);

        classEnrollmentRepository.findByClassroomIdAndStudentId(classroom.getId(), studentId)
            .orElseThrow(() -> new UnauthorizedException("Student not enrolled in class"));

        List<Map<String, Object>> assignmentHistory = assignmentRepository.findAllByClassroomIdOrderByCreatedAtDesc(classroom.getId())
            .stream()
            .map(assignment -> {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("assignmentId", assignment.getId());
                item.put("title", assignment.getTitle());
                item.put("deadline", assignment.getDeadline());

                var submissionOpt = submissionRepository.findByAssignmentIdAndStudentId(assignment.getId(), studentId);
                item.put("submitted", submissionOpt.isPresent());
                submissionOpt.ifPresent(submission -> {
                    var gradeOpt = gradeRepository.findBySubmissionId(submission.getId());
                    item.put("grade", gradeOpt.map(g -> g.getGrade()).orElse(null));
                    item.put("feedback", gradeOpt.map(g -> g.getFeedback()).orElse(null));
                });
                if (submissionOpt.isEmpty()) {
                    item.put("grade", null);
                    item.put("feedback", null);
                }
                return item;
            })
            .toList();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("studentId", student.getId());
        response.put("name", student.getName());
        response.put("userId", "user_" + student.getId());
        response.put("assignments", assignmentHistory);
        return response;
    }

    public List<Map<String, Object>> getClassSubmissions(String classCode, String filter, Long teacherId) {
        Classroom classroom = getTeacherClassOrThrow(classCode, teacherId);
        List<Assignment> assignments = assignmentRepository.findAllByClassroomIdOrderByCreatedAtDesc(classroom.getId());

        List<Map<String, Object>> result = new ArrayList<>();

        for (Assignment assignment : assignments) {
            List<Submission> submissions = submissionRepository.findAllByAssignmentId(assignment.getId());
            List<Map<String, Object>> submissionRows = submissions.stream()
                .filter(submission -> {
                    long reviewCount = peerReviewRepository.countBySubmissionId(submission.getId());
                    if ("PEER_REVIEWED".equalsIgnoreCase(filter)) {
                        return reviewCount > 0;
                    }
                    if ("NOT_REVIEWED".equalsIgnoreCase(filter)) {
                        return reviewCount == 0;
                    }
                    return true;
                })
                .map(submission -> {
                    var grade = gradeRepository.findBySubmissionId(submission.getId());
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("submissionId", submission.getId());
                    row.put("studentId", submission.getStudent().getId());
                    row.put("studentName", submission.getStudent().getName());
                    row.put("submittedAt", submission.getSubmittedAt());
                    row.put("fileName", submission.getFileName());
                    row.put("fileSizeKb", submission.getFileSizeKb());
                    row.put("grade", grade.map(g -> g.getGrade()).orElse(null));
                    row.put("feedback", grade.map(g -> g.getFeedback()).orElse(null));
                    row.put("status", grade.isPresent() ? "GRADED" : "PENDING");
                    return row;
                })
                .toList();

            Map<String, Object> group = new LinkedHashMap<>();
            group.put("assignmentId", assignment.getId());
            group.put("assignmentTitle", assignment.getTitle());
            group.put("deadline", assignment.getDeadline());
            group.put("showing", submissionRows.size());
            group.put("total", submissions.size());
            group.put("submissions", submissionRows);
            result.add(group);
        }

        return result;
    }

    public List<Map<String, Object>> getClassPeerReviews(String classCode, Long teacherId) {
        Classroom classroom = getTeacherClassOrThrow(classCode, teacherId);
        List<Assignment> assignments = assignmentRepository.findAllByClassroomIdOrderByCreatedAtDesc(classroom.getId());

        List<Map<String, Object>> response = new ArrayList<>();
        for (Assignment assignment : assignments) {
            List<PeerReview> reviews = peerReviewRepository.findAllByAssignmentIdOrderByReviewedAtDesc(assignment.getId());
            List<Map<String, Object>> rows = reviews.stream()
                .map(review -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("reviewerId", review.getReviewer().getId());
                    item.put("reviewerName", review.getReviewer().getName());
                    item.put("submissionId", review.getSubmission().getId());
                    item.put("submittee", review.getSubmission().getStudent().getName());
                    item.put("grade", review.getGrade());
                    item.put("feedback", review.getFeedback());
                    item.put("reviewedAt", review.getReviewedAt());
                    return item;
                })
                .toList();

            Map<String, Object> assignmentGroup = new LinkedHashMap<>();
            assignmentGroup.put("assignmentId", assignment.getId());
            assignmentGroup.put("assignmentTitle", assignment.getTitle());
            assignmentGroup.put("peerReviews", rows);
            response.add(assignmentGroup);
        }
        return response;
    }

    public Map<String, Object> getStudentOverview(Long studentId) {
        List<ClassEnrollment> enrollments = classEnrollmentRepository.findAllByStudentId(studentId);
        long totalClasses = enrollments.size();

        long pendingReviews = 0;
        LocalDate upcomingDeadline = null;

        for (ClassEnrollment enrollment : enrollments) {
            List<Assignment> assignments = assignmentRepository.findAllByClassroomIdOrderByCreatedAtDesc(
                enrollment.getClassroom().getId()
            );

            for (Assignment assignment : assignments) {
                if (assignment.getDeadline().isAfter(LocalDate.now())
                    && (upcomingDeadline == null || assignment.getDeadline().isBefore(upcomingDeadline))) {
                    upcomingDeadline = assignment.getDeadline();
                }

                List<Submission> submissions = submissionRepository.findAllByAssignmentId(assignment.getId());
                for (Submission submission : submissions) {
                    if (submission.getStudent().getId().equals(studentId)) {
                        continue;
                    }
                    boolean reviewed = peerReviewRepository.existsByReviewerIdAndSubmissionId(studentId, submission.getId());
                    if (!reviewed) {
                        pendingReviews++;
                    }
                }
            }
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalClasses", totalClasses);
        response.put("pendingReviews", pendingReviews);
        response.put("upcomingDeadline", upcomingDeadline);
        return response;
    }

    @Transactional
    public Map<String, String> joinClass(JoinClassRequest request, Long studentId) {
        Classroom classroom = classRepository.findByClassCode(request.getClassCode().trim().toUpperCase())
            .orElseThrow(() -> new ResourceNotFoundException("Class not found"));

        if (!classroom.getPassword().equalsIgnoreCase(request.getPassword().trim())) {
            throw new BadRequestException("Invalid class password");
        }

        if (classEnrollmentRepository.existsByClassroomIdAndStudentId(classroom.getId(), studentId)) {
            throw new BadRequestException("You are already enrolled in this class");
        }

        User student = userService.getById(studentId);
        classEnrollmentRepository.save(ClassEnrollment.builder()
            .classroom(classroom)
            .student(student)
            .build());

        return Map.of("message", "Joined class successfully");
    }

    @Transactional
    public void leaveClass(String classCode, Long studentId) {
        Classroom classroom = classRepository.findByClassCode(classCode)
            .orElseThrow(() -> new ResourceNotFoundException("Class not found"));
        classEnrollmentRepository.deleteByClassroomIdAndStudentId(classroom.getId(), studentId);
    }

    public List<Map<String, Object>> getStudentClasses(Long studentId) {
        List<ClassEnrollment> enrollments = classEnrollmentRepository.findAllByStudentId(studentId);
        return enrollments.stream()
            .sorted(Comparator.comparing(e -> e.getClassroom().getCreatedAt(), Comparator.reverseOrder()))
            .map(enrollment -> {
                Classroom classroom = enrollment.getClassroom();
                long totalAssignments = assignmentRepository.countByClassroomId(classroom.getId());
                long submittedCount = submissionRepository.countByAssignmentClassroomIdAndStudentId(classroom.getId(), studentId);
                double completion = totalAssignments == 0 ? 0 : (submittedCount * 100.0) / totalAssignments;

                Map<String, Object> response = new LinkedHashMap<>();
                response.put("classCode", classroom.getClassCode());
                response.put("className", classroom.getName());
                response.put("subject", classroom.getSubject());
                response.put("teacherName", classroom.getTeacher().getName());
                response.put("gradeLevel", classroom.getGradeLevel());
                response.put("submittedCount", submittedCount);
                response.put("totalAssignments", totalAssignments);
                response.put("completionPercent", Math.round(completion * 100.0) / 100.0);
                return response;
            })
            .toList();
    }

    public Map<String, Object> getStudentClassDetail(String classCode, Long studentId) {
        Classroom classroom = classRepository.findByClassCode(classCode)
            .orElseThrow(() -> new ResourceNotFoundException("Class not found"));
        ensureStudentEnrollment(classroom.getId(), studentId);

        List<AssignmentResponse> assignments = assignmentRepository.findAllByClassroomIdOrderByCreatedAtDesc(classroom.getId())
            .stream()
            .map(assignment -> assignmentService.toStudentAssignmentResponse(assignment, studentId))
            .toList();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("classCode", classroom.getClassCode());
        response.put("className", classroom.getName());
        response.put("subject", classroom.getSubject());
        response.put("teacherName", classroom.getTeacher().getName());
        response.put("gradeLevel", classroom.getGradeLevel());
        response.put("assignments", assignments);
        return response;
    }

    public List<Map<String, Object>> getClassStudentsForStudent(String classCode, Long studentId) {
        Classroom classroom = classRepository.findByClassCode(classCode)
            .orElseThrow(() -> new ResourceNotFoundException("Class not found"));
        ensureStudentEnrollment(classroom.getId(), studentId);

        List<ClassEnrollment> enrollments = classEnrollmentRepository.findAllByClassroomId(classroom.getId());
        return enrollments.stream()
            .map(enrollment -> {
                User student = enrollment.getStudent();
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("studentId", student.getId());
                row.put("name", student.getName());
                row.put("you", student.getId().equals(studentId));
                return row;
            })
            .toList();
    }

    public Map<String, Object> getStudentAssignmentDetail(String classCode, Long assignmentId, Long studentId) {
        Classroom classroom = classRepository.findByClassCode(classCode)
            .orElseThrow(() -> new ResourceNotFoundException("Class not found"));
        ensureStudentEnrollment(classroom.getId(), studentId);

        Assignment assignment = assignmentRepository.findByIdAndClassroomId(assignmentId, classroom.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Assignment not found"));

        var submissionOpt = submissionRepository.findByAssignmentIdAndStudentId(assignmentId, studentId);
        Map<String, Object> submission = null;
        if (submissionOpt.isPresent()) {
            Submission s = submissionOpt.get();
            var gradeOpt = gradeRepository.findBySubmissionId(s.getId());
            submission = new LinkedHashMap<>();
            submission.put("submissionId", s.getId());
            submission.put("fileName", s.getFileName());
            submission.put("fileSizeKb", s.getFileSizeKb());
            submission.put("submittedAt", s.getSubmittedAt());
            submission.put("grade", gradeOpt.map(g -> g.getGrade()).orElse(null));
            submission.put("feedback", gradeOpt.map(g -> g.getFeedback()).orElse(null));
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("assignmentId", assignment.getId());
        response.put("title", assignment.getTitle());
        response.put("description", assignment.getDescription());
        response.put("deadline", assignment.getDeadline());
        response.put("submission", submission);
        return response;
    }

    public Classroom getTeacherClassOrThrow(String classCode, Long teacherId) {
        Classroom classroom = classRepository.findByClassCode(classCode)
            .orElseThrow(() -> new ResourceNotFoundException("Class not found"));
        if (!classroom.getTeacher().getId().equals(teacherId)) {
            throw new UnauthorizedException("You can only access your own classes");
        }
        return classroom;
    }

    public Classroom getClassOrThrow(String classCode) {
        return classRepository.findByClassCode(classCode)
            .orElseThrow(() -> new ResourceNotFoundException("Class not found"));
    }

    public void ensureStudentEnrollment(Long classId, Long studentId) {
        if (!classEnrollmentRepository.existsByClassroomIdAndStudentId(classId, studentId)) {
            throw new UnauthorizedException("Student is not enrolled in this class");
        }
    }

    private List<StudentProgressResponse> buildStudentProgress(Classroom classroom) {
        long totalAssignments = assignmentRepository.countByClassroomId(classroom.getId());
        return classEnrollmentRepository.findAllByClassroomId(classroom.getId())
            .stream()
            .map(enrollment -> {
                User student = enrollment.getStudent();
                long submitted = submissionRepository.countByAssignmentClassroomIdAndStudentId(classroom.getId(), student.getId());
                double completion = totalAssignments == 0 ? 0 : (submitted * 100.0) / totalAssignments;
                return StudentProgressResponse.builder()
                    .studentId(student.getId())
                    .name(student.getName())
                    .userId("user_" + student.getId())
                    .submittedCount(submitted)
                    .totalAssignments(totalAssignments)
                    .completionPercent(Math.round(completion * 100.0) / 100.0)
                    .build();
            })
            .collect(Collectors.toList());
    }
}
