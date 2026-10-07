import { Link } from "react-router-dom";
import { useApp } from "../context";
import { useTitle } from "../utils";

const FEATURES = [
    { icon: "👨‍🌾", title: "Direct From Farmers", text: "Buy fresh produce straight from the farmers who grow it. No middlemen." },
    { icon: "🥬", title: "Fresh Products", text: "Vegetables, fruits and grains listed by farmers near you." },
    { icon: "🛒", title: "Easy Shopping", text: "Search, add to cart, and order in a few taps." },
    { icon: "📦", title: "Track Orders", text: "Follow your order from the farm to your door." }
];

const STEPS = [
    { title: "Farmers list produce", text: "Farmers add products with their own price and stock." },
    { title: "You place an order", text: "Pick products, choose a payment method, and checkout." },
    { title: "Farmer packs it", text: "The farmer confirms, packs and sends your order." },
    { title: "Delivered home", text: "Pay on delivery and enjoy fresh food." }
];

export default function Home() {
    const { user } = useApp();
    useTitle(null);

    // Logged-in farmers go to their dashboard instead of registering again
    const isFarmer = user?.role === "farmer";

    return (
        <main>
            <section className="hero">
                <div className="hero-content">
                    <h1>Fresh Farm Farmer<br />Direct Selling System</h1>
                    <p>Fresh fruits and vegetables directly from farmers to your home.</p>

                    <Link to="/products" className="hero-btn">View Products</Link>
                    <Link to={isFarmer ? "/farmer-dashboard" : "/farmer#register"} className="hero-btn">
                        {isFarmer ? "Go to Dashboard" : "Join as Farmer"}
                    </Link>
                </div>
            </section>

            <section className="features">
                {FEATURES.map((f) => (
                    <div className="feature" key={f.title}>
                        <div className="icon">{f.icon}</div>
                        <h3>{f.title}</h3>
                        <p>{f.text}</p>
                    </div>
                ))}
            </section>

            <section className="how-it-works">
                <h2 className="section-title">How it works</h2>

                <div className="steps">
                    {STEPS.map((s, i) => (
                        <div className="step" key={s.title}>
                            <div className="step-num">{i + 1}</div>
                            <h3>{s.title}</h3>
                            <p>{s.text}</p>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
}
