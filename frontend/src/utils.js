import { useEffect } from "react";

/* ===== Formatting helpers ===== */

export function rupees(amount) {
    return "₹" + Number(amount).toLocaleString("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

export function formatDate(value) {
    return new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

export function formatDateTime(value) {
    return new Date(value).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
    });
}

export function orderCode(id) {
    return "FF" + String(1000 + Number(id));
}

export const CATEGORIES = ["Vegetables", "Fruits", "Leafy Vegetables", "Grains", "Other"];

export const PHONE_PATTERN = /^(\+91)?[6-9]\d{9}$/;

export function isValidPhone(phone) {
    return PHONE_PATTERN.test(phone.replace(/\s/g, ""));
}

/* ----- Product emoji (used when there's no photo) ----- */

const EMOJI = {
    tomato: "🍅", brinjal: "🍆", potato: "🥔", onion: "🧅", chilli: "🌶️",
    cauliflower: "🥦", broccoli: "🥦", cabbage: "🥬", carrot: "🥕", beans: "🫛",
    banana: "🍌", mango: "🥭", apple: "🍎", orange: "🍊", grapes: "🍇",
    watermelon: "🍉", coconut: "🥥", spinach: "🥬", corn: "🌽", rice: "🌾",
    wheat: "🌾", milk: "🥛", honey: "🍯", cucumber: "🥒", garlic: "🧄",
    lemon: "🍋", pineapple: "🍍", papaya: "🥭", ginger: "🫚", peas: "🫛"
};

const CATEGORY_EMOJI = {
    Vegetables: "🥕", Fruits: "🍎", "Leafy Vegetables": "🥬", Grains: "🌾", Other: "🧺"
};

export function productEmoji(name, category) {
    const lower = String(name).toLowerCase();
    for (const key in EMOJI) {
        if (lower.includes(key)) return EMOJI[key];
    }
    return CATEGORY_EMOJI[category] || "🌱";
}

/* ----- Page title ----- */


export function useTitle(title) {
    useEffect(() => {
        document.title = title ? `${title} - Fresh Farm` : "Fresh Farm Farmer Direct Selling System";
    }, [title]);
}
