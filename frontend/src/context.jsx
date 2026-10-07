/* ===== Shared app state: login, cart and toast messages ===== */

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { clearLogin, getSavedUser, getToken, saveLogin } from "./api";

const AppContext = createContext(null);

export function useApp() {
    return useContext(AppContext);
}

function loadCart() {
    try {
        return JSON.parse(localStorage.getItem("ff_cart")) || [];
    } catch {
        return [];
    }
}

export function AppProvider({ children }) {
    /* ----- Login ----- */
    const [user, setUser] = useState(() => (getToken() ? getSavedUser() : null));

    const login = useCallback((token, newUser) => {
        saveLogin(token, newUser);
        setUser(newUser);
    }, []);

    const logout = useCallback(() => {
        clearLogin();
        setUser(null);
    }, []);

    /* ----- Toast ----- */
    const [toast, setToast] = useState({ text: "", error: false, show: false });
    const toastTimer = useRef();

    const showToast = useCallback((text, error = false) => {
        setToast({ text, error, show: true });
        clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 2600);
    }, []);

    /* ----- Cart (kept in the browser until checkout) ----- */
    const [cart, setCart] = useState(loadCart);

    useEffect(() => {
        localStorage.setItem("ff_cart", JSON.stringify(cart));
    }, [cart]);

    const addToCart = useCallback((product, quantity) => {
        const existing = cart.find((item) => item.product_id === product.product_id);
        const wanted = (existing ? existing.quantity : 0) + quantity;

        if (wanted > product.quantity) {
            showToast(`Only ${product.quantity} ${product.unit} of ${product.product_name} available`, true);
            return false;
        }

        if (existing) {
            setCart(cart.map((item) =>
                item === existing
                    ? { ...item, quantity: wanted, price: product.price, stock: product.quantity }
                    : item
            ));
        } else {
            setCart([...cart, {
                product_id: product.product_id,
                product_name: product.product_name,
                price: product.price,
                unit: product.unit,
                image_url: product.image_url,
                category: product.category,
                farmer_name: product.farmer_name,
                stock: product.quantity,
                quantity
            }]);
        }
        showToast(`${product.product_name} added to cart`);
        return true;
    }, [cart, showToast]);

    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    const value = { user, login, logout, cart, setCart, addToCart, cartCount, showToast };

    return (
        <AppContext.Provider value={value}>
            {children}
            <div
                className={"toast" + (toast.show ? " show" : "") + (toast.error ? " error" : "")}
                role="status"
            >
                {toast.text}
            </div>
        </AppContext.Provider>
    );
}
