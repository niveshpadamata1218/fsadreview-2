package com.reviewin.controller;

import com.reviewin.dto.request.CreateAssignmentRequest;
import com.reviewin.dto.request.CreateClassRequest;
import com.reviewin.dto.request.GradeRequest;
import com.reviewin.dto.response.AssignmentResponse;
import com.reviewin.dto.response.ClassResponse;
import com.reviewin.model.Grade;
import com.reviewin.service.AssignmentService;
import com.reviewin.service.ClassService;
import com.reviewin.service.GradeService;
import com.reviewin.util.SecurityUtils;
import jakarta.validation.Valid;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/teacher")
@RequiredArgsConstructor
@PreAuthorize("hasRole('TEACHER')")
public class TeacherController {

    private final ClassService classService;
    private final AssignmentService assignmentService;
    private final GradeService gradeService;

    @GetMapping("/overview")
    public ResponseEntity<Map<String, Object>> overview() {
        Long teacherId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(classService.getTeacherOverview(teacherId));
    }

    @PostMapping("/classes")
    public ResponseEntity<ClassResponse> createClass(@Valid @RequestBody CreateClassRequest request) {
        Long teacherId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(classService.createClass(request, teacherId));
    }

    @GetMapping("/classes")
    public ResponseEntity<List<ClassResponse>> getClasses() {
        Long teacherId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(classService.getTeacherClasses(teacherId));
    }

    @GetMapping("/classes/{classCode}")
    public ResponseEntity<Map<String, Object>> getClassDetail(@PathVariable String classCode) {
        Long teacherId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(classService.getTeacherClassDetail(classCode, teacherId));
    }

    @DeleteMapping("/classes/{classCode}")
    public ResponseEntity<Map<String, String>> deleteClass(@PathVariable String classCode) {
        Long teacherId = SecurityUtils.getCurrentUserId();
        classService.deleteClass(classCode, teacherId);
        return ResponseEntity.ok(Map.of("message", "Class deleted"));
    }

    @PostMapping("/classes/{classCode}/assignments")
    public ResponseEntity<AssignmentResponse> createAssignment(
        @PathVariable String classCode,
        @Valid @RequestBody CreateAssignmentRequest request
    ) {
        Long teacherId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(assignmentService.createAssignment(classCode, request, teacherId));
    }

    @DeleteMapping("/classes/{classCode}/assignments/{assignmentId}")
    public ResponseEntity<Map<String, String>> deleteAssignment(
        @PathVariable String classCode,
        @PathVariable Long assignmentId
    ) {
        Long teacherId = SecurityUtils.getCurrentUserId();
        assignmentService.deleteAssignment(classCode, assignmentId, teacherId);
        return ResponseEntity.ok(Map.of("message", "Assignment deleted"));
    }

    @GetMapping("/classes/{classCode}/submissions")
    public ResponseEntity<List<Map<String, Object>>> submissions(
        @PathVariable String classCode,
        @RequestParam(defaultValue = "ALL") String filter
    ) {
        Long teacherId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(classService.getClassSubmissions(classCode, filter, teacherId));
    }

    @PostMapping("/submissions/{submissionId}/grade")
    public ResponseEntity<Map<String, Object>> gradeSubmission(
        @PathVariable Long submissionId,
        @Valid @RequestBody GradeRequest request
    ) {
        Long teacherId = SecurityUtils.getCurrentUserId();
        Grade grade = gradeService.upsertGrade(submissionId, request, teacherId);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("message", "Grade saved");
        response.put("submissionId", submissionId);
        response.put("grade", grade.getGrade());
        response.put("feedback", grade.getFeedback());
        response.put("gradedAt", grade.getGradedAt());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/classes/{classCode}/peer-reviews")
    public ResponseEntity<List<Map<String, Object>>> peerReviews(@PathVariable String classCode) {
        Long teacherId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(classService.getClassPeerReviews(classCode, teacherId));
    }

    @GetMapping("/classes/{classCode}/students")
    public ResponseEntity<?> students(@PathVariable String classCode) {
        Long teacherId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(classService.getStudentsForTeacherClass(classCode, teacherId));
    }

    @DeleteMapping("/classes/{classCode}/students/{studentId}")
    public ResponseEntity<Map<String, String>> removeStudent(
        @PathVariable String classCode,
        @PathVariable Long studentId
    ) {
        Long teacherId = SecurityUtils.getCurrentUserId();
        classService.removeStudentFromClass(classCode, studentId, teacherId);
        return ResponseEntity.ok(Map.of("message", "Student removed"));
    }

    @GetMapping("/classes/{classCode}/students/{studentId}/history")
    public ResponseEntity<Map<String, Object>> studentHistory(
        @PathVariable String classCode,
        @PathVariable Long studentId
    ) {
        Long teacherId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(classService.getStudentHistory(classCode, studentId, teacherId));
    }
}
