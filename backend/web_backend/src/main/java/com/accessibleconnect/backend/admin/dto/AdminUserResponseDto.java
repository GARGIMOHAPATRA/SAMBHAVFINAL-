package com.accessibleconnect.backend.admin.dto;

import java.util.UUID;

public class AdminUserResponseDto {
    private UUID id;
    private String name;
    private String email;
    private String phone;
    private String accountType;
    private boolean enabled;
    private String createdAt;

    public AdminUserResponseDto() {}

    public AdminUserResponseDto(UUID id, String name, String email, String phone, String accountType, boolean enabled, String createdAt) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.accountType = accountType;
        this.enabled = enabled;
        this.createdAt = createdAt;
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getAccountType() { return accountType; }
    public void setAccountType(String accountType) { this.accountType = accountType; }

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
