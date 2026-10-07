import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Banner from "../components/Banner";
import EmptyState from "../components/EmptyState";
import ProductPicture from "../components/ProductPicture";
import { api, DELIVERY_CHARGE } from "../api";
import { useApp } from "../context";
import { rupees, useTitle } from "../utils";

// Quantity box that saves when the user leaves it or presses Enter,
// so clearing it to type a new number doesn't reset it straight away
function QtyInput({ item, onSave }) {
    const [value, setValue] = useState(String(item.quantity));
    useEffect(() => setValue(String(item.quantity)), [item.quantity]);

    return (
        <input
            type="number"
            className="qty"
            min="1"
            max={item.stock}
            value={value}
            aria-label={"Quantity of " + item.product_name}
            onChange={(e) => setValue(e.target.value)}
            onBlur={() => onSave(value)}
            onKeyDown={(e) => e.key === "Enter" && onSave(value)}
        />
    );
}

export default function Cart() {
    useTitle("Cart");
    const { user, cart, setCart, cartCount, showToast } = useApp();
    const [synced, setSynced] = useState(cart.length === 0);

    // Refresh prices and stock from the server, drop products that were removed
    useEffect(() => {
        if (cart.length === 0) return;

        api("/products")
            .then((products) => {
                let changed = false;
                const updated = [];

                for (const item of cart) {
                    const p = products.find((x) => x.product_id === item.product_id);
                    if (!p || p.quantity <= 0) {
                        changed = true;
                        continue;
                    }
                    if (p.price !== item.price || item.quantity > p.quantity) changed = true;
                    updated.push({
                        ...item,
                        price: p.price,
                        stock: p.quantity,
                        quantity: Math.min(item.quantity, p.quantity)
                    });
                }

                setCart(updated);
                if (changed) showToast("Your cart was updated with the latest prices and stock");
            })
            .catch(() => {
                // Server down: still show the saved cart
            })
            .finally(() => setSynced(true));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function changeQuantity(item, value) {
        let qty = parseInt(value, 10);
        if (!Number.isInteger(qty) || qty < 1) qty = 1;
        if (qty > item.stock) {
            qty = item.stock;
            showToast(`Only ${item.stock} ${item.unit} available`, true);
        }
        setCart(cart.map((i) => (i.product_id === item.product_id ? { ...i, quantity: qty } : i)));
    }

    function remove(item) {
        setCart(cart.filter((i) => i.product_id !== item.product_id));
    }

    let body;
    if (!synced) {
        body = <p className="loading">Loading cart...</p>;
    } else if (cart.length === 0) {
        body = (
            <EmptyState emoji="🧺" className="card empty">
                Your cart is empty.<br />
                <Link to="/products" className="btn">Browse products</Link>
            </EmptyState>
        );
    } else {
        const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

        let checkoutButton;
        if (user?.role === "farmer") {
            checkoutButton = <p className="hint">Farmer accounts can't place orders. Log out and use a customer account.</p>;
        } else if (!user) {
            checkoutButton = (
                <>
                    <Link to="/customer?next=%2Fcheckout#login" className="btn btn-orange btn-block">Login to Checkout</Link>
                    <p className="hint" style={{ textAlign: "center" }}>
                        New customer? <Link to="/customer#register">Register here</Link>
                    </p>
                </>
            );
        } else {
            checkoutButton = <Link to="/checkout" className="btn btn-orange btn-block">Proceed to Checkout</Link>;
        }

        body = (
            <div className="two-col">
                <div className="card">
                    <h2>Items ({cartCount})</h2>
                    {cart.map((item) => (
                        <div className="cart-item" key={item.product_id}>
                            <div className="cart-thumb"><ProductPicture product={item} /></div>
                            <div>
                                <h3>{item.product_name}</h3>
                                <p className="product-meta">
                                    {rupees(item.price)} / {item.unit}{item.farmer_name ? " · " + item.farmer_name : ""}
                                </p>
                            </div>
                            <div className="cart-controls">
                                <QtyInput item={item} onSave={(v) => changeQuantity(item, v)} />
                                <button className="btn btn-danger btn-small" onClick={() => remove(item)}>Remove</button>
                            </div>
                            <div className="line-total">{rupees(item.price * item.quantity)}</div>
                        </div>
                    ))}
                </div>

                <div className="card">
                    <h2>Order Summary</h2>
                    <div className="summary-row"><span>Subtotal</span><span>{rupees(subtotal)}</span></div>
                    <div className="summary-row"><span>Delivery charge</span><span>{rupees(DELIVERY_CHARGE)}</span></div>
                    <div className="summary-row summary-total"><span>Total</span><span>{rupees(subtotal + DELIVERY_CHARGE)}</span></div>
                    <div style={{ marginTop: 18 }}>{checkoutButton}</div>
                    <Link to="/products" className="btn btn-outline btn-block" style={{ marginTop: 10 }}>Continue Shopping</Link>
                </div>
            </div>
        );
    }

    return (
        <>
            <Banner title="🛒 Shopping Cart">Review your items before checkout</Banner>
            <main className="container">{body}</main>
        </>
    );
}
