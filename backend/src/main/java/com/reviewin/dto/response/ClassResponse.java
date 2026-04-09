package com.reviewin.dto.response;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassResponse {
    private String classCode;
    private String password;
    private String name;
    private String subject;
    private String gradeLevel;
    private String classFocus;
    private Long studentCount;
    private Long assignmentCount;
    private List<AssignmentMiniResponse> assignments;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AssignmentMiniResponse {
        private Long assignmentId;
        private String title;
        private Long submissionCount;
    }
}
