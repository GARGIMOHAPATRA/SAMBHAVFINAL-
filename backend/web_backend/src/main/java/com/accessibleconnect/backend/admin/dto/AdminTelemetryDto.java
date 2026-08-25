package com.accessibleconnect.backend.admin.dto;

public class AdminTelemetryDto {
    private long activeSessions;
    private long totalSessions;
    private long onlineSessions;
    private long offlineSessions;
    private long totalUsers;
    private long totalAdmins;
    private long tokenAllocations;
    private long failedAccessAttempts;

    public AdminTelemetryDto() {}

    public AdminTelemetryDto(long activeSessions, long totalSessions, long onlineSessions, long offlineSessions,
                             long totalUsers, long totalAdmins, long tokenAllocations, long failedAccessAttempts) {
        this.activeSessions = activeSessions;
        this.totalSessions = totalSessions;
        this.onlineSessions = onlineSessions;
        this.offlineSessions = offlineSessions;
        this.totalUsers = totalUsers;
        this.totalAdmins = totalAdmins;
        this.tokenAllocations = tokenAllocations;
        this.failedAccessAttempts = failedAccessAttempts;
    }

    // Getters and Setters
    public long getActiveSessions() { return activeSessions; }
    public void setActiveSessions(long activeSessions) { this.activeSessions = activeSessions; }

    public long getTotalSessions() { return totalSessions; }
    public void setTotalSessions(long totalSessions) { this.totalSessions = totalSessions; }

    public long getOnlineSessions() { return onlineSessions; }
    public void setOnlineSessions(long onlineSessions) { this.onlineSessions = onlineSessions; }

    public long getOfflineSessions() { return offlineSessions; }
    public void setOfflineSessions(long offlineSessions) { this.offlineSessions = offlineSessions; }

    public long getTotalUsers() { return totalUsers; }
    public void setTotalUsers(long totalUsers) { this.totalUsers = totalUsers; }

    public long getTotalAdmins() { return totalAdmins; }
    public void setTotalAdmins(long totalAdmins) { this.totalAdmins = totalAdmins; }

    public long getTokenAllocations() { return tokenAllocations; }
    public void setTokenAllocations(long tokenAllocations) { this.tokenAllocations = tokenAllocations; }

    public long getFailedAccessAttempts() { return failedAccessAttempts; }
    public void setFailedAccessAttempts(long failedAccessAttempts) { this.failedAccessAttempts = failedAccessAttempts; }
}
