/* ===== API helper and saved login ===== */

// The backend serves the built site, and Vite forwards /api in development,
// so the same relative path works in both cases.
const API_BASE = "/api";

export const DELIVERY_CHARGE = 20;

export function getToken() {
    return localStorage.getItem("ff_token");
}

export function getSavedUser() {
    try {
        return JSON.parse(localStorage.getItem("ff_user"));
    } catch {
        return null;
    }
}

export function saveLogin(token, user) {
    localStorage.setItem("ff_token", token);
    localStorage.setItem("ff_user", JSON.stringify(user));
}

export function clearLogin() {
    localStorage.removeItem("ff_token");
    localStorage.removeItem("ff_user");
}

export async function api(path, options = {}) {
    const headers = { "Content-Type": "application/json" };
    const token = getToken();
    if (token) headers.Authorization = "Bearer " + token;

    let response;
    try {
        response = await fetch(API_BASE + path, {
            method: options.method || "GET",
            headers,
            body: options.body ? JSON.stringify(options.body) : undefined
        });
    } catch {
        throw new Error("Can't reach the server. Make sure the backend is running (npm start).");
    }

    const data = await response.json().catch(() => ({}));

    // Token expired or invalid: log out and send to the right login page
    if (response.status === 401 && token) {
        const role = getSavedUser()?.role;
        clearLogin();
        window.location.href = (role === "farmer" ? "/farmer" : "/customer") + "?expired=1#login";
        throw new Error(data.message || "Please log in again");
    }

    if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
    }
    return data;
}
