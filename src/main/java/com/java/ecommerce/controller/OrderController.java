package com.java.ecommerce.controller;

import com.java.ecommerce.dto.order.OrderRequest;
import com.java.ecommerce.dto.order.OrderResponse;
import com.java.ecommerce.model.Role;
import com.java.ecommerce.model.User;
import com.java.ecommerce.service.AuthContext;
import com.java.ecommerce.service.OrderService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;
    private final AuthContext authContext;

    public OrderController(OrderService orderService,
                           AuthContext authContext) {
        this.orderService = orderService;
        this.authContext = authContext;
    }

    @PostMapping
    public OrderResponse createOrder(@Valid @RequestBody OrderRequest req,
                                     HttpSession session) {
        User user = authContext.requireUser(session);
        return orderService.createOrder(user, req);
    }

    @GetMapping
    public List<OrderResponse> getOrders(HttpSession session) {
        User user = authContext.requireUser(session);
        if (user.getRole() == Role.ADMIN) {
            return orderService.findAllOrders();
        }
        return orderService.findOrdersForUser(user);
    }

    @DeleteMapping("/{id}")
    public void deleteOrder(@PathVariable Long id, HttpSession session) {
        User user = authContext.requireUser(session);
        orderService.deleteOrder(id, user);
    }
}
