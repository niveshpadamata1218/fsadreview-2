package com.reviewin.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class JoinClassRequest {

    @NotBlank(message = "Class code is required")
    private String classCode;

    @NotBlank(message = "Password is required")
    private String password;
}
