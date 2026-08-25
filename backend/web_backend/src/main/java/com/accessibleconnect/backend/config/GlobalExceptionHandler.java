package com.accessibleconnect.backend.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @Autowired
    private com.accessibleconnect.backend.admin.service.CommunicationAuditService auditService;

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("code", "VALIDATION_ERROR");
        body.put("message", "Validation failed for one or more fields");

        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        body.put("fieldErrors", errors);

        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("code", "BAD_REQUEST");
        body.put("message", ex.getMessage());
        body.put("fieldErrors", new HashMap<>());
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleConflict(org.springframework.dao.DataIntegrityViolationException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.CONFLICT.value());
        body.put("code", "CONFLICT_ERROR");
        body.put("message", "Conflict occurred. The record (such as email) might already exist.");
        body.put("fieldErrors", new HashMap<>());

        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    @ExceptionHandler(org.springframework.security.authentication.BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleBadCredentials(org.springframework.security.authentication.BadCredentialsException ex, jakarta.servlet.http.HttpServletRequest request) {
        auditService.logEvent(
                "anonymousUser",
                "AUTHENTICATION_FAILURE",
                null,
                "FAILURE",
                "Invalid login credentials provided.",
                request.getRemoteAddr()
        );

        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.UNAUTHORIZED.value());
        body.put("code", "UNAUTHORIZED");
        body.put("message", "Invalid email or password.");
        body.put("fieldErrors", new HashMap<>());

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
    }

    @ExceptionHandler(com.accessibleconnect.backend.communication.exception.SessionNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleSessionNotFound(com.accessibleconnect.backend.communication.exception.SessionNotFoundException ex, jakarta.servlet.http.HttpServletRequest request) {
        String actor = getPrincipalName();
        auditService.logEvent(
                actor,
                "SESSION_NOT_FOUND",
                null,
                "FAILURE",
                ex.getMessage(),
                request.getRemoteAddr()
        );

        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.NOT_FOUND.value());
        body.put("code", "SESSION_NOT_FOUND");
        body.put("message", ex.getMessage());
        body.put("fieldErrors", new HashMap<>());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    @ExceptionHandler(com.accessibleconnect.backend.communication.exception.UnauthorizedSessionAccessException.class)
    public ResponseEntity<Map<String, Object>> handleUnauthorizedSessionAccess(com.accessibleconnect.backend.communication.exception.UnauthorizedSessionAccessException ex, jakarta.servlet.http.HttpServletRequest request) {
        String actor = getPrincipalName();
        auditService.logEvent(
                actor,
                "UNAUTHORIZED_SESSION_ACCESS",
                null,
                "ACCESS_DENIED",
                ex.getMessage(),
                request.getRemoteAddr()
        );

        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.FORBIDDEN.value());
        body.put("code", "UNAUTHORIZED_ACCESS");
        body.put("message", ex.getMessage());
        body.put("fieldErrors", new HashMap<>());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
    }

    @ExceptionHandler(com.accessibleconnect.backend.communication.exception.InvalidSessionStateException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidSessionState(com.accessibleconnect.backend.communication.exception.InvalidSessionStateException ex, jakarta.servlet.http.HttpServletRequest request) {
        String actor = getPrincipalName();
        auditService.logEvent(
                actor,
                "INVALID_SESSION_STATE_REQUEST",
                null,
                "FAILURE",
                ex.getMessage(),
                request.getRemoteAddr()
        );

        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("code", "INVALID_SESSION_STATE");
        body.put("message", ex.getMessage());
        body.put("fieldErrors", new HashMap<>());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(com.accessibleconnect.backend.communication.exception.DuplicateRoomCodeException.class)
    public ResponseEntity<Map<String, Object>> handleDuplicateRoomCode(com.accessibleconnect.backend.communication.exception.DuplicateRoomCodeException ex, jakarta.servlet.http.HttpServletRequest request) {
        String actor = getPrincipalName();
        auditService.logEvent(
                actor,
                "DUPLICATE_ROOM_CODE",
                null,
                "FAILURE",
                ex.getMessage(),
                request.getRemoteAddr()
        );

        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.CONFLICT.value());
        body.put("code", "DUPLICATE_ROOM_CODE");
        body.put("message", ex.getMessage());
        body.put("fieldErrors", new HashMap<>());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(org.springframework.security.access.AccessDeniedException ex, jakarta.servlet.http.HttpServletRequest request) {
        String actor = getPrincipalName();
        auditService.logEvent(
                actor,
                "API_ACCESS_DENIED",
                null,
                "ACCESS_DENIED",
                "Unauthorized access attempted on URL path: " + request.getRequestURI(),
                request.getRemoteAddr()
        );

        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.FORBIDDEN.value());
        body.put("code", "ACCESS_DENIED");
        body.put("message", "Access denied. You do not possess the required administrator authorizations.");
        body.put("fieldErrors", new HashMap<>());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalState(IllegalStateException ex, jakarta.servlet.http.HttpServletRequest request) {
        String actor = getPrincipalName();
        auditService.logEvent(
                actor,
                "INTERNAL_STATE_ERROR",
                null,
                "FAILURE",
                ex.getMessage(),
                request.getRemoteAddr()
        );

        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        body.put("code", "INTERNAL_ERROR");
        body.put("message", ex.getMessage());
        body.put("fieldErrors", new HashMap<>());

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleAllOthers(Exception ex, jakarta.servlet.http.HttpServletRequest request) {
        String actor = getPrincipalName();
        auditService.logEvent(
                actor,
                "INTERNAL_SERVER_ERROR",
                null,
                "FAILURE",
                ex.getClass().getSimpleName() + ": " + ex.getMessage(),
                request.getRemoteAddr()
        );

        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        body.put("code", "INTERNAL_ERROR");
        body.put("message", "An unexpected error occurred.");
        body.put("fieldErrors", new HashMap<>());

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }

    private String getPrincipalName() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
            return auth.getName();
        }
        return "anonymousUser";
    }
}
