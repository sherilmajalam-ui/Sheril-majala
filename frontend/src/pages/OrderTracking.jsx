import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import Banner from "../components/Banner";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import { api } from "../api";
import { useApp } from "../context";
import { formatDateTime, orderCode, productEmoji, rupees, useTitle } from "../utils";

const STEPS = [
    { status: "Placed", text: "Your order has been placed." },
    { status: "Confirmed", text: "The farmer has confirmed your order." },
    { status: "Packed", text: "Your products have been packed." },
    { status: "Out for Delivery", text: "Your order is on the way." },
    { status: "Delivered", text: "Your order has been delivered." }
];

function Timeline({ status }) {
    if (status === "Cancelled") {
        return <div className="cancelled-box">❌ This order was cancelled. Any stock was returned to the farmer.</div>;
    }

    const current = STEPS.findIndex((s) => s.status === status);

    return (
        <ol className="timeline">
            {STEPS.map((step, i) => {
                let cls = "";
                if (i < current || status === "Delivered") cls = "done";
                else if (i === current) cls = "current";

                return (
                    <li className={cls} key={step.status}>
                        <span className="dot">{cls === "done" ? "✓" : ""}</span>
                        <h4>{step.status}</h4>
                        <p>{i <= current ? step.text : "Waiting"}</p>
                    </li>
                );
            })}
        </ol>
    );
}

export default function OrderTracking() {
    useTitle("Order Tracking");
    const { user, showToast } = useApp();
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const orderId = params.get("id");
    const isNew = Boolean(params.get("new"));

    const [order, setOrder] = useState(null);
    const [error, setError] = useState("");
    const [cancelling, setCancelling] = useState(false);

    const load = useCallback(() => {
        if (!orderId) return;
        api("/orders/" + encodeURIComponent(orderId)).then(setOrder).catch((err) => setError(err.message));
    }, [orderId]);

    useEffect(load, [load]);

    async function cancel() {
        if (!window.confirm("Cancel this order?")) return;

        setCancelling(true);
        try {
            await api(`/orders/${order.order_id}/cancel`, { method: "PUT" });
            showToast("Order cancelled");
            navigate(`/order-tracking?id=${order.order_id}`, { replace: true });
            load();
        } catch (err) {
            showToast(err.message, true);
        } finally {
            setCancelling(false);
        }
    }

    const isCustomer = user.role === "customer";
    let body;
    let bannerText = "Follow your order from the farm to your door";

    if (!orderId) {
        body = (
            <EmptyState emoji="🔍" className="card empty">
                No order selected.<br />
                <Link to="/orders" className="btn">Go to My Orders</Link>
            </EmptyState>
        );
    } else if (error) {
        body = (
            <EmptyState emoji="🔍" className="card empty">
                {error}<br />
                <Link to="/" className="btn">Go Home</Link>
            </EmptyState>
        );
    } else if (!order) {
        body = <p className="loading">Loading order...</p>;
    } else {
        const o = order;
        bannerText = `Order #${orderCode(o.order_id)} · ${o.status}`;

        // Unique farmers in this order
        const farmers = [];
        o.items.forEach((i) => {
            if (!farmers.some((f) => f.name === i.farmer_name)) {
                farmers.push({ name: i.farmer_name, location: i.farm_location, phone: i.farmer_phone });
            }
        });

        body = (
            <>
                {isNew && (
                    <p className="message show success" style={{ margin: "0 0 22px" }}>
                        ✅ Order placed successfully! Thank you for shopping with Fresh Farm.
                    </p>
                )}

                <div className="info-grid">
                    <div className="card">
                        <h2>Order Details</h2>
                        <p><b>Order ID:</b> #{orderCode(o.order_id)}</p>
                        <p><b>Placed on:</b> {formatDateTime(o.created_at)}</p>
                        <p><b>Status:</b> <StatusBadge status={o.status} /></p>
                        <p>
                            <b>Payment:</b>{" "}
                            {o.payment
                                ? <>{o.payment.payment_method} <StatusBadge status={o.payment.payment_status} /></>
                                : "-"}
                        </p>
                    </div>

                    <div className="card">
                        <h2>📍 Delivery</h2>
                        <p><b>Customer:</b> {o.customer_name}</p>
                        <p><b>Address:</b> {o.delivery_address}, {o.city} - {o.pincode}</p>
                        <p><b>Phone:</b> {o.phone}</p>
                        {o.delivery
                            ? <p><b>Delivery person:</b> {o.delivery.delivery_person} ({o.delivery.phone})</p>
                            : <p className="hint">A delivery person will be assigned soon.</p>}
                    </div>

                    <div className="card">
                        <h2>👨‍🌾 Farmer{farmers.length > 1 ? "s" : ""}</h2>
                        {farmers.map((f) => (
                            <p key={f.name}>
                                <b>{f.name}</b><br />
                                <span className="hint">{f.location || ""}{f.phone ? " · " + f.phone : ""}</span>
                            </p>
                        ))}
                    </div>
                </div>

                <div className="two-col" style={{ marginTop: 22 }}>
                    <div className="card">
                        <h2>📋 Order Status</h2>
                        <Timeline status={o.status} />
                    </div>

                    <div className="card">
                        <h2>Items</h2>
                        <div className="summary-items">
                            {o.items.map((i, n) => (
                                <div key={n}>
                                    <span>{productEmoji(i.product_name)} {i.product_name} × {i.quantity} {i.unit}</span>
                                    <span>{rupees(i.subtotal)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="summary-row"><span>Subtotal</span><span>{rupees(o.subtotal)}</span></div>
                        <div className="summary-row"><span>Delivery charge</span><span>{rupees(o.delivery_charge)}</span></div>
                        <div className="summary-row summary-total"><span>Total</span><span>{rupees(o.total_amount)}</span></div>

                        <div style={{ marginTop: 18, display: "grid", gap: 10 }}>
                            {isCustomer && o.status === "Placed" && (
                                <button className="btn btn-danger btn-block" disabled={cancelling} onClick={cancel}>
                                    {cancelling ? "Cancelling..." : "Cancel Order"}
                                </button>
                            )}
                            <Link to={isCustomer ? "/orders" : "/farmer-dashboard"} className="btn btn-outline btn-block">
                                {isCustomer ? "Back to My Orders" : "Back to Dashboard"}
                            </Link>
                            {isCustomer && <Link to="/products" className="btn btn-block">Continue Shopping</Link>}
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Banner title="🚚 Order Tracking">{bannerText}</Banner>
            <main className="container" style={{ maxWidth: 1000 }}>{body}</main>
        </>
    );
}
