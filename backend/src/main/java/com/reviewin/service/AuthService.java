package com.reviewin.service;

import com.reviewin.dto.request.LoginRequest;
import com.reviewin.dto.request.OtpVerifyRequest;
import com.reviewin.dto.request.RegisterRequest;
import com.reviewin.dto.request.ResendOtpRequest;
import com.reviewin.dto.response.AuthResponse;
import com.reviewin.model.User;
import com.reviewin.security.JwtUtil;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserService userService;
    private final OtpService otpService;
    private final JwtUtil jwtUtil;

    public Map<String, String> register(RegisterRequest request) {
        User user = userService.registerUser(request);
        otpService.generateAndSendOtp(user.getEmail());

        Map<String, String> response = new LinkedHashMap<>();
        response.put("message", "Registration successful. OTP sent to email.");
        return response;
    }

    public AuthResponse verifyOtpAndLogin(OtpVerifyRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        otpService.verifyOtp(email, request.getOtp().trim());
        User user = userService.markVerified(email);
        return buildAuthResponse(user);
    }

    public Map<String, String> resendOtp(ResendOtpRequest request) {
        User user = userService.getByEmail(request.getEmail());
        otpService.generateAndSendOtp(user.getEmail());

        Map<String, String> response = new LinkedHashMap<>();
        response.put("message", "OTP resent successfully.");
        return response;
    }

    public AuthResponse login(LoginRequest request) {
        User user = userService.authenticate(request.getEmail(), request.getPassword());
        return buildAuthResponse(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        UserDetails details = new org.springframework.security.core.userdetails.User(
            user.getEmail(),
            user.getPasswordHash(),
            List.of()
        );
        String token = jwtUtil.generateToken(details, user.getId(), user.getRole().name());
        return AuthResponse.builder()
            .token(token)
            .userId(user.getId())
            .name(user.getName())
            .email(user.getEmail())
            .role(user.getRole())
            .build();
    }
}
