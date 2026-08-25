package com.accessibleconnect.backend.communication.stt.rule;

import com.accessibleconnect.backend.communication.stt.dto.ISLToken;
import com.accessibleconnect.backend.communication.stt.dto.ISLTokenCategory;
import com.accessibleconnect.backend.communication.stt.dto.SemanticRepresentation;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Locale;

@Component
public class ActionRule implements ISLRule {
    @Override
    public boolean evaluate(SemanticRepresentation semantic) {
        return semantic.getAction() != null && 
               !semantic.getAction().trim().isEmpty() && 
               !"speak".equalsIgnoreCase(semantic.getAction().trim()) &&
               !"greet".equalsIgnoreCase(semantic.getAction().trim());
    }

    @Override
    public List<ISLToken> apply(SemanticRepresentation semantic) {
        String actionStr = semantic.getAction().trim().toUpperCase(Locale.ROOT);
        ISLToken token = new ISLToken(
                actionStr,
                actionStr,
                ISLTokenCategory.ACTION,
                "action",
                semantic.getConfidence(),
                4 // MVP heuristic ordering weight
        );
        return Collections.singletonList(token);
    }
}
