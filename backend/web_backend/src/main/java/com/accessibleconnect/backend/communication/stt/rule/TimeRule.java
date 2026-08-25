package com.accessibleconnect.backend.communication.stt.rule;

import com.accessibleconnect.backend.communication.stt.dto.ISLToken;
import com.accessibleconnect.backend.communication.stt.dto.ISLTokenCategory;
import com.accessibleconnect.backend.communication.stt.dto.SemanticRepresentation;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Locale;

@Component
public class TimeRule implements ISLRule {
    @Override
    public boolean evaluate(SemanticRepresentation semantic) {
        return semantic.getTime() != null && 
               !semantic.getTime().trim().isEmpty() && 
               !"now".equalsIgnoreCase(semantic.getTime().trim());
    }

    @Override
    public List<ISLToken> apply(SemanticRepresentation semantic) {
        String rawTime = semantic.getTime().trim().toUpperCase(Locale.ROOT);
        ISLToken token = new ISLToken(
                rawTime,
                rawTime,
                ISLTokenCategory.TIME,
                "time",
                semantic.getConfidence(),
                2 // MVP heuristic ordering weight
        );
        return Collections.singletonList(token);
    }
}
