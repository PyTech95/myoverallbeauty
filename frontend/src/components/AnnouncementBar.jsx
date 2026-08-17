import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { X } from "lucide-react";
import { useContent } from "../lib/contentContext";

export default function AnnouncementBar() {
    const [open, setOpen] = useState(true);
    const { content } = useContent();
    const b = content.banner || {};
    const messages = [b.text, b.secondary, b.tertiary].filter(Boolean);
    if (b.enabled === false || messages.length === 0) return null;

    return (
        <AnimatePresence initial={false}>
            {open && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
                    className="relative overflow-hidden border-b border-gold/25 bg-black"
                    data-testid="announcement-bar"
                >
                    <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-2.5 sm:px-8">
                        <div className="flex-1 overflow-hidden">
                            <div className="marquee-track">
                                {Array.from({ length: 2 }).map((_, k) => (
                                    <div
                                        key={k}
                                        className="flex shrink-0 items-center gap-14 pr-14 label text-gold"
                                    >
                                        {messages.map((m, i) => (
                                            <span
                                                key={i}
                                                className="flex items-center gap-14"
                                                data-testid={`announcement-msg-${i}`}
                                            >
                                                <span
                                                    data-edit={
                                                        i === 0
                                                            ? "banner.text"
                                                            : i === 1
                                                              ? "banner.secondary"
                                                              : "banner.tertiary"
                                                    }
                                                >
                                                    {m}
                                                </span>
                                                <span aria-hidden>✦</span>
                                            </span>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={() => setOpen(false)}
                            aria-label="Dismiss announcement"
                            data-testid="announcement-close-btn"
                            className="shrink-0 text-white/50 transition-colors hover:text-gold"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
