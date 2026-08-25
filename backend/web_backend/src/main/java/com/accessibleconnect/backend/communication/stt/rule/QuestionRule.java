package com.accessibleconnect.backend.communication.stt.rule;

import com.accessibleconnect.backend.communication.stt.dto.ISLToken;
import com.accessibleconnect.backend.communication.stt.dto.ISLTokenCategory;
import com.accessibleconnect.backend.communication.stt.dto.SemanticRepresentation;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
public class QuestionRule implements ISLRule {
    @Override
    public boolean evaluate(SemanticRepresentation semantic) {
        String text = semantic.getOriginalText() != null ? semantic.getOriginalText() : "";
        return "question".equalsIgnoreCase(semantic.getIntent()) || text.contains("?");
    }

    @Override
    public List<ISLToken> apply(SemanticRepresentation semantic) {
        ISLToken token = new ISLToken(
                "QUESTION",
                "QUESTION",
                ISLTokenCategory.QUESTION,
                "question marker",
                semantic.getConfidence(),
                5 // MVP heuristic ordering weight
        );
        return Collections.singletonList(token);
    }
}
