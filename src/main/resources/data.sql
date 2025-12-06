-- Seed data: creates an admin user and some example products
-- Password for admin: "secret" (SHA-256, base64)

INSERT INTO users (id, name, email, password_hash, role)
VALUES (1, 'Admin User', 'admin@example.com', 'K7gNU3sdo+OL0wNhqoVWhr3g6s1xYv72ol/pe/Unols=', 'ADMIN');

INSERT INTO products (id, name, description, price, image_url, stock)
VALUES
  (1, 'Invisible Keyboard', 'Perfect for typing imaginary emails', 9.99, 'https://via.placeholder.com/150', 10),
  (2, 'Wireless Extension Cord', '0% cables, 100% confusion', 14.50, 'https://via.placeholder.com/150', 5),
  (3, 'Decision Coin Flipper', 'Just blame the coin', 24.00, 'https://via.placeholder.com/150', 8);
  (4, 'Bug Spray for Software Bugs', 'Think your code has bugs? Just spray them away!', 24.00, 'https://via.placeholder.com/150', 8);
  (5, 'Add to Cart Button (Physical)', 'A physical button to add items to your cart', 15.00, 'https://via.placeholder.com/150', 20);


INSERT INTO products (id, name, description, price, image_url, stock)

