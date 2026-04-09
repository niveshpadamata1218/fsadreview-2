package com.reviewin.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateClassRequest {

    @NotBlank(message = "Class name is required")
    private String name;

    private String subject;

    private String gradeLevel;

    private String classFocus;
}
