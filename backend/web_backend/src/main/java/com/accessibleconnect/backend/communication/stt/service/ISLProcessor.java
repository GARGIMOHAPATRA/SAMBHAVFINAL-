package com.accessibleconnect.backend.communication.stt.service;

import com.accessibleconnect.backend.communication.stt.dto.ISLToken;
import com.accessibleconnect.backend.communication.stt.dto.SemanticRepresentation;
import com.accessibleconnect.backend.communication.stt.rule.ISLRule;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Component
public class ISLProcessor {
    private final List<ISLRule> rules;

    public ISLProcessor(List<ISLRule> rules) {
        this.rules = rules;
    }

    public List<ISLToken> process(SemanticRepresentation semantic) {
        List<ISLToken> tokens = new ArrayList<>();
        if (semantic == null) return tokens;

        // Apply matching rules
        for (ISLRule rule : rules) {
            if (rule.evaluate(semantic)) {
                tokens.addAll(rule.apply(semantic));
            }
        }

        // Sort by MVP heuristic ordering weight
        tokens.sort(Comparator.comparingInt(ISLToken::getOrder));

        return tokens;
    }
}
