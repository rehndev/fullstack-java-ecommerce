-- Seed data: creates an admin user and some example products
-- Password for admin: "secret" (SHA-256, base64)

INSERT INTO users (id, name, email, password_hash, role)
VALUES (1, 'Admin User', 'admin@example.com', 'K7gNU3sdo+OL0wNhqoVWhr3g6s1xYv72ol/pe/Unols=', 'ADMIN');

INSERT INTO products (id, name, description, price, image_url, stock)
VALUES
  (1, 'Widget', 'Handy widget for everyday tasks', 9.99, 'https://via.placeholder.com/150', 10),
  (2, 'Thingamajig', 'Useful thingamajig with multiple uses', 14.50, NULL, 5),
  (3, 'Gizmo', 'Small gizmo that makes life easier', 24.00, 'https://via.placeholder.com/150', 8);
