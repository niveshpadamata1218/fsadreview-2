package com.reviewin.service;

import com.reviewin.dto.request.RegisterRequest;
import com.reviewin.exception.BadRequestException;
import com.reviewin.exception.ResourceNotFoundException;
import com.reviewin.model.User;
import com.reviewin.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public User registerUser(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("Email already registered");
        }

        User user = User.builder()
            .name(request.getName().trim())
            .email(email)
            .passwordHash(passwordEncoder.encode(request.getPassword()))
            .role(request.getRole())
            .isVerified(false)
            .build();

        return userRepository.save(user);
    }

    @Transactional
    public User markVerified(String email) {
        User user = getByEmail(email);
        user.setIsVerified(true);
        return userRepository.save(user);
    }

    public User authenticate(String email, String password) {
        User user = getByEmail(email);
        if (!Boolean.TRUE.equals(user.getIsVerified())) {
            throw new BadRequestException("Email not verified");
        }
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new BadRequestException("Invalid email or password");
        }
        return user;
    }

    public User getByEmail(String email) {
        return userRepository.findByEmail(email.trim().toLowerCase())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    public User getById(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
