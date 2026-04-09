package com.reviewin.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GradeRequest {

    @NotBlank(message = "Grade is required")
    private String grade;

    private String feedback;
}
