package com.accessibleconnect.backend.communication.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class CreateCommunicationSessionRequest {

    @NotBlank(message = "Communication mode is required")
    @Pattern(regexp = "ONLINE|OFFLINE", message = "Mode must be either ONLINE or OFFLINE")
    private String mode;

    public CreateCommunicationSessionRequest() {}

    public CreateCommunicationSessionRequest(String mode) {
        this.mode = mode;
    }

    public String getMode() {
        return mode;
    }

    public void setMode(String mode) {
        this.mode = mode;
    }
}
