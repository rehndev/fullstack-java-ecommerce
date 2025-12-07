const DEPLOYED_BACKEND_URL = 'https://your-backend-url.com/api';

const API_BASE = (() => {
    const hostname = window.location.hostname;
    const port = window.location.port;
    
    if (hostname.endsWith('.github.io') || hostname === 'github.io') {
        return DEPLOYED_BACKEND_URL;
    }
    
    if (port === '8080' || (!port && (hostname === 'localhost' || hostname === '127.0.0.1'))) {
        return '/api';
    }
    
    return 'http://localhost:8080/api';
})();

let currentUser = null;
let cart = [];

function initUI() {
    const cartToggle = document.getElementById('cart-toggle');
    const cartClose = document.getElementById('cart-close');
    const cartDrawer = document.getElementById('cart-drawer');
    const cartOverlay = document.getElementById('cart-overlay');
    
    cartToggle?.addEventListener('click', () => {
        cartDrawer?.classList.add('active');
        cartOverlay?.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
    
    cartClose?.addEventListener('click', closeCart);
    cartOverlay?.addEventListener('click', closeCart);
    
    function closeCart() {
        cartDrawer?.classList.remove('active');
        cartOverlay?.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    const authToggle = document.getElementById('auth-toggle');
    const authClose = document.getElementById('auth-close');
    const authModal = document.getElementById('auth-modal');
    const authOverlay = document.getElementById('auth-overlay');
    
    authToggle?.addEventListener('click', () => {
        authModal?.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
    
    authClose?.addEventListener('click', closeAuth);
    authOverlay?.addEventListener('click', closeAuth);
    
    function closeAuth() {
        authModal?.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    const adminClose = document.getElementById('admin-close');
    const adminModal = document.getElementById('admin-modal');
    const adminOverlay = document.getElementById('admin-overlay');
    
    adminClose?.addEventListener('click', closeAdmin);
    adminOverlay?.addEventListener('click', closeAdmin);
    
    function closeAdmin() {
        adminModal?.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            document.querySelectorAll('.auth-form').forEach(form => {
                form.classList.remove('active');
            });
            document.getElementById(`${tab}-form`)?.classList.add('active');
        });
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeCart();
            closeAuth();
            closeAdmin();
        }
    });
}

function showError(message) {
    const existing = document.getElementById('error-toast');
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.id = 'error-toast';
    div.className = 'error-toast';
    div.textContent = message;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

function showSuccess(message) {
    const div = document.createElement('div');
    div.className = 'error-toast';
    div.style.background = 'var(--success)';
    div.textContent = message;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

function renderUserInfo() {
    const authToggle = document.getElementById('auth-toggle');
    const logoutBtn = document.getElementById('logout-btn');
    const ordersSection = document.getElementById('orders-section');
    const adminModal = document.getElementById('admin-modal');

    if (!currentUser) {
        if (authToggle) authToggle.textContent = 'Sign In';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (ordersSection) ordersSection.classList.add('hidden');
        if (adminModal) adminModal.classList.remove('active');
        return;
    }
    
    if (authToggle) {
        authToggle.textContent = currentUser.name;
    }
    
    if (logoutBtn) {
        logoutBtn.style.display = 'block';
    }
    
    if (ordersSection) {
        ordersSection.classList.remove('hidden');
    }
    
    if (currentUser.role === 'ADMIN') {
        if (!document.getElementById('admin-toggle')) {
            const adminBtn = document.createElement('button');
            adminBtn.id = 'admin-toggle';
            adminBtn.className = 'nav-btn';
            adminBtn.textContent = 'Admin';
            adminBtn.addEventListener('click', () => {
                adminModal?.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
            const nav = document.querySelector('.nav');
            if (nav && authToggle) {
                nav.insertBefore(adminBtn, authToggle);
            }
        }
    } else {
        const adminBtn = document.getElementById('admin-toggle');
        if (adminBtn) adminBtn.remove();
    }
}

async function register() {
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    if (!name || !email || !password) {
        showError('Please fill in all fields');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({name, email, password})
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Register failed');
        }
        await res.json();
        showSuccess('Registered successfully! You can now log in.');
        document.querySelector('[data-tab="login"]')?.click();
        document.getElementById('reg-name').value = '';
        document.getElementById('reg-email').value = '';
        document.getElementById('reg-password').value = '';
    } catch (e) {
        showError(e.message);
    }
}

async function login() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        showError('Please enter email and password');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify({email, password})
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Login failed');
        }
        currentUser = await res.json();
        renderUserInfo();
        await loadOrders();
        
        document.getElementById('auth-modal')?.classList.remove('active');
        document.body.style.overflow = '';
        document.getElementById('login-email').value = '';
        document.getElementById('login-password').value = '';
        
        showSuccess(`Welcome back, ${currentUser.name}!`);
    } catch (e) {
        showError(e.message);
    }
}

async function logout() {
    try {
        await fetch(`${API_BASE}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });
        currentUser = null;
        cart = [];
        renderUserInfo();
        renderCart();
        document.getElementById('orders').innerHTML = '';
        showSuccess('Logged out successfully');
    } catch (e) {
        showError('Logout failed');
    }
}

async function loadCurrentUser() {
    try {
        const res = await fetch(`${API_BASE}/auth/me`, {
            method: 'GET',
            credentials: 'include'
        });
        if (!res.ok) {
            currentUser = null;
        } else {
            currentUser = await res.json();
        }
    } catch {
        currentUser = null;
    }
    renderUserInfo();
}

async function loadProducts() {
    const container = document.getElementById('products');
    if (!container) {
        return;
    }
    
    container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-secondary);">Loading products...</div>';
    
    try {
        if (!API_BASE) {
            container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--error);">API endpoint not configured. Please check your configuration.</div>';
            return;
        }
        
        const url = `${API_BASE}/products`;
        
        const res = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });
        
        if (!res.ok) {
            let errorText = '';
            try {
                errorText = await res.text();
            } catch (e) {
                errorText = res.statusText;
            }
            throw new Error(`HTTP ${res.status}: ${errorText || res.statusText}`);
        }
        
        const products = await res.json();
        
        if (!products || !Array.isArray(products)) {
            container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--error);">Invalid products data received from server.</div>';
            return;
        }
        
        renderProducts(products);
    } catch (e) {
        let errorMsg = e.message || 'Unknown error';
        
        if (e.message.includes('Failed to fetch') || e.message.includes('NetworkError') || e.message.includes('Network request failed')) {
            errorMsg = 'Cannot connect to server. Make sure the Spring Boot backend is running on port 8080.';
            container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--error);">
                <strong>Server Connection Error</strong><br>
                ${errorMsg}<br><br>
                <small style="color: var(--text-secondary);">
                    To start the server, run: <code>mvn spring-boot:run</code> or start your Spring Boot application.
                </small>
            </div>`;
        } else {
            container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--error);">
                Could not load products: ${errorMsg}<br>
                <small style="color: var(--text-secondary);">Check the browser console (F12) for more details.</small>
            </div>`;
        }
        
        showError(`Could not load products: ${errorMsg}`);
    }
}

function renderProducts(products) {
    const container = document.getElementById('products');
    if (!container) {
        return;
    }
    
    container.innerHTML = '';
    
    if (!products || products.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-secondary);">No products available at this time.</div>';
        return;
    }

    products.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        if (p.imageUrl) {
            const img = document.createElement('img');
            img.src = p.imageUrl;
            img.alt = p.name;
            img.loading = 'lazy';
            card.appendChild(img);
        } else {
            const imgPlaceholder = document.createElement('div');
            imgPlaceholder.style.cssText = 'width: 100%; height: 280px; background: var(--bg-tertiary); display: flex; align-items: center; justify-content: center; color: var(--text-tertiary);';
            imgPlaceholder.textContent = 'No image';
            card.appendChild(imgPlaceholder);
        }

        const content = document.createElement('div');
        
        const name = document.createElement('div');
        name.className = 'product-name';
        name.textContent = p.name;
        content.appendChild(name);
        
        if (p.description) {
            const desc = document.createElement('div');
            desc.className = 'product-description';
            desc.textContent = p.description;
            content.appendChild(desc);
        }
        
        const price = document.createElement('div');
        price.className = 'product-price';
        price.textContent = `${parseFloat(p.price).toFixed(2)} €`;
        content.appendChild(price);
        
        const stock = document.createElement('div');
        stock.className = 'product-stock';
        stock.textContent = `${p.stock} in stock`;
        content.appendChild(stock);
        
        const addBtn = document.createElement('button');
        addBtn.className = 'btn-primary';
        addBtn.textContent = 'Add to Cart';
        addBtn.onclick = (ev) => {
            ev.stopPropagation();
            addToCart(p);
        };
        content.appendChild(addBtn);
        
        if (currentUser && currentUser.role === 'ADMIN') {
            card.onclick = () => {
                fillProductForm(p);
                document.getElementById('admin-modal')?.classList.add('active');
                document.body.style.overflow = 'hidden';
            };
            
            const delBtn = document.createElement('button');
            delBtn.className = 'btn-secondary';
            delBtn.textContent = 'Delete';
            delBtn.onclick = async (ev) => {
                ev.stopPropagation();
                if (confirm(`Delete "${p.name}"?`)) {
                    await deleteProduct(p.id);
                }
            };
            content.appendChild(delBtn);
        }
        
        card.appendChild(content);
        container.appendChild(card);
    });
}

function addToCart(product) {
    if (product.stock <= 0) {
        showError('Product is out of stock');
        return;
    }
    
    const existing = cart.find(c => c.productId === product.id);
    if (existing) {
        if (existing.quantity >= product.stock) {
            showError('Not enough stock available');
            return;
        }
        existing.quantity += 1;
    } else {
        cart.push({
            productId: product.id,
            name: product.name,
            price: parseFloat(product.price),
            quantity: 1
        });
    }
    renderCart();
    updateCartBadge();
    showSuccess('Added to cart');
}

function renderCart() {
    const container = document.getElementById('cart');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (cart.length === 0) {
        container.innerHTML = '';
        document.getElementById('cart-total').textContent = '0.00';
        updateCartBadge();
        return;
    }

    cart.forEach((item, idx) => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        
        const info = document.createElement('div');
        info.className = 'cart-item-info';
        
        const name = document.createElement('div');
        name.className = 'cart-item-name';
        name.textContent = item.name;
        info.appendChild(name);
        
        const price = document.createElement('div');
        price.className = 'cart-item-price';
        price.textContent = `${item.price.toFixed(2)} € each`;
        info.appendChild(price);
        
        cartItem.appendChild(info);
        
        const controls = document.createElement('div');
        controls.className = 'cart-item-controls';
        
        const input = document.createElement('input');
        input.type = 'number';
        input.min = '1';
        input.value = item.quantity;
        input.onchange = () => {
            const q = parseInt(input.value, 10);
            if (isNaN(q) || q < 1) {
                input.value = item.quantity;
                return;
            }
            item.quantity = q;
            renderCart();
        };
        controls.appendChild(input);
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'cart-item-remove';
        removeBtn.textContent = '×';
        removeBtn.onclick = () => {
            cart.splice(idx, 1);
            renderCart();
        };
        controls.appendChild(removeBtn);
        
        cartItem.appendChild(controls);
        container.appendChild(cartItem);
    });

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    document.getElementById('cart-total').textContent = total.toFixed(2);
    updateCartBadge();
}

function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (badge) {
        const count = cart.reduce((sum, item) => sum + item.quantity, 0);
        badge.textContent = count;
        badge.style.display = count > 0 ? 'block' : 'none';
    }
}

async function checkout() {
    if (!currentUser) {
        showError('Please sign in to checkout');
        document.getElementById('auth-modal')?.classList.add('active');
        document.body.style.overflow = 'hidden';
        return;
    }
    if (cart.length === 0) {
        showError('Your cart is empty');
        return;
    }

    const items = cart.map(i => ({
        productId: i.productId,
        quantity: i.quantity
    }));

    try {
        const res = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify({items})
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Checkout failed');
        }
        const order = await res.json();
        cart = [];
        renderCart();
        await loadOrders();
        
        document.getElementById('cart-drawer')?.classList.remove('active');
        document.getElementById('cart-overlay')?.classList.remove('active');
        document.body.style.overflow = '';
        
        showSuccess(`Order #${order.id} created successfully!`);
    } catch (e) {
        showError(e.message);
    }
}

async function loadOrders() {
    if (!currentUser) return;
    try {
        const res = await fetch(`${API_BASE}/orders`, {
            credentials: 'include'
        });
        if (!res.ok) {
            const container = document.getElementById('orders');
            if (container) container.innerHTML = '<p>Could not load orders.</p>';
            return;
        }
        const orders = await res.json();
        renderOrders(orders);
    } catch (e) {
        showError('Could not load orders');
    }
}

function renderOrders(orders) {
    const container = document.getElementById('orders');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!orders || orders.length === 0) {
        container.innerHTML = '';
        return;
    }

    orders.forEach(o => {
        const card = document.createElement('div');
        card.className = 'order-card';

        const header = document.createElement('div');
        header.className = 'order-header';
        
        const left = document.createElement('span');
        left.textContent = `Order #${o.id} – ${o.status}`;
        header.appendChild(left);
        
        const date = document.createElement('span');
        const d = new Date(o.createdAt);
        date.textContent = d.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        header.appendChild(date);
        card.appendChild(header);

        const list = document.createElement('div');
        list.className = 'order-items';
        o.items.forEach(it => {
            const line = document.createElement('div');
            const total = (it.unitPrice * it.quantity).toFixed(2);
            line.textContent = `${it.productName} × ${it.quantity} – ${total} €`;
            list.appendChild(line);
        });
        card.appendChild(list);

        const actions = document.createElement('div');
        actions.className = 'order-actions';
        const canCancel = currentUser && (currentUser.role === 'ADMIN' || (currentUser.id === o.userId && o.status === 'NEW'));
        if (canCancel) {
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'btn-secondary';
            cancelBtn.textContent = 'Cancel Order';
            cancelBtn.onclick = async () => {
                await cancelOrder(o.id);
            };
            actions.appendChild(cancelBtn);
        }
        card.appendChild(actions);

        container.appendChild(card);
    });
}

async function cancelOrder(id) {
    if (!currentUser) {
        showError('Please sign in');
        return;
    }
    if (!confirm('Cancel this order?')) return;
    try {
        const res = await fetch(`${API_BASE}/orders/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Could not cancel order');
        }
        await loadOrders();
        showSuccess('Order cancelled');
    } catch (e) {
        showError(e.message);
    }
}

function fillProductForm(p) {
    document.getElementById('prod-id').value = p.id;
    document.getElementById('prod-name').value = p.name;
    document.getElementById('prod-desc').value = p.description || '';
    document.getElementById('prod-price').value = p.price;
    document.getElementById('prod-image').value = p.imageUrl || '';
    document.getElementById('prod-stock').value = p.stock;
}

function clearProductForm() {
    document.getElementById('prod-id').value = '';
    document.getElementById('prod-name').value = '';
    document.getElementById('prod-desc').value = '';
    document.getElementById('prod-price').value = '';
    document.getElementById('prod-image').value = '';
    document.getElementById('prod-stock').value = '';
}

async function createOrUpdateProduct() {
    if (!currentUser || currentUser.role !== 'ADMIN') {
        showError('Admin access required');
        return;
    }

    const id = document.getElementById('prod-id').value;
    const name = document.getElementById('prod-name').value.trim();
    const description = document.getElementById('prod-desc').value.trim();
    const price = parseFloat(document.getElementById('prod-price').value);
    const imageUrl = document.getElementById('prod-image').value.trim();
    const stock = parseInt(document.getElementById('prod-stock').value, 10);

    if (!name || isNaN(price) || isNaN(stock)) {
        showError('Please fill in all required fields');
        return;
    }

    const body = {name, description, price, imageUrl, stock};

    try {
        const url = id ? `${API_BASE}/products/${id}` : `${API_BASE}/products`;
        const method = id ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify(body)
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Save failed');
        }
        clearProductForm();
        await loadProducts();
        
        document.getElementById('admin-modal')?.classList.remove('active');
        document.body.style.overflow = '';
        
        showSuccess(id ? 'Product updated' : 'Product created');
    } catch (e) {
        showError(e.message);
    }
}

async function deleteProduct(id) {
    if (!currentUser || currentUser.role !== 'ADMIN') {
        showError('Admin access required');
        return;
    }
    
    try {
        const res = await fetch(`${API_BASE}/products/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Delete failed');
        }
        await loadProducts();
        showSuccess('Product deleted');
    } catch (e) {
        showError(e.message);
    }
}

window.addEventListener('DOMContentLoaded', async () => {
    initUI();
    await loadCurrentUser();
    await loadProducts();
    await loadOrders();
    renderCart();
    updateCartBadge();
});
