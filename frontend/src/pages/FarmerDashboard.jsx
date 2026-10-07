import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Banner from "../components/Banner";
import EmptyState from "../components/EmptyState";
import ProductPicture from "../components/ProductPicture";
import StatusBadge from "../components/StatusBadge";
import { api } from "../api";
import { useApp } from "../context";
import { formatDateTime, orderCode, productEmoji, rupees, useTitle } from "../utils";

const FLOW = ["Placed", "Confirmed", "Packed", "Out for Delivery", "Delivered"];

const isClosed = (o) => o.status === "Delivered" || o.status === "Cancelled";
const myTotal = (o) => o.items.reduce((s, i) => s + i.subtotal, 0);

function ProductTable({ products, onDelete, deletingId }) {
    if (products.length === 0) {
        return (
            <EmptyState emoji="🌱">
                You haven't added any products yet.<br />
                <Link to="/add-product" className="btn">Add your first product</Link>
            </EmptyState>
        );
    }

    return (
        <div className="table-wrap">
            <table>
                <thead>
                    <tr><th></th><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr>
                </thead>
                <tbody>
                    {products.map((p) => (
                        <tr key={p.product_id}>
                            <td>
                                <div className="cart-thumb" style={{ width: 50, height: 50, fontSize: 26 }}>
                                    <ProductPicture product={p} />
                                </div>
                            </td>
                            <td><strong>{p.product_name}</strong></td>
                            <td>{p.category}</td>
                            <td>{rupees(p.price)} / {p.unit}</td>
                            <td>
                                {p.quantity <= 0
                                    ? <span className="stock-out">Out of stock</span>
                                    : p.quantity <= 5
                                        ? <span className="stock-low">{p.quantity} left</span>
                                        : p.quantity}
                            </td>
                            <td style={{ whiteSpace: "nowrap" }}>
                                <Link to={`/add-product?id=${p.product_id}`} className="btn btn-outline btn-small">Edit</Link>{" "}
                                <button className="btn btn-danger btn-small" disabled={deletingId === p.product_id}
                                        onClick={() => onDelete(p)}>
                                    {deletingId === p.product_id ? "Deleting..." : "Delete"}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function DeliveryForm({ order, onSaved }) {
    const { showToast } = useApp();
    const [person, setPerson] = useState(order.delivery?.delivery_person || "");
    const [phone, setPhone] = useState(order.delivery?.phone || "");
    const [busy, setBusy] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setBusy(true);
        try {
            await api("/deliveries", {
                method: "POST",
                body: { order_id: order.order_id, delivery_person: person.trim(), phone: phone.trim() }
            });
            showToast("Delivery person saved");
            onSaved();
        } catch (err) {
            showToast(err.message, true);
        } finally {
            setBusy(false);
        }
    }

    return (
        <form className="delivery-form" onSubmit={handleSubmit}>
            <input type="text" placeholder="Delivery person name" aria-label="Delivery person name"
                   value={person} onChange={(e) => setPerson(e.target.value)} />
            <input type="tel" placeholder="Their mobile number" maxLength={13} aria-label="Delivery person phone"
                   value={phone} onChange={(e) => setPhone(e.target.value)} />
            <button type="submit" className="btn btn-outline btn-small" disabled={busy}>
                {busy ? "Saving..." : order.delivery ? "Update Delivery" : "Assign Delivery"}
            </button>
        </form>
    );
}

function StatusControls({ order, onSaved }) {
    const { showToast } = useApp();
    const next = FLOW.slice(FLOW.indexOf(order.status) + 1);
    const [status, setStatus] = useState(next[0] || "Cancelled");
    const [busy, setBusy] = useState(false);

    async function save() {
        if (status === "Cancelled" && !window.confirm("Cancel this order? Stock will be returned.")) return;

        setBusy(true);
        try {
            await api(`/orders/${order.order_id}/status`, { method: "PUT", body: { status } });
            showToast(status === "Cancelled" ? "Order cancelled" : "Order marked as " + status);
            onSaved();
        } catch (err) {
            showToast(err.message, true);
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="order-actions">
            <select className="status-select" aria-label="New status" value={status}
                    onChange={(e) => setStatus(e.target.value)}>
                {next.map((s) => <option key={s}>{s}</option>)}
                <option value="Cancelled">Cancel order</option>
            </select>
            <button className="btn btn-small" disabled={busy} onClick={save}>
                {busy ? "Saving..." : "Update Status"}
            </button>
        </div>
    );
}

function FarmerOrder({ order: o, onChanged }) {
    const closed = isClosed(o);

    return (
        <article className="order-card" style={{ boxShadow: "none", border: "1px solid var(--line)" }}>
            <div className="order-head">
                <div>
                    <h3>Order #{orderCode(o.order_id)}</h3>
                    <span className="date">{formatDateTime(o.created_at)} · {o.customer_name} · 📞 {o.phone}</span>
                </div>
                <StatusBadge status={o.status} />
            </div>
            <div className="order-body">
                {o.items.map((i, n) => (
                    <div className="order-line" key={n}>
                        <div>
                            {productEmoji(i.product_name)} <strong>{i.product_name}</strong>
                            <div className="sub">{i.quantity} {i.unit} × {rupees(i.price)}</div>
                        </div>
                        <div>{rupees(i.subtotal)}</div>
                    </div>
                ))}
                <p className="hint" style={{ padding: "8px 0" }}>
                    📍 {o.delivery_address}, {o.city} - {o.pincode}
                    {o.payment && <> · {o.payment.payment_method} <StatusBadge status={o.payment.payment_status} /></>}
                </p>
                {closed
                    ? o.delivery && <p className="hint">Delivered by {o.delivery.delivery_person}</p>
                    : <DeliveryForm order={o} onSaved={onChanged} />}
            </div>
            <div className="order-foot">
                <span className="total">Your items: {rupees(myTotal(o))}</span>
                {!closed && <StatusControls key={o.status} order={o} onSaved={onChanged} />}
            </div>
        </article>
    );
}

export default function FarmerDashboard() {
    useTitle("Farmer Dashboard");
    const { user, showToast } = useApp();

    const [products, setProducts] = useState(null);
    const [orders, setOrders] = useState(null);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState("active");
    const [deletingId, setDeletingId] = useState(null);

    const load = useCallback(() => {
        Promise.all([api("/products/my-products"), api("/orders/farmer-orders")])
            .then(([p, o]) => {
                setProducts(p);
                setOrders(o);
            })
            .catch((err) => setError(err.message));
    }, []);

    useEffect(load, [load]);

    async function deleteProduct(p) {
        if (!window.confirm(`Delete ${p.product_name}? Customers will no longer see it.`)) return;

        setDeletingId(p.product_id);
        try {
            await api("/products/" + p.product_id, { method: "DELETE" });
            showToast("Product deleted");
            load();
        } catch (err) {
            showToast(err.message, true);
        } finally {
            setDeletingId(null);
        }
    }

    const loaded = products && orders;
    const errorBox = <EmptyState emoji="⚠️">{error}</EmptyState>;
    const loading = <p className="loading">Loading...</p>;

    // Stats. Earnings only count this farmer's own items.
    let stats = ["-", "-", "-", "-"];
    let orderList = null;
    if (loaded) {
        const delivered = orders.filter((o) => o.status === "Delivered");
        stats = [
            products.length,
            orders.filter((o) => !isClosed(o)).length,
            delivered.length,
            rupees(delivered.reduce((sum, o) => sum + myTotal(o), 0))
        ];

        const shown = orders.filter((o) =>
            filter === "all" ? true : filter === "done" ? isClosed(o) : !isClosed(o)
        );
        orderList = shown.length === 0
            ? (
                <EmptyState emoji="📭">
                    {filter === "active" ? "No orders waiting. New orders will appear here." : "No orders here yet."}
                </EmptyState>
            )
            : shown.map((o) => <FarmerOrder key={o.order_id} order={o} onChanged={load} />);
    }

    const STAT_LABELS = ["Products listed", "Orders to handle", "Orders delivered", "Earnings (delivered)"];

    return (
        <>
            <Banner title={`Welcome, ${user.name}!`}>Manage your products and customer orders</Banner>

            <main className="container">
                <div className="stats">
                    {STAT_LABELS.map((label, i) => (
                        <div className="stat" key={label}>
                            <div className="value">{stats[i]}</div>
                            <div className="label">{label}</div>
                        </div>
                    ))}
                </div>

                <div className="card">
                    <div className="dash-head">
                        <h2>🌱 My Products</h2>
                        <Link to="/add-product" className="btn btn-orange">+ Add Product</Link>
                    </div>
                    {error ? errorBox : !loaded ? loading
                        : <ProductTable products={products} onDelete={deleteProduct} deletingId={deletingId} />}
                </div>

                <div className="card">
                    <div className="dash-head">
                        <h2>📦 Customer Orders</h2>
                        <select className="status-select" aria-label="Filter orders" value={filter}
                                onChange={(e) => setFilter(e.target.value)}>
                            <option value="active">Orders to handle</option>
                            <option value="all">All orders</option>
                            <option value="done">Delivered / cancelled</option>
                        </select>
                    </div>
                    {error ? errorBox : !loaded ? loading : orderList}
                </div>
            </main>
        </>
    );
}
