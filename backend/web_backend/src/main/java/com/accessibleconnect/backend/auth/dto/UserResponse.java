package com.accessibleconnect.backend.auth.dto;

import com.accessibleconnect.backend.user.entity.AccountType;
import java.util.UUID;

public class UserResponse {
    private UUID id;
    private String name;
    private String email;
    private String phone;
    private AccountType accountType;
    private boolean enabled;
    private Object profile;

    public UserResponse() {}

    public UserResponse(UUID id, String name, String email, String phone, AccountType accountType, boolean enabled) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.accountType = accountType;
        this.enabled = enabled;
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

    public AccountType getAccountType() { return accountType; }
    public void setAccountType(AccountType accountType) { this.accountType = accountType; }

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public Object getProfile() { return profile; }
    public void setProfile(Object profile) { this.profile = profile; }
}
