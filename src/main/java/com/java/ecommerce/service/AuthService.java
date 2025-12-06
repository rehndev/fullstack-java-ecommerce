package com.java.ecommerce.service;

import com.java.ecommerce.dto.auth.AuthUserResponse;
import com.java.ecommerce.dto.auth.LoginRequest;
import com.java.ecommerce.dto.auth.RegisterRequest;
import com.java.ecommerce.model.Role;
import com.java.ecommerce.model.User;
import com.java.ecommerce.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpSession;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

@Service
public class AuthService {

    private final UserRepository userRepository;

    // Simple session attribute keys
    public static final String SESSION_USER_ID = "USER_ID";
    public static final String SESSION_USER_ROLE = "USER_ROLE";

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public AuthUserResponse register(RegisterRequest req) {
        userRepository.findByEmail(req.getEmail()).ifPresent(u -> {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already in use");
        });

        User user = new User();
        user.setName(req.getName());
        user.setEmail(req.getEmail());
        user.setPasswordHash(hashPassword(req.getPassword()));
        user.setRole(Role.CUSTOMER); // new users are customers by default

        User saved = userRepository.save(user);
        return new AuthUserResponse(saved.getId(), saved.getName(), saved.getEmail(), saved.getRole());
    }

    public AuthUserResponse login(LoginRequest req, HttpSession session) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        String hash = hashPassword(req.getPassword());
        if (!hash.equals(user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        // Store minimal data in HTTP session
        session.setAttribute(SESSION_USER_ID, user.getId());
        session.setAttribute(SESSION_USER_ROLE, user.getRole().name());

        return new AuthUserResponse(user.getId(), user.getName(), user.getEmail(), user.getRole());
    }

    public void logout(HttpSession session) {
        session.invalidate();
    }

    public AuthUserResponse currentUser(HttpSession session) {
        Long userId = (Long) session.getAttribute(SESSION_USER_ID);
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not logged in");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        return new AuthUserResponse(user.getId(), user.getName(), user.getEmail(), user.getRole());
    }

    // Helper: hash password using SHA-256 (for demo only; use BCrypt in real apps)
    private String hashPassword(String plain) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] bytes = md.digest(plain.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(bytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("Cannot hash password", e);
        }
    }
}