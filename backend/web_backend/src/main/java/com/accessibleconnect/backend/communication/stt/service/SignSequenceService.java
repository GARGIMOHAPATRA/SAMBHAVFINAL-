package com.accessibleconnect.backend.communication.stt.service;

import com.accessibleconnect.backend.communication.stt.dto.ISLRepresentation;
import com.accessibleconnect.backend.communication.stt.dto.SignSequence;

public interface SignSequenceService {
    SignSequence generateSequence(String sessionId, ISLRepresentation representation);
}
