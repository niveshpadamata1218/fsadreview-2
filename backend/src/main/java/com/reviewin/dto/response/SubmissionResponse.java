package com.reviewin.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
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
public class SubmissionResponse {
    private Long submissionId;
    private Long assignmentId;
    private Long studentId;
    private String studentName;
    private String fileName;
    private String filePath;
    private BigDecimal fileSizeKb;
    private LocalDateTime submittedAt;
    private String grade;
    private String feedback;
    private String status;
}
