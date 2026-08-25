package com.accessibleconnect.backend.communication.stt.rule;

import com.accessibleconnect.backend.communication.stt.dto.ISLToken;
import com.accessibleconnect.backend.communication.stt.dto.SemanticRepresentation;

import java.util.List;

public interface ISLRule {
    boolean evaluate(SemanticRepresentation semantic);
    List<ISLToken> apply(SemanticRepresentation semantic);
}
