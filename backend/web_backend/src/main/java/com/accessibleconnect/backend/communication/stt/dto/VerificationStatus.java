package com.accessibleconnect.backend.communication.stt.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

@JsonFormat(shape = JsonFormat.Shape.STRING)
public enum VerificationStatus {
    DRAFT,
    IN_REVIEW,
    VERIFIED
}
