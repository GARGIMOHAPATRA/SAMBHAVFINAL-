package com.accessibleconnect.backend.auth.service;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String mailFrom;

    /**
     * Sends the password reset OTP to the user's email address.
     * Returns true if sent via SMTP, or false if logged to console / fallback.
     */
    public boolean sendPasswordResetEmail(String toEmail, String otp) {
        log.info("=================================================");
        log.info("[SAMBHAV Security] Password Reset OTP for: {}", toEmail);
        log.info("[SAMBHAV Security] Verification Code: {}", otp);
        log.info("[SAMBHAV Security] Valid for: 10 minutes");
        log.info("=================================================");

        if (mailSender == null || mailFrom == null || mailFrom.trim().isEmpty()) {
            log.warn("[SAMBHAV Email] SMTP credentials not configured (SPRING_MAIL_USERNAME is blank). OTP was logged above for verification.");
            return false;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(mailFrom, "Sambhav Accessibility AI");
            helper.setTo(toEmail);
            helper.setSubject("SAMBHAV: " + otp + " is your verification code");

            String htmlBody = """
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <style>
                    body { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #f7fafc; margin: 0; padding: 24px; color: #181c1e; }
                    .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e0e3e5; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
                    .header { text-align: center; margin-bottom: 24px; }
                    .logo { font-size: 24px; font-weight: 800; color: #030813; letter-spacing: -0.5px; }
                    .logo span { color: #fe9832; }
                    .badge { display: inline-block; background: #fff4eb; color: #8f4e00; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; margin-bottom: 12px; }
                    .otp-box { background: #f1f4f6; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; border: 1px dashed #fe9832; }
                    .otp-code { font-family: 'Courier New', monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #683700; margin: 0; }
                    .footer { text-align: center; font-size: 11px; color: #828796; margin-top: 24px; line-height: 1.5; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <div class="badge">SECURITY VERIFICATION</div>
                      <div class="logo">SAM<span>BHAV</span></div>
                    </div>
                    <p style="font-size: 15px; font-weight: 600; margin-bottom: 8px;">Hello,</p>
                    <p style="font-size: 13px; color: #45474c; line-height: 1.6;">
                      We received a request to reset the password for your SAMBHAV accessibility account (<strong>%s</strong>).
                    </p>
                    <div class="otp-box">
                      <p style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #8f4e00; margin: 0 0 8px 0;">Your 6-Digit OTP</p>
                      <h2 class="otp-code">%s</h2>
                    </div>
                    <p style="font-size: 12px; color: #45474c; line-height: 1.5;">
                      This verification code is valid for <strong>10 minutes</strong>. If you did not request this password reset, please ignore this email or reach out to security support immediately.
                    </p>
                    <div class="footer">
                      &copy; 2026 Sambhav Accessibility AI. All rights reserved.<br>
                      Indian Sign Language &amp; Universal Access Platform
                    </div>
                  </div>
                </body>
                </html>
                """.formatted(toEmail, otp);

            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("[SAMBHAV Email] Verification email successfully delivered via SMTP to {}", toEmail);
            return true;
        } catch (Exception e) {
            log.error("[SAMBHAV Email] Failed to send email via SMTP to {}: {}", toEmail, e.getMessage());
            return false;
        }
    }
}
