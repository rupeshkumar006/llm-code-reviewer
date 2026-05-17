package com.codereviewer.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewRequest {

    @NotBlank(message = "Code must not be empty")
    @Size(max = 51200, message = "Code must not exceed 50KB")
    private String code;

    @NotBlank(message = "Language must be specified")
    private String language;
}
