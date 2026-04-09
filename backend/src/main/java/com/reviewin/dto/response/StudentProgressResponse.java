package com.reviewin.dto.response;

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
public class StudentProgressResponse {
    private Long studentId;
    private String name;
    private String userId;
    private Long submittedCount;
    private Long totalAssignments;
    private Double completionPercent;
}
