package com.java.ecommerce.service;

import com.java.ecommerce.dto.order.OrderItemRequest;
import com.java.ecommerce.dto.order.OrderItemResponse;
import com.java.ecommerce.dto.order.OrderRequest;
import com.java.ecommerce.dto.order.OrderResponse;
import com.java.ecommerce.model.*;
import com.java.ecommerce.repository.OrderRepository;
import com.java.ecommerce.repository.ProductRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    public OrderService(OrderRepository orderRepository,
                        ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
    }

    public OrderResponse createOrder(User user, OrderRequest req) {
        if (req.getItems() == null || req.getItems().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order must have items");
        }

        Order order = new Order();
        order.setUser(user);
        order.setCreatedAt(Instant.now());
        order.setStatus(OrderStatus.NEW);

        for (OrderItemRequest itemReq : req.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product not found: " + itemReq.getProductId()));

            if (product.getStock() < itemReq.getQuantity()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Not enough stock for product: " + product.getName());
            }

            product.setStock(product.getStock() - itemReq.getQuantity());

            OrderItem item = new OrderItem();
            item.setProduct(product);
            item.setQuantity(itemReq.getQuantity());
            item.setUnitPrice(product.getPrice());

            order.addItem(item);
        }

        Order saved = orderRepository.save(order);
        productRepository.saveAll(
                saved.getItems().stream().map(OrderItem::getProduct).toList()
        );

        return toResponse(saved);
    }

    public List<OrderResponse> findOrdersForUser(User user) {
        List<Order> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        return orders.stream().map(this::toResponse).toList();
    }

    public List<OrderResponse> findAllOrders() {
        return orderRepository.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteOrder(Long id, User user) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        if (user.getRole() != Role.ADMIN && (order.getUser() == null || !order.getUser().getId().equals(user.getId()))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed to delete this order");
        }

        if (user.getRole() != Role.ADMIN && order.getStatus() != OrderStatus.NEW) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only NEW orders can be cancelled by the customer");
        }

        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            if (product != null) {
                product.setStock(product.getStock() + item.getQuantity());
            }
        }

        productRepository.saveAll(
                order.getItems().stream().map(OrderItem::getProduct).toList()
        );

        orderRepository.delete(order);
    }

    private OrderResponse toResponse(Order order) {
        List<OrderItemResponse> items = order.getItems().stream()
                .map(i -> new OrderItemResponse(
                        i.getId(),
                        i.getProduct().getId(),
                        i.getProduct().getName(),
                        i.getQuantity(),
                        i.getUnitPrice()
                )).toList();
        return new OrderResponse(
                order.getId(),
                order.getUser() != null ? order.getUser().getId() : null,
                order.getCreatedAt(),
                order.getStatus(),
                items
        );
    }
}