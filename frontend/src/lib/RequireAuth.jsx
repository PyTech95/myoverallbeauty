import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./auth";
import { useSeo } from "./seo";

export function RequireAuth({ children, staffOnly = false }) {
    const { user, ready } = useAuth();
    const location = useLocation();
    useSeo({ path: location.pathname, noindex: true });
    if (!ready)
        return (
            <div
                className="grid min-h-screen place-items-center bg-ink text-gold"
                data-testid="auth-loading"
            >
                <div className="label">Loading…</div>
            </div>
        );
    if (!user)
        return (
            <Navigate
                to="/signin"
                state={{ from: location.pathname }}
                replace
            />
        );
    if (staffOnly && user.role !== "staff")
        return <Navigate to="/account" replace />;
    return children;
}
