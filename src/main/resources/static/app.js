// Use deployed backend URL for GitHub Pages, localhost for local development
const API_BASE = window.location.hostname === 'rehndev.github.io' 
    ? 'https://your-backend-url.com/api'  // TODO: Replace with your deployed backend URL
    : '/api';  // Local development

let currentUser = null;
let cart = []; // {productId, name, price, quantity}

// Utility: show small error toast
function showError(message) {
    console.error(message);
    const existing = document.getElementById('error-toast');
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.id = 'error-toast';
    div.className = 'error-toast';
    div.textContent = message;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

// Update header user info and admin panel visibility
function renderUserInfo() {
    const info = document.getElementById('user-info');
    const adminPanel = document.getElementById('admin-panel');

    if (!currentUser) {
        info.textContent = 'Not logged in';
        adminPanel.classList.add('hidden');
        return;
    }
    info.textContent = `${currentUser.name} (${currentUser.role})`;
    if (currentUser.role === 'ADMIN') {
        adminPanel.classList.remove('hidden');
    } else {
        adminPanel.classList.add('hidden');
    }
}

// AUTH ------------------------------------------------

async function register() {
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

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
        const user = await res.json();
        alert('Registered! You can now log in.');
    } catch (e) {
        showError(e.message);
    }
}

async function login() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include', // important for HttpSession cookies
            body: JSON.stringify({email, password})
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Login failed');
        }
        currentUser = await res.json();
        renderUserInfo();
        await loadOrders();
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
        renderUserInfo();
        document.getElementById('orders').innerHTML = '';
    } catch (e) {
        showError('Logout failed');
    }
}

// Try to restore session on load
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

// PRODUCTS -------------------------------------------

async function loadProducts() {
    try {
        const res = await fetch(`${API_BASE}/products`);
        const products = await res.json();
        renderProducts(products);
    } catch (e) {
        showError('Could not load products');
    }
}

function renderProducts(products) {
    const container = document.getElementById('products');
    container.innerHTML = '';

    products.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.onclick = (ev) => {
            // For admin: clicking card loads into edit form
            if (currentUser && currentUser.role === 'ADMIN') {
                ev.stopPropagation();
                fillProductForm(p);
            }
        };

        if (p.imageUrl) {
            const img = document.createElement('img');
            img.src = p.imageUrl;
            card.appendChild(img);
        }

        const name = document.createElement('div');
        name.className = 'product-name';
        name.textContent = p.name;
        card.appendChild(name);

        const price = document.createElement('div');
        price.className = 'product-price';
        price.textContent = `${p.price} €`;
        card.appendChild(price);

        const stock = document.createElement('div');
        stock.className = 'product-stock';
        stock.textContent = `In stock: ${p.stock}`;
        card.appendChild(stock);

        const btn = document.createElement('button');
        btn.textContent = 'Add to cart';
        btn.onclick = (ev) => {
            ev.stopPropagation();
            addToCart(p);
        };
        card.appendChild(btn);

        if (currentUser && currentUser.role === 'ADMIN') {
            const delBtn = document.createElement('button');
            delBtn.textContent = 'Delete';
            delBtn.className = 'secondary';
            delBtn.onclick = async (ev) => {
                ev.stopPropagation();
                if (confirm('Delete product?')) {
                    await deleteProduct(p.id);
                }
            };
            card.appendChild(delBtn);
        }

        container.appendChild(card);
    });
}

function addToCart(product) {
    const existing = cart.find(c => c.productId === product.id);
    if (existing) {
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
}

function renderCart() {
    const container = document.getElementById('cart');
    container.innerHTML = '';
    if (cart.length === 0) {
        container.setAttribute('data-empty-message', 'Your cart is empty');
        document.getElementById('cart-total').textContent = '0';
        return;
    }
    container.removeAttribute('data-empty-message');

    cart.forEach((item, idx) => {
        const row = document.createElement('div');
        row.className = 'cart-item';

        const left = document.createElement('div');
        left.textContent = item.name;
        row.appendChild(left);

        const center = document.createElement('div');
        const input = document.createElement('input');
        input.type = 'number';
        input.min = '1';
        input.value = item.quantity;
        input.onchange = () => {
            const q = parseInt(input.value, 10);
            if (isNaN(q) || q < 1) return;
            item.quantity = q;
            renderCart();
        };
        center.appendChild(input);
        row.appendChild(center);

        const right = document.createElement('div');
        const lineTotal = (item.price * item.quantity).toFixed(2);
        right.textContent = `${lineTotal} €`;
        const btn = document.createElement('button');
        btn.className = 'secondary';
        btn.textContent = 'X';
        btn.onclick = () => {
            cart.splice(idx, 1);
            renderCart();
        };
        right.appendChild(btn);
        row.appendChild(right);

        container.appendChild(row);
    });

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    document.getElementById('cart-total').textContent = total.toFixed(2);
}

async function checkout() {
    if (!currentUser) {
        showError('Login first to checkout');
        return;
    }
    if (cart.length === 0) {
        showError('Cart is empty');
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
        alert(`Order #${order.id} created! (status: ${order.status})`);
    } catch (e) {
        showError(e.message);
    }
}

// ORDERS ----------------------------------------------

async function loadOrders() {
    if (!currentUser) return;
    try {
        const res = await fetch(`${API_BASE}/orders`, {
            credentials: 'include'
        });
        if (!res.ok) {
            document.getElementById('orders').innerHTML = 'Could not load orders.';
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
    container.innerHTML = '';
    if (!orders || orders.length === 0) {
        container.setAttribute('data-empty-message', 'No orders yet');
        return;
    }
    container.removeAttribute('data-empty-message');

    orders.forEach(o => {
        const card = document.createElement('div');
        card.className = 'order-card';

        const header = document.createElement('div');
        header.className = 'order-header';
        const left = document.createElement('span');
        left.textContent = `#${o.id} – ${o.status}`;
        const date = document.createElement('span');
        const d = new Date(o.createdAt);
        date.textContent = d.toLocaleString();
        header.appendChild(left);
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

        // Actions: allow cancelling by owner (if NEW) or by admin (any status)
        const actions = document.createElement('div');
        actions.className = 'order-actions';
        const canCancel = currentUser && (currentUser.role === 'ADMIN' || (currentUser.id === o.userId && o.status === 'NEW'));
        if (canCancel) {
            const cancelBtn = document.createElement('button');
            cancelBtn.textContent = 'Cancel';
            cancelBtn.onclick = async (ev) => {
                ev.stopPropagation();
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
        showError('Login first');
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
        showError('Order cancelled');
    } catch (e) {
        showError(e.message);
    }
}

// ADMIN product form ----------------------------------

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
        showError('Admin only');
        return;
    }

    const id = document.getElementById('prod-id').value;
    const name = document.getElementById('prod-name').value.trim();
    const description = document.getElementById('prod-desc').value.trim();
    const price = parseFloat(document.getElementById('prod-price').value);
    const imageUrl = document.getElementById('prod-image').value.trim();
    const stock = parseInt(document.getElementById('prod-stock').value, 10);

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
    } catch (e) {
        showError(e.message);
    }
}

async function deleteProduct(id) {
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
    } catch (e) {
        showError(e.message);
    }
}

// INIT ------------------------------------------------

window.addEventListener('DOMContentLoaded', async () => {
    await loadCurrentUser();
    await loadProducts();
    await loadOrders();
    renderCart();
});