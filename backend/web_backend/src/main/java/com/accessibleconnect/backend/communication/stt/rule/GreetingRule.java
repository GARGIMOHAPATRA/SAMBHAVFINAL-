package com.accessibleconnect.backend.communication.stt.rule;

import com.accessibleconnect.backend.communication.stt.dto.ISLToken;
import com.accessibleconnect.backend.communication.stt.dto.ISLTokenCategory;
import com.accessibleconnect.backend.communication.stt.dto.SemanticRepresentation;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
public class GreetingRule implements ISLRule {
    @Override
    public boolean evaluate(SemanticRepresentation semantic) {
        return "greeting".equalsIgnoreCase(semantic.getIntent()) || "greet".equalsIgnoreCase(semantic.getAction());
    }

    @Override
    public List<ISLToken> apply(SemanticRepresentation semantic) {
        ISLToken token = new ISLToken(
                "HELLO",
                "HELLO",
                ISLTokenCategory.GREETING,
                "greet",
                semantic.getConfidence(),
                1 // MVP heuristic ordering weight
        );
        return Collections.singletonList(token);
    }
}
