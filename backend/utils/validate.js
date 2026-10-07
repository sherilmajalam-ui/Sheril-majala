const isEmail = (v) => typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

// Indian mobile number: 10 digits starting 6-9 (optional +91)
const isPhone = (v) => typeof v === "string" && /^(\+91)?[6-9]\d{9}$/.test(v.replace(/\s/g, ""));

const isPincode = (v) => /^\d{6}$/.test(String(v || "").trim());

const clean = (v) => (typeof v === "string" ? v.trim() : v);

// Checks name/email/phone/password for both farmers and customers
const validateRegistration = ({ name, email, phone, password }) => {
    if (!name || !email || !phone || !password) return "Please fill all required fields";
    if (clean(name).length < 2) return "Please enter your full name";
    if (!isEmail(email)) return "Please enter a valid email address";
    if (!isPhone(phone)) return "Please enter a valid 10-digit mobile number";
    if (password.length < 6) return "Password must be at least 6 characters";
    return null;
};

module.exports = { isEmail, isPhone, isPincode, clean, validateRegistration };
