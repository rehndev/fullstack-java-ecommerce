package com.java.ecommerce.controller;

import com.java.ecommerce.dto.product.ProductRequest;
import com.java.ecommerce.model.Product;
import com.java.ecommerce.model.User;
import com.java.ecommerce.service.AuthContext;
import com.java.ecommerce.service.ProductService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;
    private final AuthContext authContext;

    public ProductController(ProductService productService,
            AuthContext authContext) {
        this.productService = productService;
        this.authContext = authContext;
    }

    @GetMapping
    public List<Product> listProducts() {
        return productService.findAll();
    }

    @GetMapping("/{id}")
    public Product getProduct(@PathVariable Long id) {
        return productService.findById(id);
    }

    @PostMapping
    public Product createProduct(@Valid @RequestBody ProductRequest req,
            HttpSession session) {
        authContext.requireAdmin(session);
        return productService.create(req);
    }

    @PutMapping("/{id}")
    public Product updateProduct(@PathVariable Long id,
            @Valid @RequestBody ProductRequest req,
            HttpSession session) {
        User admin = authContext.requireAdmin(session);
        return productService.update(id, req);
    }

    @DeleteMapping("/{id}")
    public void deleteProduct(@PathVariable Long id,
            HttpSession session) {
        User admin = authContext.requireAdmin(session);
        productService.delete(id);
    }
}
