package com.accessibleconnect.backend.communication.stt.service;

import com.accessibleconnect.backend.communication.stt.dto.ISLRepresentation;
import com.accessibleconnect.backend.communication.stt.dto.SemanticRepresentation;

public interface ISLService {
    ISLRepresentation generateISL(String sessionId, SemanticRepresentation semantic);
}
