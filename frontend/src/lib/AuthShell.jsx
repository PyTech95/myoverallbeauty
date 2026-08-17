import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LOGO_URL } from "./content";
import { useAuth } from "./auth";

export default function AuthShell({ title, subtitle, children, footer }) {
    return (
        <div
            className="grain relative flex min-h-screen flex-col bg-ink text-white lg:flex-row"
            data-testid="auth-shell"
        >
            {/* Left panel */}
            <div className="relative hidden overflow-hidden lg:block lg:w-[55%]">
                <img
                    src="https://images.unsplash.com/photo-1519668752166-ebdbfe986afd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzF8MHwxfHNlYXJjaHwxfHxnbG93aW5nJTIwc2tpbiUyMHdvbWFuJTIwYmxhY2slMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc4NDYzODk5OHww&ixlib=rb-4.1.0&q=85"
                    alt=""
                    className="h-full w-full object-cover opacity-70"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/30 to-transparent" />
                <div className="absolute inset-0 border-r border-gold/25" />
                <Link
                    to="/"
                    className="absolute left-8 top-8 flex items-center gap-3"
                    data-testid="auth-back-home"
                >
                    <img
                        src={LOGO_URL}
                        alt=""
                        className="h-14 w-auto object-contain"
                    />
                </Link>
                <div className="absolute bottom-14 left-10 right-10 max-w-lg">
                    <div className="label mb-4 text-gold">
                        Where beauty meets wellness
                    </div>
                    <div className="font-serif text-5xl italic leading-[1.05] text-white">
                        Personalized care,
                        <br />
                        authored one client{" "}
                        <em className="italic text-gold-gradient animate-shimmer">
                            at a time.
                        </em>
                    </div>
                </div>
            </div>

            {/* Right panel — form */}
            <div className="flex flex-1 flex-col px-6 py-10 sm:px-12 lg:px-16 lg:py-16">
                <Link
                    to="/"
                    className="mb-8 flex items-center gap-3 lg:hidden"
                    data-testid="auth-mobile-back"
                >
                    <img
                        src={LOGO_URL}
                        alt=""
                        className="h-12 w-auto object-contain"
                    />
                </Link>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
                    className="mx-auto w-full max-w-md flex-1"
                >
                    <div className="label mb-4 text-gold">{subtitle}</div>
                    <h1 className="font-serif text-4xl italic leading-tight text-white sm:text-5xl">
                        {title}
                    </h1>
                    <div className="mt-10">{children}</div>
                    {footer && <div className="mt-10">{footer}</div>}
                </motion.div>
            </div>
        </div>
    );
}

export function UserMenu({ compact = false }) {
    const { user, signout } = useAuth();
    const navigate = useNavigate();
    const loc = useLocation();
    if (!user) return null;
    const initials =
        (user.first_name?.[0] || "") + (user.last_name?.[0] || "");
    return (
        <div className="flex items-center gap-3">
            <Link
                to={user.role === "staff" ? "/studio" : "/account"}
                data-testid="user-menu-portal"
                className="flex items-center gap-2 border border-white/15 px-3 py-1.5 label text-white/80 transition-colors hover:border-gold hover:text-gold"
            >
                <span className="grid h-6 w-6 place-items-center bg-gold text-[10px] font-medium text-ink">
                    {initials.toUpperCase()}
                </span>
                {!compact && (
                    <span>
                        {user.role === "staff" ? "Studio" : "My Account"}
                    </span>
                )}
            </Link>
            <button
                onClick={() => {
                    signout();
                    if (loc.pathname !== "/") navigate("/");
                }}
                data-testid="user-menu-signout"
                className="label text-white/50 transition-colors hover:text-gold"
            >
                Sign out
            </button>
        </div>
    );
}
