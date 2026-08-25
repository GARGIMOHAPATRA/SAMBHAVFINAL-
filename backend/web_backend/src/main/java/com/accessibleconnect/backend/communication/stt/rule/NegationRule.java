package com.accessibleconnect.backend.communication.stt.rule;

import com.accessibleconnect.backend.communication.stt.dto.ISLToken;
import com.accessibleconnect.backend.communication.stt.dto.ISLTokenCategory;
import com.accessibleconnect.backend.communication.stt.dto.SemanticRepresentation;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Locale;

@Component
public class NegationRule implements ISLRule {
    @Override
    public boolean evaluate(SemanticRepresentation semantic) {
        String text = semantic.getOriginalText() != null ? semantic.getOriginalText().toLowerCase(Locale.ROOT) : "";
        return "negation".equalsIgnoreCase(semantic.getIntent()) ||
               text.contains("not") || 
               text.contains("no ") || 
               text.contains("don't") ||
               text.contains("cannot") ||
               text.contains("can't");
    }

    @Override
    public List<ISLToken> apply(SemanticRepresentation semantic) {
        ISLToken token = new ISLToken(
                "NOT",
                "NOT",
                ISLTokenCategory.NEGATION,
                "negation marker",
                semantic.getConfidence(),
                6 // MVP heuristic ordering weight
        );
        return Collections.singletonList(token);
    }
}
