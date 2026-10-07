import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import Banner from "../components/Banner";
import Message from "../components/Message";
import ProductPicture from "../components/ProductPicture";
import { api } from "../api";
import { useApp } from "../context";
import { CATEGORIES, useTitle } from "../utils";

const UNITS = ["Kg", "500 g", "250 g", "Piece", "Dozen", "Bunch", "Litre"];

const EMPTY = {
    product_name: "", category: "", unit: "Kg", price: "", quantity: "", description: "", image_url: ""
};

export default function AddProduct() {
    const [params] = useSearchParams();
    const editId = params.get("id");
    useTitle(editId ? "Edit Product" : "Add Product");

    const { user, showToast } = useApp();
    const navigate = useNavigate();

    const [form, setForm] = useState(EMPTY);
    const [msg, setMsg] = useState(null);
    const [busy, setBusy] = useState(false);
    const [locked, setLocked] = useState(false);

    // Edit mode: load the product into the form
    useEffect(() => {
        setForm(EMPTY);
        setMsg(null);
        setLocked(false);
        if (!editId) return;

        api("/products/" + encodeURIComponent(editId))
            .then((p) => {
                if (p.farmer_id !== user.id) {
                    setMsg({ text: "You can only edit your own products." });
                    setLocked(true);
                    return;
                }
                setForm({
                    product_name: p.product_name,
                    category: p.category,
                    unit: p.unit,
                    price: String(p.price),
                    quantity: String(p.quantity),
                    description: p.description || "",
                    image_url: p.image_url || ""
                });
            })
            .catch((err) => {
                setMsg({ text: err.message });
                setLocked(true);
            });
    }, [editId, user.id]);

    const setField = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    async function handleSubmit(e) {
        e.preventDefault();
        setMsg(null);

        const body = {
            product_name: form.product_name.trim(),
            category: form.category,
            unit: form.unit,
            price: Number(form.price),
            quantity: Number(form.quantity),
            description: form.description.trim(),
            image_url: form.image_url.trim()
        };

        if (body.product_name.length < 2) return setMsg({ text: "Please enter a product name." });
        if (!body.category) return setMsg({ text: "Please choose a category." });
        if (!(body.price > 0)) return setMsg({ text: "Price must be more than 0." });
        if (form.quantity === "" || !Number.isInteger(body.quantity) || body.quantity < 0) {
            return setMsg({ text: "Stock must be a whole number (0 or more)." });
        }

        setBusy(true);
        try {
            if (editId) {
                await api("/products/" + editId, { method: "PUT", body });
                showToast("Product updated");
                setTimeout(() => navigate("/farmer-dashboard"), 700);
            } else {
                await api("/products", { method: "POST", body });
                setForm(EMPTY);
                setMsg({ text: `${body.product_name} added. Customers can see it now.`, type: "success" });
            }
        } catch (err) {
            setMsg({ text: err.message });
        } finally {
            setBusy(false);
        }
    }

    const preview = {
        product_name: form.product_name,
        category: form.category,
        image_url: form.image_url.trim()
    };

    return (
        <>
            <Banner title={editId ? "Edit Product" : "Add New Product"}>Farmer Product Management</Banner>

            <main className="container" style={{ maxWidth: 640 }}>
                <form className="card" onSubmit={handleSubmit} noValidate>
                    <div className="form-group">
                        <label htmlFor="productName">Product name</label>
                        <input type="text" id="productName" name="product_name" placeholder="Example: Tomato"
                               maxLength={100} value={form.product_name} onChange={setField} required />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="category">Category</label>
                            <select id="category" name="category" value={form.category} onChange={setField} required>
                                <option value="">Select category</option>
                                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="unit">Sold per</label>
                            <select id="unit" name="unit" value={form.unit} onChange={setField}>
                                {UNITS.map((u) => <option key={u}>{u}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="price">Price (₹)</label>
                            <input type="number" id="price" name="price" placeholder="Price per unit" min="1" step="0.5"
                                   value={form.price} onChange={setField} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="quantity">Stock available</label>
                            <input type="number" id="quantity" name="quantity" placeholder="How many units" min="0" step="1"
                                   value={form.quantity} onChange={setField} required />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description</label>
                        <textarea id="description" name="description" placeholder="How it's grown, freshness, taste..."
                                  value={form.description} onChange={setField} />
                    </div>

                    <div className="form-group">
                        <label htmlFor="imageUrl">Photo link (optional)</label>
                        <input type="url" id="imageUrl" name="image_url" placeholder="https://..."
                               value={form.image_url} onChange={setField} />
                        <p className="hint">Paste an image link. Without one, an emoji is shown.</p>
                    </div>

                    <div className="product-img" style={{ borderRadius: 8, marginBottom: 18 }}>
                        <ProductPicture product={preview} />
                    </div>

                    <button type="submit" className="btn btn-orange btn-block" disabled={busy || locked}>
                        {busy ? "Saving..." : editId ? "Save Changes" : "Add Product"}
                    </button>

                    <Message msg={msg} />

                    <Link to="/farmer-dashboard" className="btn btn-outline btn-block" style={{ marginTop: 10 }}>
                        Back to Dashboard
                    </Link>
                </form>
            </main>
        </>
    );
}
