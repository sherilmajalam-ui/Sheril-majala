import { Navigate, useLocation } from "react-router-dom";
import { useApp } from "../context";

// Shows the page only to a logged-in user with the right role.
// Otherwise sends them to the login page and brings them back afterwards.
export default function RequireLogin({ role, children }) {
    const { user } = useApp();
    const location = useLocation();

    if (!user || (role && user.role !== role)) {
        const page = role === "farmer" ? "/farmer" : "/customer";
        const next = encodeURIComponent(location.pathname + location.search);
        return <Navigate to={`${page}?next=${next}#login`} replace />;
    }
    return children;
}
