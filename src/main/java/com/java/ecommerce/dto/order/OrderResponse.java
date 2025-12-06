package com.java.ecommerce.dto.order;

import com.java.ecommerce.model.OrderStatus;

import java.time.Instant;
import java.util.List;

public class OrderResponse {

    private Long id;
    private Long userId;
    private Instant createdAt;
    private OrderStatus status;
    private List<OrderItemResponse> items;

    public OrderResponse(Long id, Long userId, Instant createdAt,
                         OrderStatus status, List<OrderItemResponse> items) {
        this.id = id;
        this.userId = userId;
        this.createdAt = createdAt;
        this.status = status;
        this.items = items;
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public List<OrderItemResponse> getItems() {
        return items;
    }
}