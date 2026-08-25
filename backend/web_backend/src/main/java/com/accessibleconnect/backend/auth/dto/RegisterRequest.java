package com.accessibleconnect.backend.auth.dto;

import com.accessibleconnect.backend.profile.entity.AccessibilityNeedType;
import com.accessibleconnect.backend.user.entity.AccountType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public class RegisterRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name must be less than 100 characters")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    @Size(max = 255, message = "Email must be less than 255 characters")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters long")
    private String password;

    private String phone;

    @NotNull(message = "Account type is required")
    private AccountType accountType;

    // Accessibility profile details (optional during registration, filled if accountType is ACCESSIBILITY_USER)
    private List<AccessibilityNeedType> accessibilityNeeds;

    private String preferredLanguage;

    private String preferredSignLanguage;

    private String textSizePreference;

    private boolean highContrastPreference = false;

    private String communicationPreference;

    public RegisterRequest() {}

    // Getters and Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public AccountType getAccountType() { return accountType; }
    public void setAccountType(AccountType accountType) { this.accountType = accountType; }

    public List<AccessibilityNeedType> getAccessibilityNeeds() { return accessibilityNeeds; }
    public void setAccessibilityNeeds(List<AccessibilityNeedType> accessibilityNeeds) { this.accessibilityNeeds = accessibilityNeeds; }

    public String getPreferredLanguage() { return preferredLanguage; }
    public void setPreferredLanguage(String preferredLanguage) { this.preferredLanguage = preferredLanguage; }

    public String getPreferredSignLanguage() { return preferredSignLanguage; }
    public void setPreferredSignLanguage(String preferredSignLanguage) { this.preferredSignLanguage = preferredSignLanguage; }

    public String getTextSizePreference() { return textSizePreference; }
    public void setTextSizePreference(String textSizePreference) { this.textSizePreference = textSizePreference; }

    public boolean isHighContrastPreference() { return highContrastPreference; }
    public void setHighContrastPreference(boolean highContrastPreference) { this.highContrastPreference = highContrastPreference; }

    public String getCommunicationPreference() { return communicationPreference; }
    public void setCommunicationPreference(String communicationPreference) { this.communicationPreference = communicationPreference; }
}
