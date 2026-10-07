import { useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";

import Banner from "../components/Banner";
import Message from "../components/Message";
import { api } from "../api";
import { useApp } from "../context";
import { isValidPhone, useTitle } from "../utils";

// Text that differs between the farmer and customer pages
const TEXT = {
    farmer: {
        title: "Farmer",
        banner: "👨‍🌾 Farmer Account",
        tagline: "Sell your produce directly to customers",
        apiPath: "/farmers",
        home: "/farmer-dashboard",
        addressLabel: "Farm location",
        addressPlaceholder: "Village, district, state",
        demo: "farmer@freshfarm.com / farmer123"
    },
    customer: {
        title: "Customer",
        banner: "🛒 Customer Account",
        tagline: "Buy fresh produce straight from farmers",
        apiPath: "/customers",
        home: "/products",
        addressLabel: "Address (optional)",
        addressPlaceholder: "Your home address",
        demo: "customer@freshfarm.com / customer123"
    }
};

const EMPTY_REGISTER = { name: "", email: "", phone: "", address: "", password: "", confirm: "" };

export default function AuthPage({ role }) {
    const t = TEXT[role];
    useTitle(t.title);

    const { user, login } = useApp();
    const navigate = useNavigate();
    const { hash } = useLocation();
    const [params] = useSearchParams();
    const tab = hash === "#register" ? "register" : "login";

    const [loginForm, setLoginForm] = useState({ email: "", password: "" });
    const [loginMsg, setLoginMsg] = useState(
        params.get("expired") ? { text: "Your session expired. Please log in again." } : null
    );
    const [loginBusy, setLoginBusy] = useState(false);
    const passwordRef = useRef();

    const [reg, setReg] = useState(EMPTY_REGISTER);
    const [regMsg, setRegMsg] = useState(null);
    const [regBusy, setRegBusy] = useState(false);

    // Where to go after login. Only allow paths inside this site.
    const next = params.get("next");
    const nextPage = next && /^\/[\w\-/]*(\?[\w=&-]*)?$/.test(next) ? next : t.home;

    // Already logged in with this role? Go straight in.
    if (user?.role === role) return <Navigate to={nextPage} replace />;

    async function handleLogin(e) {
        e.preventDefault();
        setLoginMsg(null);

        const email = loginForm.email.trim();
        if (!email || !loginForm.password) {
            return setLoginMsg({ text: "Please enter your email and password." });
        }

        setLoginBusy(true);
        try {
            const data = await api(t.apiPath + "/login", {
                method: "POST",
                body: { email, password: loginForm.password }
            });
            login(data.token, data.user);
            navigate(nextPage, { replace: true });
        } catch (err) {
            setLoginMsg({ text: err.message });
            setLoginBusy(false);
        }
    }

    async function handleRegister(e) {
        e.preventDefault();
        setRegMsg(null);

        const body = {
            name: reg.name.trim(),
            email: reg.email.trim(),
            phone: reg.phone.trim(),
            address: reg.address.trim(),
            password: reg.password
        };

        if (!body.name || !body.email || !body.phone || !body.password) {
            return setRegMsg({ text: "Please fill name, email, mobile number and password." });
        }
        if (!isValidPhone(body.phone)) {
            return setRegMsg({ text: "Please enter a valid 10-digit mobile number." });
        }
        if (body.password.length < 6) {
            return setRegMsg({ text: "Password must be at least 6 characters." });
        }
        if (body.password !== reg.confirm) {
            return setRegMsg({ text: "Passwords don't match." });
        }

        setRegBusy(true);
        try {
            await api(t.apiPath + "/register", { method: "POST", body });
            setReg(EMPTY_REGISTER);
            setLoginForm({ email: body.email, password: "" });
            setLoginMsg({ text: "Registration successful. Please log in.", type: "success" });
            navigate({ search: params.toString(), hash: "login" });
            setTimeout(() => passwordRef.current?.focus());
        } catch (err) {
            setRegMsg({ text: err.message });
        } finally {
            setRegBusy(false);
        }
    }

    const setLoginField = (e) => setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
    const setRegField = (e) => setReg({ ...reg, [e.target.name]: e.target.value });
    const goTab = (name) => navigate({ search: params.toString(), hash: name }, { replace: true });

    return (
        <>
            <Banner title={t.banner}>{t.tagline}</Banner>

            <main className="container narrow">
                <div className="card">
                    <div className="tabs" role="tablist">
                        <button
                            className={"tab" + (tab === "login" ? " active" : "")}
                            type="button"
                            role="tab"
                            aria-selected={tab === "login"}
                            onClick={() => goTab("login")}
                        >
                            Login
                        </button>
                        <button
                            className={"tab" + (tab === "register" ? " active" : "")}
                            type="button"
                            role="tab"
                            aria-selected={tab === "register"}
                            onClick={() => goTab("register")}
                        >
                            Register
                        </button>
                    </div>

                    {tab === "login" ? (
                        <form onSubmit={handleLogin} noValidate>
                            <h2>{t.title} Login</h2>

                            <div className="form-group">
                                <label htmlFor="loginEmail">Email</label>
                                <input type="email" id="loginEmail" name="email" placeholder="Enter your email"
                                       autoComplete="email" value={loginForm.email} onChange={setLoginField} required />
                            </div>

                            <div className="form-group">
                                <label htmlFor="loginPassword">Password</label>
                                <input type="password" id="loginPassword" name="password" placeholder="Enter your password"
                                       autoComplete="current-password" ref={passwordRef}
                                       value={loginForm.password} onChange={setLoginField} required />
                            </div>

                            <button type="submit" className="btn btn-block" disabled={loginBusy}>
                                {loginBusy ? "Logging in..." : "Login"}
                            </button>

                            <Message msg={loginMsg} />

                            <p className="switch-text">
                                New here? <Link to={{ search: params.toString(), hash: "register" }}>Create a {role} account</Link>
                            </p>

                            <p className="demo-note">Demo account: {t.demo}</p>
                        </form>
                    ) : (
                        <form onSubmit={handleRegister} noValidate>
                            <h2>{t.title} Registration</h2>

                            <div className="form-group">
                                <label htmlFor="regName">Full name</label>
                                <input type="text" id="regName" name="name" placeholder="Enter your full name"
                                       autoComplete="name" value={reg.name} onChange={setRegField} required />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="regEmail">Email</label>
                                    <input type="email" id="regEmail" name="email" placeholder="you@example.com"
                                           autoComplete="email" value={reg.email} onChange={setRegField} required />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="regPhone">Mobile number</label>
                                    <input type="tel" id="regPhone" name="phone" placeholder="10-digit number" maxLength={13}
                                           autoComplete="tel" value={reg.phone} onChange={setRegField} required />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="regAddress">{t.addressLabel}</label>
                                <textarea id="regAddress" name="address" placeholder={t.addressPlaceholder}
                                          value={reg.address} onChange={setRegField} />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="regPassword">Password</label>
                                    <input type="password" id="regPassword" name="password" placeholder="At least 6 characters"
                                           autoComplete="new-password" value={reg.password} onChange={setRegField} required />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="regConfirm">Confirm password</label>
                                    <input type="password" id="regConfirm" name="confirm" placeholder="Type it again"
                                           autoComplete="new-password" value={reg.confirm} onChange={setRegField} required />
                                </div>
                            </div>

                            <button type="submit" className="btn btn-block btn-orange" disabled={regBusy}>
                                {regBusy ? "Registering..." : `Register as ${t.title}`}
                            </button>

                            <Message msg={regMsg} />

                            <p className="switch-text">
                                Already registered? <Link to={{ search: params.toString(), hash: "login" }}>Login</Link>
                            </p>
                        </form>
                    )}
                </div>
            </main>
        </>
    );
}
