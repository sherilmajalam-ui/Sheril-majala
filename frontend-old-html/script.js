/* ===== Fresh Farm - shared JavaScript ===== */

// When the backend serves the site (http://localhost:5001) use the same address.
// When opened with Live Server (port 5500) or as a file, call the backend directly.
// Port 5001 is used because macOS AirPlay already takes port 5000.
const BACKEND_PORT = "5001";
const API_BASE =
    location.protocol.startsWith("http") && location.port !== "5500"
        ? "/api"
        : `http://localhost:${BACKEND_PORT}/api`;

const DELIVERY_CHARGE = 20;

/* ---------- API helper ---------- */

async function api(path, options = {}) {
    const headers = { "Content-Type": "application/json" };
    const token = localStorage.getItem("ff_token");
    if (token) headers.Authorization = "Bearer " + token;

    let response;
    try {
        response = await fetch(API_BASE + path, {
            method: options.method || "GET",
            headers,
            body: options.body ? JSON.stringify(options.body) : undefined
        });
    } catch (e) {
        throw new Error("Can't reach the server. Make sure the backend is running (npm start).");
    }

    const data = await response.json().catch(() => ({}));

    // Token expired or invalid: log out and send to the right login page
    if (response.status === 401 && token) {
        const role = getUser()?.role;
        logout(false);
        location.href = (role === "farmer" ? "farmer.html" : "customer.html") + "?expired=1#login";
        throw new Error(data.message || "Please log in again");
    }

    if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
    }
    return data;
}

/* ---------- Login state ---------- */

function getUser() {
    try {
        return JSON.parse(localStorage.getItem("ff_user"));
    } catch {
        return null;
    }
}

function saveLogin(token, user) {
    localStorage.setItem("ff_token", token);
    localStorage.setItem("ff_user", JSON.stringify(user));
}

function logout(redirect = true) {
    localStorage.removeItem("ff_token");
    localStorage.removeItem("ff_user");
    if (redirect) location.href = "index.html";
}

// Call at the top of pages that need a login. Returns the user or redirects.
function requireLogin(role) {
    const user = getUser();
    if (!user || !localStorage.getItem("ff_token") || (role && user.role !== role)) {
        const page = role === "farmer" ? "farmer.html" : "customer.html";
        location.href = page + "?next=" + encodeURIComponent(location.pathname.split("/").pop() + location.search) + "#login";
        return null;
    }
    return user;
}

/* ---------- Cart (kept in the browser until checkout) ---------- */

function getCart() {
    try {
        return JSON.parse(localStorage.getItem("ff_cart")) || [];
    } catch {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem("ff_cart", JSON.stringify(cart));
    updateCartCount();
}

function addToCart(product, quantity) {
    const cart = getCart();
    const existing = cart.find((item) => item.product_id === product.product_id);
    const wanted = (existing ? existing.quantity : 0) + quantity;

    if (wanted > product.quantity) {
        showToast(`Only ${product.quantity} ${product.unit} of ${product.product_name} available`, true);
        return false;
    }

    if (existing) {
        existing.quantity = wanted;
        existing.price = product.price;
        existing.stock = product.quantity;
    } else {
        cart.push({
            product_id: product.product_id,
            product_name: product.product_name,
            price: product.price,
            unit: product.unit,
            image_url: product.image_url,
            category: product.category,
            farmer_name: product.farmer_name,
            stock: product.quantity,
            quantity
        });
    }
    saveCart(cart);
    showToast(`${product.product_name} added to cart`);
    return true;
}

function cartItemCount() {
    return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

function updateCartCount() {
    const el = document.getElementById("cartCount");
    if (el) {
        const n = cartItemCount();
        el.textContent = n;
        el.style.display = n > 0 ? "inline-block" : "none";
    }
}

/* ---------- Formatting helpers ---------- */

function rupees(amount) {
    return "₹" + Number(amount).toLocaleString("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

function formatDate(value) {
    return new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function formatDateTime(value) {
    return new Date(value).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function orderCode(id) {
    return "FF" + String(1000 + Number(id));
}

// Escape text before putting it into innerHTML
function esc(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function statusBadge(status) {
    return `<span class="badge badge-${esc(status).replace(/ /g, "-")}">${esc(status)}</span>`;
}

/* ---------- Product pictures ---------- */

const EMOJI = {
    tomato: "🍅", brinjal: "🍆", potato: "🥔", onion: "🧅", chilli: "🌶️",
    cauliflower: "🥦", broccoli: "🥦", cabbage: "🥬", carrot: "🥕", beans: "🫛",
    banana: "🍌", mango: "🥭", apple: "🍎", orange: "🍊", grapes: "🍇",
    watermelon: "🍉", coconut: "🥥", spinach: "🥬", corn: "🌽", rice: "🌾",
    wheat: "🌾", milk: "🥛", honey: "🍯", cucumber: "🥒", garlic: "🧄",
    lemon: "🍋", pineapple: "🍍", papaya: "🥭", ginger: "🫚", peas: "🫛"
};

const CATEGORY_EMOJI = {
    Vegetables: "🥕", Fruits: "🍎", "Leafy Vegetables": "🥬", Grains: "🌾", Other: "🧺"
};

function productEmoji(name, category) {
    const lower = String(name).toLowerCase();
    for (const key in EMOJI) {
        if (lower.includes(key)) return EMOJI[key];
    }
    return CATEGORY_EMOJI[category] || "🌱";
}

// Photo if the product has one, emoji if not (or if the photo fails to load)
function productPicture(product) {
    const emoji = productEmoji(product.product_name, product.category);
    if (product.image_url) {
        return `<img src="${esc(product.image_url)}" alt="${esc(product.product_name)}" loading="lazy"
                 onerror="this.replaceWith(document.createTextNode('${emoji}'))">`;
    }
    return emoji;
}

/* ---------- Messages ---------- */

function showMessage(id, text, type = "error") {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.className = "message show " + type;
}

function hideMessage(id) {
    const el = document.getElementById(id);
    if (el) el.className = "message";
}

let toastTimer;
function showToast(text, isError = false) {
    let toast = document.getElementById("toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast";
        toast.setAttribute("role", "status");
        document.body.appendChild(toast);
    }
    toast.textContent = text;
    toast.className = "toast show" + (isError ? " error" : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toast.className = "toast"), 2600);
}

// Disables a button while an async action runs
async function withButton(button, busyText, action) {
    const original = button.textContent;
    button.disabled = true;
    button.textContent = busyText;
    try {
        return await action();
    } finally {
        button.disabled = false;
        button.textContent = original;
    }
}

/* ---------- Header & footer (same on every page) ---------- */

function renderHeader() {
    const header = document.getElementById("site-header");
    if (!header) return;

    const user = getUser();
    const page = location.pathname.split("/").pop() || "index.html";
    const active = (file) => (page === file ? ' class="active"' : "");

    let links = `<a href="index.html"${active("index.html")}>Home</a>`;

    if (!user) {
        links += `
            <div class="dropdown">
                <button class="dropbtn" aria-haspopup="true">Farmer ▾</button>
                <div class="dropdown-content">
                    <a href="farmer.html#register">Farmer Registration</a>
                    <a href="farmer.html#login">Farmer Login</a>
                </div>
            </div>
            <div class="dropdown">
                <button class="dropbtn" aria-haspopup="true">Customer ▾</button>
                <div class="dropdown-content">
                    <a href="customer.html#register">Customer Registration</a>
                    <a href="customer.html#login">Customer Login</a>
                </div>
            </div>
            <a href="products.html"${active("products.html")}>Products</a>
            <a href="cart.html"${active("cart.html")}>Cart <span class="cart-count" id="cartCount"></span></a>`;
    } else if (user.role === "customer") {
        links += `
            <a href="products.html"${active("products.html")}>Products</a>
            <a href="cart.html"${active("cart.html")}>Cart <span class="cart-count" id="cartCount"></span></a>
            <a href="orders.html"${active("orders.html")}>My Orders</a>`;
    } else {
        links += `
            <a href="farmer-dashboard.html"${active("farmer-dashboard.html")}>Dashboard</a>
            <a href="add-product.html"${active("add-product.html")}>Add Product</a>
            <a href="products.html"${active("products.html")}>Products</a>`;
    }

    if (user) {
        links += `
            <div class="dropdown">
                <button class="dropbtn" aria-haspopup="true">👤 ${esc(user.name.split(" ")[0])} ▾</button>
                <div class="dropdown-content">
                    <button type="button" id="logoutBtn">Logout</button>
                </div>
            </div>`;
    }

    header.innerHTML = `
        <a href="index.html" class="logo">🌱 Fresh Farm</a>
        <nav class="nav">${links}</nav>`;

    header.className = "site-header";

    // Tap to open dropdowns on phones
    header.querySelectorAll(".dropbtn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const parent = btn.parentElement;
            const wasOpen = parent.classList.contains("open");
            header.querySelectorAll(".dropdown").forEach((d) => d.classList.remove("open"));
            if (!wasOpen) parent.classList.add("open");
        });
    });
    document.addEventListener("click", () =>
        header.querySelectorAll(".dropdown").forEach((d) => d.classList.remove("open"))
    );

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) logoutBtn.addEventListener("click", () => logout());

    updateCartCount();
}

function renderFooter() {
    const footer = document.getElementById("site-footer");
    if (footer) {
        footer.className = "site-footer";
        footer.innerHTML = `© ${new Date().getFullYear()} Fresh Farm Farmer Direct Selling System`;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    renderHeader();
    renderFooter();
});
