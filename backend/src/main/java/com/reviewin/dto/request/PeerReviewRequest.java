package com.reviewin.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PeerReviewRequest {

    @NotBlank(message = "Grade is required")
    private String grade;

    @NotBlank(message = "Feedback is required")
    private String feedback;
}
