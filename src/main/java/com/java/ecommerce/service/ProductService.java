package com.java.ecommerce.service;

import com.java.ecommerce.dto.product.ProductRequest;
import com.java.ecommerce.model.Product;
import com.java.ecommerce.repository.ProductRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<Product> findAll() {
        return productRepository.findAll();
    }

    public Product findById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
    }

    public Product create(ProductRequest req) {
        Product p = new Product();
        updateEntityFromRequest(p, req);
        return productRepository.save(p);
    }

    public Product update(Long id, ProductRequest req) {
        Product p = findById(id);
        updateEntityFromRequest(p, req);
        return productRepository.save(p);
    }

    public void delete(Long id) {
        if (!productRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found");
        }
        productRepository.deleteById(id);
    }

    private void updateEntityFromRequest(Product p, ProductRequest req) {
        p.setName(req.getName());
        p.setDescription(req.getDescription());
        p.setPrice(req.getPrice());
        p.setImageUrl(req.getImageUrl());
        p.setStock(req.getStock());
    }
}