package com.reviewin.dto.response;

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
public class PeerReviewResponse {
    private Long reviewId;
    private Long reviewerId;
    private String reviewerName;
    private Long submissionId;
    private String submittee;
    private String grade;
    private String feedback;
    private LocalDateTime reviewedAt;
}
