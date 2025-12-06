package com.java.ecommerce.controller;

import com.java.ecommerce.dto.auth.AuthUserResponse;
import com.java.ecommerce.dto.auth.LoginRequest;
import com.java.ecommerce.dto.auth.RegisterRequest;
import com.java.ecommerce.service.AuthContext;
import com.java.ecommerce.service.AuthService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final AuthContext authContext;

    public AuthController(AuthService authService, AuthContext authContext) {
        this.authService = authService;
        this.authContext = authContext;
    }

    @PostMapping("/register")
    public AuthUserResponse register(@Valid @RequestBody RegisterRequest req) {
        return authService.register(req);
    }

    @PostMapping("/login")
    public AuthUserResponse login(@Valid @RequestBody LoginRequest req,
                                  HttpSession session) {
        return authService.login(req, session);
    }

    @PostMapping("/logout")
    public void logout(HttpSession session) {
        authService.logout(session);
    }

    @GetMapping("/me")
    public AuthUserResponse currentUser(HttpSession session) {
        return authService.currentUser(session);
    }
}