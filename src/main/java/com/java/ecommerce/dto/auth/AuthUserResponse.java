package com.java.ecommerce.dto.auth;

import com.java.ecommerce.model.Role;

public class AuthUserResponse {

    private Long id;
    private String name;
    private String email;
    private Role role;

    public AuthUserResponse(Long id, String name, String email, Role role) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public Role getRole() {
        return role;
    }
}