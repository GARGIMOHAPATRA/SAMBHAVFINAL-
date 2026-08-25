package com.accessibleconnect.backend.communication.stt.rule;

import com.accessibleconnect.backend.communication.stt.dto.ISLToken;
import com.accessibleconnect.backend.communication.stt.dto.ISLTokenCategory;
import com.accessibleconnect.backend.communication.stt.dto.SemanticRepresentation;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Component
public class LocationRule implements ISLRule {
    @Override
    public boolean evaluate(SemanticRepresentation semantic) {
        if (semantic.getEntities() == null) return false;
        return semantic.getEntities().stream()
                .anyMatch(e -> "location".equalsIgnoreCase(e.getType()));
    }

    @Override
    public List<ISLToken> apply(SemanticRepresentation semantic) {
        List<ISLToken> tokens = new ArrayList<>();
        if (semantic.getEntities() != null) {
            for (SemanticRepresentation.Entity entity : semantic.getEntities()) {
                if ("location".equalsIgnoreCase(entity.getType())) {
                    String loc = entity.getValue().trim().toUpperCase(Locale.ROOT);
                    tokens.add(new ISLToken(
                            loc,
                            loc,
                            ISLTokenCategory.LOCATION,
                            "location entity",
                            semantic.getConfidence(),
                            3 // MVP heuristic ordering weight
                    ));
                }
            }
        }
        return tokens;
    }
}
