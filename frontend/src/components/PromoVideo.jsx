import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Volume2, VolumeX } from "lucide-react";
import { Link } from "react-router-dom";
import { useContent } from "../lib/contentContext";

const SEEN_KEY = "obw_promo_seen";

export default function PromoVideo() {
    const { content } = useContent();
    const V = content.promo_video || {};
    const [open, setOpen] = useState(false);
    const [muted, setMuted] = useState(true);
    const videoRef = useRef(null);

    useEffect(() => {
        if (!V.enabled || !V.src) return;
        if (V.once_per_visit && sessionStorage.getItem(SEEN_KEY)) return;
        const t = setTimeout(
            () => setOpen(true),
            Math.max(0, Number(V.delay_seconds ?? 5)) * 1000,
        );
        return () => clearTimeout(t);
    }, [V.enabled, V.src, V.delay_seconds, V.once_per_visit]);

    useEffect(() => {
        if (!open) return;
        sessionStorage.setItem(SEEN_KEY, "1");
        const onKey = (e) => e.key === "Escape" && setOpen(false);
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open]);

    function toggleSound() {
        const v = videoRef.current;
        if (!v) return;
        v.muted = !v.muted;
        setMuted(v.muted);
        if (!v.muted) v.play().catch(() => {});
    }

    if (!V.enabled || !V.src) return null;

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="fixed inset-0 z-[90] grid place-items-center bg-black/85 px-4 backdrop-blur-md"
                    onClick={() => setOpen(false)}
                    data-testid="promo-video-overlay"
                    role="dialog"
                    aria-modal="true"
                    aria-label={V.title || "Welcome video"}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 12 }}
                        transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-[640px] border border-gold/40 bg-ink shadow-[0_40px_120px_rgba(0,0,0,0.7)]"
                        data-testid="promo-video-modal"
                    >
                        <button
                            onClick={() => setOpen(false)}
                            aria-label="Close video"
                            data-testid="promo-video-close"
                            className="group absolute -right-3 -top-3 z-10 grid h-11 w-11 place-items-center rounded-full border border-gold/60 bg-ink text-gold transition-all duration-300 hover:rotate-90 hover:bg-gold hover:text-ink"
                        >
                            <X className="h-5 w-5" strokeWidth={1.6} />
                        </button>

                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            loop
                            playsInline
                            className="block h-auto w-full"
                            data-testid="promo-video-player"
                        >
                            {V.src_webm && <source src={V.src_webm} type="video/webm" />}
                            <source src={V.src} type="video/mp4" />
                        </video>

                        <button
                            onClick={toggleSound}
                            aria-label={muted ? "Unmute" : "Mute"}
                            data-testid="promo-video-sound"
                            className="absolute bottom-[104px] right-3 grid h-10 w-10 place-items-center rounded-full border border-white/25 bg-black/60 text-white/80 backdrop-blur transition-colors hover:border-gold hover:text-gold sm:bottom-[112px]"
                        >
                            {muted ? (
                                <VolumeX className="h-4 w-4" />
                            ) : (
                                <Volume2 className="h-4 w-4" />
                            )}
                        </button>

                        <div className="border-t border-white/10 p-5">
                            {V.title && (
                                <div
                                    className="font-serif text-xl italic text-white"
                                    data-edit="promo_video.title"
                                >
                                    {V.title}
                                </div>
                            )}
                            {V.subtitle && (
                                <div
                                    className="mt-1 text-sm text-white/60"
                                    data-edit="promo_video.subtitle"
                                >
                                    {V.subtitle}
                                </div>
                            )}
                            <div className="mt-4 flex items-center gap-4">
                                <Link
                                    to="/book"
                                    onClick={() => setOpen(false)}
                                    data-testid="promo-video-cta"
                                    className="group inline-flex items-center gap-3 border border-gold bg-gold px-5 py-3 text-[10px] tracking-[0.24em] uppercase font-medium text-ink transition-transform duration-500 hover:translate-y-[-2px]"
                                >
                                    <span data-edit="promo_video.cta_label">
                                        {V.cta_label}
                                    </span>
                                    <span className="h-px w-6 bg-ink transition-all duration-500 group-hover:w-10" />
                                </Link>
                                <button
                                    onClick={() => setOpen(false)}
                                    data-testid="promo-video-dismiss"
                                    className="label link-underline text-white/50 hover:text-white"
                                >
                                    <span data-edit="promo_video.dismiss_label">
                                        {V.dismiss_label}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
