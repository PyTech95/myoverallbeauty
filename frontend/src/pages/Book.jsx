import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles, ShieldCheck, CalendarHeart } from "lucide-react";
import Nav from "../components/Nav";
import Footer from "../components/sections/Footer";
import Booking from "../components/sections/Booking";
import ScrollProgress from "../components/ScrollProgress";
import { useLenis } from "../lib/useLenis";
import { useContent } from "../lib/contentContext";

export default function Book() {
    useLenis();
    const { content } = useContent();
    const founder = content.founder;

    useEffect(() => {
        // Set page title for SEO + tab clarity
        const prev = document.title;
        document.title =
            "Book a Consultation — Overall Beauty & Wellness";
        window.scrollTo({ top: 0, behavior: "instant" });
        return () => {
            document.title = prev;
        };
    }, []);

    const trust = [
        {
            icon: CalendarHeart,
            label: "Complimentary",
            body: "Your first consultation is on the house. No pressure, no commitment.",
        },
        {
            icon: ShieldCheck,
            label: "Board-Certified",
            body: `Personally reviewed by ${founder?.name || "Crystal G. Marrero"}, FNP-C.`,
        },
        {
            icon: Sparkles,
            label: "45 Minutes",
            body: "Focused, unhurried time to build a plan tailored to your goals.",
        },
    ];

    return (
        <main
            className="grain relative bg-ink text-white"
            data-testid="book-page"
        >
            <ScrollProgress />
            <Nav />

            {/* Page hero */}
            <section
                className="relative overflow-hidden border-b border-white/5 pt-14 sm:pt-20 pb-10 sm:pb-14"
                data-testid="book-page-hero"
            >
                <motion.div
                    animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.85, 0.5] }}
                    transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
                    className="pointer-events-none absolute -top-40 left-1/2 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-gold/[.08] blur-[160px]"
                />
                <div className="relative z-10 mx-auto max-w-[1600px] px-4 sm:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <Link
                            to="/"
                            data-testid="book-back-home"
                            className="inline-flex items-center gap-2 label text-white/50 transition-colors hover:text-gold"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Back to home
                        </Link>
                    </motion.div>

                    <div className="mt-6 grid grid-cols-1 items-end gap-8 lg:mt-10 lg:grid-cols-[1.4fr_1fr]">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
                        >
                            <div className="label mb-6 flex items-center gap-3 text-gold">
                                <span className="h-px w-10 bg-gold/60" />
                                Reserve · The Consultation
                            </div>
                            <h1 className="font-serif text-5xl leading-[0.94] tracking-tight text-white sm:text-6xl lg:text-[6.5rem]">
                                Choose your{" "}
                                <em className="italic text-gold-gradient animate-shimmer">
                                    moment.
                                </em>
                            </h1>
                            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
                                Pick a date, pick a time, and Crystal will do the rest. Every treatment begins with a personalized, complimentary consultation to develop a plan tailored to your goals and overall wellness.
                            </p>
                        </motion.div>

                        {/* Trust card cluster */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.9, delay: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
                            className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1"
                        >
                            {trust.map((t, i) => (
                                <motion.div
                                    key={t.label}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.7, delay: 0.35 + i * 0.08 }}
                                    className="flex items-start gap-3 border border-white/10 bg-white/[0.02] p-4 backdrop-blur-sm transition-colors hover:border-gold/40"
                                    data-testid={`book-trust-${i}`}
                                >
                                    <div className="mt-0.5 grid h-9 w-9 flex-shrink-0 place-items-center border border-gold/40 text-gold">
                                        <t.icon className="h-4 w-4" strokeWidth={1.4} />
                                    </div>
                                    <div>
                                        <div className="label text-gold">{t.label}</div>
                                        <div className="mt-1.5 text-sm leading-relaxed text-white/70">
                                            {t.body}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* The actual booking section (reuses the existing rich calendar + Eva) */}
            <Booking />

            <Footer />
        </main>
    );
}
