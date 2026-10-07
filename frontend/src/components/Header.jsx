import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useApp } from "../context";

function Dropdown({ name, label, open, onToggle, children }) {
    return (
        <div className={"dropdown" + (open === name ? " open" : "")}>
            <button
                className="dropbtn"
                aria-haspopup="true"
                onClick={(e) => {
                    e.stopPropagation();
                    onToggle(open === name ? null : name);
                }}
            >
                {label} ▾
            </button>
            <div className="dropdown-content">{children}</div>
        </div>
    );
}

export default function Header() {
    const { user, logout, cartCount } = useApp();
    const navigate = useNavigate();
    const [open, setOpen] = useState(null);

    // Tap anywhere else to close an open dropdown (phones)
    useEffect(() => {
        const close = () => setOpen(null);
        document.addEventListener("click", close);
        return () => document.removeEventListener("click", close);
    }, []);

    const cartLink = (
        <NavLink to="/cart">
            Cart{" "}
            {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
        </NavLink>
    );

    return (
        <header className="site-header">
            <Link to="/" className="logo">🌱 Fresh Farm</Link>

            <nav className="nav">
                <NavLink to="/" end>Home</NavLink>

                {!user && (
                    <>
                        <Dropdown name="farmer" label="Farmer" open={open} onToggle={setOpen}>
                            <Link to="/farmer#register">Farmer Registration</Link>
                            <Link to="/farmer#login">Farmer Login</Link>
                        </Dropdown>
                        <Dropdown name="customer" label="Customer" open={open} onToggle={setOpen}>
                            <Link to="/customer#register">Customer Registration</Link>
                            <Link to="/customer#login">Customer Login</Link>
                        </Dropdown>
                        <NavLink to="/products">Products</NavLink>
                        {cartLink}
                    </>
                )}

                {user?.role === "customer" && (
                    <>
                        <NavLink to="/products">Products</NavLink>
                        {cartLink}
                        <NavLink to="/orders">My Orders</NavLink>
                    </>
                )}

                {user?.role === "farmer" && (
                    <>
                        <NavLink to="/farmer-dashboard">Dashboard</NavLink>
                        <NavLink to="/add-product">Add Product</NavLink>
                        <NavLink to="/products">Products</NavLink>
                    </>
                )}

                {user && (
                    <Dropdown name="user" label={"👤 " + user.name.split(" ")[0]} open={open} onToggle={setOpen}>
                        <button
                            type="button"
                            onClick={() => {
                                logout();
                                navigate("/");
                            }}
                        >
                            Logout
                        </button>
                    </Dropdown>
                )}
            </nav>
        </header>
    );
}
