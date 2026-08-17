import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Volume2, VolumeX, Check, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { useContent } from "../lib/contentContext";

const SEEN_KEY = "obw_promo_seen";
const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function expired(dateStr) {
    if (!dateStr) return false;
    const end = new Date(`${dateStr}T23:59:59`);
    if (Number.isNaN(end.getTime())) return false;
    return Date.now() > end.getTime();
}

export default function PromoVideo() {
    const { content } = useContent();
    const V = content.promo_video || {};
    const [open, setOpen] = useState(false);
    const [muted, setMuted] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [sending, setSending] = useState(false);
    const [done, setDone] = useState(false);
    const [form, setForm] = useState({ name: "", email: "", phone: "", guests: 1 });
    const [isMobile, setIsMobile] = useState(
        () =>
            typeof window !== "undefined" &&
            window.matchMedia("(max-width: 767px)").matches,
    );
    const videoRef = useRef(null);

    useEffect(() => {
        const mq = window.matchMedia("(max-width: 767px)");
        const onChange = (e) => setIsMobile(e.matches);
        mq.addEventListener("change", onChange);
        return () => mq.removeEventListener("change", onChange);
    }, []);

    const mp4 = (isMobile && V.src_mobile) || V.src;
    const webm = isMobile
        ? V.src_mobile && V.src_mobile_webm
            ? V.src_mobile_webm
            : null
        : V.src_webm;
    const isExpired = expired(V.expires_on);
    const active = !!V.enabled && !!mp4 && !isExpired;

    useEffect(() => {
        if (!active) return;
        if (V.once_per_visit && sessionStorage.getItem(SEEN_KEY)) return;
        const t = setTimeout(
            () => setOpen(true),
            Math.max(0, Number(V.delay_seconds ?? 5)) * 1000,
        );
        return () => clearTimeout(t);
    }, [active, V.delay_seconds, V.once_per_visit]);

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

    async function submitRsvp(e) {
        e.preventDefault();
        setSending(true);
        try {
            await axios.post(`${API}/rsvps`, {
                name: form.name,
                email: form.email,
                phone: form.phone || null,
                guests: Number(form.guests) || 1,
                event: V.event_name || V.title,
            });
            setDone(true);
        } catch (err) {
            const d = err?.response?.data?.detail;
            toast.error(typeof d === "string" ? d : "Could not save your RSVP.");
        } finally {
            setSending(false);
        }
    }

    if (!active) return null;

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="fixed inset-0 z-[90] grid place-items-center overflow-y-auto bg-black/85 px-4 py-6 backdrop-blur-md"
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
                        className={`relative my-auto w-full border border-gold/40 bg-ink shadow-[0_40px_120px_rgba(0,0,0,0.7)] ${
                            isMobile && V.src_mobile ? "max-w-[400px]" : "max-w-[640px]"
                        }`}
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

                        <div className="relative">
                            <video
                                ref={videoRef}
                                key={mp4}
                                autoPlay
                                muted
                                loop
                                playsInline
                                className="block h-auto max-h-[52vh] w-full object-contain sm:max-h-[62vh]"
                                data-testid="promo-video-player"
                            >
                                {webm && <source src={webm} type="video/webm" />}
                                <source src={mp4} type="video/mp4" />
                            </video>
                            <button
                                onClick={toggleSound}
                                aria-label={muted ? "Unmute" : "Mute"}
                                data-testid="promo-video-sound"
                                className="absolute left-3 top-3 grid h-10 w-10 place-items-center rounded-full border border-white/25 bg-black/60 text-white/80 backdrop-blur transition-colors hover:border-gold hover:text-gold"
                            >
                                {muted ? (
                                    <VolumeX className="h-4 w-4" />
                                ) : (
                                    <Volume2 className="h-4 w-4" />
                                )}
                            </button>
                        </div>

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

                            {done ? (
                                <div
                                    className="mt-5 flex items-start gap-3 border border-gold/40 bg-gold/10 p-4"
                                    data-testid="promo-rsvp-success"
                                >
                                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                                    <div className="text-sm text-white/80">
                                        {V.rsvp_success}
                                    </div>
                                </div>
                            ) : showForm ? (
                                <form
                                    onSubmit={submitRsvp}
                                    className="mt-5 space-y-3"
                                    data-testid="promo-rsvp-form"
                                >
                                    <div className="text-sm text-white/60">
                                        {V.rsvp_note}
                                    </div>
                                    <input
                                        className="field"
                                        placeholder="Your name"
                                        required
                                        value={form.name}
                                        data-testid="promo-rsvp-name"
                                        onChange={(e) =>
                                            setForm({ ...form, name: e.target.value })
                                        }
                                    />
                                    <input
                                        className="field"
                                        type="email"
                                        placeholder="Email"
                                        required
                                        value={form.email}
                                        data-testid="promo-rsvp-email"
                                        onChange={(e) =>
                                            setForm({ ...form, email: e.target.value })
                                        }
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            className="field"
                                            placeholder="Phone (optional)"
                                            value={form.phone}
                                            data-testid="promo-rsvp-phone"
                                            onChange={(e) =>
                                                setForm({ ...form, phone: e.target.value })
                                            }
                                        />
                                        <select
                                            className="field"
                                            value={form.guests}
                                            data-testid="promo-rsvp-guests"
                                            onChange={(e) =>
                                                setForm({ ...form, guests: e.target.value })
                                            }
                                        >
                                            {[1, 2, 3, 4, 5, 6].map((n) => (
                                                <option key={n} value={n}>
                                                    {n} {n === 1 ? "guest" : "guests"}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-4 pt-1">
                                        <button
                                            type="submit"
                                            disabled={sending}
                                            data-testid="promo-rsvp-submit"
                                            className="inline-flex items-center gap-3 border border-gold bg-gold px-5 py-3 text-[10px] tracking-[0.24em] uppercase font-medium text-ink transition-transform duration-500 hover:translate-y-[-2px] disabled:opacity-60"
                                        >
                                            {sending && (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            )}
                                            {sending ? "Sending…" : "Confirm RSVP"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowForm(false)}
                                            data-testid="promo-rsvp-back"
                                            className="label link-underline text-white/50 hover:text-white"
                                        >
                                            Back
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="mt-4 flex flex-wrap items-center gap-4">
                                    {V.rsvp_enabled && (
                                        <button
                                            onClick={() => setShowForm(true)}
                                            data-testid="promo-rsvp-open"
                                            className="group inline-flex items-center gap-3 border border-gold bg-gold px-5 py-3 text-[10px] tracking-[0.24em] uppercase font-medium text-ink transition-transform duration-500 hover:translate-y-[-2px]"
                                        >
                                            <span data-edit="promo_video.rsvp_label">
                                                {V.rsvp_label}
                                            </span>
                                            <span className="h-px w-6 bg-ink transition-all duration-500 group-hover:w-10" />
                                        </button>
                                    )}
                                    <Link
                                        to="/book"
                                        onClick={() => setOpen(false)}
                                        data-testid="promo-video-cta"
                                        className={`inline-flex items-center gap-3 px-5 py-3 text-[10px] tracking-[0.24em] uppercase font-medium transition-colors duration-500 ${
                                            V.rsvp_enabled
                                                ? "border border-white/25 text-white/80 hover:border-gold hover:text-gold"
                                                : "border border-gold bg-gold text-ink"
                                        }`}
                                    >
                                        <span data-edit="promo_video.cta_label">
                                            {V.cta_label}
                                        </span>
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
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
