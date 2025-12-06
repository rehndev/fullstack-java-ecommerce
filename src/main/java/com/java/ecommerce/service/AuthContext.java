package com.java.ecommerce.service;

import com.java.ecommerce.dto.auth.AuthUserResponse;
import com.java.ecommerce.model.Role;
import com.java.ecommerce.model.User;
import com.java.ecommerce.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/**
 * Helper to resolve the currently logged-in user from HttpSession
 * and to enforce CUSTOMER / ADMIN roles.
 */
@Component
public class AuthContext {

    private final UserRepository userRepository;

    public AuthContext(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User requireUser(HttpSession session) {
        Long userId = (Long) session.getAttribute(AuthService.SESSION_USER_ID);
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not logged in");
        }
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    public User requireAdmin(HttpSession session) {
        User user = requireUser(session);
        if (user.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
        }
        return user;
    }

    public AuthUserResponse toResponse(User user) {
        return new AuthUserResponse(user.getId(), user.getName(), user.getEmail(), user.getRole());
    }
}