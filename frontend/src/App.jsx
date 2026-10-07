import { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";
import RequireLogin from "./components/RequireLogin";

import Home from "./pages/Home";
import AuthPage from "./pages/AuthPage";
import Products from "./pages/Products";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderTracking from "./pages/OrderTracking";
import FarmerDashboard from "./pages/FarmerDashboard";
import AddProduct from "./pages/AddProduct";

export default function App() {
    const { pathname } = useLocation();

    // The home page footer has no top margin (see .home-page in styles.css)
    useEffect(() => {
        document.body.classList.toggle("home-page", pathname === "/");
        window.scrollTo(0, 0);
    }, [pathname]);

    return (
        <>
            <Header />

            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/farmer" element={<AuthPage role="farmer" />} />
                <Route path="/customer" element={<AuthPage role="customer" />} />
                <Route path="/products" element={<Products />} />
                <Route path="/cart" element={<Cart />} />

                <Route path="/checkout" element={<RequireLogin role="customer"><Checkout /></RequireLogin>} />
                <Route path="/orders" element={<RequireLogin role="customer"><Orders /></RequireLogin>} />
                <Route path="/order-tracking" element={<RequireLogin><OrderTracking /></RequireLogin>} />
                <Route path="/farmer-dashboard" element={<RequireLogin role="farmer"><FarmerDashboard /></RequireLogin>} />
                <Route path="/add-product" element={<RequireLogin role="farmer"><AddProduct /></RequireLogin>} />

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            <Footer />
        </>
    );
}
