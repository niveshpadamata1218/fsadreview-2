package com.reviewin.controller;

import com.reviewin.dto.request.JoinClassRequest;
import com.reviewin.service.ClassService;
import com.reviewin.util.SecurityUtils;
import jakarta.validation.Valid;
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
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/student")
@RequiredArgsConstructor
@PreAuthorize("hasRole('STUDENT')")
public class StudentController {

    private final ClassService classService;

    @GetMapping("/overview")
    public ResponseEntity<Map<String, Object>> overview() {
        Long studentId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(classService.getStudentOverview(studentId));
    }

    @PostMapping("/classes/join")
    public ResponseEntity<Map<String, String>> joinClass(@Valid @RequestBody JoinClassRequest request) {
        Long studentId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(classService.joinClass(request, studentId));
    }

    @DeleteMapping("/classes/{classCode}/leave")
    public ResponseEntity<Map<String, String>> leaveClass(@PathVariable String classCode) {
        Long studentId = SecurityUtils.getCurrentUserId();
        classService.leaveClass(classCode, studentId);
        return ResponseEntity.ok(Map.of("message", "Left class"));
    }

    @GetMapping("/classes")
    public ResponseEntity<List<Map<String, Object>>> myClasses() {
        Long studentId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(classService.getStudentClasses(studentId));
    }

    @GetMapping("/classes/{classCode}")
    public ResponseEntity<Map<String, Object>> classDetail(@PathVariable String classCode) {
        Long studentId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(classService.getStudentClassDetail(classCode, studentId));
    }

    @GetMapping("/classes/{classCode}/students")
    public ResponseEntity<List<Map<String, Object>>> classStudents(@PathVariable String classCode) {
        Long studentId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(classService.getClassStudentsForStudent(classCode, studentId));
    }

    @GetMapping("/classes/{classCode}/assignments/{assignmentId}")
    public ResponseEntity<Map<String, Object>> assignmentDetail(
        @PathVariable String classCode,
        @PathVariable Long assignmentId
    ) {
        Long studentId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(classService.getStudentAssignmentDetail(classCode, assignmentId, studentId));
    }
}
