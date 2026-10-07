import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import Banner from "../components/Banner";
import Message from "../components/Message";
import { api, DELIVERY_CHARGE } from "../api";
import { useApp } from "../context";
import { isValidPhone, rupees, useTitle } from "../utils";

const PAYMENT_OPTIONS = [
    { value: "Cash on Delivery", label: "💵 Cash on Delivery" },
    { value: "UPI", label: "📱 UPI on delivery" },
    { value: "Card", label: "💳 Card on delivery" }
];

export default function Checkout() {
    useTitle("Checkout");
    const { cart, setCart } = useApp();
    const navigate = useNavigate();

    const [form, setForm] = useState({ address: "", city: "", pincode: "", phone: "", payment: "Cash on Delivery" });
    const [msg, setMsg] = useState(null);
    const [busy, setBusy] = useState(false);
    const [placed, setPlaced] = useState(false);

    // Fill in saved phone and address
    useEffect(() => {
        api("/customers/me")
            .then((me) => setForm((f) => ({
                ...f,
                phone: f.phone || me.phone || "",
                address: f.address || me.address || ""
            })))
            .catch(() => {});
    }, []);

    if (cart.length === 0 && !placed) return <Navigate to="/cart" replace />;

    // Summary (the server recalculates the real total when the order is placed)
    const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const setField = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    async function handleSubmit(e) {
        e.preventDefault();
        setMsg(null);

        const body = {
            items: cart.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
            address: form.address.trim(),
            city: form.city.trim(),
            pincode: form.pincode.trim(),
            phone: form.phone.trim(),
            payment_method: form.payment
        };

        if (body.address.length < 5) return setMsg({ text: "Please enter your full address." });
        if (body.city.length < 2) return setMsg({ text: "Please enter your city." });
        if (!/^\d{6}$/.test(body.pincode)) return setMsg({ text: "Please enter a valid 6-digit PIN code." });
        if (!isValidPhone(body.phone)) return setMsg({ text: "Please enter a valid 10-digit mobile number." });

        setBusy(true);
        try {
            const result = await api("/orders", { method: "POST", body });
            setPlaced(true);
            setCart([]);
            navigate(`/order-tracking?id=${result.orderId}&new=1`);
        } catch (err) {
            setMsg({ text: err.message });
            setBusy(false);
        }
    }

    return (
        <>
            <Banner title="Checkout">Delivery details and payment</Banner>

            <main className="container">
                <form className="two-col" onSubmit={handleSubmit} noValidate>
                    <div>
                        <div className="card">
                            <h2>Delivery Address</h2>

                            <div className="form-group">
                                <label htmlFor="address">House / street / area</label>
                                <textarea id="address" name="address" placeholder="Door no, street, area"
                                          value={form.address} onChange={setField} required />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="city">City</label>
                                    <input type="text" id="city" name="city" placeholder="City or town"
                                           value={form.city} onChange={setField} required />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="pincode">PIN code</label>
                                    <input type="text" id="pincode" name="pincode" placeholder="6 digits" maxLength={6}
                                           inputMode="numeric" value={form.pincode} onChange={setField} required />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="phone">Mobile number for delivery</label>
                                <input type="tel" id="phone" name="phone" placeholder="10-digit number" maxLength={13}
                                       value={form.phone} onChange={setField} required />
                            </div>
                        </div>

                        <div className="card">
                            <h2>Payment Method</h2>

                            {PAYMENT_OPTIONS.map((o) => (
                                <label className="radio-option" key={o.value}>
                                    <input type="radio" name="payment" value={o.value}
                                           checked={form.payment === o.value} onChange={setField} />
                                    {" "}{o.label}
                                </label>
                            ))}

                            <p className="hint">You pay the delivery person when your order arrives.</p>
                        </div>
                    </div>

                    <div className="card">
                        <h2>Order Summary</h2>
                        <div className="summary-items">
                            {cart.map((i) => (
                                <div key={i.product_id}>
                                    <span>{i.product_name} × {i.quantity} {i.unit}</span>
                                    <span>{rupees(i.price * i.quantity)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="summary-row"><span>Subtotal</span><span>{rupees(subtotal)}</span></div>
                        <div className="summary-row"><span>Delivery charge</span><span>{rupees(DELIVERY_CHARGE)}</span></div>
                        <div className="summary-row summary-total"><span>Total</span><span>{rupees(subtotal + DELIVERY_CHARGE)}</span></div>

                        <button type="submit" className="btn btn-orange btn-block" style={{ marginTop: 18 }} disabled={busy}>
                            {busy ? "Placing order..." : "Place Order"}
                        </button>

                        <Message msg={msg} />

                        <Link to="/cart" className="btn btn-outline btn-block" style={{ marginTop: 10 }}>Back to Cart</Link>
                    </div>
                </form>
            </main>
        </>
    );
}
