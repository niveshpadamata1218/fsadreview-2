package com.reviewin.service;

import com.reviewin.exception.BadRequestException;
import com.reviewin.model.OtpVerification;
import com.reviewin.repository.OtpRepository;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OtpService {

    private final OtpRepository otpRepository;
    private final JavaMailSender mailSender;

    @Value("${otp.expiry-minutes:10}")
    private int otpExpiryMinutes;

    @Value("${otp.code-length:6}")
    private int otpCodeLength;

    @Value("${MAIL_FROM:${spring.mail.username:}}")
    private String mailFrom;

    private final SecureRandom random = new SecureRandom();

    @Transactional
    public void generateAndSendOtp(String email) {
        String otp = generateOtp();
        OtpVerification otpVerification = OtpVerification.builder()
            .email(email)
            .otpCode(otp)
            .expiresAt(LocalDateTime.now().plusMinutes(otpExpiryMinutes))
            .isUsed(false)
            .build();

        otpRepository.save(otpVerification);
        sendOtpEmail(email, otp);
    }

    @Transactional
    public void verifyOtp(String email, String otpCode) {
        OtpVerification otp = otpRepository.findTopByEmailAndIsUsedFalseOrderByCreatedAtDesc(email)
            .orElseThrow(() -> new BadRequestException("OTP not found. Please request a new code."));

        if (otp.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("OTP has expired. Please request a new code.");
        }

        if (!otp.getOtpCode().equals(otpCode)) {
            throw new BadRequestException("Invalid OTP code.");
        }

        otp.setIsUsed(true);
        otpRepository.save(otp);
    }

    private String generateOtp() {
        int length = Math.max(4, otpCodeLength);
        int max = (int) Math.pow(10, length);
        int otp = random.nextInt(max);
        return String.format("%0" + length + "d", otp);
    }

    private void sendOtpEmail(String email, String otp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false);
            helper.setTo(email);
            if (mailFrom != null && !mailFrom.isBlank()) {
                helper.setFrom(mailFrom);
            }
            helper.setSubject("Your review.in verification code");
            helper.setText("Your verification code is: " + otp + ". Valid for 10 minutes.", false);
            mailSender.send(message);
        } catch (MessagingException | MailException ex) {
            throw new BadRequestException("Unable to send OTP email. Check mail configuration.");
        }
    }
}
