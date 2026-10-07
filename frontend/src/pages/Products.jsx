import { useEffect, useState } from "react";

import Banner from "../components/Banner";
import EmptyState from "../components/EmptyState";
import ProductPicture from "../components/ProductPicture";
import { api } from "../api";
import { useApp } from "../context";
import { CATEGORIES, rupees, useTitle } from "../utils";

const FULL_ROW = { gridColumn: "1/-1" };

function ProductCard({ product: p, canBuy }) {
    const { addToCart, showToast } = useApp();
    const [qty, setQty] = useState("1");
    const out = p.quantity <= 0;

    function handleAdd() {
        const n = parseInt(qty, 10);
        if (!Number.isInteger(n) || n < 1) {
            showToast("Please enter a quantity of 1 or more", true);
            return;
        }
        if (addToCart(p, n)) setQty("1");
    }

    return (
        <article className="product-card">
            <div className="product-img"><ProductPicture product={p} /></div>
            <div className="product-body">
                <h3>{p.product_name}</h3>
                <p className="product-meta">Category: {p.category}</p>
                <p className="product-meta">
                    👨‍🌾 {p.farmer_name}{p.farm_location ? ", " + p.farm_location.split(",")[0] : ""}
                </p>
                <p className="price">{rupees(p.price)} <small>/ {p.unit}</small></p>

                {out && <p className="stock-out">Out of stock</p>}
                {!out && p.quantity <= 5 && <p className="stock-low">Only {p.quantity} left</p>}

                {canBuy && (
                    <div className="qty-row">
                        <input type="number" value={qty} min="1" max={p.quantity} aria-label="Quantity"
                               disabled={out} onChange={(e) => setQty(e.target.value)} />
                        <button className="btn btn-orange" disabled={out} onClick={handleAdd}>
                            Add to Cart
                        </button>
                    </div>
                )}
            </div>
        </article>
    );
}

export default function Products() {
    useTitle("Products");
    const { user } = useApp();

    const [products, setProducts] = useState(null);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("");

    useEffect(() => {
        api("/products").then(setProducts).catch((err) => setError(err.message));
    }, []);

    // Farmers can browse but not buy
    const canBuy = user?.role !== "farmer";

    let content;
    if (error) {
        content = <EmptyState emoji="⚠️" style={FULL_ROW}>{error}</EmptyState>;
    } else if (!products) {
        content = <p className="loading">Loading products...</p>;
    } else if (products.length === 0) {
        content = <EmptyState emoji="🌱" style={FULL_ROW}>No products yet. Farmers will add them soon.</EmptyState>;
    } else {
        const term = search.trim().toLowerCase();
        const shown = products.filter((p) =>
            p.product_name.toLowerCase().includes(term) && (!category || p.category === category)
        );
        content = shown.length === 0
            ? <EmptyState emoji="🔍" style={FULL_ROW}>No products match your search.</EmptyState>
            : shown.map((p) => <ProductCard key={p.product_id} product={p} canBuy={canBuy} />);
    }

    return (
        <>
            <Banner title="Available Fresh Products">Fresh fruits and vegetables direct from farmers</Banner>

            <main className="container">
                <div className="toolbar">
                    <input type="search" className="search-input" placeholder="Search Tomato, Potato, Apple..."
                           aria-label="Search products" value={search} onChange={(e) => setSearch(e.target.value)} />

                    <select className="category-filter" aria-label="Filter by category"
                            value={category} onChange={(e) => setCategory(e.target.value)}>
                        <option value="">All categories</option>
                        {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                </div>

                <div className="product-grid">{content}</div>
            </main>
        </>
    );
}
