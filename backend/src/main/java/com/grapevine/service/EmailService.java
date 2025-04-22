package com.grapevine.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EmailService {
    private final JavaMailSender mailSender;

    @Value("${spring.mail.from:noreply@studygrapevine.com}")
    private String fromAddress;

    public void sendVerificationEmail(String to, String token) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);  // Add from address
        message.setTo(to);
        message.setSubject("Email Verification");
        message.setText("Your verification code is: " + token);
        mailSender.send(message);
    }

    public void sendVerificationEmail(String to, String subject, String content) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);  // Add from address
        message.setTo(to);
        message.setSubject(subject);
        message.setText(content);
        mailSender.send(message);
    }

    public void sendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(fromAddress);  // Add from address
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true); // true indicates HTML content

            mailSender.send(mimeMessage);
        } catch (MessagingException e) {
            // Fallback to plain text email
            sendVerificationEmail(to, subject,
                    "Access request from user to join group. Please visit the links below:\n\n" +
                            "Accept: " + extractUrl(htmlContent, "Accept") + "\n" +
                            "Deny: " + extractUrl(htmlContent, "Deny"));
        }
    }

    // Helper method unchanged
    String extractUrl(String htmlContent, String buttonType) {
        try {
            String searchStart = buttonType.equals("Accept") ?
                    "href=\"" : "Deny</a></td>"; // Different search pattern based on button

            int startIndex = htmlContent.indexOf(searchStart);
            if (startIndex == -1) return "URL not found";

            if (buttonType.equals("Accept")) {
                startIndex += 6; // Length of href="
                int endIndex = htmlContent.indexOf("\"", startIndex);
                return htmlContent.substring(startIndex, endIndex);
            } else {
                // For Deny button, find the second href
                int firstHref = htmlContent.indexOf("href=\"");
                int secondHref = htmlContent.indexOf("href=\"", firstHref + 1);
                startIndex = secondHref + 6;
                int endIndex = htmlContent.indexOf("\"", startIndex);
                return htmlContent.substring(startIndex, endIndex);
            }
        } catch (Exception e) {
            return "Error extracting URL";
        }
    }
}