import { motion } from "framer-motion";
import { Phone, Calendar } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useContent } from "../lib/contentContext";

export default function MobileActionBar() {
    const { content } = useContent();
    const loc = useLocation();
    const tel = (content.contact?.phone || "").replace(/[^+0-9]/g, "");

    // Only show on the marketing pages
    if (
        loc.pathname.startsWith("/studio") ||
        loc.pathname.startsWith("/account") ||
        loc.pathname.startsWith("/signin") ||
        loc.pathname.startsWith("/signup")
    )
        return null;

    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
            className="fixed bottom-0 left-0 right-0 z-40 border-t border-gold/30 bg-black/95 backdrop-blur-xl lg:hidden"
            data-testid="mobile-action-bar"
            role="navigation"
            aria-label="Quick actions"
        >
            <div
                className="grid grid-cols-2"
                style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
                <a
                    href={tel ? `tel:${tel}` : "#contact"}
                    data-testid="mab-call"
                    className="flex items-center justify-center gap-2 py-4 label text-white transition-colors active:bg-white/5"
                >
                    <Phone className="h-4 w-4 text-gold" />
                    {content.mobile_bar?.call_label}
                </a>
                <Link
                    to="/book"
                    data-testid="mab-book"
                    className="flex items-center justify-center gap-2 bg-gold py-4 text-[11px] tracking-[0.24em] uppercase font-medium text-ink transition-colors active:bg-gold-soft"
                >
                    <Calendar className="h-4 w-4" />
                    {content.mobile_bar?.book_label}
                </Link>
            </div>
        </motion.div>
    );
}
