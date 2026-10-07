import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Banner from "../components/Banner";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import { api } from "../api";
import { useApp } from "../context";
import { formatDate, orderCode, productEmoji, rupees, useTitle } from "../utils";

function OrderCard({ order: o, onCancel, cancelling }) {
    const closed = o.status === "Delivered" || o.status === "Cancelled";

    return (
        <article className="order-card">
            <div className="order-head">
                <div>
                    <h3>Order #{orderCode(o.order_id)}</h3>
                    <span className="date">Placed on {formatDate(o.created_at)}</span>
                </div>
                <StatusBadge status={o.status} />
            </div>

            <div className="order-body">
                {o.items.map((i, n) => (
                    <div className="order-line" key={n}>
                        <div>
                            {productEmoji(i.product_name)} <strong>{i.product_name}</strong>
                            <div className="sub">
                                {i.quantity} {i.unit} × {rupees(i.price)} · Farmer: {i.farmer_name}
                            </div>
                        </div>
                        <div>{rupees(i.subtotal)}</div>
                    </div>
                ))}
            </div>

            <div className="order-foot">
                <div>
                    <span className="total">Total: {rupees(o.total_amount)}</span>
                    <div className="sub hint">
                        {o.payment && <>{o.payment.payment_method} · <StatusBadge status={o.payment.payment_status} /></>}
                    </div>
                </div>
                <div className="order-actions">
                    {o.status === "Placed" && (
                        <button className="btn btn-danger btn-small" disabled={cancelling} onClick={() => onCancel(o)}>
                            {cancelling ? "Cancelling..." : "Cancel Order"}
                        </button>
                    )}
                    <Link to={`/order-tracking?id=${o.order_id}`} className="btn btn-orange">
                        {closed ? "View Details" : "Track Order"}
                    </Link>
                </div>
            </div>
        </article>
    );
}

export default function Orders() {
    useTitle("My Orders");
    const { showToast } = useApp();

    const [orders, setOrders] = useState(null);
    const [error, setError] = useState("");
    const [cancellingId, setCancellingId] = useState(null);

    const load = useCallback(() => {
        api("/orders/my-orders").then(setOrders).catch((err) => setError(err.message));
    }, []);

    useEffect(load, [load]);

    async function cancel(order) {
        if (!window.confirm("Cancel this order?")) return;

        setCancellingId(order.order_id);
        try {
            await api(`/orders/${order.order_id}/cancel`, { method: "PUT" });
            showToast("Order cancelled");
            load();
        } catch (err) {
            showToast(err.message, true);
        } finally {
            setCancellingId(null);
        }
    }

    let body;
    if (error) {
        body = <EmptyState emoji="⚠️" className="card empty">{error}</EmptyState>;
    } else if (!orders) {
        body = <p className="loading">Loading your orders...</p>;
    } else if (orders.length === 0) {
        body = (
            <EmptyState emoji="📦" className="card empty">
                You haven't placed any orders yet.<br />
                <Link to="/products" className="btn">Start shopping</Link>
            </EmptyState>
        );
    } else {
        body = orders.map((o) => (
            <OrderCard key={o.order_id} order={o} onCancel={cancel} cancelling={cancellingId === o.order_id} />
        ));
    }

    return (
        <>
            <Banner title="📦 My Orders">Track and manage your Fresh Farm orders</Banner>
            <main className="container" style={{ maxWidth: 900 }}>{body}</main>
        </>
    );
}
