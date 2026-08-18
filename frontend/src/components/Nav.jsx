import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogIn, UserPlus } from "lucide-react";
import { useContent } from "../lib/contentContext";
import { useAuth } from "../lib/auth";
import { UserMenu } from "../lib/AuthShell";
import TextSizeToggle from "./TextSizeToggle";

export default function Nav() {
    const [scrolled, setScrolled] = useState(false);
    const [open, setOpen] = useState(false);
    const { user } = useAuth();
    const { content } = useContent();
    const brand = content.brand || {};
    const N = content.nav || {};
    const links = N.links || [];

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <motion.header
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1], delay: 0.2 }}
            className={`sticky top-0 z-50 w-full border-b bg-black transition-colors duration-500 ${
                scrolled ? "border-white/10 backdrop-blur-xl" : "border-transparent"
            }`}
            data-testid="site-nav"
        >
            <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-1 sm:px-8 sm:py-1.5">
                <Link
                    to="/"
                    className="flex items-center gap-3"
                    data-testid="nav-logo"
                    aria-label={`${brand.name} — home`}
                >
                    <img
                        src={brand.logo_url}
                        alt={brand.name}
                        className="h-[82px] w-auto object-contain sm:h-[112px] lg:h-[144px] my-[-8px]"
                    />
                </Link>

                <nav className="hidden gap-8 xl:flex">
                    {links.map((l, i) => (
                        <a
                            key={`${l.href}-${i}`}
                            href={l.href}
                            className="label link-underline text-white/70 hover:text-white"
                            data-testid={`nav-link-${(l.label || "").toLowerCase()}`}
                            data-edit={`nav.links.${i}.label`}
                        >
                            {l.label}
                        </a>
                    ))}
                </nav>

                <div className="hidden items-center gap-4 lg:flex">
                    <TextSizeToggle />
                    {user ? (
                        <UserMenu />
                    ) : (
                        <>
                            <Link
                                to="/signin"
                                data-testid="nav-signin"
                                className="label link-underline text-white/70 hover:text-white"
                            >
                                {N.signin_label}
                            </Link>
                            <Link
                                to="/signup"
                                data-testid="nav-signup"
                                className="label link-underline text-white/70 hover:text-white"
                            >
                                {N.signup_label}
                            </Link>
                        </>
                    )}
                    <Link
                        to="/book"
                        data-testid="nav-cta-book"
                        className="group relative inline-flex items-center gap-3 border border-gold/50 px-4 py-2 text-[11px] tracking-[0.24em] uppercase font-medium text-white transition-colors duration-500 hover:text-ink"
                    >
                        <span className="absolute inset-0 origin-left scale-x-0 bg-gold transition-transform duration-500 group-hover:scale-x-100" />
                        <span className="relative" data-edit="nav.cta_label">
                            {N.cta_label}
                        </span>
                        <span className="relative h-px w-5 bg-gold transition-all duration-500 group-hover:w-8 group-hover:bg-ink" />
                    </Link>
                </div>

                <button
                    className="lg:hidden text-white"
                    onClick={() => setOpen(true)}
                    aria-label="Open menu"
                    data-testid="nav-menu-open"
                >
                    <Menu className="h-6 w-6" />
                </button>            </div>

            {typeof document !== "undefined" &&
                createPortal(
                    <AnimatePresence>
                        {open && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                className="fixed inset-0 z-[70] bg-[#0A0A0A] lg:hidden"
                                data-testid="mobile-menu"
                            >
                                <div className="flex items-center justify-between border-b border-white/10 bg-ink px-4 py-3 sm:px-8">
                                    <img
                                        src={brand.logo_url}
                                        alt=""
                                        className="h-10 w-auto object-contain"
                                    />
                                    <button
                                        onClick={() => setOpen(false)}
                                        aria-label="Close menu"
                                        data-testid="nav-menu-close"
                                        className="text-white"
                                    >
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>
                                <div className="flex flex-col items-start gap-5 px-8 py-8">
                                    {links.map((l, i) => (
                                        <motion.a
                                            key={`${l.href}-${i}`}
                                            href={l.href}
                                            onClick={() => setOpen(false)}
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{
                                                delay: 0.1 + i * 0.05,
                                                duration: 0.5,
                                            }}
                                            className="font-serif text-3xl italic text-white hover:text-gold transition-colors"
                                            data-testid={`mobile-link-${(l.label || "").toLowerCase()}`}
                                        >
                                            {l.label}
                                        </motion.a>
                                    ))}
                                    <div className="mt-6 h-px w-full bg-white/10" />
                                    <TextSizeToggle />
                                    {user ? (
                                        <div className="flex flex-wrap gap-4">
                                            <Link
                                                to={
                                                    user.role === "staff"
                                                        ? "/studio"
                                                        : "/account"
                                                }
                                                onClick={() => setOpen(false)}
                                                data-testid="mobile-my-portal"
                                                className="border border-gold px-5 py-3 label text-gold"
                                            >
                                                {user.role === "staff"
                                                    ? "Open Studio"
                                                    : "My Account"}
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap gap-4">
                                            <Link
                                                to="/signin"
                                                onClick={() => setOpen(false)}
                                                data-testid="mobile-signin"
                                                className="inline-flex items-center gap-2 border border-white/20 px-5 py-3 label text-white/80"
                                            >
                                                <LogIn className="h-4 w-4" />{" "}
                                                {N.signin_label}
                                            </Link>
                                            <Link
                                                to="/signup"
                                                onClick={() => setOpen(false)}
                                                data-testid="mobile-signup"
                                                className="inline-flex items-center gap-2 border border-white/20 px-5 py-3 label text-white/80"
                                            >
                                                <UserPlus className="h-4 w-4" />{" "}
                                                {N.signup_label}
                                            </Link>
                                        </div>
                                    )}
                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.5, duration: 0.5 }}
                                        className="mt-4"
                                    >
                                        <Link
                                            to="/book"
                                            onClick={() => setOpen(false)}
                                            className="inline-flex items-center gap-3 border border-gold bg-gold px-6 py-3 label text-ink"
                                            data-testid="mobile-cta-book"
                                        >
                                            {N.cta_label}
                                        </Link>
                                    </motion.div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>,
                    document.body,
                )}
        </motion.header>
    );
}
