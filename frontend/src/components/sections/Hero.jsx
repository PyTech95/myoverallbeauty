import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { useContent } from "../../lib/contentContext";

const line = {
    hidden: { y: "110%" },
    show: (i = 0) => ({
        y: "0%",
        transition: {
            delay: 0.2 + i * 0.12,
            duration: 1.1,
            ease: [0.2, 0.8, 0.2, 1],
        },
    }),
};

function GoldParticles() {
    const seeds = useMemo(
        () =>
            Array.from({ length: 18 }).map((_, i) => ({
                id: i,
                x: Math.random() * 100,
                y: Math.random() * 100,
                d: 6 + Math.random() * 14,
                s: 1 + Math.random() * 2,
                delay: Math.random() * 4,
            })),
        [],
    );
    return (
        <div
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden"
        >
            {seeds.map((p) => (
                <motion.span
                    key={p.id}
                    initial={{ opacity: 0, y: 0 }}
                    animate={{
                        opacity: [0, 0.9, 0],
                        y: [-30, -160],
                        x: [0, (Math.random() - 0.5) * 40],
                    }}
                    transition={{
                        duration: p.d,
                        delay: p.delay,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: `${p.s}px`,
                        height: `${p.s}px`,
                    }}
                    className="absolute rounded-full bg-gold shadow-[0_0_8px_rgba(212,175,55,0.9)]"
                />
            ))}
        </div>
    );
}

export default function Hero() {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end start"],
    });
    const y = useTransform(scrollYProgress, [0, 1], [0, 180]);
    const scale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
    const rot = useTransform(scrollYProgress, [0, 1], [0, -6]);
    const bgY = useTransform(scrollYProgress, [0, 1], [0, 220]);
    const bgScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.18]);

    const { content } = useContent();
    const H = content.hero;
    const HERO_BG = H.image;
    const LOGO = content.brand?.logo_url;

    return (
        <section
            id="top"
            ref={ref}
            className="relative isolate min-h-[100svh] w-full overflow-hidden bg-ink"
            data-testid="hero-section"
        >
            {/* Background image with slow ken-burns + parallax */}
            <motion.div
                style={{ y: bgY, scale: bgScale }}
                className="pointer-events-none absolute inset-0 -z-10"
                aria-hidden
            >
                <img
                    src={HERO_BG}
                    alt=""
                    className="h-full w-full object-cover object-center opacity-40"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-ink/50 via-ink/70 to-ink" />
                <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/30 to-transparent" />
            </motion.div>

            {/* Ambient gold glow */}
            <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.55, 0.9, 0.55] }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="pointer-events-none absolute -top-40 left-1/2 h-[900px] w-[900px] -translate-x-1/2 rounded-full bg-gold/10 blur-[160px]"
            />
            <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.7, 0.4] }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2,
                }}
                className="pointer-events-none absolute bottom-0 right-0 h-[600px] w-[600px] rounded-full bg-gold/[.06] blur-[140px]"
            />

            {/* Right side — parallax portrait clipped card */}
            <motion.div
                style={{ y, scale }}
                className="pointer-events-none absolute right-[-4%] top-1/2 hidden h-[75vh] w-[38vw] -translate-y-1/2 overflow-hidden xl:block"
            >
                <div className="absolute inset-0 z-10 border border-gold/25" />
                <div className="absolute inset-0 z-[11] bg-gradient-to-b from-transparent via-transparent to-black/60" />
                <img
                    src={HERO_BG}
                    alt="Glowing skin"
                    className="h-full w-full object-cover object-center opacity-90"
                    loading="eager"
                />
                <div className="absolute right-3 top-6 z-20 rotate-180 [writing-mode:vertical-rl] label text-gold/80">
                    <span data-edit="hero.chapter_label">{H.chapter_label}</span>
                </div>
            </motion.div>

            {/* Gold particles */}
            <GoldParticles />

            {/* Content */}
            <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-[1600px] flex-col justify-between px-4 pt-16 pb-28 sm:px-8 sm:pt-24 sm:pb-14">
                <div className="flex items-start justify-between gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.9 }}
                        className="label text-white/50"
                    >
                        <span data-edit="hero.est_line1">{H.est_line1}</span>
                        <br />
                        <span data-edit="hero.est_line2">{H.est_line2}</span>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.9 }}
                        className="label text-right text-white/50"
                    >
                        <span data-edit="brand.name">{content.brand?.name}</span>
                    </motion.div>
                </div>

                <div className="relative py-8 sm:py-10 lg:py-16">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.7 }}
                        className="label mb-6 flex items-center gap-3 text-gold sm:mb-8"
                    >
                        <span className="h-px w-8 bg-gold/60 sm:w-10" />
                        <span data-edit="hero.eyebrow">{H.eyebrow}</span>
                    </motion.div>

                    <h1
                        className="font-serif text-[16vw] leading-[0.9] tracking-[-0.03em] text-white sm:text-[12vw] lg:text-[10.5vw]"
                        data-testid="hero-headline"
                    >
                        <span className="reveal-mask">
                            <motion.span
                                custom={0}
                                variants={line}
                                initial="hidden"
                                animate="show"
                                className="reveal-inner"
                                data-edit="hero.line1"
                            >
                                {H.line1}
                            </motion.span>
                        </span>{" "}
                        <span className="reveal-mask">
                            <motion.span
                                custom={1}
                                variants={line}
                                initial="hidden"
                                animate="show"
                                className="reveal-inner italic text-gold-gradient animate-shimmer"
                                data-edit="hero.line2"
                            >
                                {H.line2}
                            </motion.span>
                        </span>
                        <br />
                        <span className="reveal-mask">
                            <motion.span
                                custom={2}
                                variants={line}
                                initial="hidden"
                                animate="show"
                                className="reveal-inner"
                                data-edit="hero.line3"
                            >
                                {H.line3}
                            </motion.span>
                        </span>{" "}
                        <span className="reveal-mask">
                            <motion.span
                                custom={3}
                                variants={line}
                                initial="hidden"
                                animate="show"
                                className="reveal-inner italic"
                                data-edit="hero.line4"
                            >
                                {H.line4}
                            </motion.span>
                        </span>
                    </h1>

                    <motion.div
                        style={{ rotate: rot }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2, duration: 0.8 }}
                        className="absolute right-4 top-4 hidden select-none lg:block"
                    >
                        <div className="font-serif text-xs italic text-gold/70">
                            fig.&nbsp;01
                        </div>
                        <div className="mt-1 font-serif text-6xl italic text-white/10">
                            ✦
                        </div>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.4, duration: 0.9 }}
                    className="grid grid-cols-1 items-end gap-8 lg:grid-cols-3"
                >
                    <div
                        className="max-w-md text-sm text-white/70 sm:text-base"
                        data-edit="hero.subtitle"
                    >
                        {H.subtitle}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6 lg:justify-center">
                        <Link
                            to="/book"
                            data-testid="hero-cta-consultation"
                            className="group relative inline-flex items-center gap-3 border border-gold bg-gold px-5 py-3 text-[11px] tracking-[0.24em] uppercase font-medium text-ink transition-transform duration-500 hover:translate-y-[-2px] sm:gap-4 sm:px-7 sm:py-4 sm:text-[12px]"
                        >
                            <span data-edit="hero.cta_primary">
                                {H.cta_primary}
                            </span>
                            <span className="h-px w-6 bg-ink transition-all duration-500 group-hover:w-10 sm:w-8 sm:group-hover:w-12" />
                        </Link>
                        <a
                            href="#services"
                            data-testid="hero-cta-services"
                            className="label link-underline text-white/70 hover:text-white"
                            data-edit="hero.cta_secondary"
                        >
                            {H.cta_secondary}
                        </a>
                    </div>
                    <div className="hidden items-center justify-end gap-6 lg:flex">
                        <div className="text-right">
                            <div
                                className="label text-white/50"
                                data-edit="hero.badge_top"
                            >
                                {H.badge_top}
                            </div>
                            <div
                                className="mt-1 font-serif text-2xl italic text-white"
                                data-edit="hero.badge_bottom"
                            >
                                {H.badge_bottom}
                            </div>
                        </div>
                        <img
                            src={LOGO}
                            alt="mark"
                            className="h-16 w-auto object-contain lg:h-20"
                        />
                    </div>
                </motion.div>
            </div>

            <div className="absolute bottom-24 left-1/2 z-20 -translate-x-1/2 flex-col items-center gap-2 sm:bottom-6 sm:flex">
                <div className="label text-white/40" data-edit="hero.scroll_label">
                    {H.scroll_label}
                </div>
                <motion.div
                    animate={{ scaleY: [0.2, 1, 0.2] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="h-10 w-px origin-top bg-gold/60"
                />
            </div>
        </section>
    );
}
