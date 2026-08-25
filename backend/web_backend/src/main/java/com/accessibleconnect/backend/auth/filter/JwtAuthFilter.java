package com.accessibleconnect.backend.auth.filter;

import com.accessibleconnect.backend.auth.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    @Autowired
    private JwtService jwtService;

    @Value("${cors.allowed-origins:http://localhost:5173}")
    private String allowedOrigins;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        final String path = request.getRequestURI();
        
        // 1. Explicit CSRF Defense: Origin-header validation on cookie-authenticated routes
        if ("/api/auth/refresh".equals(path) || "/api/auth/logout".equals(path)) {
            String origin = request.getHeader("Origin");
            if (origin != null) {
                boolean match = false;
                for (String allowed : allowedOrigins.split(",")) {
                    if ("*".equals(allowed.trim()) || origin.trim().equalsIgnoreCase(allowed.trim())) {
                        match = true;
                        break;
                    }
                }
                if (!match) {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"code\":\"CSRF_BLOCKED\",\"message\":\"Origin header validation failed.\"}");
                    return;
                }
            }
        }

        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String email;

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        jwt = authHeader.substring(7);
        try {
            if (jwtService.isTokenExpired(jwt)) {
                filterChain.doFilter(request, response);
                return;
            }
            email = jwtService.extractEmail(jwt);
            String role = jwtService.extractRole(jwt); // COMMON_USER, ACCESSIBILITY_USER, ADMIN

            if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        email,
                        null,
                        Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role))
                );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        } catch (Exception e) {
            // Log warning or ignore; invalid tokens will fail security checks
        }

        filterChain.doFilter(request, response);
    }
}
